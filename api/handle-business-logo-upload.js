import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
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
      base64
    } = req.body || {};

    // =========================
    // VALIDATE BASE64
    // =========================

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: "BASE64 kosong"
      });
    }

    // =========================
    // PARSE BASE64
    // =========================

    const matches =
      base64.match(
        /^data:(.+);base64,(.+)$/
      );

    if (!matches) {
      return res.status(400).json({
        success: false,
        error: "Format gambar tidak valid"
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

    const ext =
      mime.split("/")[1] || "jpg";

    // =========================
    // PATH
    // =========================

    const path =
      `business/logo_${Date.now()}.${ext}`;

    // =========================
    // UPLOAD
    // =========================

    const {
      error: uploadError
    } = await supabase.storage
      .from("Logo_Digital_Recipes")
      .upload(
        path,
        buffer,
        {
          contentType: mime,
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
    } = supabase.storage
      .from("Logo_Digital_Recipes")
      .getPublicUrl(path);

    const logoUrl =
      publicData.publicUrl;

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      logo_url: logoUrl
    });

  }
  catch (err) {

    console.error(
      "HANDLE BUSINESS LOGO UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload business logo gagal"
    });

  }

}
