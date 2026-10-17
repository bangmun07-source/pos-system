import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";
export default async function handler(req, res) {

  try {

    // =====================================================
    // MASTER SUPABASE
    // =====================================================

    const centralSupabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    // =====================================================
    // POST = LOGIN
    // =====================================================

    if (req.method === "POST") {

      const {
        tenantSlug,
        username,
        password
      } = req.body || {};

      // ==========================================
      // VALIDASI INPUT
      // ==========================================

      if (!tenantSlug) {
        return res.status(400).json({
          success: false,
          error: "Tenant slug kosong"
        });
      }

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username dan password wajib diisi"
        });
      }

      // LOGIN RATE LIMIT - MASTER DATABASE
      const rateLimitSecret = process.env.LOGIN_RATE_LIMIT_SECRET;
      
      if (!rateLimitSecret) { throw new Error("LOGIN_RATE_LIMIT_SECRET belum diatur"); }
      
      const normalizedTenant = String(tenantSlug).trim().toLowerCase();
      const normalizedUsername = String(username).trim().toLowerCase();
      const createSecurityHash = (value) =>
        createHmac("sha256", rateLimitSecret)
          .update(value)
          .digest("hex");
      // Hash identitas akun: tidak menyimpan username asli.
      const accountHash = createSecurityHash( `account:${normalizedTenant}:${normalizedUsername}` );
      // IP hanya untuk audit, BUKAN untuk memblokir login.
      const forwardedFor = req.headers["x-forwarded-for"];
      const clientIp = (
        Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : forwardedFor?.split(",")[0]
      )?.trim() || req.socket?.remoteAddress || "unknown";
      const ipHash = createSecurityHash(`ip:${clientIp}`);
      // Helper untuk mencatat login gagal di Master.
      const recordLoginFailure = async () => {
        const { error } = await centralSupabase.rpc(
          "record_login_failure",
          {
            p_tenant_slug: normalizedTenant,
            p_account_hash: accountHash,
            p_ip_hash: ipHash
          }
        );
      
        if (error) { throw error; }
      };


      // AMBIL CONFIG TENANT
      const {
        data: tenantResult,
        error: tenantError
      } =
        await centralSupabase.rpc(
          "get_tenant_config",
          {
            p_slug: normalizedTenant
          }
        );

      if (tenantError) { throw tenantError; }
      if (
        !tenantResult?.success ||
        !tenantResult?.data
      ) {
        return res.status(401).json({
          success: false,
          error: "Tenant tidak ditemukan"
        });
      }

      const config = tenantResult.data;

      // ==========================================
      // CEK TENANT AKTIF
      // ==========================================

      if (!config.is_active) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak aktif"
        });
      }

      // CEK JEDA LOGIN BERTAHAP
      const {
        data: rateLimitResult,
        error: rateLimitError
      } = await centralSupabase.rpc(
        "check_login_rate_limit",
        {
          p_tenant_slug: normalizedTenant,
          p_account_hash: accountHash,
          p_ip_hash: ipHash
        }
      );
      
      if (rateLimitError) { throw rateLimitError; }
      if (rateLimitResult?.allowed === false) {
        const retryAfter = Math.max( 1, Number(rateLimitResult.retry_after_seconds) || 1 );
      
        res.setHeader("Retry-After", String(retryAfter));
    
        return res.status(429).json({
          success: false,
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${retryAfter} detik.`,
          retry_after_seconds: retryAfter
        });
      }
      
      // TENANT SUPABASE
      let tenantSupabase;
      if (normalizedTenant === "master") {
        tenantSupabase =
          createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
      
      } else {
      
        const {
          data: credential,
          error: credentialError
        } =
          await centralSupabase
            .from("tenant_credentials")
            .select("service_role_key")
            .eq( "tenant_id", config.tenant_id )
            .single();
      
        if (credentialError) { throw credentialError; }
        if (!credential?.service_role_key) {
          throw new Error(
            "Service Role Customer tidak ditemukan"
          );
        }
      
        tenantSupabase =
          createClient(
            config.supabase_url,
            credential.service_role_key
          );
      }

      // CEK USER 
      const {
        data: user,
        error: userError
      } = await tenantSupabase
        .from("Users")
        .select("ID_User, Username, Password, Role, branchId")
        .eq("Username", username.trim())
        .maybeSingle();
      
        if (userError) { throw userError; }
        if (!user || !user.Password) {
          await recordLoginFailure();
          return res.status(401).json({
            success: false,
            error: "Username atau password salah"
          });
        }
      
      // VERIFIKASI PASSWORD + MIGRASI USER LAMA
      const storedPassword = user.Password;
      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
      
      let passwordValid = false;
      
      if (isBcryptHash) {
        // Password sudah di-hash oleh pgcrypto atau bcryptjs
        passwordValid = await bcrypt.compare(
          password,
          storedPassword
        );
      } else {
        // Password user lama masih plaintext
        passwordValid = storedPassword === password;
      
        if (passwordValid) {
          // Hash password lama setelah login berhasil
          const newHash = await bcrypt.hash(password, 12);
          const { error: upgradeError } = await tenantSupabase
            .from("Users")
            .update({ Password: newHash })
            .eq("ID_User", user.ID_User)
            .eq("Password", storedPassword);
      
          if (upgradeError) {
            console.error(
              "Password hash migration failed:",
              upgradeError.message
            );
          }
        }
      }
            
      if (!passwordValid) {
        await recordLoginFailure();
      
        return res.status(401).json({
          success: false,
          error: "Username atau password salah"
        });
      }

      // RESET PENGHITUNG SETELAH PASSWORD VALID
      const {
        error: resetLimitError
      } = await centralSupabase.rpc(
        "reset_login_account_limit",
        {
          p_tenant_slug: normalizedTenant,
          p_account_hash: accountHash
        }
      );
      
      if (resetLimitError) {
        // Catat error, tetapi jangan menggagalkan login yang valid.
        console.error(
          "Login rate limit reset failed:",
          resetLimitError.message
        );
      }

      // BUAT SESSION
      const expiresAt =
        new Date(
          Date.now() +
          24 * 60 * 60 * 1000
        ).toISOString();

      const { data: session, error: sessionError
      } =
        await tenantSupabase
          .from("auth_sessions")
          .insert({
            user_id: user.ID_User,
            expires_at: expiresAt
          })
          .select( "session_id, expires_at" ) .single();

      if (sessionError) { throw sessionError; }

      // RESPONSE LOGIN

      return res.status(200).json({
        success: true,
        session_id: session.session_id,
        expires_at: session.expires_at,
        user: {
          ID_User: user.ID_User,
          Username: user.Username,
          Role: user.Role,
          branchId: user.branchId
        }
      });
    }

    // GET = VALIDASI SESSION
    if (req.method === "GET") {
      const sessionId = req.headers["x-session-id"];
      const tenantSlug = req.headers["x-tenant-slug"];

      // VALIDASI HEADER
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          error: "Session tidak ditemukan"
        });
      }
      if (!tenantSlug) {
        return res.status(400).json({
          success: false,
          error: "Tenant slug kosong"
        });
      }
      
      const normalizedTenant = String(tenantSlug).trim().toLowerCase();
      // AMBIL TENANT
      const {
        data: tenantResult,
        error: tenantError
      } =
        await centralSupabase.rpc(
          "get_tenant_config",
          {
            p_slug: normalizedTenant
          }
        );

      if (tenantError) { throw tenantError; }

      if (
        !tenantResult?.success ||
        !tenantResult?.data
      ) {
        return res.status(401).json({
          success: false,
          error: "Tenant tidak ditemukan"
        });
      }

      const config = tenantResult.data;
      if (!config.is_active) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak aktif"
        });
      }

      // TENTUKAN DATABASE TENANT
      let tenantSupabase;
      if (normalizedTenant === "master") {
        // MASTER → langsung gunakan MASTER DB
        tenantSupabase =
          createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
      
      } else {
        // CUSTOMER → ambil credential dari MASTER
        const {
          data: credential,
          error: credentialError
        } =
          await centralSupabase
            .from("tenant_credentials")
            .select("service_role_key")
            .eq( "tenant_id", config.tenant_id )
            .single();
        
        if (credentialError) { throw credentialError; }
        if (!credential?.service_role_key) { throw new Error( "Service Role Customer tidak ditemukan" ); }
        tenantSupabase = createClient( config.supabase_url, credential.service_role_key );
      }

      // CEK SESSION
      const {
        data: session, error: sessionError
      } =
        await tenantSupabase
          .from("auth_sessions")
          .select( "session_id, user_id, expires_at" )
          .eq( "session_id", sessionId )
          .maybeSingle();

      if (sessionError) { throw sessionError; }
      if (!session) {
        return res.status(401).json({
          success: false,
          error: "Session tidak valid"
        });
      }
      
      // CEK EXPIRED
      if (
        new Date(session.expires_at)
        <= new Date()
      ) {
        await tenantSupabase
          .from("auth_sessions")
          .delete()
          .eq(  "session_id", sessionId );
        return res.status(401).json({
          success: false,
          error: "Session sudah expired"
        });
      }

      // AMBIL USER
      const {
        data: user, error: userError
      } =
        await tenantSupabase
          .from("Users")
          .select( "ID_User, Username, Role, branchId" )
          .eq( "ID_User", session.user_id )
          .maybeSingle();

      if (userError) { throw userError; }
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User tidak ditemukan"
        });
      }
      
      // RESPONSE SESSION
      return res.status(200).json({
        success: true,
        user: {
          ID_User: user.ID_User,
          Username: user.Username,
          Role: user.Role,
          branchId: user.branchId
        },
        expires_at: session.expires_at
      });
    }

    // METHOD LAIN
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }
  catch (error) {
    console.error("Authentication error:", error);
  
    return res.status(500).json({
      success: false,
      error: "Authentication gagal. Silakan coba lagi."
    });
  }
}
