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

  // ==========================================
  // METHOD
  // ==========================================

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    // ==========================================
    // REQUEST
    // ==========================================

    const {
      start,
      end,
      branchId,
      status = "ALL",
      category = "ALL"
    } = req.body || {};


    // ==========================================
    // VALIDASI BRANCH
    // ==========================================

    if (!branchId) {

      return res
        .status(400)
        .json({
          success: false,
          error: "branchId wajib diisi"
        });

    }


    // ==========================================
    // NORMALIZE FILTER
    // ==========================================

    const normalizedStatus =
      status === "All Status"
        ? "ALL"
        : status || "ALL";

    const normalizedCategory =
      category === "All Categories"
        ? "ALL"
        : category || "ALL";


    console.log(
      "=========================================="
    );

    console.log(
      "EXPORT EXPENSE REQUEST"
    );

    console.log({
      start: start || null,
      end: end || null,
      branchId,
      status: normalizedStatus,
      category: normalizedCategory
    });


    // ==========================================
    // GET EXPENSE DASHBOARD
    // ==========================================

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


    console.log(
      "EXPORT EXPENSE DATA:",
      data
    );


    // ==========================================
    // NORMALIZE DATA
    // ==========================================

    const rows =
      Array.isArray(data?.expenses)
        ? data.expenses
        : [];


    console.log(
      "EXPORT EXPENSE ROW COUNT:",
      rows.length
    );


    // ==========================================
    // FILTER BRANCH / STATUS / CATEGORY
    // ==========================================

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


        // --------------------------------------
        // BRANCH
        // --------------------------------------

        const matchBranch =
          normalize(rowBranch) ===
          normalize(branchId);


        // --------------------------------------
        // STATUS
        // --------------------------------------

        const matchStatus =
          normalizedStatus === "ALL" ||
          normalizedStatus === "All Status" ||
          normalize(rowStatus) ===
            normalize(normalizedStatus);


        // --------------------------------------
        // CATEGORY
        // --------------------------------------

        const matchCategory =
          normalizedCategory === "ALL" ||
          normalizedCategory === "All Categories" ||
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


    // ==========================================
    // PAID ROWS
    // ==========================================

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


    // ==========================================
    // CATEGORY BREAKDOWN
    // ==========================================

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


    // ==========================================
    // TOTAL EXPENDITURE
    // ==========================================

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


    // ==========================================
    // CATEGORY ROWS
    // ==========================================

    const categoryRows =
      categoryBreakdown.length

        ? categoryBreakdown
            .map(item => {

              return `
                <tr>

                  <td>
                    ${escapeHtml(
                      item.name
                    )}
                  </td>

                  <td class="right">
                    ${item.percent.toFixed(1)}%
                  </td>

                  <td class="right">
                    Rp ${rupiah(
                      item.amount
                    )}
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


    // ==========================================
    // LEDGER ROWS
    // ==========================================

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
                    ${escapeHtml(
                      description
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      rowCategory
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      payment
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      rowBranch
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      rowStatus
                    )}
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


    // ==========================================
    // FILENAME
    // ==========================================

    const filename =
      `Expense Ledger Report - ${branchId} (${start || "-"} - ${end || "-"}).pdf`;


    // ==========================================
    // HTML REPORT
    // ==========================================

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


/* ==========================================
   TOOLBAR
========================================== */

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


/* ==========================================
   REPORT
========================================== */

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


/* ==========================================
   HEADER
========================================== */

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


/* ==========================================
   META
========================================== */

.meta {

  font-size:
    12px;

  color:
    #777;

  line-height:
    1.7;

}


/* ==========================================
   KPI
========================================== */

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


/* ==========================================
   CARD
========================================== */

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


/* ==========================================
   TABLE
========================================== */

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


/* ==========================================
   TOTAL
========================================== */

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


/* ==========================================
   FOOTER
========================================== */

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


/* ==========================================
   PAGE BREAK
========================================== */

.page-break {

  page-break-before:
    always;

}


/* ==========================================
   PRINT
========================================== */

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


<!-- ==========================================
     TOOLBAR
========================================== -->

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


<!-- ==========================================
     REPORT
========================================== -->

<div class="report">


  <!-- HEADER -->

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


  <!-- META -->

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


  <!-- KPI -->

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


  <!-- CATEGORY BREAKDOWN -->

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


  <!-- PAGE BREAK -->

  <div class="page-break"></div>


  <!-- EXPENSE LEDGER -->

  <div class="card">

    <h3>
      Expense Ledger
    </h3>


    <table>

      <thead>

        <tr>

          <th>
            Date
          </th>

          <th>
            Ref ID
          </th>

          <th>
            Description
          </th>

          <th>
            Category
          </th>

          <th>
            Payment
          </th>

          <th>
            Branch
          </th>

          <th>
            Status
          </th>

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


  <!-- FOOTER -->

  <div class="footer">

    Generated by Sistem POS
    •
    ${new Date().toLocaleString("id-ID")}

  </div>


</div>


</body>

</html>
`;


    // ==========================================
    // RETURN HTML
    // ==========================================

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    return res
      .status(200)
      .send(html);

  }


  // ==========================================
  // ERROR
  // ==========================================

  catch (err) {

    console.error(
      "EXPORT EXPENSE ERROR:",
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
          "Export expense gagal"

      });

  }

}
