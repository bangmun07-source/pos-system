import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const logoSrc =
  `${process.env.SUPABASE_URL}/storage/v1/object/public/Logo/SOMA.png`;

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

    if (!branchId) {
      return res
        .status(400)
        .send("branchId wajib diisi");
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
        p_login_user_id:
          loginUserId,

        p_branch_id:
          branchId || "ALL",

        p_start:
          start || null,

        p_end:
          end || null
      }
    );

    if (error) {
      throw error;
    }

    console.log(
      "EXPORT CASH FLOW DATA:",
      data
    );

    if (!data) {
      throw new Error(
        "Data Cash Flow kosong"
      );
    }

    if (!data.success) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            data.message ||
            "Access denied"
        });
    }

    // =========================
    // NORMALIZE
    // =========================

    const account =
      data.account || {};

    const summary =
      data.summary || {};

    const chart =
      data.chart || {};

    const transfers =
      Array.isArray(data.transfers)
        ? data.transfers
        : [];

    const ownerSummary =
      data.ownerSummary || {};

    const ownerTransactions =
      Array.isArray(
        data.ownerTransactions
      )
        ? data.ownerTransactions
        : [];

    console.log(
      "ACCOUNT:",
      account
    );

    console.log(
      "SUMMARY:",
      summary
    );

    console.log(
      "OWNER SUMMARY:",
      ownerSummary
    );

    console.log(
      "OWNER TRANSACTIONS:",
      ownerTransactions
    );

    // =========================
    // HISTORY
    // =========================

    const history = [
      ...transfers.map(t => ({
        date:
          t.date ||
          t.Date ||
          t.created_at ||
          "-",

        type:
          "Transfer",

        description:
          t.description ||
          `${t.fromAccount || ""} → ${t.toAccount || ""}`,

        amount:
          Number(
            t.amount ||
            t.Amount ||
            0
          )
      })),

      ...ownerTransactions.map(t => ({
        date:
          t.date ||
          t.Date ||
          t.created_at ||
          "-",

        type:
          t.type ||
          "Owner",

        description:
          t.description ||
          t.note ||
          "-",

        amount:
          Number(
            t.amount ||
            t.Amount ||
            0
          )
      }))
    ];

    // =========================
    // HISTORY ROWS
    // =========================

    const historyRows =
      history.length

        ? history.map(h => `
            <tr>

              <td>
                ${escapeHtml(h.date)}
              </td>

              <td>
                ${escapeHtml(h.type)}
              </td>

              <td>
                ${escapeHtml(
                  h.description
                )}
              </td>

              <td class="right">
                Rp ${rupiah(h.amount)}
              </td>

            </tr>
          `).join("")

        : `
          <tr>
            <td
              colspan="4"
              class="empty"
            >
              No Data
            </td>
          </tr>
        `;

    // =========================
    // INCOME SOURCE
    // =========================

    const incomeSource =
      Array.isArray(
        summary.incomeSource
      )
        ? summary.incomeSource
        : [];

    const totalIncome =
      incomeSource.reduce(
        (a, b) =>
          a +
          Number(
            b.amount || 0
          ),
        0
      );

    incomeSource.forEach(i => {

      i.percent =
        totalIncome > 0
          ? (
              Number(
                i.amount || 0
              ) /
              totalIncome
            ) * 100
          : 0;

    });

    const incomeRows =
      incomeSource.length

        ? incomeSource.map(i => `
            <tr>

              <td>
                ${escapeHtml(
                  i.name
                )}
              </td>

              <td>
                Rp ${rupiah(
                  i.amount
                )}
              </td>

              <td class="right">
                ${Number(
                  i.percent || 0
                ).toFixed(1)}%
              </td>

            </tr>
          `).join("")

        : `
          <tr>
            <td
              colspan="3"
              class="empty"
            >
              No income data
            </td>
          </tr>
        `;

    // =========================
    // EXPENSE CATEGORY
    // =========================

    const expenseCategory =
      Array.isArray(
        summary.expenseCategory
      )
        ? summary.expenseCategory
        : [];

    const totalExpense =
      expenseCategory.reduce(
        (a, b) =>
          a +
          Number(
            b.amount || 0
          ),
        0
      );

    expenseCategory.forEach(e => {

      e.percent =
        totalExpense > 0
          ? (
              Number(
                e.amount || 0
              ) /
              totalExpense
            ) * 100
          : 0;

    });

    const expenseRows =
      expenseCategory.length

        ? expenseCategory.map(e => `
            <tr>

              <td>
                ${escapeHtml(
                  e.name
                )}
              </td>

              <td>
                Rp ${rupiah(
                  e.amount
                )}
              </td>

              <td class="right">
                ${Number(
                  e.percent || 0
                ).toFixed(1)}%
              </td>

            </tr>
          `).join("")

        : `
          <tr>
            <td
              colspan="3"
              class="empty"
            >
              No expense data
            </td>
          </tr>
        `;

    // =========================
    // HTML REPORT
    // =========================

    const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Cash Flow Report
</title>

<style>

body{
  font-family:Arial,sans-serif;
  padding:20px;
  color:#333;
}

.logo{
  width:150px;
  height:auto;
  object-fit:contain;
  margin-bottom:16px;
}

