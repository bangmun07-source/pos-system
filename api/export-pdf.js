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


function normalize(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}


export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    const {
      type = "",
      start,
      end,
      branchId,
      status = "ALL",
      category = "ALL",
      tier = "ALL"
    } = req.body || {};

    console.log(
      "EXPORT PDF REQUEST:",
      {
        type,
        start,
        end,
        branchId,
        status,
        category,
        tier
      }
    );

    // ==========================================
    // EXPENSE
    // ==========================================

    if (type === "expense") {

      // ========================================
      // VALIDASI
      // ========================================

      if (!branchId) {

        return res
          .status(400)
          .json({
            success: false,
            error: "branchId wajib diisi"
          });

      }


      // ========================================
      // NORMALIZE FILTER
      // ========================================

      const normalizedStatus =
        status === "All Status"
          ? "ALL"
          : status || "ALL";


      const normalizedCategory =
        category === "All Categories"
          ? "ALL"
          : category || "ALL";


      console.log(
        "EXPORT EXPENSE REQUEST:",
        {
          start: start || null,
          end: end || null,
          branchId,
          status: normalizedStatus,
          category: normalizedCategory
        }
      );


      // ========================================
      // RPC
      // ========================================

      const {
        data,
        error
      } = await supabase.rpc(
        "get_expense_dashboard",
        {

          p_branch_id:
            branchId,

          p_status:
            normalizedStatus,

          p_category:
            normalizedCategory,

          p_keyword:
            "",

          p_start:
            start || null,

          p_end:
            end || null

        }
      );


      if (error) {

        console.error(
          "RPC get_expense_dashboard ERROR:",
          error
        );

        throw error;

      }


      // ========================================
      // DATA
      // ========================================

      const rows =
        Array.isArray(data?.expenses)
          ? data.expenses
          : [];


      console.log(
        "EXPORT EXPENSE ROW COUNT:",
        rows.length
      );


      // ========================================
      // FILTER
      // ========================================

      const filteredRows =
        rows.filter(row => {

          const rowBranch =
            row.branchId ??
            row.branch_id ??
            row.branchid ??
            "";


          const rowStatus =
            row.status ??
            row.Status ??
            "";


          const rowCategory =
            row.category ??
            row.Category ??
            "";


          const matchBranch =
            normalize(rowBranch) ===
            normalize(branchId);


          const matchStatus =
            normalizedStatus === "ALL" ||
            normalize(rowStatus) ===
              normalize(normalizedStatus);


          const matchCategory =
            normalizedCategory === "ALL" ||
            normalize(rowCategory) ===
              normalize(normalizedCategory);


          return (
            matchBranch &&
            matchStatus &&
            matchCategory
          );

        });


      console.log(
        "FILTERED EXPENSE ROW COUNT:",
        filteredRows.length
      );


      // ========================================
      // PAID
      // ========================================

      const paidRows =
        filteredRows.filter(row => {

          const rowStatus =
            row.status ??
            row.Status ??
            "";

          return (
            normalize(rowStatus) ===
            "PAID"
          );

        });


      // ========================================
      // CATEGORY
      // ========================================

      const categoryMap = {};

      let categoryTotal = 0;


      paidRows.forEach(row => {

        const categoryName =
          row.category ??
          row.Category ??
          "Other";


        const amount =
          Number(
            row.amount ??
            row.Amount ??
            0
          );


        categoryMap[categoryName] =
          (
            categoryMap[categoryName] ||
            0
          ) + amount;


        categoryTotal += amount;

      });


      const categoryBreakdown =
        Object.entries(categoryMap)
          .map(
            ([name, amount]) => {

              return {

                name,

                amount,

                percent:
                  categoryTotal > 0
                    ? (
                        amount /
                        categoryTotal
                      ) * 100
                    : 0

              };

            }
          )
          .sort(
            (a, b) =>
              b.amount - a.amount
          );


      // ========================================
      // TOTAL
      // ========================================

      const total =
        paidRows.reduce(
          (sum, row) => {

            const amount =
              Number(
                row.amount ??
                row.Amount ??
                0
              );

            return sum + amount;

          },
          0
        );


      // ========================================
      // CATEGORY HTML
      // ========================================

      const categoryRows =
        categoryBreakdown.length

          ? categoryBreakdown
              .map(item => {

                return `
                  <tr>

                    <td>
                      ${escapeHtml(item.name)}
                    </td>

                    <td class="right">
                      ${item.percent.toFixed(1)}%
                    </td>

                    <td class="right">
                      Rp ${rupiah(item.amount)}
                    </td>

                  </tr>
                `;

              })
              .join("")

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


      // ========================================
      // LEDGER HTML
      // ========================================

      const ledgerRows =
        filteredRows.length

          ? filteredRows
              .map(row => {

                const date =
                  row.tanggal ??
                  row.date ??
                  "";


                const refId =
                  row.refId ??
                  row.ref_id ??
                  "";


                const description =
                  row.description ??
                  "";


                const rowCategory =
                  row.category ??
                  row.Category ??
                  "";


                const payment =
                  row.paymentMethod ??
                  row.payment_method ??
                  row.method ??
                  "";


                const rowBranch =
                  row.branchId ??
                  row.branch_id ??
                  "";


                const rowStatus =
                  row.status ??
                  row.Status ??
                  "";


                const amount =
                  Number(
                    row.amount ??
                    row.Amount ??
                    0
                  );


                return `
                  <tr>

                    <td>
                      ${escapeHtml(date)}
                    </td>

                    <td>
                      ${escapeHtml(refId)}
                    </td>

                    <td>
                      ${escapeHtml(description)}
                    </td>

                    <td>
                      ${escapeHtml(rowCategory)}
                    </td>

                    <td>
                      ${escapeHtml(payment)}
                    </td>

                    <td>
                      ${escapeHtml(rowBranch)}
                    </td>

                    <td>
                      ${escapeHtml(rowStatus)}
                    </td>

                    <td class="right">
                      Rp ${rupiah(amount)}
                    </td>

                  </tr>
                `;

              })
              .join("")

          : `
              <tr>

                <td
                  colspan="8"
                  class="empty"
                >
                  No expense data
                </td>

              </tr>
            `;


      // ========================================
      // FILENAME
      // ========================================

      const filename =
        `Expense Ledger Report - ${branchId} (${start || "-"} - ${end || "-"}).pdf`;


      // ========================================
      // HTML REPORT
      // ========================================

      const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  ${escapeHtml(filename)}
</title>

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {

  background: #0B0F14;

  font-family:
    Arial,
    sans-serif;

  color: #333;

  padding:
    40px 20px;

}

.export-toolbar {

  width: 100%;

  max-width:
    1100px;

  margin:
    0 auto 20px auto;

  display:
    flex;

  justify-content:
    space-between;

  align-items:
    center;

  color: white;

  font-size: 14px;

}

.export-toolbar button {

  border:
    1px solid
    rgba(255,255,255,.15);

  background:
    rgba(255,255,255,.08);

  color: white;

  padding:
    10px 16px;

  border-radius:
    10px;

  cursor:
    pointer;

  font-weight:
    bold;

}

.report {

  width: 100%;

  max-width:
    1100px;

  margin:
    0 auto;

  background:
    white;

  padding:
    45px;

  border-radius:
    4px;

  box-shadow:
    0 20px 60px
    rgba(0,0,0,.45);

}

.header {

  text-align:
    center;

  margin-bottom:
    15px;

}

.logo {

  width:
    170px;

  height:
    auto;

  max-height:
    90px;

  object-fit:
    contain;

  margin-bottom:
    8px;

}

.title {

  font-size:
    24px;

  font-weight:
    bold;

  margin-bottom:
    8px;

}

.meta {

  font-size:
    12px;

  color:
    #777;

  line-height:
    1.7;

}

.kpi-grid {

  display:
    grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap:
    16px;

  margin:
    30px 0;

}

.kpi-card {

  border:
    1px solid
    #e5e5e5;

  border-radius:
    14px;

  padding:
    22px;

  background:
    #fafafa;

  text-align:
    center;

}

.kpi-title {

  font-size:
    11px;

  color:
    #666;

  font-weight:
    bold;

  margin-bottom:
    12px;

}

.kpi-value {

  font-size:
    22px;

  font-weight:
    bold;

  color:
    #222;

}

.card {

  border:
    1px solid
    #e5e5e5;

  border-radius:
    14px;

  padding:
    18px;

  margin-top:
    20px;

  background:
    #fff;

}

.card h3 {

  margin:
    0 0 12px 0;

  font-size:
    16px;

}

table {

  width:
    100%;

  border-collapse:
    collapse;

  font-size:
    11px;

  margin-top:
    10px;

}

th {

  background:
    #f5f5f5;

  padding:
    10px;

  text-align:
    left;

  font-weight:
    bold;

}

td {

  padding:
    10px;

  border-bottom:
    1px solid
    #eee;

}

.right {

  text-align:
    right;

}

.empty {

  text-align:
    center;

  color:
    #777;

  padding:
    25px;

}

.total {

  margin-top:
    15px;

  text-align:
    right;

  font-weight:
    bold;

  font-size:
    14px;

}

.footer {

  margin-top:
    40px;

  text-align:
    center;

  font-size:
    9px;

  color:
    #888;

}

.page-break {

  page-break-before:
    always;

}

@media print {

  body {

    background:
      white;

    padding:
      0;

  }

  .export-toolbar {

    display:
      none;

  }

  .report {

    max-width:
      none;

    box-shadow:
      none;

    border-radius:
      0;

    padding:
      25px;

  }

}

</style>

</head>

<body>

<div class="export-toolbar">

  <div>
    📄 Expense Ledger Report
  </div>

  <button
    onclick="window.print()"
  >
    Download / Print PDF
  </button>

</div>

<div class="report">

  <div class="header">

    ${
      logoSrc
        ? `
          <img
            src="${logoSrc}"
            class="logo"
            alt="Sistem POS"
          />
        `
        : ""
    }

    <div class="title">
      Expense Ledger Report
    </div>

  </div>

  <div class="meta">

    <b>Periode:</b>
    ${escapeHtml(start || "-")}
    -
    ${escapeHtml(end || "-")}

    <br>

    <b>Branch:</b>
    ${escapeHtml(branchId)}

    <br>

    <b>Status:</b>
    ${escapeHtml(normalizedStatus)}

    <br>

    <b>Category:</b>
    ${escapeHtml(normalizedCategory)}

  </div>

  <div class="kpi-grid">

    <div class="kpi-card">

      <div class="kpi-title">
        TOTAL EXPENDITURE
      </div>

      <div class="kpi-value">
        Rp ${rupiah(total)}
      </div>

    </div>

    <div class="kpi-card">

      <div class="kpi-title">
        TOTAL EXPENSE RECORDS
      </div>

      <div class="kpi-value">
        ${filteredRows.length}
      </div>

    </div>

  </div>

  <div class="card">

    <h3>
      Category Breakdown
    </h3>

    <table>

      <thead>

        <tr>

          <th>
            Category
          </th>

          <th class="right">
            Percent
          </th>

          <th class="right">
            Amount
          </th>

        </tr>

      </thead>

      <tbody>

        ${categoryRows}

      </tbody>

    </table>

    <div class="total">

      TOTAL EXPENDITURE:
      Rp ${rupiah(total)}

    </div>

  </div>

  <div class="page-break"></div>

  <div class="card">

    <h3>
      Expense Ledger
    </h3>

    <table>

      <thead>

        <tr>

          <th>Date</th>
          <th>Ref ID</th>
          <th>Description</th>
          <th>Category</th>
          <th>Payment</th>
          <th>Branch</th>
          <th>Status</th>

          <th class="right">
            Amount
          </th>

        </tr>

      </thead>

      <tbody>

        ${ledgerRows}

      </tbody>

    </table>

  </div>

  <div class="footer">

    Generated by Sistem POS
    •
    ${new Date().toLocaleString("id-ID")}

  </div>

</div>

</body>

</html>
`;


      // ========================================
      // RETURN
      // ========================================

      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );

      return res
        .status(200)
        .send(html);

    }




    // ==========================================
    // MEMBERS
    // ==========================================

    if (type === "members") {

      if (!branchId) {

        return res
          .status(400)
          .json({
            success: false,
            error: "branchId wajib diisi"
          });

      }


      // ========================================
      // GET SEMUA MEMBER
      // ========================================

      const {
        data: members,
        error
      } = await supabase.rpc(
        "get_members",
        {
          p_branch_id: null
        }
      );


      if (error) {
        throw error;
      }


      console.log(
        "EXPORT MEMBERS:",
        members?.length
      );


      // ========================================
      // NORMALIZE
      // ========================================

      let rows =
        Array.isArray(members)
          ? members.map(m => ({
              id: m.ID_Member,
              name: m.Nama,
              tier: m.Level_Current,
              spend: m.Total_Spend,
              points: m.Point,
              wa: m.WA
            }))
          : [];


      // ========================================
      // FILTER TIER
      // ========================================

      if (
        tier &&
        tier.toUpperCase() !== "ALL"
      ) {

        rows = rows.filter(r =>
          String(r.tier || "")
            .toUpperCase() ===
          tier.toUpperCase()
        );

      }


      console.log(
        "EXPORT MEMBER ROWS:",
        rows.length
      );


      // ========================================
      // SUMMARY
      // ========================================

      const totalMembers =
        rows.length;


      const {
        data: tier5Setting,
        error: tier5Error
      } = await supabase
        .from("Settings")
        .select("name_value")
        .eq("key", "tier_5")
        .maybeSingle();


      if (tier5Error) {
        throw tier5Error;
      }


      const topTierName =
        tier5Setting?.name_value ||
        "Top Tier";


      const totalTopTier =
        rows.filter(r =>
          String(r.tier || "")
            .toUpperCase() ===
          String(topTierName)
            .toUpperCase()
        ).length;


      const totalPoints =
        rows.reduce(
          (sum, r) =>
            sum +
            Number(r.points || 0),
          0
        );


      // ========================================
      // MEMBER ROWS
      // ========================================

      const memberRows =
        rows.length

          ? rows
              .map(m => `
                <tr>

                  <td>
                    ${escapeHtml(m.id)}
                  </td>

                  <td>
                    ${escapeHtml(m.name)}
                  </td>

                  <td>
                    ${escapeHtml(m.tier)}
                  </td>

                  <td class="right">
                    Rp ${rupiah(m.spend)}
                  </td>

                  <td class="right">
                    ${rupiah(m.points)}
                  </td>

                  <td>
                    ${escapeHtml(m.wa)}
                  </td>

                </tr>
              `)
              .join("")

          : `
              <tr>

                <td
                  colspan="6"
                  class="empty"
                >
                  No members
                </td>

              </tr>
            `;


      // ========================================
      // HTML MEMBER REPORT
      // ========================================

      const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Member Directory Report
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  padding: 40px 20px;

  background: #0B0F14;

  font-family:
    Arial,
    sans-serif;

  color: #333;

}

.export-toolbar {

  width: 100%;

  max-width: 1100px;

  margin: 0 auto 20px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  color: white;

}

.export-toolbar button {

  border:
    1px solid
    rgba(255,255,255,.15);

  background:
    rgba(255,255,255,.08);

  color: white;

  padding:
    10px 16px;

  border-radius: 10px;

  cursor: pointer;

  font-weight: bold;

}

.report {

  width: 100%;

  max-width: 1100px;

  margin: auto;

  background: white;

  padding: 45px;

  border-radius: 4px;

}

.header {

  text-align: center;

  margin-bottom: 20px;

}

.logo {

  width: 170px;

  max-height: 90px;

  object-fit: contain;

}

.title {

  font-size: 24px;

  font-weight: bold;

  margin-bottom: 8px;

}

.subtitle {

  font-size: 12px;

  color: #777;

  margin-bottom: 3px;

}

.kpi-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 16px;

  margin: 30px 0;

}

.kpi-card {

  border:
    1px solid #e5e5e5;

  border-radius: 14px;

  padding: 22px;

  background: #fafafa;

  text-align: center;

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

}

.card {

  border:
    1px solid #e5e5e5;

  border-radius: 14px;

  padding: 18px;

  margin-top: 20px;

}

.card h3 {

  margin-top: 0;

  font-size: 16px;

}

table {

  width: 100%;

  border-collapse: collapse;

  font-size: 11px;

  margin-top: 10px;

}

th {

  background: #f5f5f5;

  padding: 10px;

  text-align: left;

}

td {

  padding: 10px;

  border-bottom:
    1px solid #eee;

}

.right {

  text-align: right;

}

.empty {

  text-align: center;

  color: #777;

  padding: 25px;

}

.footer {

  margin-top: 40px;

  text-align: center;

  font-size: 9px;

  color: #888;

}

@media print {

  body {

    background: white;

    padding: 0;

  }

  .export-toolbar {

    display: none;

  }

  .report {

    max-width: none;

    box-shadow: none;

    border-radius: 0;

  }

}

</style>

</head>

<body>

<div class="export-toolbar">

  <div>
    📄 Member Directory Report
  </div>

  <button onclick="window.print()">
    Download / Print PDF
  </button>

</div>

<div class="report">

  <div class="header">

    <img
      src="${logoSrc}"
      class="logo"
      alt="Sistem POS"
    >

  </div>

  <div class="title">
    Member Directory Report
  </div>

  <div class="subtitle">
    Branch:
    ${escapeHtml(branchId)}
  </div>

  <div class="subtitle">
    Tier:
    ${escapeHtml(tier)}
  </div>

  <div class="kpi-grid">

    <div class="kpi-card">

      <div class="kpi-title">
        TOTAL MEMBERS
      </div>

      <div class="kpi-value">
        ${rupiah(totalMembers)}
      </div>

    </div>

    <div class="kpi-card">

      <div class="kpi-title">
        ${escapeHtml(topTierName)} TIER
      </div>

      <div class="kpi-value">
        ${rupiah(totalTopTier)}
      </div>

    </div>

    <div class="kpi-card">

      <div class="kpi-title">
        POINTS ISSUED
      </div>

      <div class="kpi-value">
        ${rupiah(totalPoints)}
      </div>

    </div>

  </div>

  <div class="card">

    <h3>
      Member Directory
    </h3>

    <table>

      <thead>

        <tr>

          <th>ID</th>

          <th>Name</th>

          <th>Tier</th>

          <th class="right">
            Spend
          </th>

          <th class="right">
            Points
          </th>

          <th>
            WhatsApp
          </th>

        </tr>

      </thead>

      <tbody>

        ${memberRows}

      </tbody>

    </table>

  </div>

  <div class="footer">

    Generated by Sistem POS
    •
    ${new Date().toLocaleString("id-ID")}

  </div>

</div>

</body>

</html>

`;


      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );

      return res
        .status(200)
        .send(html);

    }


