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
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    const {
      tier = "ALL",
      branchId
    } = req.body || {};

    if (!branchId) {
      return res
        .status(400)
        .send("branchId wajib diisi");
    }

    // =========================
    // GET SEMUA MEMBER
    // =========================

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

    // =========================
    // NORMALIZE
    // =========================

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

    // =========================
    // FILTER TIER
    // =========================

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

    // =========================
    // SUMMARY
    // =========================

    const totalMembers =
      rows.length;

    const totalRindu =
      rows.filter(r =>
        String(r.tier || "")
          .toUpperCase() === "RINDU"
      ).length;

    const totalPoints =
      rows.reduce(
        (sum, r) =>
          sum +
          Number(r.points || 0),
        0
      );

    // =========================
    // MEMBER ROWS
    // =========================

    const memberRows =
      rows.length

        ? rows.map(m => `
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
          `).join("")

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

    // =========================
    // HTML REPORT
    // =========================

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
  font-family: Arial, sans-serif;
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
}

.card {
  border: 1px solid #e5e5e5;
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
        RINDU TIER
      </div>

      <div class="kpi-value">
        ${rupiah(totalRindu)}
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
    • ${new Date().toLocaleString("id-ID")}

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
      "EXPORT MEMBERS ERROR:",
      err
    );

    return res
      .status(500)
      .json({
        success: false,
        error:
          err?.message ||
          "Export member gagal"
      });

  }

}
