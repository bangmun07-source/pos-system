import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { tenantSlug } = req.body || {};

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: "Tenant slug kosong"
      });
    }

    // MASTER SUPABASE
    const centralSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // GET TENANT CONFIG
    const { data: tenantResult, error: tenantError } =
      await centralSupabase.rpc("get_tenant_config", {
        p_slug: tenantSlug
      });

    if (tenantError) {
      throw tenantError;
    }

    if (!tenantResult?.success || !tenantResult?.data) {
      throw new Error(
        tenantResult?.message || "Tenant tidak ditemukan"
      );
    }

    const config = tenantResult.data;

    if (!config.is_active) {
      throw new Error("Tenant tidak aktif");
    }

    // CUSTOMER SUPABASE
    const supabase = createClient(
      config.supabase_url,
      config.supabase_anon_key
    );

    let totalDeleted = 0;
    const batchSize = 100; // Jumlah file yang dihapus dalam sekali cicilan

    // Lakukan perulangan karena storage.list() dibatasi limit, 
    // jadi kita bisa terus menghapus sampai foldernya benar-benar kosong bersih.
    while (true) {
      // LIST FILE (Ambil maksimal 1000 file per iterasi)
      const { data: files, error: listError } = await supabase
        .storage
        .from("Recipes_Digital")
        .list("", {
          limit: 1000
        });

      if (listError) {
        throw listError;
      }

      // Jika sudah tidak ada file sama sekali, hentikan perulangan
      if (!files || files.length === 0) {
        break;
      }

      const filePaths = files
        .filter(file => file.name)
        .map(file => file.name);

      if (filePaths.length === 0) {
        break;
      }

      // CINCIL PENGHAPUSAN BERDASARKAN BATCH SIZE (100 file per tahap)
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const chunk = filePaths.slice(i, i + batchSize);

        const { error: deleteError } = await supabase
          .storage
          .from("Recipes_Digital")
          .remove(chunk);

        if (deleteError) {
          throw deleteError;
        }

        totalDeleted += chunk.length;
      }

      // Jika jumlah file yang di-list kurang dari 1000, 
      // artinya semua file di bucket sudah habis terhapus.
      if (files.length < 1000) {
        break;
      }
    }

    // CLEAR receipt_url DI TABEL TRANSAKSI
    const { error: updateError } = await supabase
      .from("Transaksi")
      .update({
        receipt_url: null
      })
      .not("receipt_url", "is", null);

    if (updateError) {
      throw updateError;
    }

    // RESPONSE
    return res.status(200).json({
      success: true,
      deleted: totalDeleted,
      message: `${totalDeleted} struk digital berhasil dihapus secara bertahap`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Gagal menghapus struk digital"
    });
  }
}
