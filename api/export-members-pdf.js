
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// HELPERS
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


// API
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {

    const {
      tier = "ALL",
      branchId
    } = req.body || {};

    if (!branchId) {
      return res.status(400).send(
        "branchId wajib diisi"
      );
    }

    // =========================
    // GET MEMBERS
    // =========================

    /*
      GANTI NAMA RPC DI BAWAH INI
      jika RPC member kamu memiliki nama berbeda.
    */

    const {
      data: members,
      error: memberError
    } = await supabase.rpc(
      "get_members",
      {
        p_branch_id: branchId
      }
    );

    if (memberError) {
      throw memberError;
    }

    console.log(
      "EXPORT MEMBERS:",
      members
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

      rows = rows.filter(row =>
        String(row.tier || "")
          .toUpperCase() ===
        tier.toUpperCase()
      );

    }

    // =========================
    // SUMMARY
    // =========================

    const totalMembers =
      rows.length;

    const totalRindu =
      rows.filter(row =>
        String(row.tier || "")
          .toUpperCase() === "RINDU"
      ).length;

    const totalPoints =
      rows.reduce(
        (sum, row) =>
          sum +
          Number(row.points || 0),
        0
      );

    // =========================
    // MEMBER ROWS
    // =========================

    const memberRows =
      rows.length
        ? rows.map(member => `
            <tr>

              <td>
                ${escapeHtml(member.id)}
              </td>

              <td>
                ${escapeHtml(member.name)}
              </td>

              <td>
                ${escapeHtml(member.tier)}
              </td>

              <td class="right">
                Rp ${rupiah(member.spend)}
              </td>

              <td class="right">
                ${rupiah(member.points)}
              </td>

              <td>
                ${escapeHtml(member.wa)}
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

/* =========================
   TOOLBAR
========================= */

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

  border-radius:
    10px;

  cursor: pointer;

  font-weight:
    bold;
}

/* =========================
   REPORT
========================= */

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

/* =========================
   HEADER
========================= */

.header {

  text-align: center;

  margin-bottom: 10px;
}

.logo {

  width: 170px;

  height: auto;

  max-height: 90px;

  object-fit: contain;

  margin-bottom: 8px;
}

/* =========================
   TITLE
========================= */

.title {

  font-size: 22px;

  font-weight: bold;

  margin-bottom: 8px;
}

.subtitle {

  font-size: 12px;

  color: #777;
}

/* =========================
   SUMMARY
========================= */

.summary-grid {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 14px;

  margin-top: 25px;

  margin-bottom: 25px;
}

.summary-card {

  border:
    1px solid #eee;

  border-radius:
    14px;

  padding: 18px;

  background:
    #fff;
}

.summary-label {

  font-size: 11px;

  color: #777;

  margin-bottom: 8px;
}

.summary-value {

  font-size: 28px;

  font-weight: bold;

  color: #222;
}

/* =========================
   CARD
========================= */

.section {

  margin-top: 25px;
}

.card {

  border:
    1px solid #eee;

  border-radius:
    14px;

  padding: 18px;

  width: 100%;

  box-sizing: border-box;

  background: #fff;
}

.card h3 {

  margin-top: 0;

  margin-bottom: 5px;

  font-size: 16px;
}

/* =========================
   TABLE
========================= */

table {

  width: 100%;

  border-collapse:
    collapse;

  font-size: 11px;

  margin-top: 15px;
}

th {

  background:
    #f5f5f5;

  padding: 10px;

  text-align: left;

  font-weight: bold;
}

td {

  padding:
    12px 10px;

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

/* =========================
   FOOTER
========================= */

.footer {

  max-width: 1100px;

  margin:
    40px auto 0;

  font-size: 9px;

  text-align: center;

  color: #888;
}

/* =========================
   PRINT
========================= */

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

  .footer {

    margin-top: 30px;
  }

}

</style>

</head>

<body>

<!-- TOOLBAR -->

<div class="export-toolbar">

  <div>
    📄 Member Directory Report
  </div>

  <button
    onclick="window.print()">

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

    Member Directory Report

  </div>


  <div class="subtitle">

    Tier Member:
    ${escapeHtml(tier)}

  </div>

  <div class="subtitle">

    Branch:
    ${escapeHtml(branchId)}

  </div>


  <!-- SUMMARY -->

  <div class="summary-grid">

    <div class="summary-card">

      <div class="summary-label">
        Total Members
      </div>

      <div class="summary-value">

        ${rupiah(totalMembers)}

      </div>

    </div>


    <div class="summary-card">

      <div class="summary-label">
        Rindu Tier
      </div>

      <div class="summary-value">

        ${rupiah(totalRindu)}

      </div>

    </div>


    <div class="summary-card">

      <div class="summary-label">
        Points Issued
      </div>

      <div class="summary-value">

        ${rupiah(totalPoints)}

      </div>

    </div>

  </div>


  <!-- MEMBER DIRECTORY -->

  <div class="section">

    <div class="card">

      <h3>
        Member Directory
      </h3>

      <div class="subtitle">

        ${rows.length}
        member(s)

      </div>


      <table>

        <thead>

          <tr>

            <th>
              ID
            </th>

            <th>
              Name
            </th>

            <th>
              Tier
            </th>

            <th class="right">
              Spend
            </th>

            <th class="right">
              Points
            </th>

            <th>
              WA
            </th>

          </tr>

        </thead>

        <tbody>

          ${memberRows}

        </tbody>

      </table>

    </div>

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
      "EXPORT MEMBERS PDF ERROR:",
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
        "Export member gagal"

    });

  }

}

