import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const supabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    // =========================
    // LIST SEMUA STRUK
    // =========================

    const {
      data: files,
      error: listError
    } = await supabase
      .storage
      .from("Recipes_Digital")
      .list("", {
        limit: 1000
      });

    if (listError) {
      throw listError;
    }

    // =========================
    // TIDAK ADA FILE
    // =========================

    if (!files || files.length === 0) {

      return res.status(200).json({
        success: true,
        deleted: 0,
        message: "Tidak ada struk digital"
      });

    }

    // =========================
    // AMBIL NAMA FILE
    // =========================

    const filePaths =
      files
        .filter(file => file.name)
        .map(file => file.name);

    // =========================
    // DELETE SEMUA FILE
    // =========================

    const {
      error: deleteError
    } = await supabase
      .storage
      .from("Recipes_Digital")
      .remove(filePaths);

    if (deleteError) {
      throw deleteError;
    }

    // =========================
    // CLEAR receipt_url
    // =========================

    const {
      error: updateError
    } = await supabase
      .from("Transaksi")
      .update({
        receipt_url: null
      })
      .not(
        "receipt_url",
        "is",
        null
      );

    if (updateError) {
      throw updateError;
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({

      success: true,

      deleted:
        filePaths.length,

      message:
        `${filePaths.length} struk digital berhasil dihapus`

    });

  }
  catch (error) {

    console.error(
      "Clear digital receipts error:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "Gagal menghapus struk digital"

    });

  }

}
