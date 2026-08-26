
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
    // 1. Coba ambil config dari Central Supabase via RPC
    const { data, error } = await centralSupabase.rpc(
      "get_tenant_config",
      { p_slug: slug }
    );

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || "Tenant tidak ditemukan");

    const config = data.data;
    if (!config.is_active) throw new Error("Tenant tidak aktif");

    // Simpan config ke localStorage sebagai cadangan offline
    localStorage.setItem("pos_cached_tenant_config", JSON.stringify(config));

    // 2. Buat Client Customer
    if (
      !supabaseClient ||
      connectedTenantUrl !== config.supabase_url
    ) {
      supabaseClient = supabase.createClient(
        config.supabase_url,
        config.supabase_anon_key
      );
    
      connectedTenantUrl =
        config.supabase_url;
    }

    // 3. Coba baca branch & sync (Bungkus try/catch terpisah agar kalau offline tidak bikin blank)
    try {
      const { count: branchCount } = await supabaseClient
        .from("Branches")
        .select("*", { count: "exact", head: true });

      // Kirim sync ke Vercel di background (tidak perlu di-await mati-matian kalau offline)
      fetch("/api/sync-tenant-branch-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: config.tenant_id })
      }).catch(() => {}); // Abaikan error sync jika offline

      return {
        ...config,
        branch_count: branchCount || 0
      };

    } catch (dbError) {
      console.warn("Gagal konek ke DB tenant (mungkin offline), pakai mode offline:", dbError);
      return config;
    }

  } catch (err) {
    console.warn("Gagal ambil config tenant online, cek cache...", err);
    
    // ==========================================
    // FALLBACK OFFLINE (AMBIL DARI LOCALSTORAGE)
    // ==========================================
    const cachedConfig = localStorage.getItem("pos_cached_tenant_config");
    if (cachedConfig) {
      const config = JSON.parse(cachedConfig);
      // Inisialisasi ulang client pakai data cache
      if (
        !supabaseClient ||
        connectedTenantUrl !== config.supabase_url
      ) {
        supabaseClient = supabase.createClient(
          config.supabase_url,
          config.supabase_anon_key
        );
      
        connectedTenantUrl =
          config.supabase_url;
      }
      console.log("Berhasil memuat tenant dari cache offline!");
      return config;
    }

    // Kalau di cache juga benar-benar kosong, baru lempar error
    throw new Error("Tidak ada koneksi internet dan data offline tidak ditemukan.");
  }
}
