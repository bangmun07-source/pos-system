
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// LOGO
const logoSrc =
  `${process.env.SUPABASE_URL}/storage/v1/object/public/Logo/SOMA.png`;

// HELPERS
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

// HANDLER
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


    // VALIDASI
    if (!branchId) {
      return res
        .status(400)
        .send("branchId wajib diisi");
    }

    if (!start || !end) {
      return res
        .status(400)
        .send("Tanggal periode wajib diisi");
    }

    console.log(
      "EXPORT ANALYTICS:",
      {
        branchId,
        start,
        end
      }
    );

    // GET ANALYTICS
    const {
      data: analytics,
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
      "ANALYTICS RESULT:",
      analytics
    );

    // =========================
    // GET PAYMENT DISTRIBUTION
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
      "PAYMENT DISTRIBUTION:",
      paymentData
    );

    // =========================
    // NORMALIZE ANALYTICS
    // =========================

    const data =
      analytics &&
      typeof analytics === "object"
        ? analytics
        : {};

    const paymentDistribution =
      Array.isArray(paymentData)
        ? paymentData
        : [];

    // =========================
    // SAFE DATA
    // =========================

    const revenue =
      Number(data.revenue || 0);

    const hpp =
      Number(data.hpp || 0);

    const grossProfit =
      Number(data.grossProfit || 0);

    const operational =
      Number(data.operational || 0);

    const netProfitBeforeOtherIncome =
      Number(
        data.netProfitBeforeOtherIncome || 0
      );

    const otherIncome =
      Number(data.otherIncome || 0);

    const netProfit =
      Number(data.netProfit || 0);

    const growth =
      Number(data.growth || 0);

    const activeMembers =
      Number(data.activeMembers || 0);

    const weekly =
      Array.isArray(data.weekly)
        ? data.weekly
        : [];

    // =========================
    // WEEKLY ROWS
    // =========================

    const weeklyRows =
      weekly.length

        ? weekly.map((value, index) => `
            <tr>
              <td>
                Week ${index + 1}
              </td>

              <td class="right">
                Rp ${rupiah(value)}
              </td>
            </tr>
          `).join("")

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
    // PAYMENT ROWS
    // =========================

    const paymentRows =
      paymentDistribution.length

        ? paymentDistribution.map(p => {

            const method =
              p.method ??
              p.payment_method ??
              p.Payment_Method ??
              "Unknown";

            const value =
              Number(
                p.value ??
                p.total ??
                p.amount ??
                0
              );

            const percent =
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
                  ${percent.toFixed(1)}%
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

          body{
            font-family:Arial,sans-serif;
            color:#333;
            padding:30px;
            margin:0;
          }

          .header{
            text-align:center;
            margin-bottom:20px;
          }

          .logo{
            width:170px;
            height:auto;
            object-fit:contain;
            margin-bottom:8px;
          }

          .card{
            border:1px solid #eee;
            border-radius:14px;
            padding:15px;
            margin-bottom:20px;
          }

          h3{
            margin:0 0 10px 0;
          }

          .subtitle{
            font-size:12px;
            color:#777;
            margin-bottom:15px;
            line-height:1.6;
          }

          table{
            width:100%;
            border-collapse:collapse;
            font-size:11px;
          }

          th{
            background:#f5f5f5;
            padding:10px;
            text-align:left;
          }

          td{
            padding:10px;
            border-bottom:1px solid #eee;
          }

          .right{
            text-align:right;
          }

          .empty{
            text-align:center;
            color:#999;
            padding:20px;
          }

          .footer{
            margin-top:40px;
            text-align:center;
            font-size:8px;
            color:#777;
          }

          @media print{

            body{
              padding:15px;
            }

            .card{
              break-inside:avoid;
            }

          }

        </style>

      </head>

      <body>

        <div class="header">

          <img
            src="${logoSrc}"
            class="logo"
            alt="Sistem POS"
          >

        </div>

        <!-- =========================
             EXECUTIVE SUMMARY
        ========================== -->

        <div class="card">

          <h3>
            Executive Analytics Report
          </h3>

          <div class="subtitle">

            Branch :
            ${escapeHtml(branchId)}

            <br>

            Periode :
            ${escapeHtml(start)}
            -
            ${escapeHtml(end)}

          </div>

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
                  <b>
                    Net Profit
                    (Before Other Income)
                  </b>
                </td>

                <td class="right">

                  <b>
                    Rp ${rupiah(
                      netProfitBeforeOtherIncome
                    )}
                  </b>

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

              <tr>

                <td>
                  Active Members
                </td>

                <td class="right">
                  ${rupiah(activeMembers)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

        <!-- =========================
             WEEKLY PERFORMANCE
        ========================== -->

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

        <!-- =========================
             PAYMENT DISTRIBUTION
        ========================== -->

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
                  Value
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

        <div class="footer">

          Generated by Sistem POS

          • ${new Date().toLocaleString("id-ID")}

        </div>

      </body>

      </html>
    `;

    // =========================
    // RETURN HTML
    // =========================

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
          "Export analytics gagal"
      });

  }

}


