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
        error: "File path tidak ditemukan"
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

    if (!config.is_active) {
      throw new Error(
        "Tenant tidak aktif"
      );
    }

    // ==========================================
    // AMBIL SERVICE ROLE CUSTOMER
    // ==========================================
    
    const {
      data: credential,
      error: credentialError
    } =
      await centralSupabase
        .from("tenant_credentials")
        .select("service_role_key")
        .eq("tenant_id", config.tenant_id)
        .single();
    
    if (credentialError) {
      throw credentialError;
    }
    
    if (!credential?.service_role_key) {
      throw new Error(
        "Service Role Customer tidak ditemukan"
      );
    }
    
    
    // ==========================================
    // CUSTOMER SUPABASE
    // ==========================================
    
    const supabase =
      createClient(
        config.supabase_url,
        credential.service_role_key
      );

    // DELETE
    const {
      data: deletedFiles,
      error
    } =
      await supabase
        .storage
        .from("database_backup")
        .remove([
          filePath
        ]);
    
    console.log(
      "DELETE BACKUP CUSTOMER:",
      {
        tenantSlug,
        filePath,
        deletedFiles,
        error
      }
    );
    
    if (error) {
      throw error;
    }
    
    if (
      !deletedFiles ||
      deletedFiles.length === 0
    ) {
      throw new Error(
        "File backup tidak ditemukan atau gagal dihapus dari Storage tenant"
      );
    }

    return res.status(200).json({
      success: true,
      file_path: filePath
    });

  }
  catch (error) {

    console.error(
      "Delete backup storage error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Gagal menghapus file backup"
    });
  }
}
