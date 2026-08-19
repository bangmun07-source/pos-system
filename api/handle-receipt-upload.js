const { createClient } =
  require("@supabase/supabase-js");

const centralSupabase =
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

module.exports = async function handler(req, res) {

  console.log(
    "=== HANDLE RECEIPT START ==="
  );

  console.log(
    "METHOD:",
    req.method
  );

  console.log(
    "BODY:",
    req.body
      ? Object.keys(req.body)
      : null
  );

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

    console.log(
      "TRX:",
      trxId
    );

    console.log(
      "TENANT:",
      tenantSlug
    );

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

    if (tenantSlug) {

      console.log(
        "RECEIPT → CUSTOMER"
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

      console.log(
        "TENANT CONFIG:",
        tenantResult
      );

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
        "CUSTOMER URL:",
        config.supabase_url
      );
    }

    // =====================================
    // MASTER
    // =====================================

    else {

      console.log(
        "RECEIPT → MASTER"
      );

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

    console.log(
      "BUFFER SIZE:",
      buffer.length
    );

    // =====================================
    // STORAGE
    // =====================================

    const bucket =
      "Recipes_Digital";

    const fileName =
      `${trxId}.jpg`;

    console.log(
      "UPLOAD:",
      bucket,
      fileName
    );

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

    console.log(
      "STORAGE UPLOAD SUCCESS"
    );

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

    console.log(
      "PUBLIC URL:",
      url
    );

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

    console.log(
      "TRANSAKSI UPDATE SUCCESS"
    );

    return res.status(200).json({
      success: true,
      url
    });

  }
  catch (err) {

    console.error(
      "HANDLE RECEIPT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload receipt gagal"
    });
  }
};
