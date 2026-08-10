import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    const {
      start,
      end,
      branchId,
      loginUserId
    } = req.body || {};

    // =========================
    // VALIDASI
    // =========================

    if (!loginUserId) {
      return res
        .status(400)
        .send("loginUserId wajib diisi");
    }

    // =========================
    // CASH FLOW PAGE DATA
    // =========================

    const {
      data,
      error
    } = await supabase.rpc(
      "get_cash_flow_page_data",
      {
        p_login_user_id: loginUserId,

        p_branch_id:
          branchId || "ALL",

        p_start:
          start || null,

        p_end:
          end || null
      }
    );

    if (error) {
      console.error(
        "get_cash_flow_page_data error:",
        error
      );

      throw error;
    }

    console.log(
      "CASH FLOW EXPORT DATA:",
      data
    );

    // =========================
    // RPC ERROR
    // =========================

    if (!data?.success) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            data?.message ||
            "Gagal mengambil data Cash Flow"
        });
    }

    // =========================
    // SEMENTARA
    // =========================

    return res
      .status(200)
      .json({
        success: true,
        data
      });

  }

  catch (err) {

    console.error(
      "EXPORT CASH FLOW ERROR:",
      err
    );

    return res
      .status(500)
      .json({
        success: false,
        error:
          err?.message ||
          "Export Cash Flow gagal"
      });

  }

}
