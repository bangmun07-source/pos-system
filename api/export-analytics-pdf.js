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

function number(value) {
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

function percent(value) {
  return Number(value || 0).toFixed(1);
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
      branchId
    } = req.body || {};

    // =========================
    // VALIDASI
    // =========================

    if (!branchId) {
      return res
        .status(400)
        .send("branchId wajib diisi");
    }

    if (!start || !end) {
      return res
        .status(400)
        .send("Tanggal wajib diisi");
    }

    console.log(
      "EXPORT ANALYTICS:",
      {
        branchId,
        start,
        end
      }
    );

    // =========================
    // GET ANALYTICS
    // =========================

    const {
      data: analyticsData,
      error: analyticsError
    } = await supabase.rpc(
      "get_analytics",
      {
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (analyticsError) {
      throw analyticsError;
    }

    console.log(
      "EXPORT ANALYTICS DATA:",
      analyticsData
    );

    // =========================
    // PAYMENT DISTRIBUTION
    // =========================

    const {
      data: paymentData,
      error: paymentError
    } = await supabase.rpc(
      "get_payment_distribution",
      {
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (paymentError) {
      throw paymentError;
    }

    console.log(
      "EXPORT PAYMENT:",
      paymentData
    );

    // =========================
    // PEAK HOURS
    // =========================

    const {
      data: peakData,
      error: peakError
    } = await supabase.rpc(
      "get_peak_hours",
      {
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (peakError) {
      throw peakError;
    }

    console.log(
      "EXPORT PEAK HOURS:",
      peakData
    );

    // =========================
    // TOP SELLING ITEMS
    // =========================

    const {
      data: topSellingData,
      error: topSellingError
    } = await supabase.rpc(
      "get_top_selling_items",
      {
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (topSellingError) {
      throw topSellingError;
    }

    console.log(
      "EXPORT TOP SELLING:",
      topSellingData
    );

    // =========================
    // RAW MATERIAL ANALYSIS
    // =========================

    const {
      data: rawMaterialData,
      error: rawMaterialError
    } = await supabase.rpc(
      "get_raw_material_analysis",
      {
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (rawMaterialError) {
      throw rawMaterialError;
    }

    console.log(
      "EXPORT RAW MATERIAL:",
      rawMaterialData
    );

    // =========================
    // NORMALIZE
    // =========================

    const analytics =
      analyticsData || {};

    const payment =
      Array.isArray(paymentData)
        ? paymentData
        : [];

    const peakHours =
      Array.isArray(peakData)
        ? peakData
        : [];

    const topSelling =
      Array.isArray(topSellingData)
        ? topSellingData
        : [];

    const rawMaterials =
      Array.isArray(rawMaterialData)
        ? rawMaterialData
        : [];

    // =========================
    // PAYMENT ROWS
    // =========================

    const paymentRows =
      payment.length

        ? payment.map(p => {

            const method =
              p.method ??
              p.payment_method ??
              p.Payment_Method ??
              "-";

            const value =
              Number(
                p.value ??
                p.total ??
                p.amount ??
                0
              );

            const pct =
              Number(
                p.percent ??
                p.percentage ??
                0
              );

            return `
              <tr>

                <td>
                  ${escapeHtml(method)}
                </td>

                <td class="right">
                  Rp ${rupiah(value)}
                </td>

                <td class="right">
                  ${percent(pct)}%
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
              No payment data
            </td>
          </tr>
        `;

    // =========================
    // PEAK HOURS ROWS
    // =========================

    const peakRows =
      peakHours.length

        ? peakHours.map(p => {

            const hour =
              p.hour ??
              p.jam ??
              p.time ??
              "-";

            const orders =
              Number(
                p.orders ??
                p.total_orders ??
                p.count ??
                0
              );

            const revenue =
              Number(
                p.revenue ??
                p.total_revenue ??
                p.value ??
                0
              );

            return `
              <tr>

                <td>
                  ${escapeHtml(hour)}
                </td>

                <td class="center">
                  ${number(orders)}
                </td>

                <td class="right">
                  Rp ${rupiah(revenue)}
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
              No peak hour data
            </td>
          </tr>
        `;

    // =========================
    // TOP SELLING ROWS
    // =========================

    const topSellingRows =
      topSelling.length

        ? topSelling.map((item, index) => {

            const name =
              item.name ??
              item.product_name ??
              item.Nama ??
              "-";

            const qty =
              Number(
                item.qty ??
                item.quantity ??
                item.total_qty ??
                0
              );

            const revenue =
              Number(
                item.revenue ??
                item.total_revenue ??
                item.total ??
                0
              );

            return `
              <tr>

                <td class="center">
                  ${index + 1}
                </td>

                <td>
                  ${escapeHtml(name)}
                </td>

                <td class="center">
                  ${number(qty)}
                </td>

                <td class="right">
                  Rp ${rupiah(revenue)}
                </td>

              </tr>
            `;

          }).join("")

        : `
          <tr>
            <td
              colspan="4"
              class="empty"
            >
              No product data
            </td>
          </tr>
        `;

    // =========================
    // RAW MATERIAL ROWS
    // =========================

    const rawMaterialRows =
      rawMaterials.length

        ? rawMaterials.map(item => {

            const name =
              item.name ??
              item.ingredient ??
              item.ingredient_name ??
              item.Ingredient ??
              "-";

            const qty =
              Number(
                item.qty ??
                item.quantity ??
                item.total_qty ??
                0
              );

            const cost =
              Number(
                item.cost ??
                item.total_cost ??
                item.value ??
                0
              );

            return `
              <tr>

                <td>
                  ${escapeHtml(name)}
                </td>

                <td class="right">
                  ${number(qty)}
                </td>

                <td class="right">
                  Rp ${rupiah(cost)}
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
              No raw material data
            </td>
          </tr>
        `;

    // =========================
    // ANALYTICS VALUES
    // =========================

    const revenue =
      Number(
        analytics.revenue ??
        analytics.netRevenue ??
        analytics.net_revenue ??
        0
      );

    const hpp =
      Number(
        analytics.hpp ??
        analytics.hppTotal ??
        analytics.hpp_total ??
        0
      );

    const grossProfit =
      Number(
        analytics.grossProfit ??
        analytics.gross_profit ??
        revenue - hpp
      );

    const operational =
      Number(
        analytics.operational ??
        analytics.operationalExpense ??
        analytics.operational_expense ??
        0
      );

    const otherIncome =
      Number(
        analytics.otherIncome ??
        analytics.other_income ??
        0
      );

    const netProfitBeforeOtherIncome =
      Number(
        analytics.netProfitBeforeOtherIncome ??
        analytics.net_profit_before_other_income ??
        grossProfit - operational
      );

    const netProfit =
      Number(
        analytics.netProfit ??
        analytics.net_profit ??
        netProfitBeforeOtherIncome +
          otherIncome
      );

    const growth =
      Number(
        analytics.growth ??
        0
      );

    const orders =
      Number(
        analytics.orders ??
        analytics.totalOrders ??
        analytics.total_orders ??
        0
      );

    const aov =
      Number(
        analytics.aov ??
        analytics.averageOrderValue ??
        analytics.average_order_value ??
        0
      );

    const activeMembers =
      Number(
        analytics.activeMembers ??
        analytics.active_members ??
        0
      );

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

html,
body{
  margin:0;
  padding:0;
}

body{

  background:#0B0F14;

  font-family:
    Arial,
    sans-serif;

  color:#333;

  padding:
    40px 20px;
}

.export-toolbar{

  width:100%;

  max-width:1100px;

  margin:
    0 auto 20px auto;

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
    rgba(255,255,255,.15);

  background:
    rgba(255,255,255,.08);

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
    rgba(0,0,0,.45);
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

  margin-bottom:12px;
}

.title{

  font-size:24px;

  font-weight:bold;

  margin-bottom:8px;
}

.subtitle{

  font-size:12px;

  color:#777;

  margin-bottom:3px;
}

.kpi-grid{

  display:grid;

  grid-template-columns:
    repeat(3,1fr);

  gap:16px;

  margin:30px 0;
}

.kpi-card{

  border:
    1px solid #e5e5e5;

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

  font-size:22px;

  font-weight:bold;

  color:#222;
}

.card{

  border:
    1px solid #e5e5e5;

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

  border-bottom:
    1px solid #eee;
}

.right{
  text-align:right;
}

.left{
  text-align:left;
}

.center{
  text-align:center;
}

.empty{

  text-align:center;

  color:#777;

  padding:25px;
}

.metric{

  display:flex;

  justify-content:
    space-between;

  padding:10px 0;

  border-bottom:
    1px solid #eee;
}

.page-break{

  page-break-before:always;

  break-before:page;
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

  <!-- LOGO -->

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


  <!-- TITLE -->

  <div class="title">

    Executive Analytics Report

  </div>

  <div class="subtitle">

    Periode:
    ${escapeHtml(start)}
    -
    ${escapeHtml(end)}

  </div>

  <div class="subtitle">

    Branch:
    ${escapeHtml(branchId)}

  </div>


  <!-- KPI -->

  <div class="kpi-grid">

    <div class="kpi-card">

      <div class="kpi-title">
        NET REVENUE
      </div>

      <div class="kpi-value">
        Rp ${rupiah(revenue)}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        GROSS PROFIT
      </div>

      <div class="kpi-value">
        Rp ${rupiah(grossProfit)}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        NET PROFIT
      </div>

      <div class="kpi-value">
        Rp ${rupiah(netProfit)}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        TOTAL ORDERS
      </div>

      <div class="kpi-value">
        ${number(orders)}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        AOV
      </div>

      <div class="kpi-value">
        Rp ${rupiah(aov)}
      </div>

    </div>


    <div class="kpi-card">

      <div class="kpi-title">
        ACTIVE MEMBERS
      </div>

      <div class="kpi-value">
        ${number(activeMembers)}
      </div>

    </div>

  </div>


  <!-- EXECUTIVE SUMMARY -->

  <div class="card">

    <h3>
      Executive Summary
    </h3>

    <table>

      <thead>

        <tr>

          <th>
            Metric
          </th>

          <th class="right">
            Value
          </th>

        </tr>

      </thead>

      <tbody>

        <tr>

          <td>
            Net Revenue
          </td>

          <td class="right">
            Rp ${rupiah(revenue)}
          </td>

        </tr>

        <tr>

          <td>
            HPP
          </td>

          <td class="right">
            Rp ${rupiah(hpp)}
          </td>

        </tr>

        <tr>

          <td>
            Gross Profit
          </td>

          <td class="right">
            Rp ${rupiah(grossProfit)}
          </td>

        </tr>

        <tr>

          <td>
            Operational Expense
          </td>

          <td class="right">
            Rp ${rupiah(operational)}
          </td>

        </tr>

        <tr>

          <td>
            Net Profit Before Other Income
          </td>

          <td class="right">
            Rp ${rupiah(
              netProfitBeforeOtherIncome
            )}
          </td>

        </tr>

        <tr>

          <td>
            Other Income
          </td>

          <td class="right">
            Rp ${rupiah(otherIncome)}
          </td>

        </tr>

        <tr>

          <td>
            <b>
              Final Net Profit
            </b>
          </td>

          <td class="right">

            <b>
              Rp ${rupiah(netProfit)}
            </b>

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


  <!-- TOP PRODUCTS -->

  <div class="card">

    <h3>
      Top Selling Products
    </h3>

    <table>

      <thead>

        <tr>

          <th class="center">
            #
          </th>

          <th>
            Product
          </th>

          <th class="center">
            Qty
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
            Hour
          </th>

          <th class="center">
            Orders
          </th>

          <th class="right">
            Revenue
          </th>

        </tr>

      </thead>

      <tbody>

        ${peakRows}

      </tbody>

    </table>

  </div>


  <!-- RAW MATERIAL -->

  <div class="page-break"></div>

  <div class="card">

    <h3>
      Raw Material Analysis
    </h3>

    <table>

      <thead>

        <tr>

          <th>
            Ingredient
          </th>

          <th class="right">
            Quantity
          </th>

          <th class="right">
            Cost
          </th>

        </tr>

      </thead>

      <tbody>

        ${rawMaterialRows}

      </tbody>

    </table>

  </div>


  <!-- FOOTER -->

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
          "Export analytics gagal"
      });

  }

}
