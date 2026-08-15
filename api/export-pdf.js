import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const logoSrc =
  `${process.env.SUPABASE_URL}/storage/v1/object/public/Logo/SOMA.png`;


function rupiah(value) {
  return Number(value || 0)
    .toLocaleString("id-ID");
}

function number(value) {
  return Number(value || 0);
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

  console.log("=== EXPORT PDF START ===");

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
      tier = "ALL",
      search = "",
      loginUserId
    } = req.body || {};

    console.log("EXPORT TYPE:", type);
    console.log("EXPORT BRANCH:", branchId);

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

    else if (type === "members") {
     console.log(
        ">>> MASUK MEMBERS EXPORT <<<"
      );
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
    
    else if (type === "recent-transactions") {
         console.log(
            ">>> MASUK RECENT TRANSAKSI EXPORT <<<"
          );
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





    // =========================
    // CASH FLOW
    // =========================

    else if (type === "cash-flow") {

          console.log(
            ">>> MASUK CASH FLOW EXPORT <<<"
          );
        
          console.log(
            "EXPORT CASH FLOW REQUEST:",
            {
              loginUserId,
              branchId,
              start,
              end
            }
          );
        
          // VALIDATION
        
          if (!loginUserId) {
        
            return res
              .status(400)
              .json({
                success: false,
                error: "loginUserId wajib diisi"
              });
        
          }
        
          if (!branchId) {
        
            return res
              .status(400)
              .json({
                success: false,
                error: "branchId wajib diisi"
              });
        
          }
        
          // GET CASH FLOW DATA
        
          const {
            data,
            error
          } = await supabase.rpc(
            "get_cash_flow_page_data",
            {
              p_login_user_id: loginUserId,
              p_branch_id: branchId,
              p_start: start || null,
              p_end: end || null
            }
          );
          
              if (error) {
                console.error(
                  "CASH FLOW RPC ERROR:",
                  error
                );
          
                throw error;
              }
          
              if (!data) {
                throw new Error(
                  "Data Cash Flow kosong"
                );
              }
          
              if (data.success === false) {
                throw new Error(
                  data.message ||
                  "Gagal mengambil data Cash Flow"
                );
              }
          
              console.log(
                "EXPORT CASH FLOW DATA:",
                data
              );
          
              // NORMALIZE
              const account =
                data.account || {};
          
              const summary =
                data.summary || {};
          
              const history =
                Array.isArray(data.history)
                  ? data.history
                  : [];
          
              const transfers =
                Array.isArray(data.transfers)
                  ? data.transfers
                  : [];
          
              const ownerTransactions =
                Array.isArray(data.ownerTransactions)
                  ? data.ownerTransactions
                  : [];
          
              // KPI
              const cashIn =
                number(
                  summary.cashIn ??
                  summary.cash_in ??
                  summary.totalCashIn ??
                  0
                );
          
              const cashOut =
                number(
                  summary.cashOut ??
                  summary.cash_out ??
                  summary.totalCashOut ??
                  0
                );
          
              const netFlow =
                number(
                  summary.netFlow ??
                  summary.net_flow ??
                  (cashIn - cashOut)
                );
          
              const cashBalance =
                number(
                  account.cash ??
                  account.Cash ??
                  account.cashBalance ??
                  account.cash_balance ??
                  0
                );
          
              const bankBalance =
                number(
                  account.bank ??
                  account.Bank ??
                  account.bankBalance ??
                  account.bank_balance ??
                  0
                );
          
              const totalBalance =
                number(
                  account.total ??
                  account.Total ??
                  account.balance ??
                  account.Balance ??
                  (cashBalance + bankBalance)
                );
          
              const balanceBase =
                cashBalance + bankBalance;
          
              const cashPercent =
                balanceBase > 0
                  ? (cashBalance / balanceBase) * 100
                  : 0;
          
              const bankPercent =
                balanceBase > 0
                  ? (bankBalance / balanceBase) * 100
                  : 0;
          
              // INCOME SOURCE
              const incomeSource =
                Array.isArray(summary.incomeSource)
                  ? summary.incomeSource
                  : Array.isArray(summary.income_source)
                    ? summary.income_source
                    : [];
          
              const totalIncome =
                incomeSource.reduce(
                  (sum, item) => {
          
                    return (
                      sum +
                      number(
                        item.amount ??
                        item.total ??
                        item.value
                      )
                    );
          
                  },
                  0
                );
          
              const incomeRows =
                incomeSource.length
          
                  ? incomeSource
                      .map(item => {
          
                        const amount =
                          number(
                            item.amount ??
                            item.total ??
                            item.value
                          );
          
                        const percent =
                          totalIncome > 0
                            ? (amount / totalIncome) * 100
                            : 0;
          
                        return `
                          <tr>
          
                            <td>
                              ${escapeHtml(
                                item.name ??
                                item.source ??
                                item.type ??
                                "-"
                              )}
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(amount)}
                            </td>
          
                            <td class="right">
                              ${percent.toFixed(1)}%
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
                        No income data
                      </td>
          
                    </tr>
                  `;
          
              // EXPENSE CATEGORY
              const expenseCategory =
                Array.isArray(summary.expenseCategory)
                  ? summary.expenseCategory
                  : Array.isArray(summary.expense_category)
                    ? summary.expense_category
                    : [];
          
              const totalExpense =
                expenseCategory.reduce(
                  (sum, item) => {
          
                    return (
                      sum +
                      number(
                        item.amount ??
                        item.total ??
                        item.value
                      )
                    );
          
                  },
                  0
                );
          
              const expenseRows =
                expenseCategory.length
          
                  ? expenseCategory
                      .map(item => {
          
                        const amount =
                          number(
                            item.amount ??
                            item.total ??
                            item.value
                          );
          
                        const percent =
                          totalExpense > 0
                            ? (amount / totalExpense) * 100
                            : 0;
          
                        return `
                          <tr>
          
                            <td>
                              ${escapeHtml(
                                item.name ??
                                item.category ??
                                "-"
                              )}
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(amount)}
                            </td>
          
                            <td class="right">
                              ${percent.toFixed(1)}%
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
          
              // CASH FLOW HISTORY
              const historyRows =
                history.length
          
                  ? history
                      .map(item => {
          
                        return `
                          <tr>
          
                            <td>
                              ${escapeHtml(
                                item.date ??
                                item.Date ??
                                "-"
                              )}
                            </td>
          
                            <td>
                              ${escapeHtml(
                                item.type ??
                                item.Type ??
                                "-"
                              )}
                            </td>
          
                            <td>
                              ${escapeHtml(
                                item.description ??
                                item.Description ??
                                item.note ??
                                item.Notes ??
                                "-"
                              )}
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(
                                item.amount ??
                                item.Amount ??
                                0
                              )}
                            </td>
          
                          </tr>
                        `;
          
                      })
                      .join("")
          
                  : `
                    <tr>
          
                      <td
                        colspan="4"
                        class="empty"
                      >
                        No cash flow data
                      </td>
          
                    </tr>
                  `;
          
              // FUND TRANSFERS
             const transferRows =
              transfers.length
            
                ? transfers
                    .map(item => {
            
                      return `
                        <tr>
            
                          <td>
                            ${escapeHtml(
                              item.Date ??
                              item.date ??
                              "-"
                            )}
                          </td>
            
                          <td>
                            ${escapeHtml(
                              item.From_Account ??
                              "-"
                            )}
                          </td>
            
                          <td>
                            ${escapeHtml(
                              item.To_Account ??
                              "-"
                            )}
                          </td>
            
                          <td class="right">
                            IDR ${rupiah(
                              item.Amount ??
                              0
                            )}
                          </td>
            
                        </tr>
                      `;
            
                    })
                    .join("")
            
                : `
                  <tr>
            
                    <td
                      colspan="4"
                      class="empty"
                    >
                      No fund transfers
                    </td>
            
                  </tr>
                `;
              
              // OWNER TRANSACTIONS
              const ownerTransactionRows =
                ownerTransactions.length
          
                  ? ownerTransactions
                      .map(item => {
          
                        return `
                          <tr>
          
                            <td>
                              ${escapeHtml(
                                item.date ??
                                item.Date ??
                                "-"
                              )}
                            </td>
          
                            <td>
                              ${escapeHtml(
                                item.type ??
                                item.Type ??
                                "-"
                              )}
                            </td>
          
                            <td>
                              ${escapeHtml(
                                item.description ??
                                item.Description ??
                                item.Note ??
                                "-"
                              )}
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(
                                item.amount ??
                                item.Amount ??
                                0
                              )}
                            </td>
          
                          </tr>
                        `;
          
                      })
                      .join("")
          
                  : `
                    <tr>
          
                      <td
                        colspan="4"
                        class="empty"
                      >
                        No owner transactions
                      </td>
          
                    </tr>
                  `;
          
              // HTML REPORT
              const html = `
          
                <!DOCTYPE html>
          
                <html>
                <head>
                  <meta charset="UTF-8">
          
                  <title>
                    Cash Flow Report
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
                      margin: 0 auto 20px auto;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      color: white;
                      font-size: 14px;
                    }
          
                    .export-toolbar button {
                      border: 1px solid rgba(255,255,255,.15);
                      background: rgba(255,255,255,.08);
                      color: white;
                      padding: 10px 16px;
                      border-radius: 10px;
                      cursor: pointer;
                      font-weight: bold;
                    }
          
                    .report {
                      width: 100%;
                      max-width: 1100px;
                      margin: 0 auto;
                      background: white;
                      padding: 45px;
                      border-radius: 4px;
                      box-shadow: 0 20px 60px rgba(0,0,0,.45);
                    }
          
                    .header {
                      text-align: center;
                      margin-bottom: 25px;
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
                      grid-template-columns: repeat(4, 1fr);
                      gap: 16px;
                      margin: 30px 0;
                    }
          
                    .kpi-card {
                      border: 1px solid #e5e5e5;
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
                      border: 1px solid #e5e5e5;
                      border-radius: 14px;
                      padding: 18px;
                      margin-top: 20px;
                      background: #fff;
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
                      border-bottom: 1px solid #eee;
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
                        padding: 25px;
                      }
                    }
                  </style>
                </head>
          
                <body>
          
                  <!-- TOOLBAR -->
                  <div class="export-toolbar">
                    <div>
                      📄 Cash Flow Report
                    </div>
          
                    <button
                      onclick="window.print()"
                    >
                      Download / Print PDF
                    </button>
          
                  </div>
          
          
                  <!-- REPORT -->
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
                        Cash Flow Report
                      </div>
          
                      <div class="subtitle">
                        Periode:
                        ${escapeHtml(
                          start || "-"
                        )}
                        -
                        ${escapeHtml(
                          end || "-"
                        )}
                      </div>
                      
                      <div class="subtitle">
                        Branch:
                        ${escapeHtml(
                          branchId || "ALL"
                        )}
                      </div>
                    </div>
          
                    <!-- SUMMARY -->
          
                    <div class="kpi-grid">
                      <div class="kpi-card">
                        <div class="kpi-title">
                          CASH IN
                        </div>
          
                        <div class="kpi-value">
                          IDR ${rupiah(cashIn)}
                        </div>
                      </div>
          
                      <div class="kpi-card">
                        <div class="kpi-title">
                          CASH OUT
                        </div>
          
                        <div class="kpi-value">
                          IDR ${rupiah(cashOut)}
                        </div>
                      </div>
          
                      <div class="kpi-card">
                        <div class="kpi-title">
                          NET FLOW
                        </div>
          
                        <div class="kpi-value">
                          IDR ${rupiah(netFlow)}
                        </div>
                      </div>
                      
                      <div class="kpi-card">
                        <div class="kpi-title">
                          BALANCE
                        </div>
          
                        <div class="kpi-value">
                          IDR ${rupiah(totalBalance)}
                        </div>
                      </div>
                    </div>
          
                    <!-- ACCOUNT BALANCE -->
                    <div class="card">
                      <h3>
                        Account Balance
                      </h3>
          
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Account
                            </th>
          
                            <th class="right">
                              Balance
                            </th>
          
                            <th class="right">
                              Percentage
                            </th>
                          </tr>
                        </thead>
          
                        <tbody>
                          <tr>
                            <td>
                              Cash
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(
                                cashBalance
                              )}
                            </td>
          
                            <td class="right">
                              ${cashPercent.toFixed(1)}%
                            </td>
                          </tr>
          
                          <tr>
                            <td>
                              Bank
                            </td>
          
                            <td class="right">
                              IDR ${rupiah(
                                bankBalance
                              )}
                            </td>
          
                            <td class="right">
                              ${bankPercent.toFixed(1)}%
                            </td>
          
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <!-- INCOME SOURCE -->
                    <div class="card">
          
                      <h3>
                        Income Source
                      </h3>
          
                      <table>
          
                        <thead>
          
                          <tr>
          
                            <th>
                              Source
                            </th>
          
                            <th class="right">
                              Amount
                            </th>
          
                            <th class="right">
                              Percentage
                            </th>
                          </tr>
                        </thead>
          
                        <tbody>
                          ${incomeRows}
                        </tbody>
                      </table>
                    </div>
          
          
                    <!-- EXPENSE CATEGORY -->
          
                    <div class="card">
                      <h3>
                        Expense Category
                      </h3>
          
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Category
                            </th>
          
                            <th class="right">
                              Amount
                            </th>
          
                            <th class="right">
                              Percentage
                            </th>
                          </tr>
                        </thead>
          
                        <tbody>
                          ${expenseRows}
                        </tbody>
                      </table>
                    </div>
          
          
                    <!-- CASH FLOW HISTORY -->
          
                    <div class="card">
                      <h3>
                        Cash Flow History
                      </h3>
          
                      <table>
                        <thead>
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
                        </thead>
                        
                        <tbody>
                          ${historyRows}
                        </tbody>
                      </table>
                    </div>
          
          
                    <!-- FUND TRANSFERS -->
          
                    <div class="card">
                      <h3>
                        Fund Transfers
                      </h3>
                      
                      <table>
                        <thead>
                          <tr>
                            <th>
                              Date
                            </th>
                            
                            <th>
                              From
                            </th>
          
                            <th>
                              To
                            </th>
          
                            <th class="right">
                              Amount
                            </th>
                          </tr>
                        </thead>
          
                        <tbody>
                          ${transferRows}
                        </tbody>
                      </table>
                    </div>
          
          
                    <!-- OWNER TRANSACTIONS -->
                    <div class="card">
                      <h3>
                        Owner Transactions
                      </h3>
                      
                      <table>
          
                        <thead>
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
                        </thead>
                        
                        <tbody>
                          ${ownerTransactionRows}
                        </tbody>
                      </table>
                    </div>
          
          
                    <!-- FOOTER -->
          
                    <div class="footer">
                      Generated by Sistem POS
                      •
                      ${new Date().toLocaleString(
                        "id-ID"
                      )}
                    </div>
                  </div>
                </body>
                </html>
          
              `;
          
              // RETURN HTML
              res.setHeader(
                "Content-Type",
                "text/html; charset=utf-8"
              );
          
              return res
                .status(200)
                .send(html);
          
            }




      // ===================================================
      // OTHER INCOME
      // ===================================================

      else if (type === "other-income") {
            console.log(
              ">>> MASUK OTHER INCOME EXPORT <<<"
            );
                if (!branchId) {
                  return res.status(400).send(
                    "branchId wajib diisi"
                  );
                }
          
            // ===================================================
            // GET DATA
            // ===================================================
          console.log(
        "OTHER INCOME RPC REQUEST:",
        {
          branchId,
          start,
          end
        }
      );
            const {
              data,
              error
            } = await supabase.rpc(
              "get_expense_dashboard",
              {
                p_branch_id: branchId,
                p_start: start || null,
                p_end: end || null
              }
            );
      
            console.log(
        "OTHER INCOME RPC DATA:",
        data
      );
      
      console.log(
        "OTHER INCOME RPC ERROR:",
        error
      );
      
      if (error) {
      
        console.error(
          "OTHER INCOME RPC ERROR DETAIL:",
          error
        );
      
        return res
          .status(500)
          .json({
            success: false,
            error:
              error.message ||
              "RPC get_expense_dashboard gagal",
            details: error
          });
      
      }
          
            if (error) {
              throw error;
            }
          
            if (!data) {
              throw new Error(
                "Data Other Income kosong"
              );
            }
          
            // ===================================================
            // NORMALIZE
            // ===================================================
          
            const rows =
              Array.isArray(data.otherIncome)
                ? data.otherIncome
                : [];
          
            const norm = v =>
              String(v || "")
                .trim()
                .toUpperCase();
          
            const rupiah = n =>
              Number(n || 0)
                .toLocaleString("id-ID");
          
            // ===================================================
            // FILTER
            // ===================================================
          
            const branchValue =
              String(branchId || "").trim();
          
            const categoryValue =
              String(category || "").trim();
          
            const statusValue =
              String(status || "").trim();
          
            const searchValue =
              String(search || "").trim();
          
            const startDate =
              String(start || "").trim();
          
            const endDate =
              String(end || "").trim();
          
            const filteredRows =
              rows.filter(r => {
          
                const rowBranch =
                  norm(r.branchId);
          
                const rowCategory =
                  norm(r.category);
          
                const rowStatus =
                  norm(r.status);
          
                const keyword =
                  JSON.stringify(r)
                    .toUpperCase();
          
                // -------------------------------
                // BRANCH
                // -------------------------------
          
                if (
                  branchValue &&
                  norm(branchValue) !== "ALL" &&
                  rowBranch !== norm(branchValue)
                ) {
                  return false;
                }
          
                // -------------------------------
                // CATEGORY
                // -------------------------------
          
                if (
                  categoryValue &&
                  norm(categoryValue) !== "ALL" &&
                  norm(categoryValue) !==
                    "ALL CATEGORIES" &&
                  rowCategory !== norm(categoryValue)
                ) {
                  return false;
                }
          
                // -------------------------------
                // STATUS
                // -------------------------------
          
                if (
                  statusValue &&
                  norm(statusValue) !== "ALL" &&
                  norm(statusValue) !==
                    "ALL STATUS" &&
                  rowStatus !== norm(statusValue)
                ) {
                  return false;
                }
          
                // -------------------------------
                // SEARCH
                // -------------------------------
          
                if (
                  searchValue &&
                  !keyword.includes(
                    searchValue.toUpperCase()
                  )
                ) {
                  return false;
                }
          
                // -------------------------------
                // DATE RANGE
                // -------------------------------
          
                const rowDate =
                  r.date
                    ? new Date(
                        r.date + "T00:00:00"
                      )
                    : null;
          
                const startDateObj =
                  startDate
                    ? new Date(
                        startDate +
                        "T00:00:00"
                      )
                    : null;
          
                const endDateObj =
                  endDate
                    ? new Date(
                        endDate +
                        "T23:59:59"
                      )
                    : null;
          
                if (
                  startDateObj &&
                  rowDate &&
                  rowDate < startDateObj
                ) {
                  return false;
                }
          
                if (
                  endDateObj &&
                  rowDate &&
                  rowDate > endDateObj
                ) {
                  return false;
                }
          
                return true;
          
              });
          
            // ===================================================
            // CATEGORY BREAKDOWN
            // ===================================================
          
            const categoryMap = {};
          
            let totalIncome = 0;
          
            filteredRows.forEach(r => {
          
              const cat =
                r.category ||
                "Other";
          
              const amount =
                Number(r.amount || 0);
          
              categoryMap[cat] =
                (categoryMap[cat] || 0) +
                amount;
          
              totalIncome += amount;
          
            });
          
            const categoryBreakdown =
              Object.keys(categoryMap)
                .map(cat => {
          
                  const amount =
                    categoryMap[cat];
          
                  return {
                    name: cat,
                    amount: amount,
                    percent:
                      totalIncome > 0
                        ? (
                            amount /
                            totalIncome
                          ) * 100
                        : 0
                  };
          
                })
                .sort(
                  (a, b) =>
                    b.amount - a.amount
                );
          
            // ===================================================
            // DISPLAY FILTER
            // ===================================================
          
            const branchDisplay =
              !branchValue ||
              norm(branchValue) === "ALL"
                ? "ALL"
                : branchValue;
          
            const categoryDisplay =
              categoryValue &&
              norm(categoryValue) !== "ALL" &&
              norm(categoryValue) !==
                "ALL CATEGORIES"
                ? categoryValue
                : "ALL";
          
            const statusDisplay =
              statusValue &&
              norm(statusValue) !== "ALL" &&
              norm(statusValue) !==
                "ALL STATUS"
                ? statusValue
                : "ALL";
          
            // ===================================================
            // CATEGORY ROWS
            // ===================================================
          
            const categoryRows =
              categoryBreakdown.length
          
                ? categoryBreakdown
                    .map(c => `
          
                      <tr>
          
                        <td>
                          ${escapeHtml(c.name)}
                        </td>
          
                        <td class="right">
                          ${c.percent.toFixed(1)}%
                        </td>
          
                        <td class="right">
                          Rp ${rupiah(c.amount)}
                        </td>
          
                      </tr>
          
                    `)
                    .join("")
          
                : `
          
                  <tr>
          
                    <td
                      colspan="3"
                      class="empty"
                    >
                      No Data Found
                    </td>
          
                  </tr>
          
                `;
          
            // ===================================================
            // LEDGER ROWS
            // ===================================================
          
            const ledgerRows =
              filteredRows.length
          
                ? filteredRows
                    .map(r => `
          
                      <tr>
          
                        <td>
                          ${escapeHtml(
                            r.date || "-"
                          )}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.refId || "-"
                          )}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.description || "-"
                          )}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.category || "-"
                          )}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.method || "-"
                          )}
                        </td>
          
                        <td class="right">
                          Rp ${rupiah(r.amount)}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.status || "-"
                          )}
                        </td>
          
                        <td>
                          ${escapeHtml(
                            r.branchId || "-"
                          )}
                        </td>
          
                      </tr>
          
                    `)
                    .join("")
          
                : `
          
                  <tr>
          
                    <td
                      colspan="8"
                      class="empty"
                    >
                      No Data Found
                    </td>
          
                  </tr>
          
                `;
          
            // ===================================================
            // HTML REPORT
            // ===================================================
          
            const html = `
          
          <!DOCTYPE html>
          
          <html>
          
          <head>
          
          <meta charset="UTF-8">
          
          <title>
          Other Income Report
          </title>
          
          <style>
          
          *{
            box-sizing:border-box;
          }
          
          body{
          
            margin:0;
          
            padding:40px 20px;
          
            background:#0B0F14;
          
            font-family:
              Arial,
              sans-serif;
          
            color:#333;
          
          }
          
          .export-toolbar{
          
            width:100%;
          
            max-width:1100px;
          
            margin:
              0 auto 20px;
          
            display:flex;
          
            justify-content:
              space-between;
          
            align-items:center;
          
            color:white;
          
            font-size:14px;
          
          }
          
          .export-toolbar button{
          
            border:
              1px solid
              rgba(
                255,
                255,
                255,
                .15
              );
          
            background:
              rgba(
                255,
                255,
                255,
                .08
              );
          
            color:white;
          
            padding:
              10px 16px;
          
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
              0 20px 60px
              rgba(
                0,
                0,
                0,
                .45
              );
          
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
          
          .card{
          
            border:
              1px solid
              #e5e5e5;
          
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
          
          .meta{
          
            font-size:12px;
          
            color:#777;
          
            margin-bottom:12px;
          
            line-height:1.6;
          
          }
          
          table{
          
            width:100%;
          
            border-collapse:
              collapse;
          
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
          
            border-bottom:
              1px solid
              #eee;
          
          }
          
          .right{
          
            text-align:right;
          
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
              📊 Other Income Report
            </div>
          
            <button
              onclick="window.print()"
            >
              Download / Print PDF
            </button>
          
          </div>
          
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
          
            </div>
          
            <div class="title">
          
              Other Income Report
          
            </div>
          
            <div class="subtitle">
          
              Branch:
              ${escapeHtml(branchDisplay)}
          
            </div>
          
            <div class="subtitle">
          
              Periode:
              ${escapeHtml(startDate || "-")}
              -
              ${escapeHtml(endDate || "-")}
          
            </div>
          
          
            <!-- CATEGORY BREAKDOWN -->
          
            <div class="card">
          
              <h3>
          
                Category Breakdown
          
              </h3>
          
              <div class="meta">
          
                Branch:
                ${escapeHtml(branchDisplay)}
          
                <br>
          
                Category:
                ${escapeHtml(categoryDisplay)}
          
                <br>
          
                Status:
                ${escapeHtml(statusDisplay)}
          
                <br>
          
                Search:
                ${escapeHtml(searchValue || "-")}
          
              </div>
          
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
          
              <div
                style="
                  margin-top:15px;
                  text-align:right;
                  font-weight:bold;
                "
              >
          
                TOTAL OTHER INCOME:
          
                Rp ${rupiah(totalIncome)}
          
              </div>
          
            </div>
          
          
            <!-- LEDGER -->
          
            <div class="card page-break">
          
              <h3>
          
                Other Income Ledger Report
          
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
                      Method
                    </th>
          
                    <th class="right">
                      Amount
                    </th>
          
                    <th>
                      Status
                    </th>
          
                    <th>
                      Branch
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
          
            // ===================================================
            // RETURN HTML
            // ===================================================
    
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
      
        console.log(
          ">>> MASUK GROSS REVENUE EXPORT <<<"
        );
      
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
      
        const filename =
          `Gross Revenue Report - ${branchId} (${start || "-"} - ${end || "-"}).pdf`;
      
        const html = `
      
          <!DOCTYPE html>
      
            <html>
      
            <head>
      
              <meta charset="UTF-8">
      
              <title>
                Gross Revenue Report
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
      
                  max-width: 1100px;
      
                  margin:
                    0 auto 20px auto;
      
                  display: flex;
      
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
      
                  cursor: pointer;
      
                  font-weight: bold;
      
                }
      
                .report {
      
                  width: 100%;
      
                  max-width: 1100px;
      
                  margin: 0 auto;
      
                  background: white;
      
                  padding: 45px;
      
                  border-radius: 4px;
      
                  box-shadow:
                    0 20px 60px
                    rgba(0,0,0,.45);
      
                }
      
                .header {
      
                  text-align: center;
      
                  margin-bottom: 25px;
      
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
      
                  margin:
                    30px 0;
      
                }
      
                .kpi-card {
      
                  border:
                    1px solid #e5e5e5;
      
                  border-radius:
                    14px;
      
                  padding: 22px;
      
                  background:
                    #fafafa;
      
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
      
                  border-radius:
                    14px;
      
                  padding: 18px;
      
                  margin-top: 20px;
      
                  background: #fff;
      
                }
      
                .card h3 {
      
                  margin-top: 0;
      
                  margin-bottom: 12px;
      
                  font-size: 16px;
      
                }
      
                table {
      
                  width: 100%;
      
                  border-collapse:
                    collapse;
      
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
      
                  page-break-before:
                    always;
      
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
      
              <!-- TOOLBAR -->
      
              <div class="export-toolbar">
      
                <div>
                  📄 Gross Revenue Report
                </div>
      
                <button
                  onclick="window.print()"
                >
                  Download / Print PDF
                </button>
      
              </div>
      
      
              <!-- REPORT -->
      
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
                    Gross Revenue Report
                  </div>
      
                  <div class="subtitle">
                    Periode:
                    ${escapeHtml(
                      start || "-"
                    )}
                    -
                    ${escapeHtml(
                      end || "-"
                    )}
                  </div>
      
                  <div class="subtitle">
                    Branch:
                    ${escapeHtml(
                      branchId
                    )}
                  </div>
      
                </div>
      
      
                <!-- SUMMARY -->
      
                <div class="kpi-grid">
      
                  <div class="kpi-card">
      
                    <div class="kpi-title">
                      GROSS REVENUE
                    </div>
      
                    <div class="kpi-value">
                      IDR ${rupiah(
                        summary.totalSubtotal
                      )}
                    </div>
      
                  </div>
      
      
                  <div class="kpi-card">
      
                    <div class="kpi-title">
                      NET REVENUE
                    </div>
      
                    <div class="kpi-value">
                      IDR ${rupiah(
                        summary.totalNetRevenue
                      )}
                    </div>
      
                  </div>
      
      
                  <div class="kpi-card">
      
                    <div class="kpi-title">
                      GRAND TOTAL
                    </div>
      
                    <div class="kpi-value">
                      IDR ${rupiah(
                        summary.totalRevenue
                      )}
                    </div>
      
                  </div>
      
                </div>
      
      
                <!-- SUMMARY DETAIL -->
      
                <div class="card">
      
                  <h3>
                    Revenue Summary
                  </h3>
      
                  <table>
      
                    <tr>
      
                      <td>
                        Gross Revenue
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalSubtotal
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        Total Discount
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalDiscount
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        Net Revenue
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalNetRevenue
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        Total Tax
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalTax
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        Total Service
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalService
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        Grand Total Payment
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          summary.totalRevenue
                        )}
                      </td>
      
                    </tr>
      
      
                    <tr>
      
                      <td>
                        AOV
                      </td>
      
                      <td class="right">
                        IDR ${rupiah(
                          Math.round(
                            summary.aov || 0
                          )
                        )}
                      </td>
      
                    </tr>
      
                  </table>
      
                </div>
      
      
                <!-- CATEGORY -->
      
                <div class="card">
      
                  <h3>
                    Revenue by Category
                  </h3>
      
                  <table>
      
                    <thead>
      
                      <tr>
      
                        <th>
                          Category
                        </th>
      
                        <th class="right">
                          Revenue
                        </th>
      
                      </tr>
      
                    </thead>
      
                    <tbody>
      
                      ${categoryRows}
      
                    </tbody>
      
                  </table>
      
                </div>
      
      
                <!-- TREND -->
      
                <div class="card page-break">
      
                  <h3>
                    Revenue Trend
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
      
                        <th class="right">
                          Revenue
                        </th>
      
                      </tr>
      
                    </thead>
      
                    <tbody>
      
                      ${trendRows}
      
                    </tbody>
      
                  </table>
      
                </div>
      
      
                <!-- FOOTER -->
      
                <div class="footer">
      
                  Generated by Sistem POS
                  •
                  ${new Date().toLocaleString(
                    "id-ID"
                  )}
      
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
// ANALYTICS
// ==========================================

else if (type === "analytics") {

  console.log(
    ">>> MASUK ANALYTICS EXPORT <<<"
  );

  console.log(
    "ANALYTICS REQUEST:",
    {
      start,
      end,
      branchId
    }
  );

  // =========================
  // VALIDATION
  // =========================

  if (!branchId) {

    return res
      .status(400)
      .json({
        success: false,
        error: "branchId wajib diisi"
      });

  }

  // =========================
  // RPC
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

    console.error(
      "ANALYTICS RPC ERROR:",
      error
    );

    throw error;

  }

  console.log(
    "ANALYTICS RPC DATA:",
    data
  );

  // ==========================================
  // NORMALIZE
  // ==========================================

  const report =
    data || {};

  const analytics =
    report.analytics || {};

  const weekly =
    Array.isArray(
      analytics.weekly
    )
      ? analytics.weekly
      : [];

  const paymentDistribution =
    Array.isArray(
      report.paymentDistribution
    )
      ? report.paymentDistribution
      : [];

  const topSelling =
    Array.isArray(
      report.topSelling
    )
      ? report.topSelling
      : [];

  const peakHours =
    Array.isArray(
      report.peakHours
    )
      ? report.peakHours
      : [];

  const rawMaterials =
    Array.isArray(
      report.rawMaterials
    )
      ? report.rawMaterials
      : [];

  console.log(
    "ANALYTICS NORMALIZED:",
    {
      analytics,
      weeklyCount:
        weekly.length,
      paymentCount:
        paymentDistribution.length,
      topSellingCount:
        topSelling.length,
      peakHoursCount:
        peakHours.length,
      rawMaterialsCount:
        rawMaterials.length
    }
  );

  // =========================
  // PROFIT SUMMARY
  // =========================

  const revenue =
    Number(
      analytics.revenue || 0
    );

  const hpp =
    Number(
      analytics.hpp || 0
    );

  const grossProfit =
    Number(
      analytics.grossProfit || 0
    );

  const operational =
    Number(
      analytics.operational || 0
    );

  const otherIncome =
    Number(
      analytics.otherIncome || 0
    );

  const netProfitBeforeOtherIncome =
    Number(
      analytics.netProfitBeforeOtherIncome || 0
    );

  const netProfit =
    Number(
      analytics.netProfit || 0
    );

  const growth =
    Number(
      analytics.growth || 0
    );

  // =========================
  // PROFIT SUMMARY ROWS
  // =========================

  const profitSummaryRows = `

    <tr>
      <td>
        Revenue
      </td>

      <td class="right">
        IDR ${rupiah(revenue)}
      </td>
    </tr>

    <tr>
      <td>
        HPP
      </td>

      <td class="right">
        IDR ${rupiah(hpp)}
      </td>
    </tr>

    <tr>
      <td>
        Gross Profit
      </td>

      <td class="right">
        IDR ${rupiah(grossProfit)}
      </td>
    </tr>

    <tr>
      <td>
        Operational
      </td>

      <td class="right">
        IDR ${rupiah(operational)}
      </td>
    </tr>

    <tr>
      <td>
        Other Income
      </td>

      <td class="right">
        IDR ${rupiah(otherIncome)}
      </td>
    </tr>

    <tr>
      <td>
        Net Profit Before Other Income
      </td>

      <td class="right">
        IDR ${rupiah(
          netProfitBeforeOtherIncome
        )}
      </td>
    </tr>

    <tr>
      <td>
        Net Profit
      </td>

      <td class="right">
        <strong>
          IDR ${rupiah(netProfit)}
        </strong>
      </td>
    </tr>

    <tr>
      <td>
        Growth
      </td>

      <td class="right">
        ${growth.toFixed(2)}%
      </td>
    </tr>

  `;

  // ==========================================
  // WEEKLY REVENUE
  // ==========================================

  const weeklyRows =
    weekly.length

      ? weekly.map(
          (item, index) => {

            let day =
              `Week ${index + 1}`;

            let amount =
              0;

            // Kalau weekly berupa angka
            if (
              typeof item ===
              "number"
            ) {

              amount =
                Number(item);

            }

            // Kalau weekly berupa object
            else if (
              item &&
              typeof item ===
              "object"
            ) {

              day =
                item.day ??
                item.date ??
                item.label ??
                item.Day ??
                `Week ${index + 1}`;

              amount =
                Number(
                  item.revenue ??
                  item.total ??
                  item.amount ??
                  item.value ??
                  0
                );

            }

            return `
              <tr>

                <td>
                  ${escapeHtml(day)}
                </td>

                <td class="right">
                  IDR ${rupiah(amount)}
                </td>

              </tr>
            `;

          }
        ).join("")

      : `
        <tr>

          <td
            colspan="2"
            class="empty"
          >
            No weekly revenue data
          </td>

        </tr>
      `;

  // ==========================================
  // PAYMENT DISTRIBUTION
  // ==========================================

  const paymentRows =
    paymentDistribution.length

      ? paymentDistribution.map(
          item => {

            const method =
              item?.method ??
              item?.paymentMethod ??
              item?.payment_method ??
              item?.name ??
              item?.type ??
              "-";

            const amount =
              Number(
                item?.value ??
                item?.amount ??
                item?.total ??
                item?.revenue ??
                0
              );

            const percent =
              Number(
                item?.percent ??
                item?.percentage ??
                0
              );

            return `
              <tr>

                <td>
                  ${escapeHtml(method)}
                </td>

                <td class="right">
                  IDR ${rupiah(amount)}
                </td>

                <td class="right">
                  ${percent.toFixed(1)}%
                </td>

              </tr>
            `;

          }
        ).join("")

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

  // ==========================================
  // TOP SELLING PRODUCTS
  // ==========================================

  const topSellingRows =
    topSelling.length

      ? topSelling.map(
          (item, index) => {

            const product =
              item?.name ??
              item?.product ??
              item?.productName ??
              item?.product_name ??
              "-";

            const quantity =
              Number(
                item?.qty ??
                item?.quantity ??
                item?.totalQuantity ??
                0
              );

            const amount =
              Number(
                item?.revenue ??
                item?.totalRevenue ??
                item?.amount ??
                item?.total ??
                0
              );

            return `
              <tr>

                <td>
                  ${index + 1}
                </td>

                <td>
                  ${escapeHtml(product)}
                </td>

                <td class="right">
                  ${quantity.toLocaleString(
                    "id-ID"
                  )}
                </td>

                <td class="right">
                  IDR ${rupiah(amount)}
                </td>

              </tr>
            `;

          }
        ).join("")

      : `
        <tr>

          <td
            colspan="4"
            class="empty"
          >
            No top selling products
          </td>

        </tr>
      `;

  // ==========================================
  // PEAK HOURS
  // ==========================================

  /*
    IMPORTANT:

    peakHours dari dashboard:

    [
      [24 jam],
      [24 jam],
      [24 jam],
      ...
    ]

    Jadi JANGAN flatten.

    Setiap array = 1 hari.
    Setiap index = jam.
  */

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
    start
      ? new Date(
          `${start}T00:00:00`
        )
      : new Date();

  peakHours.forEach(
    (day, dayIndex) => {

      if (
        !Array.isArray(day)
      ) {
        return;
      }

      const currentDate =
        new Date(startDateObj);

      currentDate.setDate(
        startDateObj.getDate() +
        dayIndex
      );

      const dayName =
        dayNames[
          currentDate.getDay()
        ];

      const dateText =
        currentDate.toLocaleDateString(
          "id-ID"
        );

      day.forEach(
        (count, hour) => {

          const value =
            Number(count || 0);

          // Hanya tampilkan jam
          // yang benar-benar punya transaksi
          if (value <= 0) {
            return;
          }

          const nextHour =
            (hour + 1) % 24;

          const hourLabel =
            `${String(hour).padStart(
              2,
              "0"
            )}:00 - ${String(nextHour).padStart(
              2,
              "0"
            )}:00`;

          peakHourRows.push(`
            <tr>

              <td>
                ${escapeHtml(
                  dateText
                )}
              </td>

              <td>
                ${escapeHtml(
                  dayName
                )}
              </td>

              <td>
                ${hourLabel}
              </td>

              <td class="right">
                ${value.toLocaleString(
                  "id-ID"
                )}
              </td>

            </tr>
          `);

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
  // RAW MATERIAL ROWS
  // =========================

  const rawMaterialRows =
    rawMaterials.length

      ? rawMaterials.map(item => {

          const id =
            item?.id ??
            "-";

          const name =
            item?.name ??
            "-";

          const unit =
            item?.unit ??
            "-";

          const stock =
            Number(
              item?.stock || 0
            );

          const status =
            item?.status ??
            "-";

          return `
            <tr>

              <td>
                ${escapeHtml(id)}
              </td>

              <td>
                ${escapeHtml(name)}
              </td>

              <td>
                ${escapeHtml(unit)}
              </td>

              <td class="right">
                ${stock.toLocaleString("id-ID")}
              </td>

              <td>
                ${escapeHtml(status)}
              </td>

            </tr>
          `;

        }).join("")

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

  // ==========================================
  // ACTIVE MEMBERS
  // ==========================================

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

  // ==========================================
  // DEBUG SEBELUM HTML
  // ==========================================

  console.log(
    "ANALYTICS EXPORT ROWS:",
    {
      revenue,
      hpp,
      netProfit,
      growth,
      weeklyRowsLength:
        weeklyRows.length,
      paymentRowsLength:
        paymentRows.length,
      topSellingRowsLength:
        topSellingRows.length,
      peakRowsLength:
        peakRows.length,
      rawMaterialRowsLength:
        rawMaterialRows.length,
      memberRowsLength:
        memberRows.length
    }
  );

  // ==========================================
  // HTML REPORT
  // ==========================================

  const html = `

    <!DOCTYPE html>

    <html>

    <head>

      <meta charset="UTF-8">

      <title>
        Analytics Report
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

          max-width: 1100px;

          margin:
            0 auto 20px auto;

          display: flex;

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

          cursor: pointer;

          font-weight:
            bold;

        }

        .report {

          width: 100%;

          max-width: 1100px;

          margin: 0 auto;

          background: white;

          padding: 45px;

          border-radius: 4px;

          box-shadow:
            0 20px 60px
            rgba(0,0,0,.45);

        }

        .header {

          text-align: center;

          margin-bottom: 25px;

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
            repeat(4, 1fr);

          gap: 16px;

          margin:
            30px 0;

        }

        .kpi-card {

          border:
            1px solid #e5e5e5;

          border-radius:
            14px;

          padding: 22px;

          background:
            #fafafa;

          text-align:
            center;

        }

        .kpi-title {

          font-size: 11px;

          color: #666;

          font-weight: bold;

          margin-bottom:
            12px;

        }

        .kpi-value {

          font-size: 20px;

          font-weight: bold;

          color: #222;

        }

        .card {

          border:
            1px solid #e5e5e5;

          border-radius:
            14px;

          padding: 18px;

          margin-top: 20px;

          background: #fff;

        }

        .card h3 {

          margin-top: 0;

          margin-bottom: 12px;

          font-size: 16px;

        }

        table {

          width: 100%;

          border-collapse:
            collapse;

          font-size: 11px;

          margin-top: 10px;

        }

        th {

          background:
            #f5f5f5;

          padding: 10px;

          text-align:
            left;

          font-weight:
            bold;

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

          text-align:
            center;

          color: #777;

          padding: 25px;

        }

        .footer {

          margin-top: 40px;

          text-align:
            center;

          font-size: 9px;

          color: #888;

        }

        .page-break {

          page-break-before:
            always;

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

      <!-- TOOLBAR -->

      <div class="export-toolbar">

        <div>
          📊 Analytics Report
        </div>

        <button
          onclick="window.print()"
        >
          Download / Print PDF
        </button>

      </div>


      <!-- REPORT -->

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
            Analytics Report
          </div>

          <div class="subtitle">

            Periode:
            ${escapeHtml(
              start || "-"
            )}
            -
            ${escapeHtml(
              end || "-"
            )}

          </div>

          <div class="subtitle">

            Branch:
            ${escapeHtml(
              branchId
            )}

          </div>

        </div>


        <!-- KPI -->

        <div class="kpi-grid">


          <div class="kpi-card">

            <div class="kpi-title">
              REVENUE
            </div>

            <div class="kpi-value">
              IDR ${rupiah(revenue)}
            </div>

          </div>


          <div class="kpi-card">

            <div class="kpi-title">
              HPP
            </div>

            <div class="kpi-value">
              IDR ${rupiah(hpp)}
            </div>

          </div>


          <div class="kpi-card">

            <div class="kpi-title">
              NET PROFIT
            </div>

            <div class="kpi-value">
              IDR ${rupiah(netProfit)}
            </div>

          </div>


          <div class="kpi-card">

            <div class="kpi-title">
              GROWTH
            </div>

            <div class="kpi-value">
              ${growth.toFixed(2)}%
            </div>

          </div>


        </div>

        <!-- PROFIT SUMMARY  -->

        <div class="card">

          <h3>
            Profit Summary
          </h3>

          <table>

            <thead>
              <tr>

                <th>
                  Description
                </th>

                <th class="right">
                  Amount
                </th>

              </tr>
            </thead>

            <tbody>

              ${profitSummaryRows}

            </tbody>

          </table>

        </div>


        <!-- WEEKLY -->

        <div class="card">

          <h3>
            Weekly Revenue
          </h3>

          <table>

            <thead>

              <tr>

                <th>
                  Day
                </th>

                <th class="right">
                  Revenue
                </th>

              </tr>

            </thead>

            <tbody>

              ${weeklyRows}

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
                  Payment Method
                </th>

                <th class="right">
                  Amount
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


        <!-- TOP SELLING -->

        <div class="card">

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
                  Quantity
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

        <div class="card page-break">

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
                  Transactions
                </th>

              </tr>

            </thead>

            <tbody>

              ${peakRows}

            </tbody>

          </table>

        </div>


        <!-- RAW MATERIALS -->

        <div class="card">

          <h3>
            Raw Materials
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
                  Member
                </th>

                <th>
                  Tier
                </th>

                <th class="right">
                  Points
                </th>

              </tr>

            </thead>

            <tbody>

              ${memberRows}

            </tbody>

          </table>

        </div>


        <!-- FOOTER -->

        <div class="footer">

          Generated by Sistem POS
          •
          ${new Date().toLocaleString(
            "id-ID"
          )}

        </div>


      </div>

    </body>

    </html>

  `;

  return res
    .status(200)
    .send(html);

}




    















    

    // =====================================================
    // UNKNOWN TYPE
    // =====================================================

    return res.status(400).json({
      success: false,
      error:
        `Export type tidak dikenal: ${type}`
    });

  } catch (err) {

    console.error(
      "EXPORT TEST ERROR:",
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
        "Unknown error"
    });
  }
}
