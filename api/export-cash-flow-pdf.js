import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// LOGO
// ==========================================

const logoSrc =
  `${process.env.SUPABASE_URL}/storage/v1/object/public/Logo/SOMA.png`;

// ==========================================
// HELPERS
// ==========================================

function rupiah(value) {
  return Number(value || 0).toLocaleString("id-ID");
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

// ==========================================
// HANDLER
// ==========================================

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    // ======================================
    // REQUEST
    // ======================================

    const {
      start,
      end,
      branchId,
      loginUserId
    } = req.body || {};

    console.log(
      "EXPORT CASH FLOW REQUEST:",
      {
        loginUserId,
        branchId,
        start,
        end
      }
    );

    // ======================================
    // VALIDATION
    // ======================================

    if (
      loginUserId === undefined ||
      loginUserId === null ||
      loginUserId === ""
    ) {
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

    // ======================================
    // 1. GET CASH FLOW SUMMARY
    // ======================================

    const {
      data: cashFlowSummary,
      error: cashFlowError
    } = await supabase.rpc(
      "get_cash_flow_summary",
      {
        p_branch_id: branchId,
        p_start: start || null,
        p_end: end || null
      }
    );

    if (cashFlowError) {

      console.error(
        "CASH FLOW SUMMARY ERROR:",
        cashFlowError
      );

      throw cashFlowError;
    }

    console.log(
      "CASH FLOW SUMMARY:",
      cashFlowSummary
    );

    const cf =
      cashFlowSummary || {};

    // ======================================
    // 2. GET CASH FLOW PAGE DATA
    // ======================================
    //
    // Dipakai untuk:
    // - Account Balance
    // - Fund Transfers
    // - Owner Transactions
    //
    // ======================================

    const {
      data: pageData,
      error: pageError
    } = await supabase.rpc(
      "get_cash_flow_page_data",
      {
        p_login_user_id:
          String(loginUserId),

        p_branch_id:
          branchId || "ALL",

        p_start:
          start || null,

        p_end:
          end || null
      }
    );

    if (pageError) {

      console.error(
        "CASH FLOW PAGE DATA ERROR:",
        pageError
      );

      throw pageError;
    }

    if (!pageData) {
      throw new Error(
        "Data Cash Flow kosong"
      );
    }

    if (pageData.success === false) {
      throw new Error(
        pageData.message ||
        "Gagal mengambil data Cash Flow"
      );
    }

    console.log(
      "CASH FLOW PAGE DATA:",
      pageData
    );

    // ======================================
    // NORMALIZE PAGE DATA
    // ======================================

    const account =
      pageData.account || {};

    const transfers =
      Array.isArray(pageData.transfers)
        ? pageData.transfers
        : [];

    const ownerTransactions =
      Array.isArray(
        pageData.ownerTransactions
      )
        ? pageData.ownerTransactions
        : [];

    // ======================================
    // KPI
    // ======================================
    //
    // get_cash_flow_summary:
    //
    // income
    // expense
    // netFlow
    //
    // ======================================

    const cashIn =
      number(
        cf.income
      );

    const cashOut =
      number(
        cf.expense
      );

    const netFlow =
      number(
        cf.netFlow
      );

    // ======================================
    // ACCOUNT BALANCE
    // ======================================

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
      cashBalance +
      bankBalance;

    const cashPercent =
      balanceBase > 0
        ? (
            cashBalance /
            balanceBase
          ) * 100
        : 0;

    const bankPercent =
      balanceBase > 0
        ? (
            bankBalance /
            balanceBase
          ) * 100
        : 0;

    // ======================================
    // INCOME SOURCE
    // ======================================
    //
    // Dari get_cash_flow_summary:
    //
    // sales
    // otherIncome
    //
    // ======================================

    const sales =
      number(
        cf.sales
      );

    const otherIncome =
      number(
        cf.otherIncome
      );

    const incomeSource = [

      {
        name: "Sales",
        amount: sales
      },

      {
        name: "Other Income",
        amount: otherIncome
      }

    ].filter(
      item =>
        item.amount > 0
    );

    const totalIncome =
      incomeSource.reduce(
        (sum, item) =>
          sum +
          number(item.amount),
        0
      );

    const incomeRows =
      incomeSource.length

        ? incomeSource
            .map(item => {

              const amount =
                number(
                  item.amount
                );

              const percent =
                totalIncome > 0
                  ? (
                      amount /
                      totalIncome
                    ) * 100
                  : 0;

              return `
                <tr>

                  <td class="left">
                    ${escapeHtml(
                      item.name
                    )}
                  </td>

                  <td class="right">
                    Rp ${rupiah(
                      amount
                    )}
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

    // ======================================
    // EXPENSE CATEGORY
    // ======================================
    //
    // Dari get_cash_flow_summary:
    //
    // operationExpense
    // ingredientPurchase
    //
    // ======================================

    const operationExpense =
      number(
        cf.operationExpense
      );

    const ingredientPurchase =
      number(
        cf.ingredientPurchase
      );

    const expenseCategory = [

      {
        name: "Operational",
        amount: operationExpense
      },

      {
        name: "Ingredient Purchase",
        amount: ingredientPurchase
      }

    ].filter(
      item =>
        item.amount > 0
    );

    const totalExpense =
      expenseCategory.reduce(
        (sum, item) =>
          sum +
          number(item.amount),
        0
      );

    const expenseRows =
      expenseCategory.length

        ? expenseCategory
            .map(item => {

              const amount =
                number(
                  item.amount
                );

              const percent =
                totalExpense > 0
                  ? (
                      amount /
                      totalExpense
                    ) * 100
                  : 0;

              return `
                <tr>

                  <td class="left">
                    ${escapeHtml(
                      item.name
                    )}
                  </td>

                  <td class="right">
                    Rp ${rupiah(
                      amount
                    )}
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

    // ======================================
    // CASH FLOW HISTORY
    // ======================================

    const history =
      Array.isArray(
        pageData.history
      )
        ? pageData.history
        : Array.isArray(
            pageData.transactions
          )
          ? pageData.transactions
          : Array.isArray(
              pageData.summary?.history
            )
            ? pageData.summary.history
            : [];

    const historyRows =
      history.length

        ? history
            .map(item => `

              <tr>

                <td class="left">
                  ${escapeHtml(
                    item.date ??
                    item.Date ??
                    item.tanggal ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.type ??
                    item.Type ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.description ??
                    item.Description ??
                    item.note ??
                    "-"
                  )}
                </td>

                <td class="right">
                  Rp ${rupiah(
                    item.amount ??
                    item.Amount ??
                    0
                  )}
                </td>

              </tr>

            `)
            .join("")

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

    // ======================================
    // FUND TRANSFERS
    // ======================================

    const transferRows =
      transfers.length

        ? transfers
            .map(item => `

              <tr>

                <td class="left">
                  ${escapeHtml(
                    item.date ??
                    item.Date ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.fromAccount ??
                    item.from_account ??
                    item.from ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.toAccount ??
                    item.to_account ??
                    item.to ??
                    "-"
                  )}
                </td>

                <td class="right">
                  Rp ${rupiah(
                    item.amount ??
                    item.Amount ??
                    0
                  )}
                </td>

              </tr>

            `)
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

    // ======================================
    // OWNER TRANSACTIONS
    // ======================================

    const ownerTransactionRows =
      ownerTransactions.length

        ? ownerTransactions
            .map(item => `

              <tr>

                <td class="left">
                  ${escapeHtml(
                    item.date ??
                    item.Date ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.type ??
                    item.Type ??
                    "-"
                  )}
                </td>

                <td class="left">
                  ${escapeHtml(
                    item.description ??
                    item.Description ??
                    item.note ??
                    "-"
                  )}
                </td>

                <td class="right">
                  Rp ${rupiah(
                    item.amount ??
                    item.Amount ??
                    0
                  )}
                </td>

              </tr>

            `)
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

    // ======================================
    // FILENAME
    // ======================================

    const filename =
      `Cash Flow Report - ${branchId} (${start || "-"} - ${end || "-"}).pdf`;

    // ======================================
    // HTML REPORT
    // ======================================

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

            margin:
              0 auto 20px auto;

            display: flex;

            justify-content:
              space-between;

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

            padding:
              10px 16px;

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
              repeat(4, 1fr);

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

            font-size: 20px;

            font-weight: bold;

            color: #222;

          }

          .card {

            border:
              1px solid #e5e5e5;

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

          .left {
            text-align: left;
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

            .page-break {

              page-break-before:
                always;

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


          <!-- KPI -->

          <div class="kpi-grid">


            <div class="kpi-card">

              <div class="kpi-title">
                CASH IN
              </div>

              <div class="kpi-value">

                Rp ${rupiah(
                  cashIn
                )}

              </div>

            </div>


            <div class="kpi-card">

              <div class="kpi-title">
                CASH OUT
              </div>

              <div class="kpi-value">

                Rp ${rupiah(
                  cashOut
                )}

              </div>

            </div>


            <div class="kpi-card">

              <div class="kpi-title">
                NET FLOW
              </div>

              <div class="kpi-value">

                Rp ${rupiah(
                  netFlow
                )}

              </div>

            </div>


            <div class="kpi-card">

              <div class="kpi-title">
                BALANCE
              </div>

              <div class="kpi-value">

                Rp ${rupiah(
                  totalBalance
                )}

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
                    Rp ${rupiah(
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
                    Rp ${rupiah(
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


          <!-- HISTORY -->

          <div class="page-break"></div>

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


          <!-- TRANSFERS -->

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


          <!-- OWNER -->

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

    // ======================================
    // RETURN HTML
    // ======================================

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
          "Export Cash Flow gagal"

      });

  }

}
