
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {

    const {
      start,
      end,
      status = "ALL",
      branchId
    } = req.body;

    if (!branchId) {
      return res.status(400).send(
        "branchId wajib diisi"
      );
    }

    // =========================
    // GET TRANSACTIONS
    // =========================

    const {
      data: transactions,
      error: trxError
    } = await supabase.rpc(
      "get_recent_transactions_page",
      {
        p_branch_id: branchId,
        p_start: start || null,
        p_end: end || null,
        p_status: status,
        p_table: "ALL"
      }
    );

    if (trxError) {
      throw trxError;
    }

    // =========================
    // GET SUMMARY
    // =========================

    const {
      data: summary,
      error: summaryError
    } = await supabase.rpc(
      "get_recent_transaction_summary",
      {
        p_branch_id: branchId,
        p_start: start || null,
        p_end: end || null,
        p_status: status,
        p_table: "ALL"
      }
    );

    if (summaryError) {
      throw summaryError;
    }

    console.log(
      "EXPORT TRANSACTIONS:",
      transactions
    );

    console.log(
      "EXPORT SUMMARY:",
      summary
    );

    return res.status(200).json({
      success: true,
      transactions,
      summary
    });

  }
  catch (err) {

    console.error(
      "EXPORT RECENT TRANSACTIONS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        err.message ||
        "Export gagal"
    });
  }
}


