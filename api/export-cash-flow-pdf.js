
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

    const {
      start,
      end,
      branchId
    } = req.body || {};

    if (!branchId) {
      return res
        .status(400)
        .send("branchId wajib diisi");
    }

    // ======================================
    // GET CASH FLOW PAGE DATA
    // ======================================

    const {
      data,
      error
    } = await supabase.rpc(
      "get_cash_flow_page_data",
      {
        p_login_user_id:
          loginUserId,
    
        p_branch_id:
          branchId || "ALL",
    
        p_start:
          start || null,
    
        p_end:
          end || null
      }
    );

    if (error) {
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

    // ======================================
    // NORMALIZE
    // ======================================

    const account =
      data.account || {};

    const summary =
      data.summary || {};

    const transfers =
      Array.isArray(data.transfers)
        ? data.transfers
        : [];

    const ownerSummary =
      data.ownerSummary || {};

    const ownerTransactions =
      Array.isArray(data.ownerTransactions)
        ? data.ownerTransactions
        : [];

    // ======================================
    // SUPPORT BERBAGAI BENTUK SUMMARY
    // ======================================

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

    // ======================================
    // INCOME SOURCE
    // ======================================

    const incomeSource =
      Array.isArray(
        summary.incomeSource
      )
        ? summary.incomeSource
        : Array.isArray(
            summary.income_source
          )
          ? summary.income_source
          : [];

    const totalIncome =
      incomeSource.reduce(
        (sum, item) =>
          sum +
          number(
            item.amount ??
            item.total ??
            item.value
          ),
        0
      );

    const incomeRows =
      incomeSource.length

        ? incomeSource.map(item => {

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
              No income data
            </td>
          </tr>
        `;

    // ======================================
    // EXPENSE CATEGORY
    // ======================================

    const expenseCategory =
      Array.isArray(
        summary.expenseCategory
      )
        ? summary.expenseCategory
        : Array.isArray(
            summary.expense_category
          )
          ? summary.expense_category
          : [];

    const totalExpense =
      expenseCategory.reduce(
        (sum, item) =>
          sum +
          number(
            item.amount ??
            item.total ??
            item.value
          ),
        0
      );

    const expenseRows =
      expenseCategory.length

        ? expenseCategory.map(item => {

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
              No expense data
            </td>
          </tr>
        `;

    // ======================================
    // CASH FLOW HISTORY
    // ======================================

    const history =
      Array.isArray(
        summary.history
      )
        ? summary.history
        : Array.isArray(
            summary.transactions
          )
          ? summary.transactions
          : [];

    const historyRows =
      history.length

        ? history.map(item => `

            <tr>

              <td>
                ${escapeHtml(
                  item.date ??
                  item.Date ??
                  item.tanggal ??
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
                  "-"
                )}
              </td>

              <td class="right">
                Rp ${rupiah(
                  item.amount ??
                  item.Amount
                )}
              </td>

            </tr>

          `).join("")

        : `
          <tr>
            <td colspan="4" class="empty">
              No Data
            </td>
          </tr>
        `;

    // ======================================
    // FUND TRANSFERS
    // ======================================

    const transferRows =
      transfers.length

        ? transfers.map(item => `

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
                  item.fromAccount ??
                  item.from_account ??
                  item.from ??
                  "-"
                )}
              </td>

              <td>
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
                  item.Amount
                )}
              </td>

            </tr>

          `).join("")

        : `
          <tr>
            <td colspan="4" class="empty">
              No fund transfers
            </td>
          </tr>
        `;

    // ======================================
    // OWNER TRANSACTIONS
    // ======================================

    const ownerTransactionRows =
      ownerTransactions.length

        ? ownerTransactions.map(item => `

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
                  "-"
                )}
              </td>

              <td class="right">
                Rp ${rupiah(
                  item.amount ??
                  item.Amount
                )}
              </td>

            </tr>

          `).join("")

        : `
          <tr>
            <td colspan="4" class="empty">
              No owner transactions
            </td>
          </tr>
        `;

    // ======================================
    // HTML REPORT
    // ======================================

    const html = `

      <html>

      <head>

        <meta charset="UTF-8">

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }

          .logo {
            width: 150px;
            height: auto;
            object-fit: contain;
            margin-bottom: 16px;
          }

          .header {
            text-align: center;
          }

          .card {
            border: 1px solid #eee;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 20px;
          }

          .kpi {
            display: grid;
            grid-template-columns:
              repeat(4, 1fr);
            gap: 15px;
          }

          .kpi .card {
            width: 100%;
            box-sizing: border-box;
            padding: 10px;
            text-align: center;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;
            font-size: 11px;
          }

          th {
            background: #f5f5f5;
            padding: 8px;
            text-align: left;
          }

          td {
            padding: 8px;
            border-bottom:
              1px solid #eee;
          }

          .right {
            text-align: right;
          }

          .empty {
            text-align: center;
            color: #777;
          }

          .page-break {
            page-break-before: always;
          }

          h2 {
            font-size: 14px;
            margin: 8px 0;
          }

          h3 {
            font-size: 11px;
            margin: 0 0 8px 0;
            font-weight: bold;
          }

          p {
            font-size: 8px;
            margin: 8px 0;
          }

          b {
            font-size: 11px;
            font-weight: bold;
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


        <!-- KPI -->

        <div class="kpi">

          <div class="card">

            <b>CASH IN</b>

            <br>

            Rp ${rupiah(cashIn)}

          </div>


          <div class="card">

            <b>CASH OUT</b>

            <br>

            Rp ${rupiah(cashOut)}

          </div>


          <div class="card">

            <b>NET FLOW</b>

            <br>

            Rp ${rupiah(netFlow)}

          </div>


          <div class="card">

            <b>BALANCE</b>

            <br>

            Rp ${rupiah(totalBalance)}

          </div>

        </div>


        <!-- HEADER -->

        <div>

          <h2>
            CASH FLOW REPORT
          </h2>

          <p>

            Period :
            ${escapeHtml(start || "-")}
            -
            ${escapeHtml(end || "-")}

            <br>

            Branch :
            ${escapeHtml(branchId || "ALL")}

          </p>

        </div>


        <!-- ACCOUNT BALANCE -->

        <div class="card">

          <h3>
            ACCOUNT BALANCE
          </h3>

          <table>

            <tr>

              <td>
                Cash
                <br>
                Rp ${rupiah(cashBalance)}
              </td>

              <td class="right">
                ${cashPercent.toFixed(1)}%
              </td>

            </tr>

            <tr>

              <td>
                Bank
                <br>
                Rp ${rupiah(bankBalance)}
              </td>

              <td class="right">
                ${bankPercent.toFixed(1)}%
              </td>

            </tr>

          </table>

        </div>


        <!-- INCOME -->

        <div class="card">

          <h3>
            INCOME SOURCE
          </h3>

          <table>

            <tr>

              <th>
                Source
              </th>

              <th>
                Amount
              </th>

              <th class="right">
                Percent
              </th>

            </tr>

            ${incomeRows}

          </table>

        </div>


        <!-- EXPENSE -->

        <div class="card">

          <h3>
            EXPENSE CATEGORY
          </h3>

          <table>

            <tr>

              <th>
                Category
              </th>

              <th>
                Amount
              </th>

              <th class="right">
                Percent
              </th>

            </tr>

            ${expenseRows}

          </table>

        </div>


        <!-- CASH FLOW HISTORY -->

        <div class="page-break"></div>

        <div class="card">

          <h3>
            CASH FLOW HISTORY
          </h3>

          <table>

            <tr>

              <th>Date</th>
              <th>Type</th>
              <th>Description</th>

              <th class="right">
                Amount
              </th>

            </tr>

            ${historyRows}

          </table>

        </div>


        <!-- FUND TRANSFERS -->

        <div class="card">

          <h3>
            FUND TRANSFERS
          </h3>

          <table>

            <tr>

              <th>Date</th>
              <th>From</th>
              <th>To</th>

              <th class="right">
                Amount
              </th>

            </tr>

            ${transferRows}

          </table>

        </div>


        <!-- OWNER TRANSACTIONS -->

        <div class="card">

          <h3>
            OWNER TRANSACTIONS
          </h3>

          <table>

            <tr>

              <th>Date</th>
              <th>Type</th>
              <th>Description</th>

              <th class="right">
                Amount
              </th>

            </tr>

            ${ownerTransactionRows}

          </table>

        </div>


        <p>
          Generated by Sistem POS
          • ${new Date().toLocaleString("id-ID")}
        </p>


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

