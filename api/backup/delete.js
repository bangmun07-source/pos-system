
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

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: "Tenant slug kosong"
      });
    }

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "File backup tidak ditemukan"
      });
    }

    // =====================================================
    // SESSION
    // =====================================================

    const sessionId =
      req.headers["x-session-id"];
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: "Session tidak ditemukan"
      });
    }

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

    let targetSupabase;

    // =====================================================
    // MASTER
    // =====================================================

    if (tenantSlug === "master") {
      targetSupabase =
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
        return res.status(401).json({
          success: false,
          error: "Tenant tidak ditemukan"
        });
      }

      const config =
        tenantResult.data;
      
      // ==========================================
      // TENANT ACTIVE
      // ==========================================

      if (!config.is_active) {
        return res.status(403).json({
          success: false,
          error: "Tenant tidak aktif"
        });
      }

      // ==========================================
      // CUSTOMER SERVICE ROLE
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

      targetSupabase =
        createClient(
          config.supabase_url,
          credential.service_role_key
        );
    }

    // =====================================================
    // VALIDASI SESSION
    // =====================================================

    const {
      data: session,
      error: sessionError
    } =
      await targetSupabase
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

    // =====================================================
    // CEK EXPIRED
    // =====================================================

    if (
      new Date(session.expires_at)
      <= new Date()
    ) {

      await targetSupabase
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

    // =====================================================
    // AMBIL USER
    // =====================================================

    const {
      data: user,
      error: userError
    } =
      await targetSupabase
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
    // DELETE STORAGE
    // =====================================================

    const {
      data: deletedFiles,
      error: deleteError
    } =
      await targetSupabase
        .storage
        .from("database_backup")
        .remove([
          filePath
        ]);

    if (deleteError) {
      throw deleteError;
    }

    // =====================================================
    // VALIDASI HASIL
    // =====================================================

    if (
      !deletedFiles ||
      deletedFiles.length === 0
    ) {
      throw new Error(
        "File backup tidak ditemukan atau gagal dihapus"
      );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      path:
        filePath,
      tenant:
        tenantSlug,
      user:
        user.Username
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Gagal menghapus file backup"
    });
  }
}
