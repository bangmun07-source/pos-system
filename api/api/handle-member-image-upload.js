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
      memberId
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

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: "Member ID kosong"
      });
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
      `members/${memberId}_${Date.now()}.${ext}`;


    console.log(
      "UPLOAD MEMBER IMAGE:",
      {
        memberId,
        mime,
        path,
        size: buffer.length
      }
    );


    // =========================
    // UPLOAD
    // =========================

    const {
      error: uploadError
    } =
      await supabase.storage
        .from("Member-Image")
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
    } =
      supabase.storage
        .from("Member-Image")
        .getPublicUrl(path);


    const url =
      publicData.publicUrl;


    console.log(
      "MEMBER IMAGE URL:",
      url
    );


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
      "HANDLE MEMBER IMAGE UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload member image gagal"
    });

  }

}
