import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const sessionId =
      req.headers["x-session-id"];

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: "Session tidak ditemukan"
      });
    }


    // ==========================================
    // MASTER SUPABASE
    // ==========================================

    const centralSupabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );


    // ==========================================
    // TENANT
    // ==========================================

    const tenantSlug =
      req.headers["x-tenant-slug"];

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: "Tenant slug kosong"
      });
    }

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
        .single();

    if (credentialError) {
      throw credentialError;
    }

    if (!credential?.service_role_key) {
      throw new Error(
        "Service Role Customer tidak ditemukan"
      );
    }


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
    // RESPONSE
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
  catch (error) {

    console.error(
      "SESSION CHECK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Session check gagal"
    });
  }
}
