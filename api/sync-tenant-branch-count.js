import { createClient } from "@supabase/supabase-js";

// =====================================================
// MASTER SUPABASE
// =====================================================

const CENTRAL_SUPABASE_URL =
  process.env.SUPABASE_URL;

const CENTRAL_SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const centralSupabase =
  createClient(
    CENTRAL_SUPABASE_URL,
    CENTRAL_SUPABASE_SERVICE_ROLE_KEY
  );


// =====================================================
// API HANDLER
// =====================================================

export default async function handler(req, res) {

  // =====================================================
  // METHOD CHECK
  // =====================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    // =====================================================
    // INPUT
    // =====================================================

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
      .eq(
        "tenant_id",
        tenant_id
      )
      .single();

    if (tenantError) {
      console.error(
        "TENANT CONFIG ERROR:",
        tenantError
      );

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil konfigurasi tenant",
        error: tenantError.message || null,
        code: tenantError.code || null
      });
    }


    // =====================================================
    // 2. VALIDASI TENANT
    // =====================================================

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant tidak ditemukan"
      });
    }


    // =====================================================
    // 3. AMBIL SERVICE ROLE CUSTOMER
    //    DARI MASTER
    // =====================================================

    const {
      data: credential,
      error: credentialError
    } = await centralSupabase
      .from("tenant_credentials")
      .select(
        "service_role_key"
      )
      .eq(
        "tenant_id",
        tenant_id
      )
      .single();

    if (credentialError) {
      console.error(
        "CREDENTIAL ERROR:",
        credentialError
      );

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil credential tenant",
        error: credentialError.message || null,
        code: credentialError.code || null
      });
    }


    // =====================================================
    // 4. VALIDASI SERVICE ROLE
    // =====================================================

    if (
      !credential ||
      !credential.service_role_key
    ) {

      return res.status(500).json({
        success: false,
        message:
          "Service Role Customer tidak ditemukan"
      });
    }


    // =====================================================
    // 5. CONNECT KE CUSTOMER DATABASE
    //    SERVICE ROLE HANYA DI SERVER
    // =====================================================

    const tenantSupabase =
      createClient(
        tenant.supabase_url,
        credential.service_role_key
      );


    // =====================================================
    // 6. HITUNG BRANCH CUSTOMER
    // =====================================================

    const {
      count: branchCount,
      error: branchError
    } = await tenantSupabase
      .from("Branches")
      .select(
        "branchId",
        {
          count: "exact",
          head: true
        }
      );


    // =====================================================
    // 7. HANDLE ERROR CUSTOMER
    // =====================================================

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

        code:
          branchError.code ||
          null,

        details:
          branchError.details ||
          null,

        hint:
          branchError.hint ||
          null
      });
    }


    // =====================================================
    // 8. VALIDASI HASIL COUNT
    // =====================================================

    const actualBranchCount =
      Number.isInteger(branchCount)
        ? branchCount
        : 0;


    console.log(
      "SYNC BRANCH SUCCESS",
      {
        tenant_id,
        branch_count: actualBranchCount
      }
    );


    // =====================================================
    // 9. UPDATE MASTER
    // =====================================================

    const {
      data: updatedTenant,
      error: updateError
    } = await centralSupabase
      .from("tenant_config")
      .update({
        branch_count:
          actualBranchCount
      })
      .eq(
        "tenant_id",
        tenant_id
      )
      .select(
        "tenant_id, tenant_name, branch_count"
      )
      .single();


    // =====================================================
    // 10. HANDLE UPDATE ERROR
    // =====================================================

    if (updateError) {

      console.error(
        "MASTER UPDATE ERROR:",
        updateError
      );

      return res.status(500).json({
        success: false,
        message:
          updateError.message ||
          "Gagal update branch_count",

        code:
          updateError.code ||
          null,

        details:
          updateError.details ||
          null,

        hint:
          updateError.hint ||
          null
      });
    }


    // =====================================================
    // 11. RESPONSE
    // =====================================================

    return res.status(200).json({

      success: true,

      tenant_id,

      branch_count:
        actualBranchCount,

      data:
        updatedTenant

    });


  } catch (error) {

    // =====================================================
    // FATAL ERROR
    // =====================================================

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
