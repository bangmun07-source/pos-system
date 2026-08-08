
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

function rupiah(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
    } = req.body || {};

    if (!branchId) {
      return res.status(400).send(
        "branchId wajib diisi"
      );
    }

    // =====================================
    // GET TRANSACTIONS
    // =====================================

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

    // =====================================
    // GET SUMMARY
    // =====================================

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

    // =====================================
    // NORMALIZE DATA
    // =====================================

    const rows =
      Array.isArray(transactions)
        ? transactions
        : [];

    const reportSummary =
      summary || {};

    const paymentDistribution =
      reportSummary.paymentDistribution || {};

    const activeMembers =
      Array.isArray(reportSummary.activeMembers)
        ? reportSummary.activeMembers
        : [];

    // =====================================
    // TRANSACTION ROWS
    // =====================================

    const transactionRows =
      rows.length

        ? rows.map(row => {

            const items =
              Array.isArray(row.items)
                ? row.items
                : [];

            const itemsCount =
              items.reduce(
                (total, item) =>
                  total +
                  Number(item.qty || 0),
                0
              );

            return `
              <tr>

                <td>
                  ${escapeHtml(row.id)}
                </td>

                <td>
                  ${escapeHtml(row.date)}
                </td>

                <td>
                  ${escapeHtml(row.member || "Guest")}
                </td>

                <td>
                  ${escapeHtml(row.status || "-")}
                </td>

                <td class="right">
                  ${itemsCount}
                </td>

                <td class="right">
                  Rp ${rupiah(row.total)}
                </td>

              </tr>
            `;

          }).join("")

        : `
          <tr>
            <td
              colspan="6"
              class="empty"
            >
              No transactions
            </td>
          </tr>
        `;

    // =====================================
    // PAYMENT ROWS
    // =====================================

    const paymentRows =
      Object.entries(paymentDistribution).length

        ? Object.entries(paymentDistribution)
            .map(([method, total]) => {

              const amount =
                Number(total || 0);

              const percent =
                Number(reportSummary.revenue || 0) > 0
                  ? (
                      amount /
                      Number(reportSummary.revenue)
                    ) * 100
                  : 0;

              return `
                <tr>

                  <td>
                    ${escapeHtml(method)}
                  </td>

                  <td class="right">
                    Rp ${rupiah(amount)}
                  </td>

                  <td class="right">
                    ${percent.toFixed(1)}%
                  </td>

                </tr>
              `;

            }).join("")

        : `
          <tr>
            <td colspan="3" class="empty">
              No payment data
            </td>
          </tr>
        `;

    // =====================================
    // ACTIVE MEMBER ROWS
    // =====================================

    const memberRows =
      activeMembers.length

        ? activeMembers.map(member => {

            return `
              <tr>

                <td>
                  ${escapeHtml(member.name)}
                </td>

                <td>
                  ${escapeHtml(member.level)}
                </td>

                <td class="right">
                  ${rupiah(member.point)} PTS
                </td>

              </tr>
            `;

          }).join("")

        : `
          <tr>
            <td
              colspan="3"
              class="empty"
            >
              No active member
            </td>
          </tr>
        `;

    // =====================================
    // REPORT TITLE
    // =====================================

    const filename =
      `Recent Transactions Report - ${branchId} (${start || "-"} - ${end || "-"}).html`;

    // =====================================
    // HTML REPORT
    // =====================================

    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Recent Transactions Report
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  margin: 0;

  background: #ffffff;

  color: #333;

}

.toolbar {

  height: 60px;

  background: #0B0F14;

  color: white;

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0 24px;

  position: sticky;

  top: 0;

  z-index: 100;

}

.toolbar-title {

  font-size: 14px;

  font-weight: bold;

}

.toolbar button {

  background: #ffffff;

  color: #111;

  border: none;

  padding: 10px 18px;

  border-radius: 8px;

  cursor: pointer;

  font-weight: bold;

}

.report {

  max-width: 1100px;

  margin: 0 auto;

  padding: 40px;

}

.header {

  text-align: center;

  margin-bottom: 30px;

}

.title {

  font-size: 26px;

  font-weight: bold;

  margin-bottom: 8px;

}

.subtitle {

  font-size: 12px;

  color: #777;

  margin-top: 4px;

}

.kpi-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 16px;

  margin: 30px 0;

}

.kpi-card {

  border: 1px solid #e5e5e5;

  border-radius: 14px;

  padding: 22px;

  text-align: center;

  background: #fafafa;

}

