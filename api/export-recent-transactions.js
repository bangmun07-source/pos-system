async function exportRecentTransactions() {
  const start =
    document.getElementById("startDate")?.value;

  const end =
    document.getElementById("endDate")?.value;

  const status =
    document.getElementById("statusFilter")?.value || "ALL";

  if (!start || !end) {
    alert("Pilih tanggal dulu");
    return;
  }

  const pdfWindow = window.open("", "_blank");

  if (!pdfWindow) {
    alert("Popup diblokir browser");
    return;
  }

  pdfWindow.document.write(`
    <html>
      <body style="font-family:Arial;padding:40px">
        <h2>Generating PDF...</h2>
      </body>
    </html>
  `);

  try {

    const response =
      await fetch("/api/export-recent-transactions", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          start,
          end,
          status,
          branchId: state.branchId
        })
      });

    if (!response.ok) {
      throw new Error(
        await response.text()
      );
    }

    const html =
      await response.text();

    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();

  }
  catch (err) {

    console.error(
      "Export Recent Transactions:",
      err
    );

    pdfWindow.document.body.innerHTML = `
      <h2>Export Error</h2>
      <p>${err.message}</p>
    `;
  }
}
