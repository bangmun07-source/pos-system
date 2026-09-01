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
    

    // 1. CONFIG TENANT DARI MASTER
    const {
      data: tenant,
      error: tenantError
    } = await centralSupabase
      .from("tenant_config")
      .select(
        "id, tenant_id, tenant_name, supabase_url, supabase_anon_key"
      )
      .eq("tenant_id", tenant_id)
      .single();
    if (tenantError) {
      throw tenantError;
    }

    // 2. AMBIL SERVICE ROLE CUSTOMER DARI MASTER
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
    
    const tenantSupabase =
      createClient(
        tenant.supabase_url,
        credential.service_role_key
      );


// 3. HITUNG BRANCH AKTUAL
const branchResponse = await fetch(
  `${tenant.supabase_url}/rest/v1/Branches?select=branchId`,
  {
    method: "GET",
    headers: {
      apikey: credential.service_role_key,
      Authorization: `Bearer ${credential.service_role_key}`,
      Prefer: "count=exact"
    }
  }
);

const branchText = await branchResponse.text();

console.log("CUSTOMER HTTP STATUS:", branchResponse.status);
console.log("CUSTOMER RESPONSE:", branchText);

if (!branchResponse.ok) {
  return res.status(500).json({
    success: false,
    step: "customer_branches",
    status: branchResponse.status,
    message: "Gagal membaca Branches Customer",
    customer_response: branchText
  });
}

const branchData = JSON.parse(branchText);

const branchCount = branchData.length;

console.log("CUSTOMER BRANCH COUNT:", branchCount);

    // 4. UPDATE MASTER
    const {
      data: updatedTenant,
      error: updateError
    } = await centralSupabase
      .from("tenant_config")
      .update({
        branch_count: branchCount
      })
      .eq("tenant_id", tenant_id)
      .select(
        "tenant_id, tenant_name, branch_count"
      )
      .single();
    if (updateError) {
      throw updateError;
    }
    
    // 5. RESPONSE
    return res.status(200).json({
      success: true,
      tenant_id,
      branch_count: branchCount,
      data: updatedTenant
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal sync branch count"
    });
  }
}