// ==========================================
// RECENT TRANSACTIONS
// ==========================================

if (type === "recent-transactions") {

  if (!branchId) {

    return res
      .status(400)
      .json({
        success: false,
        error: "branchId wajib diisi"
      });

  }

  // GET TRANSACTIONS
  const {
    data: transactions,
    error: trxError
  } = await supabase.rpc(
    "get_recent_transactions_page",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null,
      p_status: status || "ALL",
      p_table: "ALL"
    }
  );

  if (trxError) {
    throw trxError;
  }

  // GET SUMMARY
  const {
    data: summary,
    error: summaryError
  } = await supabase.rpc(
    "get_recent_transaction_summary",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null,
      p_status: status || "ALL",
      p_table: "ALL"
    }
  );

  if (summaryError) {
    throw summaryError;
  }

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

  // ========================================
  // TRANSACTION ROWS
  // ========================================

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
                ${escapeHtml(
                  row.member || "Guest"
                )}
              </td>

              <td class="center">
                ${escapeHtml(
                  row.status || "-"
                )}
              </td>

              <td class="center">
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

  // ========================================
  // PAYMENT ROWS
  // ========================================

  const paymentRows =
    Object.entries(paymentDistribution).length

      ? Object.entries(paymentDistribution)
          .map(([method, total]) => {

            const amount =
              Number(total || 0);

            const revenue =
              Number(
                reportSummary.revenue || 0
              );

            const percent =
              revenue > 0
                ? (amount / revenue) * 100
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

  // ========================================
  // ACTIVE MEMBERS
  // ========================================

  const memberRows =
    activeMembers.length

      ? activeMembers.map(member => {

          return `
            <tr>

              <td>
                ${escapeHtml(member.name)}
              </td>

              <td class="center">
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

  // ========================================
  // HTML REPORT
  // ========================================

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

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: #0B0F14;
  font-family: Arial, sans-serif;
  color: #333;
  padding: 40px 20px;
}

.export-toolbar {

  width: 100%;
  max-width: 1100px;

  margin: 0 auto 20px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  color: white;
  font-size: 14px;

}

.export-toolbar button {

  border:
    1px solid
    rgba(255,255,255,.15);

  background:
    rgba(255,255,255,.08);

  color: white;

  padding: 10px 16px;

  border-radius: 10px;

  cursor: pointer;

  font-weight: bold;

}

.report {

  width: 100%;
  max-width: 1100px;

  margin: auto;

  background: white;

  padding: 45px;

  border-radius: 4px;

  box-shadow:
    0 20px 60px
    rgba(0,0,0,.45);

}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.logo {

  width: 170px;
  height: auto;

  max-height: 90px;

  object-fit: contain;

  margin-bottom: 12px;

}

.title {

  font-size: 24px;

  font-weight: bold;

  margin-bottom: 8px;

}

.subtitle {

  font-size: 12px;

  color: #777;

  margin-bottom: 3px;

}

.kpi-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 16px;

  margin: 30px 0;

}

.kpi-card {

  border:
    1px solid #e5e5e5;

  border-radius: 14px;

  padding: 22px;

  background: #fafafa;

  text-align: center;

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

.card {

  border:
    1px solid #e5e5e5;

  border-radius: 14px;

  padding: 18px;

  margin-top: 20px;

  background: white;

}

.card h3 {

  margin-top: 0;

  margin-bottom: 12px;

  font-size: 16px;

}

table {

  width: 100%;

  border-collapse: collapse;

  font-size: 11px;

  margin-top: 10px;

}

th {

  background: #f5f5f5;

  padding: 10px;

  text-align: left;

  font-weight: bold;

}

td {

  padding: 10px;

  border-bottom:
    1px solid #eee;

}

.right {
  text-align: right;
}

.center {
  text-align: center;
}

.empty {

  text-align: center;

  color: #777;

  padding: 25px;

}

.footer {

  margin-top: 40px;

  text-align: center;

  font-size: 9px;

  color: #888;

}

.page-break {

  page-break-before: always;

}

@media print {

  body {

    background: white;

    padding: 0;

  }

  .export-toolbar {

    display: none;

  }

  .report {

    max-width: none;

    box-shadow: none;

    border-radius: 0;

    padding: 25px;

  }

}

</style>

</head>

<body>

<div class="export-toolbar">

  <div>
    📄 Recent Transactions Report
  </div>

  <button onclick="window.print()">
    Download / Print PDF
  </button>

</div>

<div class="report">

  <div class="header">

    ${
      logoSrc
        ? `
          <img
            src="${logoSrc}"
            class="logo"
            alt="Sistem POS"
          />
        `
        : ""
    }

  </div>

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
        ${Number(
          reportSummary.activeGuests || 0
        )}
      </div>

    </div>

    <div class="kpi-card">

      <div class="kpi-title">
        ITEMS SOLD
      </div>

      <div class="kpi-value">
        ${Number(
          reportSummary.itemsSold || 0
        )}
      </div>

    </div>

  </div>

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

          <th class="center">
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

  <div class="page-break"></div>

  <div class="card">

    <h3>
      Recent Transactions
    </h3>

    <table>

      <thead>

        <tr>

          <th>ID</th>
          <th>Date</th>
          <th>Member</th>
          <th class="center">Status</th>
          <th class="center">Items</th>
          <th class="right">Total</th>

        </tr>

      </thead>

      <tbody>

        ${transactionRows}

      </tbody>

    </table>

  </div>

  <div class="footer">

    Generated by Sistem POS
    •
    ${new Date().toLocaleString("id-ID")}

  </div>

</div>

</body>

</html>
`;

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  return res
    .status(200)
    .send(html);

}


// ==========================================
// GROSS REVENUE
// ==========================================

else if (type === "gross-revenue") {

  if (!branchId) {

    return res
      .status(400)
      .send("branchId wajib diisi");

  }

  // =========================
  // GET GROSS REVENUE
  // =========================

  const {
    data,
    error
  } = await supabase.rpc(
    "get_gross_revenue_by_date",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null
    }
  );

  if (error) {
    throw error;
  }

  console.log(
    "EXPORT GROSS REVENUE:",
    data
  );

  // =========================
  // NORMALIZE
  // =========================

  const report =
    data || {};

  const summary =
    report.summary || {};

  const category =
    Array.isArray(report.category)
      ? report.category
      : [];

  const trend =
    Array.isArray(report.trend)
      ? report.trend
      : [];

  // =========================
  // CATEGORY ROWS
  // =========================

  const categoryRows =
    category.length

      ? category.map(item => `
          <tr>

            <td>
              ${escapeHtml(
                item.category
              )}
            </td>

            <td class="right">
              IDR ${rupiah(
                item.grossRevenue
              )}
            </td>

          </tr>
        `).join("")

      : `
        <tr>
          <td
            colspan="2"
            class="empty"
          >
            No category data
          </td>
        </tr>
      `;

  // =========================
  // TREND ROWS
  // =========================

  const trendRows =
    trend.length

      ? trend.map(item => {

          const date =
            new Date(
              `${item.date}T00:00:00`
            );

          const dayName =
            date.toLocaleDateString(
              "id-ID",
              {
                weekday: "long"
              }
            );

          return `
            <tr>

              <td>
                ${escapeHtml(
                  item.date
                )}
              </td>

              <td>
                ${escapeHtml(
                  dayName
                )}
              </td>

              <td class="right">
                IDR ${rupiah(
                  item.total
                )}
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
            No trend data
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
        Gross Revenue Report
      </title>

      <style>

        /* COPY STYLE GROSS REVENUE LAMA DI SINI */

      </style>

    </head>

    <body>

      <!--
        COPY ISI HTML GROSS REVENUE LAMA
        MULAI DARI .export-toolbar
        SAMPAI FOOTER
      -->

    </body>

    </html>

  `;

  return res
    .status(200)
    .send(html);

}



// ==========================================
// ANALYTICS
// ==========================================

else if (type === "analytics") {

  if (!branchId) {

    return res
      .status(400)
      .json({
        success: false,
        error: "branchId wajib diisi"
      });

  }

   const {
      start,
      end,
      branchId
    } = req.body || {};

    if (!branchId) {
      return res.status(400).send(
        "branchId wajib diisi"
      );
    }

    // =========================
    // GET ANALYTICS DASHBOARD
    // =========================

    const {
      data,
      error
    } = await supabase.rpc(
      "get_analytics_dashboard",
      {
        p_branch_id: branchId,
        p_start: start || null,
        p_end: end || null
      }
    );

    if (error) {
      throw error;
    }

    const analyticsData = data;

    console.log(
      "EXPORT ANALYTICS DATA:",
      analyticsData
    );

    console.log(
      "EXPORT ACTIVE MEMBERS:",
      analyticsData?.analytics?.activeMemberList
    );

    if (!data) {
      throw new Error(
        "Data analytics kosong"
      );
    }

    // =========================
    // NORMALIZE
    // =========================

    const analytics =
      data.analytics || {};

    const paymentDistribution =
      Array.isArray(data.paymentDistribution)
        ? data.paymentDistribution
        : [];

    const peakHours =
      Array.isArray(data.peakHours)
        ? data.peakHours
        : [];

    const topSelling =
      Array.isArray(data.topSelling)
        ? data.topSelling
        : [];

    const rawMaterials =
      Array.isArray(data.rawMaterials)
        ? data.rawMaterials
        : [];

    // =========================
    // PAYMENT ROWS
    // =========================

    const paymentRows =
      paymentDistribution.length

        ? paymentDistribution.map(p => `
            <tr>

              <td>
                ${escapeHtml(p.method)}
              </td>

              <td class="right">
                Rp ${rupiah(p.value)}
              </td>

              <td class="right">
                ${Number(
                  p.percent || 0
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
              No payment data
            </td>
          </tr>
        `;

    // =========================
    // TOP SELLING
    // =========================

    const topSellingRows =
      topSelling.length

        ? topSelling.map((item, index) => `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHtml(item.name)}
              </td>

              <td class="right">
                ${Number(
                  item.qty || 0
                ).toLocaleString("id-ID")}
              </td>

              <td class="right">
                Rp ${rupiah(item.revenue)}
              </td>

            </tr>
          `).join("")

        : `
          <tr>
            <td
              colspan="4"
              class="empty"
            >
              No top selling data
            </td>
          </tr>
        `;

    // =========================
    // RAW MATERIAL
    // =========================

    const rawMaterialRows =
      rawMaterials.length

        ? rawMaterials.map(item => `
            <tr>

              <td>
                ${escapeHtml(item.id)}
              </td>

              <td>
                ${escapeHtml(item.name)}
              </td>

              <td>
                ${escapeHtml(item.unit)}
              </td>

              <td class="right">
                ${Number(
                  item.stock || 0
                ).toLocaleString("id-ID")}
              </td>

              <td class="center">
                ${escapeHtml(item.status)}
              </td>

            </tr>
          `).join("")

        : `
          <tr>
            <td
              colspan="5"
              class="empty"
            >
              No raw material data
            </td>
          </tr>
        `;

    // =========================
    // PEAK HOURS
    // =========================
    const peakHourRows = [];

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];
    
    const startDateObj =
      new Date(`${start}T00:00:00`);
    
    peakHours.forEach(
      (day, dayIndex) => {
    
        if (!Array.isArray(day)) {
          return;
        }
    
        const currentDate =
          new Date(startDateObj);
    
        currentDate.setDate(
          startDateObj.getDate() + dayIndex
        );
    
        const dayName =
          dayNames[currentDate.getDay()];
    
        const dateText =
          currentDate.toLocaleDateString(
            "id-ID"
          );
    
        day.forEach(
          (count, hour) => {
    
            const value =
              Number(count || 0);
    
            if (value > 0) {
    
              peakHourRows.push(`
                <tr>
    
                  <td>
                    ${dateText}
                  </td>
    
                  <td>
                    ${dayName}
                  </td>
    
                  <td>
                    ${String(hour).padStart(
                      2,
                      "0"
                    )}:00
                  </td>
    
                  <td class="right">
                    ${value}
                  </td>
    
                </tr>
              `);
    
            }
    
          }
        );
    
      }
    );
    
    const peakRows =
      peakHourRows.length
    
        ? peakHourRows.join("")
    
        : `
          <tr>
            <td
              colspan="4"
              class="empty"
            >
              No peak hour data
            </td>
          </tr>
        `;
    // =========================
    // ACTIVE MEMBERS
    // =========================
    
    const activeMembers =
      Array.isArray(
        analytics.activeMemberList
      )
        ? analytics.activeMemberList
        : [];
    
    const memberRows =
      activeMembers.length
    
        ? activeMembers.map(
            member => `
              <tr>
    
                <td>
                  ${escapeHtml(
                    member.name
                  )}
                </td>
    
                <td>
                  ${escapeHtml(
                    member.tier || "-"
                  )}
                </td>
    
                <td class="right">
                  ${Number(
                    member.point || 0
                  ).toLocaleString(
                    "id-ID"
                  )} PTS
                </td>
    
              </tr>
            `
          ).join("")
    
        : `
          <tr>
            <td
              colspan="3"
              class="empty"
            >
              No active members
            </td>
          </tr>
        `;

// =========================
// WEEKLY
// =========================

const weekly =
  Array.isArray(
    analytics.weekly
  )
    ? analytics.weekly
    : [];

const weeklyRows =
  weekly.length

    ? weekly.map(
        (value, index) => `
          <tr>

            <td>
              Week ${index + 1}
            </td>

            <td class="right">
              Rp ${rupiah(value)}
            </td>

          </tr>
        `
      ).join("")

    : `
      <tr>
        <td
          colspan="2"
          class="empty"
        >
          No weekly data
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
Analytics Report
</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  padding:40px 20px;
  background:#0B0F14;
  font-family:Arial,sans-serif;
  color:#333;
}

.export-toolbar{
  width:100%;
  max-width:1100px;
  margin:0 auto 20px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  color:white;
  font-size:14px;
}

.export-toolbar button{
  border:1px solid rgba(255,255,255,.15);
  background:rgba(255,255,255,.08);
  color:white;
  padding:10px 16px;
  border-radius:10px;
  cursor:pointer;
  font-weight:bold;
}

.report{
  width:100%;
  max-width:1100px;
  margin:0 auto;
  background:white;
  padding:45px;
  border-radius:4px;
  box-shadow:
    0 20px 60px rgba(0,0,0,.45);
}

.header{
  text-align:center;
  margin-bottom:20px;
}

.logo{
  width:170px;
  height:auto;
  max-height:90px;
  object-fit:contain;
}

.title{
  font-size:24px;
  font-weight:bold;
  margin-bottom:8px;
}

.subtitle{
  font-size:12px;
  color:#777;
  margin-bottom:4px;
}

.kpi-grid{
  display:grid;
  grid-template-columns:
    repeat(3,1fr);
  gap:16px;
  margin:30px 0;
}

.kpi-card{
  border:1px solid #e5e5e5;
  border-radius:14px;
  padding:22px;
  background:#fafafa;
  text-align:center;
}

.kpi-title{
  font-size:11px;
  color:#666;
  font-weight:bold;
  margin-bottom:12px;
}

.kpi-value{
  font-size:20px;
  font-weight:bold;
  color:#222;
}

.card{
  border:1px solid #e5e5e5;
  border-radius:14px;
  padding:18px;
  margin-top:20px;
  background:#fff;
}

.card h3{
  margin-top:0;
  margin-bottom:12px;
  font-size:16px;
}

table{
  width:100%;
  border-collapse:collapse;
  font-size:11px;
  margin-top:10px;
}

th{
  background:#f5f5f5;
  padding:10px;
  text-align:left;
  font-weight:bold;
}

td{
  padding:10px;
  border-bottom:1px solid #eee;
}

.right{
  text-align:right;
}

.center{
  text-align:center;
}

.empty{
  text-align:center;
  color:#777;
  padding:25px;
}

.footer{
  margin-top:40px;
  text-align:center;
  font-size:9px;
  color:#888;
}

.page-break{
  page-break-before:always;
}

@media print{

  body{
    background:white;
    padding:0;
  }

  .export-toolbar{
    display:none;
  }

  .report{
    max-width:none;
    box-shadow:none;
    border-radius:0;
    padding:25px;
  }

}

</style>

</head>

<body>

<div class="export-toolbar">

  <div>
    📊 Analytics Report
  </div>

  <button onclick="window.print()">
    Download / Print PDF
  </button>

</div>

<div class="report">

  <div class="header">

    ${
      logoSrc
        ? `
          <img
            src="${logoSrc}"
            class="logo"
            alt="Sistem POS"
          />
        `
        : ""
    }

  </div>

  <div class="title">
    Executive Analytics Report
  </div>

  <div class="subtitle">
    Branch:
    ${escapeHtml(branchId)}
  </div>

  <div class="subtitle">
    Periode:
    ${escapeHtml(start || "-")}
    -
    ${escapeHtml(end || "-")}
  </div>


  <!-- KPI -->

  <div class="kpi-grid">

    <div class="kpi-card">

      <div class="kpi-title">
        NET REVENUE
      </div>

      <div class="kpi-value">
        Rp ${rupiah(
          analytics.revenue
        )}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        GROSS PROFIT
      </div>

      <div class="kpi-value">
        Rp ${rupiah(
          analytics.grossProfit
        )}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        NET PROFIT
      </div>

      <div class="kpi-value">
        Rp ${rupiah(
          analytics.netProfit
        )}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        HPP
      </div>

      <div class="kpi-value">
        Rp ${rupiah(
          analytics.hpp
        )}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        OPERATIONAL
      </div>

      <div class="kpi-value">
        Rp ${rupiah(
          analytics.operational
        )}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        ACTIVE MEMBERS
      </div>

      <div class="kpi-value">
        ${Number(
          analytics.activeMembers || 0
        ).toLocaleString("id-ID")}
      </div>

    </div>

  </div>


  <!-- PROFIT SUMMARY -->

  <div class="card">

    <h3>
      Profit Summary
    </h3>

    <table>

      <thead>

        <tr>
          <th>Metric</th>
          <th class="right">
            Value
          </th>
        </tr>

      </thead>

      <tbody>

        <tr>
          <td>Revenue</td>
          <td class="right">
            Rp ${rupiah(
              analytics.revenue
            )}
          </td>
        </tr>

        <tr>
          <td>HPP</td>
          <td class="right">
            Rp ${rupiah(
              analytics.hpp
            )}
          </td>
        </tr>

        <tr>
          <td>Gross Profit</td>
          <td class="right">
            Rp ${rupiah(
              analytics.grossProfit
            )}
          </td>
        </tr>

        <tr>
          <td>Operational Expense</td>
          <td class="right">
            Rp ${rupiah(
              analytics.operational
            )}
          </td>
        </tr>

        <tr>
          <td>
            Net Profit Before Other Income
          </td>

          <td class="right">
            Rp ${rupiah(
              analytics.netProfitBeforeOtherIncome
            )}
          </td>
        </tr>

        <tr>
          <td>
            Other Income
          </td>

          <td class="right">
            Rp ${rupiah(
              analytics.otherIncome
            )}
          </td>
        </tr>

        <tr>
          <td>
            <b>Final Net Profit</b>
          </td>

          <td class="right">
            <b>
              Rp ${rupiah(
                analytics.netProfit
              )}
            </b>
          </td>
        </tr>

        <tr>
          <td>
            Growth
          </td>

          <td class="right">
            ${Number(
              analytics.growth || 0
            ).toFixed(2)}%
          </td>
        </tr>

      </tbody>

    </table>

  </div>


  <!-- PAYMENT -->

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


  <!-- WEEKLY -->

  <div class="card">

    <h3>
      Weekly Net Profit
    </h3>

    <table>

      <thead>

        <tr>

          <th>
            Week
          </th>

          <th class="right">
            Net Profit
          </th>

        </tr>

      </thead>

      <tbody>

        ${weeklyRows}

      </tbody>

    </table>

  </div>


  <!-- TOP SELLING -->

  <div class="card page-break">

    <h3>
      Top Selling Products
    </h3>

    <table>

      <thead>

        <tr>

          <th>
            #
          </th>

          <th>
            Product
          </th>

          <th class="right">
            Qty Sold
          </th>

          <th class="right">
            Revenue
          </th>

        </tr>

      </thead>

      <tbody>

        ${topSellingRows}

      </tbody>

    </table>

  </div>

  <!-- PEAK HOURS -->
  <div class="card">
    <h3>
      Peak Hours
    </h3>

    <table>
      <thead>
        <tr>
    
          <th>
            Date
          </th>
    
          <th>
            Day
          </th>
    
          <th>
            Hour
          </th>
    
          <th class="right">
            Orders
          </th>
        </tr>
      </thead>
    
      <tbody>
        ${peakRows}
      </tbody>
    </table>
  </div>


  <!-- RAW MATERIAL -->
  <div class="card page-break">
    <h3>
      Raw Material Analysis
    </h3>
    
    <table>
      <thead>
        <tr>
          <th>
            ID
          </th>

          <th>
            Material
          </th>

          <th>
            Unit
          </th>

          <th class="right">
            Stock
          </th>

          <th>
            Status
          </th>
        </tr>
      </thead>

      <tbody>
        ${rawMaterialRows}
      </tbody>
    </table>
  </div>

  <!-- ACTIVE MEMBERS -->
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

  <div class="footer">
    Generated by Sistem POS
    • ${new Date().toLocaleString("id-ID")}
  </div>

</div>
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

}





    


    
    // ==========================================
    // UNKNOWN TYPE
    // ==========================================

    return res
      .status(400)
      .json({
        success: false,
        error:
          `Export type tidak dikenal: ${type}`
      });

  }

  catch (err) {

    console.error(
      "EXPORT PDF ERROR:",
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

    return res
      .status(500)
      .json({
        success: false,
        error:
          err?.message ||
          "Export PDF gagal"
      });

  }

}
