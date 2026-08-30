
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
let connectedTenantUrl = null;

function getActiveSupabase() {
  return state.tenantSlug
    ? supabaseClient
    : centralSupabase;
}
// =====================================================
// CONNECT TENANT
// =====================================================

async function connectTenant(slug) {
  try {

    // =====================================================
    // TENANT ISOLATION
    // =====================================================

    const loginTenant = localStorage.getItem("pos_login_tenant");
    const currentSession = localStorage.getItem("pos_session_id");

    // Kalau sudah login, hanya boleh masuk tenant yang sama
    if (currentSession && loginTenant && loginTenant !== slug) {
      throw new Error(
        `Tenant mismatch: login=${loginTenant}, target=${slug}`
      );
    }

    // =====================================================
    // 1. AMBIL CONFIG DARI CENTRAL
    // =====================================================

    const { data, error } = await centralSupabase.rpc(
      "get_tenant_config",
      { p_slug: slug }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(
        data?.message || "Tenant tidak ditemukan"
      );
    }

    const config = data.data;

    if (!config.is_active) {
      throw new Error("Tenant tidak aktif");
    }

    // =====================================================
    // 2. CONNECT DATABASE TENANT
    // =====================================================

    localStorage.setItem(
      "pos_cached_tenant_config",
      JSON.stringify(config)
    );

    if (slug === "master") {

      supabaseClient = centralSupabase;

      connectedTenantUrl =
        CENTRAL_SUPABASE_URL;

    } else if (
      !supabaseClient ||
      connectedTenantUrl !== config.supabase_url
    ) {

      supabaseClient =
        supabase.createClient(
          config.supabase_url,
          config.supabase_anon_key
        );

      connectedTenantUrl =
        config.supabase_url;
    }

    // =====================================================
    // 3. BRANCH SYNC
    // =====================================================

    try {

      const { count: branchCount } =
        await supabaseClient
          .from("Branches")
          .select("*", {
            count: "exact",
            head: true
          });

      fetch("/api/sync-tenant-branch-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenant_id: config.tenant_id
        })
      }).catch(() => {});

      return {
        ...config,
        branch_count: branchCount || 0
      };

    } catch (dbError) {

      console.warn(
        "Gagal konek DB tenant:",
        dbError
      );

      return config;
    }

  } catch (err) {

    // Tenant mismatch JANGAN masuk fallback cache
    if (
      err?.message?.startsWith("Tenant mismatch")
    ) {
      console.error(err);
      throw err;
    }

    console.warn(
      "Gagal ambil config tenant online, cek cache...",
      err
    );

    // ==========================================
    // FALLBACK OFFLINE
    // ==========================================

    const cachedConfig =
      localStorage.getItem(
        "pos_cached_tenant_config"
      );

    if (cachedConfig) {

      const config =
        JSON.parse(cachedConfig);

      if (
        config.supabase_url ===
        CENTRAL_SUPABASE_URL
      ) {

        supabaseClient =
          centralSupabase;

        connectedTenantUrl =
          CENTRAL_SUPABASE_URL;

      } else if (
        !supabaseClient ||
        connectedTenantUrl !==
          config.supabase_url
      ) {

        supabaseClient =
          supabase.createClient(
            config.supabase_url,
            config.supabase_anon_key
          );

        connectedTenantUrl =
          config.supabase_url;
      }

      return config;
    }

    throw new Error(
      "Tidak ada koneksi internet dan data offline tidak ditemukan."
    );
  }
}
