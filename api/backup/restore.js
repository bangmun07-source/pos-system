import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      filePath,
      tenantSlug
    } = req.body || {};

    if (!filePath) {
      return res.status(400).json({
        error: "File backup tidak ditemukan"
      });
    }

    if (!tenantSlug) {
      return res.status(400).json({
        error: "Tenant slug kosong"
      });
    }

    // MASTER SUPABASE
    const centralSupabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    // GET TENANT CONFIG
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

    console.log(
      "RESTORE DEBUG:",
      {
        tenantSlug,
        filePath,
        supabaseUrl:
          config.supabase_url,
        hasAnonKey:
          !!config.supabase_anon_key
      }
    );

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

    console.log(
      "RESTORE BACKUP → CUSTOMER:",
      tenantSlug,
      filePath
    );

    // 1. DOWNLOAD DARI STORAGE
    const {
      data: file,
      error: downloadError
    } =
      await supabase
        .storage
        .from("database_backup")
        .download(filePath);
    
    console.log(
      "RESTORE DOWNLOAD:",
      {
        filePath,
        hasFile: !!file,
        error:
          downloadError?.message ||
          null
      }
    );
    
    if (downloadError) {
      throw downloadError;
    }

    if (!file) {
      throw new Error(
        "File backup tidak ditemukan"
      );
    }
    
    // 2. PARSE JSON
    const text =
      await file.text();

    const backup =
      JSON.parse(text);

    // 3. RESTORE DATABASE
    const {
      data: result,
      error: restoreError
    } =
      await supabase.rpc(
        "restore_database_backup",
        {
          p_backup: backup,
          p_restored_by:
            "SYSTEM"
        }
      );

    if (restoreError) {
      throw restoreError;
    }

    // RESPONSE
    return res.status(200).json({
      success: true,
      result
    });
  }
  catch (error) {
    console.error(
      "Restore backup error:",
      error
    );
    return res.status(500).json({
      error:
        error.message ||
        "Restore backup gagal"
    });
  }
}
