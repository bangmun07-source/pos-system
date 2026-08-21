import { createClient } from "@supabase/supabase-js";

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


      // ==========================================
      // AMBIL CONFIG TENANT
      // ==========================================

      const {
        data: tenantResult,
        error: tenantError
      } =
        await centralSupabase.rpc(
          "get_tenant_config",
          {
            p_slug: tenantSlug
          }
        );

      if (tenantError) {
        throw tenantError;
      }

      if (
        !tenantResult?.success ||
        !tenantResult?.data
      ) {
        return res.status(401).json({
          success: false,
          error: "Tenant tidak ditemukan"
        });
      }

      const config =
        tenantResult.data;


      // ==========================================
      // CEK TENANT AKTIF
      // ==========================================

      if (!config.is_active) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak aktif"
        });
      }


      // ==========================================
      // SERVICE ROLE CUSTOMER
      // ==========================================

      const {
        data: credential,
        error: credentialError
      } =
        await centralSupabase
          .from("tenant_credentials")
          .select("service_role_key")
          .eq(
            "tenant_id",
            config.tenant_id
          )
          .single();

      if (credentialError) {
        throw credentialError;
      }

      if (!credential?.service_role_key) {
        throw new Error(
          "Service Role Customer tidak ditemukan"
        );
      }


      // ==========================================
      // CUSTOMER SUPABASE
      // ==========================================

      const customerSupabase =
        createClient(
          config.supabase_url,
          credential.service_role_key
        );


      // ==========================================
      // CEK USER
      // ==========================================

      const {
        data: user,
        error: userError
      } =
        await customerSupabase
          .from("Users")
          .select(
            "ID_User, Username, Password, Role, branchId"
          )
          .eq(
            "Username",
            username
          )
          .maybeSingle();

      if (userError) {
        throw userError;
      }


      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Username atau password salah"
        });
      }


      // ==========================================
      // CEK PASSWORD
      // ==========================================

      if (user.Password !== password) {
        return res.status(401).json({
          success: false,
          error: "Username atau password salah"
        });
      }


      // ==========================================
      // BUAT SESSION
      // ==========================================

      const expiresAt =
        new Date(
          Date.now() +
          24 * 60 * 60 * 1000
        ).toISOString();


      const {
        data: session,
        error: sessionError
      } =
        await customerSupabase
          .from("auth_sessions")
          .insert({
            user_id:
              user.ID_User,

            expires_at:
              expiresAt
          })
          .select(
            "session_id, expires_at"
          )
          .single();

      if (sessionError) {
        throw sessionError;
      }


      // ==========================================
      // RESPONSE LOGIN
      // ==========================================

      return res.status(200).json({

        success: true,

        session_id:
          session.session_id,

        expires_at:
          session.expires_at,

        user: {

          ID_User:
            user.ID_User,

          Username:
            user.Username,

          Role:
            user.Role,

          branchId:
            user.branchId
        }

      });
    }


    // =====================================================
    // GET = VALIDASI SESSION
    // =====================================================

    if (req.method === "GET") {

      const sessionId =
        req.headers["x-session-id"];

      const tenantSlug =
        req.headers["x-tenant-slug"];


      // ==========================================
      // VALIDASI HEADER
      // ==========================================

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


      // ==========================================
      // AMBIL TENANT
      // ==========================================

      const {
        data: tenantResult,
        error: tenantError
      } =
        await centralSupabase.rpc(
          "get_tenant_config",
          {
            p_slug: tenantSlug
          }
        );

      if (tenantError) {
        throw tenantError;
      }

      if (
        !tenantResult?.success ||
        !tenantResult?.data
      ) {
        return res.status(401).json({
          success: false,
          error: "Tenant tidak ditemukan"
        });
      }

      const config =
        tenantResult.data;


      if (!config.is_active) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak aktif"
        });
      }


      // ==========================================
      // SERVICE ROLE CUSTOMER
      // ==========================================

      const {
        data: credential,
        error: credentialError
      } =
        await centralSupabase
          .from("tenant_credentials")
          .select("service_role_key")
          .eq(
            "tenant_id",
            config.tenant_id
          )
          .single();

      if (credentialError) {
        throw credentialError;
      }

      if (!credential?.service_role_key) {
        throw new Error(
          "Service Role Customer tidak ditemukan"
        );
      }


      // ==========================================
      // CUSTOMER SUPABASE
      // ==========================================

      const customerSupabase =
        createClient(
          config.supabase_url,
          credential.service_role_key
        );


      // ==========================================
      // CEK SESSION
      // ==========================================

      const {
        data: session,
        error: sessionError
      } =
        await customerSupabase
          .from("auth_sessions")
          .select(
            "session_id, user_id, expires_at"
          )
          .eq(
            "session_id",
            sessionId
          )
          .maybeSingle();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        return res.status(401).json({
          success: false,
          error: "Session tidak valid"
        });
      }


      // ==========================================
      // CEK EXPIRED
      // ==========================================

      if (
        new Date(session.expires_at)
        <= new Date()
      ) {

        await customerSupabase
          .from("auth_sessions")
          .delete()
          .eq(
            "session_id",
            sessionId
          );

        return res.status(401).json({
          success: false,
          error: "Session sudah expired"
        });
      }


      // ==========================================
      // AMBIL USER
      // ==========================================

      const {
        data: user,
        error: userError
      } =
        await customerSupabase
          .from("Users")
          .select(
            "ID_User, Username, Role, branchId"
          )
          .eq(
            "ID_User",
            session.user_id
          )
          .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User tidak ditemukan"
        });
      }


      // ==========================================
      // RESPONSE SESSION
      // ==========================================

      return res.status(200).json({

        success: true,

        user: {

          ID_User:
            user.ID_User,

          Username:
            user.Username,

          Role:
            user.Role,

          branchId:
            user.branchId
        },

        expires_at:
          session.expires_at

      });
    }


    // =====================================================
    // METHOD LAIN
    // =====================================================

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }
  catch (error) {

    console.error(
      "AUTH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Authentication gagal"
    });
  }
}
