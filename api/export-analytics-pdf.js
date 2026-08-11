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
    return res.status(405).send("Method not allowed");
  }

  try {

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

  catch (err) {

    console.error(
      "EXPORT ANALYTICS ERROR:",
      err
    );

    return res
      .status(500)
      .json({
        success:false,
        error:
          err?.message ||
          "Export Analytics gagal"
      });

  }

}
