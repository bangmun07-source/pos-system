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

    return res
      .status(200)
      .send(html);

  }
  catch (err) {

    console.error(
      "EXPORT GROSS REVENUE ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      error:
        err?.message ||
        "Export gagal"

    });

  }

}
