import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // REQUEST
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
