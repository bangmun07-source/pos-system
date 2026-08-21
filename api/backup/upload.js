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
      fileName,
      jsonData,
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

    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: "Nama file backup kosong"
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

      console.log(
        "BACKUP → MASTER DATABASE"
      );

      targetSupabase =
        centralSupabase;

    }


    // =====================================================
    // CUSTOMER
    // =====================================================

    else {

      console.log(
        "BACKUP → CUSTOMER:",
        tenantSlug
      );


      // ==========================================
      // GET TENANT CONFIG
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
    // BUAT PATH
    // =====================================================

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const path =
      `${year}/${month}/${fileName}`;


    // =====================================================
    // JSON → BUFFER
    // =====================================================

    const jsonString =
      JSON.stringify(
        jsonData,
        null,
        2
      );

    const buffer =
      Buffer.from(
        jsonString,
        "utf8"
      );


    // =====================================================
    // UPLOAD STORAGE
    // =====================================================

    const {
      error: uploadError
    } =
      await targetSupabase
        .storage
        .from("database_backup")
        .upload(
          path,
          buffer,
          {
            contentType:
              "application/json",

            upsert:
              false
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({

      success: true,

      path:
        path,

      size:
        buffer.length,

      tenant:
        tenantSlug,

      user:
        user.Username

    });

  }
  catch (error) {

    console.error(
      "Upload backup error:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error.message ||
        "Upload backup gagal"

    });

  }
}
