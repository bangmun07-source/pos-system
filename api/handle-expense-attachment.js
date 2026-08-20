import { createClient } from "@supabase/supabase-js";

const centralSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const {
      base64,
      branchId,
      refId,
      tenantSlug
    } = req.body || {};

    // =========================
    // VALIDASI
    // =========================

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: "BASE64 kosong"
      });
    }

    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: "Branch ID kosong"
      });
    }

    if (!refId) {
      return res.status(400).json({
        success: false,
        error: "Ref ID kosong"
      });
    }

    // =========================
    // PILIH DATABASE
    // =========================
    
    let supabase;
    
    const isMaster =
      !tenantSlug ||
      tenantSlug === "master";
    
    // =========================
    // MASTER
    // =========================
    
    if (isMaster) {
    
      console.log(
        "EXPENSE ATTACHMENT → MASTER"
      );
    
      supabase =
        centralSupabase;
    }
    
    // =========================
    // CUSTOMER
    // =========================
    
    else {
    
      console.log(
        "EXPENSE ATTACHMENT → CUSTOMER:",
        tenantSlug
      );
    
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
    
      if (!config.is_active) {
        throw new Error(
          "Tenant tidak aktif"
        );
      }
    
      supabase =
        createClient(
          config.supabase_url,
          config.supabase_anon_key
        );
    
      console.log(
        "CUSTOMER SUPABASE:",
        config.supabase_url
      );
    }

    // =========================
    // BASE64
    // =========================

    const matches =
      base64.match(
        /^data:(.+);base64,(.+)$/
      );

    if (!matches) {
      return res.status(400).json({
        success: false,
        error: "Format file tidak valid"
      });
    }

    const mime =
      matches[1];

    const base64Data =
      matches[2];

    const buffer =
      Buffer.from(
        base64Data,
        "base64"
      );

    // =========================
    // EXTENSION
    // =========================

    let ext =
      mime.split("/")[1];

    if (ext === "jpeg") {
      ext = "jpg";
    }

    // =========================
    // PATH
    // =========================

    const path =
      `${branchId}/${refId}/${refId}_${Date.now()}.${ext}`;

    const bucket =
      "Expense_Attachment";

    // =========================
    // UPLOAD
    // =========================

    const {
      error: uploadError
    } =
      await supabase.storage
        .from(bucket)
        .upload(
          path,
          buffer,
          {
            contentType: mime,
            upsert: false
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    // =========================
    // PUBLIC URL
    // =========================

    const {
      data: publicData
    } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    const url =
      publicData?.publicUrl;

    if (!url) {
      throw new Error(
        "URL attachment tidak ditemukan"
      );
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      url,
      path
    });

  }
  catch (err) {

    console.error(
      "HANDLE EXPENSE ATTACHMENT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload attachment gagal"
    });

  }
}
