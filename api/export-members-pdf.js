function initExportPDF() {

  const btn =
    document.getElementById(
      "memberExportPdfBtn"
    );

  const tierSelect =
    document.getElementById(
      "tierFilter"
    );

  if (!btn) return;

  btn.addEventListener(
    "click",
    async () => {

      // =========================
      // OPEN TAB FIRST
      // =========================

      const win =
        window.open(
          "",
          "_blank"
        );

      if (!win) {

        alert(
          "Popup blocked by browser"
        );

        return;
      }

      win.document.write(`
        <html>

          <head>
            <title>
              Generating PDF...
            </title>

            <style>

              body {
                font-family: Arial;
                background: #0B0F14;
                color: white;

                display: flex;
                justify-content: center;
                align-items: center;

                height: 100vh;
                margin: 0;
              }

            </style>

          </head>

          <body>

            <h2>
              Generating Member PDF...
            </h2>

          </body>

        </html>
      `);

      try {

        const tier =
          tierSelect?.value ||
          "ALL";

        const response =
          await fetch(
            "/api/export-members-pdf",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                tier,
                branchId:
                  state.branchId
              })
            }
          );

        const html =
          await response.text();

        if (!response.ok) {
          throw new Error(
            html ||
            "Gagal export member PDF"
          );
        }

        win.document.open();

        win.document.write(
          html
        );

        win.document.close();

      } catch (err) {

        console.error(
          "Export Member PDF:",
          err
        );

        win.document.open();

        win.document.write(`
          <html>

            <body style="
              font-family:Arial;
              padding:40px;
            ">

              <h2>
                Export Failed
              </h2>

              <pre>
${String(err)}
              </pre>

            </body>

          </html>
        `);

        win.document.close();

      }

    }
  );
}
