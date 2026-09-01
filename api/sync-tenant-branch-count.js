import { createClient } from "@supabase/supabase-js";

const CENTRAL_SUPABASE_URL =
  process.env.SUPABASE_URL;

const CENTRAL_SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const centralSupabase =
  createClient(
    CENTRAL_SUPABASE_URL,
    CENTRAL_SUPABASE_SERVICE_ROLE_KEY
  );

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    const {
      tenant_id
    } = req.body || {};

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: "tenant_id wajib diisi"
      });
    }

    // =====================================================
    // 1. AMBIL CONFIG TENANT DARI MASTER
    // =====================================================

    const {
      data: tenant,
      error: tenantError
    } = await centralSupabase
      .from("tenant_config")
      .select(
        "id, tenant_id, tenant_name, supabase_url"
      )
      .eq("tenant_id", tenant_id)
      .single();

    if (tenantError) {
      throw tenantError;
    }

    // =====================================================
    // 2. AMBIL SERVICE ROLE CUSTOMER DARI MASTER
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
      throw credentialError;
    }

    if (!credential?.service_role_key) {
      throw new Error(
        "Service Role Customer tidak ditemukan"
      );
    }

    // =====================================================
    // 3. CONNECT KE CUSTOMER DENGAN SERVICE ROLE
    // =====================================================

    const tenantSupabase =
      createClient(
        tenant.supabase_url,
        credential.service_role_key
      );

    // =====================================================
    // 4. HITUNG BRANCH CUSTOMER
    // =====================================================

    const {
      count: branchCount,
      error: branchError
    } = await tenantSupabase
      .from("Branches")
      .select("branchId", {
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
        message:
          branchError.message ||
          "Gagal membaca Branches Customer",
        code: branchError.code || null,
        details: branchError.details || null,
        hint: branchError.hint || null
      });
    }

    console.log(
      "TENANT ID:",
      tenant_id
    );

    console.log(
      "BRANCH COUNT:",
      branchCount
    );

    // =====================================================
    // 5. UPDATE MASTER
    // =====================================================

    const {
      data: updatedTenant,
      error: updateError
    } = await centralSupabase
      .from("tenant_config")
      .update({
        branch_count: branchCount || 0
      })
      .eq("tenant_id", tenant_id)
      .select(
        "tenant_id, tenant_name, branch_count"
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    // =====================================================
    // 6. RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      tenant_id,
      branch_count: branchCount || 0,
      data: updatedTenant
    });

  } catch (error) {

    console.error(
      "SYNC BRANCH FATAL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Gagal sync branch count",
      code:
        error?.code ||
        null,
      details:
        error?.details ||
        null,
      hint:
        error?.hint ||
        null
    });
  }
}
