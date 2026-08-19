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
      trxId,
      tenantSlug
    } = req.body || {};

    // =========================
    // VALIDATE
    // =========================

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

    // =========================
    // PILIH DATABASE
    // =========================

    let supabase;

    // MASTER
    if (!tenantSlug) {

      console.log(
        "RECEIPT → MASTER"
      );

      supabase =
        centralSupabase;
    }

    // CUSTOMER
    else {

      console.log(
        "RECEIPT → CUSTOMER:",
        tenantSlug
      );

      // Ambil konfigurasi tenant
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

      // Buat client Customer
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

    const base64Data =
      base64.includes(",")
        ? base64.split(",")[1]
        : base64;

    const buffer =
      Buffer.from(
        base64Data,
        "base64"
      );

    // =========================
    // FILE
    // =========================

    const bucket =
      "Recipes_Digital";

    const fileName =
      `${trxId}.jpg`;

    // =========================
    // UPLOAD STORAGE
    // =========================

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

    // =========================
    // PUBLIC URL
    // =========================

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

    // =========================
    // SAVE receipt_url
    // =========================

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

    // =========================
    // RESPONSE
    // =========================

    console.log(
      "RECEIPT UPLOAD SUCCESS:",
      url
    );

    return res.status(200).json({
      success: true,
      url
    });

  }

  catch (err) {

    console.error(
      "HANDLE RECEIPT UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload receipt gagal"
    });

  }

}