.header{
  text-align:center;
}

.kpi{
  display:grid;
  grid-template-columns:
    repeat(4,1fr);
  gap:15px;
}

.card{
  border:1px solid #eee;
  border-radius:12px;
  padding:12px;
  margin-bottom:20px;
}

.kpi .card{
  width:100%;
  box-sizing:border-box;
  padding:10px;
  text-align:center;
}

table{
  width:100%;
  border-collapse:collapse;
  font-size:11px;
}

th{
  background:#f5f5f5;
  padding:8px;
  text-align:left;
}

td{
  padding:8px;
  border-bottom:1px solid #eee;
}

.right{
  text-align:right;
}

.empty{
  text-align:center;
  color:#888;
}

.page-break{
  page-break-before:always;
}

h2{
  font-size:14px;
  margin:8px 0;
}

h3{
  font-size:11px;
  margin:0 0 8px 0;
  font-weight:bold;
}

p{
  font-size:8px;
  margin:8px 0;
}

b{
  font-size:11px;
  font-weight:bold;
}

</style>

</head>

<body>

<div class="header">

<img
  src="${logoSrc}"
  class="logo"
  alt="Sistem POS"
/>

</div>


<!-- =========================
     KPI
========================= -->

<div class="kpi">


<div class="card">

<b>
CASH IN
</b>

<br>

Rp ${rupiah(
  summary.cashIn
)}

</div>


<div class="card">

<b>
CASH OUT
</b>

<br>

Rp ${rupiah(
  summary.cashOut
)}

</div>


<div class="card">

<b>
NET FLOW
</b>

<br>

Rp ${rupiah(
  summary.netFlow
)}

</div>


<div class="card">

<b>
BALANCE
</b>

<br>

Rp ${rupiah(
  summary.totalBalance
)}

</div>


</div>


<!-- =========================
     REPORT INFO
========================= -->

<div>

<h2>
CASH FLOW REPORT
</h2>

<p>

Period :
${escapeHtml(start || "-")}
-
${escapeHtml(end || "-")}

<br>

Branch :
${escapeHtml(
  branchId || "ALL"
)}

</p>

</div>


<!-- =========================
     ACCOUNT BALANCE
========================= -->

<div class="card">

<h3>
ACCOUNT BALANCE
</h3>

<table>

<tr>

<td>
Cash

<br>

Rp ${rupiah(
  account.cash ||
  account.Cash ||
  summary.cashBalance
)}

</td>

<td class="right">
${Number(
  account.cashPercent ||
  summary.cashPercent ||
  0
).toFixed(1)}%
</td>

</tr>


<tr>

<td>
Bank

<br>

Rp ${rupiah(
  account.bank ||
  account.Bank ||
  summary.bankBalance
)}

</td>

<td class="right">
${Number(
  account.bankPercent ||
  summary.bankPercent ||
  0
).toFixed(1)}%
</td>

</tr>

</table>

</div>


<!-- =========================
     INCOME SOURCE
========================= -->

<div class="card">

<h3>
INCOME SOURCE
</h3>

<table>

<tr>

<th>
Source
</th>

<th>
Amount
</th>

<th class="right">
Percent
</th>

</tr>

${incomeRows}

</table>

</div>


<!-- =========================
     EXPENSE CATEGORY
========================= -->

<div class="card">

<h3>
EXPENSE CATEGORY
</h3>

<table>

<tr>

<th>
Category
</th>

<th>
Amount
</th>

<th class="right">
Percent
</th>

</tr>

${expenseRows}

</table>

</div>


<!-- =========================
     OWNER SUMMARY
========================= -->

<div class="card">

<h3>
OWNER SUMMARY
</h3>

<table>

<tr>

<td>
Total Owner In
</td>

<td class="right">

Rp ${rupiah(
  ownerSummary.totalIn ||
  ownerSummary.ownerIn ||
  0
)}

</td>

</tr>


<tr>

<td>
Total Owner Out
</td>

<td class="right">

Rp ${rupiah(
  ownerSummary.totalOut ||
  ownerSummary.ownerOut ||
  0
)}

</td>

</tr>


<tr>

<td>
Net Owner Flow
</td>

<td class="right">

Rp ${rupiah(
  ownerSummary.net ||
  ownerSummary.netFlow ||
  0
)}

</td>

</tr>

</table>

</div>


<div class="page-break"></div>


<!-- =========================
     HISTORY
========================= -->

<div class="card">

<h3>
CASH FLOW HISTORY
</h3>

<table>

<tr>

<th>
Date
</th>

<th>
Type
</th>

<th>
Description
</th>

<th class="right">
Amount
</th>

</tr>

${historyRows}

</table>

</div>


<p>
Generated by Sistem POS
<br>
• ${new Date().toLocaleString(
  "id-ID"
)}
</p>


</body>

</html>

`;

    // =========================
    // RETURN HTML
    // =========================

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    return res
      .status(200)
      .send(html);

  }

  catch (err) {

    console.error(
      "EXPORT CASH FLOW ERROR:",
      err
    );

    return res
      .status(500)
      .json({
        success:false,
        error:
          err?.message ||
          "Export Cash Flow gagal"
      });

  }

}
