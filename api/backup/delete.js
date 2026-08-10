import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      filePath
    } = req.body || {};

    if (!filePath) {
      return res.status(400).json({
        error: "File path tidak ditemukan"
      });
    }

    const supabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

    const {
      error
    } = await supabase
      .storage
      .from("database_backup")
      .remove([
        filePath
      ]);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      file_path: filePath
    });

  } catch (error) {

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