.kpi-title {

  font-size: 11px;

  color: #666;

  font-weight: bold;

  margin-bottom: 12px;

}

.kpi-value {

  font-size: 22px;

  font-weight: bold;

  color: #222;

}

.section {

  margin-top: 30px;

}

.card {

  border: 1px solid #e5e5e5;

  border-radius: 14px;

  padding: 20px;

}

.card h3 {

  margin-top: 0;

  margin-bottom: 14px;

  font-size: 16px;

}

table {

  width: 100%;

  border-collapse: collapse;

  font-size: 11px;

}

th {

  background: #f5f5f5;

  padding: 10px;

  text-align: left;

  border-bottom: 1px solid #ddd;

}

td {

  padding: 10px;

  border-bottom: 1px solid #eee;

}

.right {

  text-align: right;

}

.empty {

  text-align: center;

  color: #777;

  padding: 20px;

}

.page-break {

  page-break-before: always;

}

.footer {

  margin-top: 50px;

  text-align: center;

  color: #888;

  font-size: 9px;

}

@media print {

  .toolbar {

    display: none;

  }

  .report {

    max-width: none;

    padding: 20px;

  }

  body {

    background: white;

  }

}

</style>

</head>


<body>


<div class="toolbar">

  <div class="toolbar-title">

    📄 Recent Transactions Report

  </div>

  <button onclick="window.print()">

    Download / Print PDF

  </button>

</div>


<div class="report">


  <div class="header">

    <div class="title">

      Recent Transactions Report

    </div>

    <div class="subtitle">

      Periode:
      ${escapeHtml(start || "-")}
      -
      ${escapeHtml(end || "-")}

    </div>

    <div class="subtitle">

      Branch:
      ${escapeHtml(branchId)}

    </div>

    <div class="subtitle">

      Status:
      ${escapeHtml(status)}

    </div>

  </div>


  <!-- KPI -->

  <div class="kpi-grid">


    <div class="kpi-card">

      <div class="kpi-title">

        TOTAL REVENUE

      </div>

      <div class="kpi-value">

        Rp ${rupiah(reportSummary.revenue)}

      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">

        ACTIVE GUEST

      </div>

      <div class="kpi-value">

        ${Number(reportSummary.activeGuests || 0)}

      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">

        ITEMS SOLD

      </div>

      <div class="kpi-value">

        ${Number(reportSummary.itemsSold || 0)}

      </div>

    </div>


  </div>


  <!-- PAYMENT -->

  <div class="section">

    <div class="card">

      <h3>

        Payment Distribution

      </h3>


      <table>

        <thead>

          <tr>

            <th>
              Payment
            </th>

            <th class="right">
              Total
            </th>

            <th class="right">
              Percentage
            </th>

          </tr>

        </thead>


        <tbody>

          ${paymentRows}

        </tbody>

      </table>

    </div>

  </div>


  <!-- MEMBERS -->

  <div class="section">

    <div class="card">

      <h3>

        Active Members

      </h3>


      <table>

        <thead>

          <tr>

            <th>
              Name
            </th>

            <th>
              Tier
            </th>

            <th class="right">
              Point
            </th>

          </tr>

        </thead>


        <tbody>

          ${memberRows}

        </tbody>

      </table>

    </div>

  </div>


  <!-- TRANSACTIONS -->

  <div class="section page-break">

    <div class="card">

      <h3>

        Recent Transactions

      </h3>


      <table>

        <thead>

          <tr>

            <th>
              ID
            </th>

            <th>
              Date
            </th>

            <th>
              Member
            </th>

            <th>
              Status
            </th>

            <th class="right">
              Items
            </th>

            <th class="right">
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          ${transactionRows}

        </tbody>

      </table>

    </div>

  </div>


  <div class="footer">

    Generated by Sistem POS

    • ${new Date().toLocaleString("id-ID")}

  </div>


</div>


</body>

</html>
`;

    // =====================================
    // RETURN HTML
    // =====================================

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    return res.status(200).send(html);

  }

  catch (err) {

    console.error(
      "EXPORT RECENT TRANSACTIONS ERROR:",
      err
    );

    console.error(
      "ERROR MESSAGE:",
      err?.message
    );

    console.error(
      "ERROR STACK:",
      err?.stack
    );

    return res.status(500).json({

      success: false,

      error:
        err?.message ||
        "Export gagal"

    });

  }

}


