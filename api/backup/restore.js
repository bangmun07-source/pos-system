
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const {
      filePath,
      tenantSlug
    } = req.body || {};


    // =====================================================
    // VALIDASI INPUT
    // =====================================================

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "File backup tidak ditemukan"
      });
    }

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: "Tenant slug kosong"
      });
    }

    const sessionId = req.headers["x-session-id"];

    // =====================================================
    // MASTER SUPABASE
    // =====================================================

    const centralSupabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    // =====================================================
    // TENTUKAN DATABASE TARGET
    // =====================================================

    let supabase;

    // =====================================================
    // MASTER
    // =====================================================

    if (tenantSlug === "master") {
      supabase =
        centralSupabase;
    }

    // =====================================================
    // CUSTOMER
    // =====================================================

    else {

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
        throw new Error(
          tenantResult?.message ||
          "Tenant tidak ditemukan"
        );
      }

      const config =
        tenantResult.data;


      // ==========================================
      // CEK TENANT
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
          .maybeSingle();

      if (credentialError) {
        throw credentialError;
      }

      if (!credential?.service_role_key) {
        throw new Error(
          "Service Role Customer tidak ditemukan"
        );
      }


      // ==========================================
      // CUSTOMER CLIENT
      // ==========================================

      supabase =
        createClient(
          config.supabase_url,
          credential.service_role_key
        );
    }


    // =====================================================
    // TENTUKAN USER
    // =====================================================

    let user;


    // =====================================================
    // MASTER USER
    // =====================================================

    if (tenantSlug === "master") {

      user = {
        ID_User: "0",
        Username: "owner",
        Role: "Owner",
        branchId: "ALL"
      };

    }


    // =====================================================
    // CUSTOMER SESSION
    // =====================================================

    else {
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          error: "Session tidak ditemukan"
        });
      }


      const {
        data: session,
        error: sessionError
      } =
        await supabase
          .from("auth_sessions")
          .select(`
            session_id,
            user_id,
            expires_at
          `)
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

        await supabase
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
        data: customerUser,
        error: userError
      } =
        await supabase
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

      if (!customerUser) {
        return res.status(401).json({
          success: false,
          error: "User tidak ditemukan"
        });
      }

      user =
        customerUser;
    }


    // =====================================================
    // OWNER ONLY
    // =====================================================

    if (
      user.Role?.toLowerCase() !== "owner"
    ) {

      return res.status(403).json({
        success: false,
        error: "Akses hanya untuk Owner"
      });

    }


    // =====================================================
    // DOWNLOAD BACKUP
    // =====================================================

    const {
      data: file,
      error: downloadError
    } =
      await supabase
        .storage
        .from("database_backup")
        .download(
          filePath
        );

    if (downloadError) {
      throw downloadError;
    }

    if (!file) {
      throw new Error(
        "File backup tidak ditemukan"
      );
    }


    // =====================================================
    // PARSE JSON
    // =====================================================

    const text =
      await file.text();

    const backup =
      JSON.parse(text);


    // =====================================================
    // RESTORE DATABASE
    // =====================================================

    const {
      data: result,
      error: restoreError
    } =
      await supabase.rpc(
        "restore_database_backup",
        {
          p_session_id: sessionId,
          p_backup: backup,
          p_restored_by: user.ID_User
        }
      );

    if (restoreError) {
      throw restoreError;
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      result,
      tenant:
        tenantSlug,
      user:
        user.Username
    });
  }
  catch (error) {

    const message =
      error.message ||
      "Restore backup gagal";
  
    // ==========================================
    // BATAS RESTORE HARIAN
    // ==========================================
  
    if (
      message.includes(
        "Restore sudah dilakukan hari ini"
      )
    ) {
  
      return res.status(429).json({
        success: false,
        error: message,
        limit: "daily_restore"
      });
  
    }
  
    // ==========================================
    // ERROR LAIN
    // ==========================================
  
    return res.status(500).json({
      success: false,
      error: message
    });
  }
}

