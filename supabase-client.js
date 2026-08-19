
// =====================================================
// CENTRAL SUPABASE
// =====================================================

const CENTRAL_SUPABASE_URL =
  "https://glbyqlibiapiorztgxee.supabase.co";

const CENTRAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYnlxbGliaWFwaW9yenRneGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNDQ5NTIsImV4cCI6MjA5ODcyMDk1Mn0.4EMqkY3hbMJMwqtwwS3dv1MM1HDueuCrn9BI7uNsqss";


const centralSupabase =
  supabase.createClient(
    CENTRAL_SUPABASE_URL,
    CENTRAL_SUPABASE_ANON_KEY
  );


// =====================================================
// CUSTOMER SUPABASE
// =====================================================

let supabaseClient = null;


// =====================================================
// CONNECT TENANT
// =====================================================

async function connectTenant(slug) {

  console.log(
    "Connecting tenant:",
    slug
  );

  const {
    data,
    error
  } = await centralSupabase.rpc(
    "get_tenant_config",
    {
      p_slug: slug
    }
  );

  if (error) {

    console.error(
      "get_tenant_config error:",
      error
    );

    throw error;
  }

  if (!data?.success) {

    throw new Error(
      data?.message ||
      "Tenant tidak ditemukan"
    );
  }

  const config =
    data.data;

  if (!config.is_active) {

    throw new Error(
      "Tenant tidak aktif"
    );
  }


  // ============================================
  // BUAT CLIENT CUSTOMER
  // ============================================

  supabaseClient =
    supabase.createClient(
      config.supabase_url,
      config.supabase_anon_key
    );


  console.log(
    "Tenant connected:",
    config.tenant_name
  );

  console.log(
    "Tenant ID:",
    config.tenant_id
  );

  console.log(
    "Branch count:",
    config.branch_count
  );


  return config;
}
