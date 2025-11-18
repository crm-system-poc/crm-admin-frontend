// simple utils: CSV generation and print-to-PDF window
export function exportToCSV(rows: any[], filename = "export.csv") {
    if (!rows || !rows.length) {
      alert("No data to export");
      return;
    }
    const headers = [
      "Customer",
      "ProductId",
      "Description",
      "ExpiryDate",
      "LicenseType",
      "Value",
      "PurchaseOrderId",
    ];
    const body = rows.map((r) => {
      const poId = r.purchaseOrderId ?? r.poId ?? r.purchaseOrder ?? r.parentId ?? r._id ?? "";
      const expiry = r.expiryDate ?? r.licenseExpiryDate ?? r.expiry ?? "";
      const line = [
        r.customerName ?? r.customer?.name ?? "",
        r.productId ?? "",
        (r.description ?? "").toString().replace(/[\r\n]+/g, " "),
        new Date(expiry).toISOString?.() ?? expiry,
        r.licenseType ?? "",
        Number(r.totalPrice ?? r.total ?? 0),
        poId,
      ];
      // escape CSV
      return line.map((col) => `"${(col ?? "").toString().replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  
  export function exportToPDF(rows: any[], filename = "export.pdf") {
    if (!rows || !rows.length) {
      alert("No data to export");
      return;
    }
    // build a printable HTML table
    const headers = ["Customer", "ProductId", "Description", "ExpiryDate", "LicenseType", "Value", "PO"];
    const htmlRows = rows
      .map((r) => {
        const poId = r.purchaseOrderId ?? r.poId ?? r.purchaseOrder ?? r.parentId ?? r._id ?? "";
        const expiry = r.expiryDate ?? r.licenseExpiryDate ?? r.expiry ?? "";
        return `<tr>
          <td style="padding:6px;border:1px solid #ddd">${(r.customerName ?? r.customer?.name ?? "")}</td>
          <td style="padding:6px;border:1px solid #ddd">${(r.productId ?? "")}</td>
          <td style="padding:6px;border:1px solid #ddd">${(r.description ?? "").toString().slice(0,200)}</td>
          <td style="padding:6px;border:1px solid #ddd">${new Date(expiry).toLocaleDateString?.() ?? expiry}</td>
          <td style="padding:6px;border:1px solid #ddd">${r.licenseType ?? ""}</td>
          <td style="padding:6px;border:1px solid #ddd">₹ ${Number(r.totalPrice ?? r.total ?? 0).toLocaleString()}</td>
          <td style="padding:6px;border:1px solid #ddd">${poId}</td>
        </tr>`;
      })
      .join("");
  
    const html = `
      <html>
        <head><title>Export</title></head>
        <body>
          <h3>Expiring Licenses Export</h3>
          <table style="border-collapse:collapse;width:100%;font-family:Arial; font-size:12px;">
            <thead>
              <tr>
                ${headers.map((h) => `<th style="padding:8px;border:1px solid #ddd;background:#f3f3f3;text-align:left">${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Please allow popups to export PDF");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
  