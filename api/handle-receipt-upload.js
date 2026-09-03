const { createClient } =
  require("@supabase/supabase-js");

const centralSupabase =
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const {
      base64,
      trxId,
      tenantSlug
    } = req.body || {};

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: "BASE64 kosong"
      });
    }

    if (!trxId) {
      return res.status(400).json({
        success: false,
        error: "TRX ID kosong"
      });
    }

    let supabase;

    // =====================================
    // CUSTOMER
    // =====================================
    
    const isMaster =
      !tenantSlug ||
      tenantSlug === "master";
    
    if (!isMaster) {
  
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
    }
    
    // =====================================
    // MASTER
    // =====================================
    
    else {
      supabase =
        centralSupabase;
    }

    // =====================================
    // BASE64
    // =====================================

    const base64Data =
      base64.includes(",")
        ? base64.split(",")[1]
        : base64;

    const buffer =
      Buffer.from(
        base64Data,
        "base64"
      );

    // =====================================
    // STORAGE
    // =====================================

    const bucket =
      "Recipes_Digital";

    const fileName =
      `${trxId}.jpg`;

    const {
      error: uploadError
    } =
      await supabase.storage
        .from(bucket)
        .upload(
          fileName,
          buffer,
          {
            contentType:
              "image/jpeg",
            upsert: true
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    // =====================================
    // URL
    // =====================================

    const {
      data: publicData
    } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(
          fileName
        );

    const url =
      publicData.publicUrl;

    // =====================================
    // UPDATE TRANSAKSI
    // =====================================

    const {
      error: updateError
    } =
      await supabase
        .from("Transaksi")
        .update({
          receipt_url: url
        })
        .eq(
          "ID_Transaksi",
          trxId
        );

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      url
    });

  }
  catch (err) {
console.error("HANDLE RECEIPT ERROR:", err);
    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload receipt gagal"
    });
  }
};
