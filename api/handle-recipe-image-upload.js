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
      base64,
      recipeId
    } = req.body || {};

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: "BASE64 kosong"
      });
    }

    if (!recipeId) {
      return res.status(400).json({
        success: false,
        error: "Recipe ID kosong"
      });
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
    // BUCKET
    // =========================

    const bucket =
      "Recipes_Digital";


    // =========================
    // FILE
    // =========================

    const fileName =
      `${recipeId}.jpg`;


    // =========================
    // UPLOAD
    // =========================

    const {
      error: uploadError
    } = await supabase.storage
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
    } = supabase.storage
      .from(bucket)
      .getPublicUrl(
        fileName
      );

    const url =
      publicData.publicUrl;


    // =========================
    // SAVE URL TO RECIPES
    // =========================

    const {
      error: updateError
    } = await supabase
      .from("Recipes")
      .update({
        Image: url
      })
      .eq(
        "ID",
        recipeId
      );

    if (updateError) {
      throw updateError;
    }


    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      url
    });

  }
  catch (err) {

    console.error(
      "HANDLE RECIPE IMAGE UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload recipe image gagal"
    });

  }

}
