import { createClient } from "@supabase/supabase-js";

// =====================================================
// API HANDLER
// =====================================================

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    const { tenant_id } = req.body || {};

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: "tenant_id wajib diisi"
      });
    }

    // =====================================================
    // MASTER
    // =====================================================

    const centralSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // =====================================================
    // 1. AMBIL CONFIG TENANT
    // =====================================================

    const {
      data: tenant,
      error: tenantError
    } = await centralSupabase
      .from("tenant_config")
      .select(
        "tenant_id, tenant_name, supabase_url"
      )
      .eq("tenant_id", tenant_id)
      .single();

    if (tenantError) {
      return res.status(500).json({
        success: false,
        step: "tenant_config",
        message: tenantError.message,
        code: tenantError.code || null
      });
    }

    // =====================================================
    // 2. AMBIL SERVICE ROLE CUSTOMER
    // =====================================================

    const {
      data: credential,
      error: credentialError
    } = await centralSupabase
      .from("tenant_credentials")
      .select("service_role_key")
      .eq("tenant_id", tenant_id)
      .single();

    if (credentialError) {
      return res.status(500).json({
        success: false,
        step: "tenant_credentials",
        message: credentialError.message,
        code: credentialError.code || null
      });
    }

    if (!credential?.service_role_key) {
      return res.status(500).json({
        success: false,
        step: "tenant_credentials",
        message: "Service Role Customer tidak ditemukan"
      });
    }

    // =====================================================
    // 3. CONNECT CUSTOMER DENGAN SERVICE ROLE
    // =====================================================

    const tenantSupabase = createClient(
      tenant.supabase_url,
      credential.service_role_key,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // =====================================================
    // 4. HITUNG BRANCH CUSTOMER
    // =====================================================

    const {
      count: branchCount,
      error: branchError
    } = await tenantSupabase
      .from("Branches")
      .select("*", {
        count: "exact",
        head: true
      });

    if (branchError) {

      console.error(
        "CUSTOMER BRANCH ERROR:",
        branchError
      );

      return res.status(500).json({
        success: false,
        step: "customer_branches",
        message:
          branchError.message ||
          "Gagal membaca Branches Customer",
        code: branchError.code || null,
        details: branchError.details || null,
        hint: branchError.hint || null
      });
    }

    // =====================================================
    // 5. UPDATE MASTER
    // =====================================================

    const actualBranchCount = branchCount || 0;

    const {
      data: updatedTenant,
      error: updateError
    } = await centralSupabase
      .from("tenant_config")
      .update({
        branch_count: actualBranchCount
      })
      .eq("tenant_id", tenant_id)
      .select(
        "tenant_id, tenant_name, branch_count"
      )
      .single();

    if (updateError) {

      return res.status(500).json({
        success: false,
        step: "master_update",
        message:
          updateError.message ||
          "Gagal update branch_count",
        code: updateError.code || null,
        details: updateError.details || null
      });
    }

    // =====================================================
    // 6. SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      tenant_id,
      branch_count: actualBranchCount,
      data: updatedTenant
    });

  } catch (error) {

    console.error(
      "SYNC BRANCH FATAL:",
      error
    );

    return res.status(500).json({
      success: false,
      step: "fatal",
      message:
        error?.message ||
        "Gagal sync branch count"
    });
  }
}
