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
        error: "File backup tidak ditemukan"
      });
    }

    const supabase =
      createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );


    // =========================
    // 1. DOWNLOAD DARI STORAGE
    // =========================

    const {
      data: file,
      error: downloadError
    } = await supabase
      .storage
      .from("database_backup")
      .download(filePath);

    if (downloadError) {
      throw downloadError;
    }

    if (!file) {
      throw new Error(
        "File backup tidak ditemukan"
      );
    }


    // =========================
    // 2. PARSE JSON
    // =========================

    const text =
      await file.text();

    const backup =
      JSON.parse(text);


    // =========================
    // 3. RESTORE DATABASE
    // =========================

    const {
      data: result,
      error: restoreError
    } = await supabase.rpc(
      "restore_database_backup",
      {
        p_backup: backup,

        p_restored_by:
          "SYSTEM"
      }
    );

    if (restoreError) {
      throw restoreError;
    }


    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {

    console.error(
      "Restore backup error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Restore backup gagal"
    });

  }
}
