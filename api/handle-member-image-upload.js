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
      memberId,
      tenantSlug
    } = req.body || {};

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
      supabase =
        centralSupabase;
    }
    
    // =========================
    // CUSTOMER
    // =========================
    
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
    // PATH
    // =========================

    const ext =
      mime.split("/")[1] || "jpg";

    const path =
      `members/${memberId}_${Date.now()}.${ext}`;

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

    return res.status(200).json({
      success: true,
      url
    });

  }
  catch (err) {

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Upload member image gagal"
    });

  }
}
