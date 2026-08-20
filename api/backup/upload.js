import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      fileName,
      jsonData,
      tenantSlug
    } = req.body || {};

    if (!tenantSlug) {
      return res.status(400).json({
        error: "Tenant slug kosong"
      });
    }

    const centralSupabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const path =
      `${year}/${month}/${fileName}`;

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
    
    // CUSTOMER SUPABASE
    const supabase =
      createClient(
        config.supabase_url,
        config.supabase_anon_key
      );
    
    const {
      error
    } = await supabase
      .storage
      .from("database_backup")
      .upload(
        path,
        buffer,
        {
          contentType:
            "application/json",
          upsert: false
        }
      );
    
    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      path: path,
      size: buffer.length
    });

  } catch (error) {

    console.error(
      "Upload backup error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Upload backup gagal"
    });

  }
}
