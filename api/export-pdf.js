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
