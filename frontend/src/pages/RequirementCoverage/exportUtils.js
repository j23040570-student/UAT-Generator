const headers = [
  "Test Case ID",
  "Requirement ID",
  "Scenario",
  "Test Type",
  "Priority",
  "Status",
  "Preconditions",
  "Test Data",
  "Test Steps",
  "Expected Result",
  "Comments"
];

function getRows(testCases) {
  return [
    headers,
    ...testCases.map((item) => [
      item.code,
      item.requirementCode,
      item.scenario,
      item.type,
      item.priority,
      item.status,
      item.preconditions,
      item.testData,
      item.steps,
      item.expected,
      item.comments
    ].map((value) => String(value ?? "")))
  ];
}

/* Common Download Function */

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], {
    type: mimeType
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim() || "UAT-Test-Cases";
}

/* =========================
   CSV EXPORT
========================= */

function escapeCSV(value) {
  let text = String(value ?? "");

  // Prevent spreadsheet formula injection
  if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCSV(projectName, testCases) {
  const csv = getRows(testCases)
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  downloadFile(
    "\uFEFF" + csv,
    `${safeFilename(projectName)}_TestCases.csv`,
    "text/csv;charset=utf-8"
  );
}

/* =========================
   EXCEL EXPORT (.xlsx)
========================= */

const encoder = new TextEncoder();

function escapeXML(value) {
  return String(value ?? "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/* ZIP checksum */

function crc32(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit++) {
      crc =
        (crc >>> 1) ^
        ((crc & 1) ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function combineBytes(parts) {
  const length = parts.reduce(
    (sum, part) => sum + part.length,
    0
  );

  const result = new Uint8Array(length);

  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/* Create uncompressed ZIP archive */

function createZIP(files) {
  const localParts = [];
  const centralParts = [];

  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const name = encoder.encode(filename);
    const data = encoder.encode(content);
    const checksum = crc32(data);

    const local = new Uint8Array(30);
    const lv = new DataView(local.buffer);

    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(12, 33, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);

    localParts.push(local, name, data);

    const central = new Uint8Array(46);
    const cv = new DataView(central.buffer);

    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(14, 33, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);

    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralDirectory = combineBytes(centralParts);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);

  ev.setUint32(0, 0x06054b50, true);

  ev.setUint16(
    8,
    Object.keys(files).length,
    true
  );

  ev.setUint16(
    10,
    Object.keys(files).length,
    true
  );

  ev.setUint32(12, centralDirectory.length, true);
  ev.setUint32(16, offset, true);

  return combineBytes([
    ...localParts,
    centralDirectory,
    end
  ]);
}

/* Generate Excel workbook */

export function exportExcel(projectName, testCases) {
  const rows = getRows(testCases);

  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const column = String.fromCharCode(65 + columnIndex);
      const reference = `${column}${rowIndex + 1}`;
      const style = rowIndex === 0 ? 1 : 2;

      return `
        <c r="${reference}" t="inlineStr" s="${style}">
          <is>
            <t xml:space="preserve">${escapeXML(value)}</t>
          </is>
        </c>
      `;
    }).join("");

    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels"
          ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/xl/workbook.xml"
          ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
        <Override PartName="/xl/worksheets/sheet1.xml"
          ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
        <Override PartName="/xl/styles.xml"
          ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
      </Types>`,

    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
          Target="xl/workbook.xml"/>
      </Relationships>`,

    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?>
      <workbook
        xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets>
          <sheet name="UAT Test Cases" sheetId="1" r:id="rId1"/>
        </sheets>
      </workbook>`,

    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
          Target="worksheets/sheet1.xml"/>
        <Relationship Id="rId2"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
          Target="styles.xml"/>
      </Relationships>`,

    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?>
      <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <fonts count="2">
          <font>
            <sz val="11"/>
            <name val="Calibri"/>
          </font>
          <font>
            <b/>
            <sz val="11"/>
            <color rgb="FFFFFFFF"/>
            <name val="Calibri"/>
          </font>
        </fonts>

        <fills count="3">
          <fill><patternFill patternType="none"/></fill>
          <fill><patternFill patternType="gray125"/></fill>
          <fill>
            <patternFill patternType="solid">
              <fgColor rgb="FF5551E6"/>
              <bgColor indexed="64"/>
            </patternFill>
          </fill>
        </fills>

        <borders count="1">
          <border>
            <left/><right/><top/><bottom/><diagonal/>
          </border>
        </borders>

        <cellStyleXfs count="1">
          <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
        </cellStyleXfs>

        <cellXfs count="3">
          <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>

          <xf numFmtId="0" fontId="1" fillId="2" borderId="0"
            xfId="0" applyFont="1" applyFill="1"/>

          <xf numFmtId="0" fontId="0" fillId="0" borderId="0"
            xfId="0" applyAlignment="1">
            <alignment vertical="top" wrapText="1"/>
          </xf>
        </cellXfs>

        <cellStyles count="1">
          <cellStyle name="Normal" xfId="0" builtinId="0"/>
        </cellStyles>
      </styleSheet>`,

    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">

        <sheetViews>
          <sheetView workbookViewId="0">
            <pane ySplit="1" topLeftCell="A2"
              activePane="bottomLeft" state="frozen"/>
          </sheetView>
        </sheetViews>

        <cols>
          <col min="1" max="2" width="18" customWidth="1"/>
          <col min="3" max="3" width="45" customWidth="1"/>
          <col min="4" max="6" width="17" customWidth="1"/>
          <col min="7" max="11" width="45" customWidth="1"/>
        </cols>

        <sheetData>
          ${sheetRows}
        </sheetData>

        <autoFilter ref="A1:K${rows.length}"/>

      </worksheet>`
  };

  const workbook = createZIP(files);

  downloadFile(
    workbook,
    `${safeFilename(projectName)}_TestCases.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

/* =========================
   PDF EXPORT
========================= */

function pdfSafeText(value) {
  return String(value ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function escapePDF(value) {
  return pdfSafeText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function wrapText(value, maxLength = 85) {
  const lines = [];

  for (const paragraph of pdfSafeText(value).split("\n")) {
    let line = "";

    for (let word of paragraph.split(/\s+/)) {
      while (word.length > maxLength) {
        if (line) {
          lines.push(line);
          line = "";
        }

        lines.push(word.slice(0, maxLength));
        word = word.slice(maxLength);
      }

      if (line && line.length + word.length + 1 > maxLength) {
        lines.push(line);
        line = word;
      } else {
        line += (line ? " " : "") + word;
      }
    }

    lines.push(line);
  }

  return lines;
}

export function exportPDF(projectName, testCases) {
  const lines = [
    `Project: ${projectName}`,
    `Total Test Cases: ${testCases.length}`,
    `Export Date: ${new Date().toLocaleDateString()}`,
    ""
  ];

  testCases.forEach((item) => {
    const fields = [
      [`${item.code} | ${item.scenario}`, ""],
      ["Requirement ID", item.requirementCode],
      ["Test Type", item.type],
      ["Priority", item.priority],
      ["Status", item.status],
      ["Preconditions", item.preconditions],
      ["Test Data", item.testData],
      ["Test Steps", item.steps],
      ["Expected Result", item.expected],
      ["Comments", item.comments || "None"]
    ];

    lines.push("-".repeat(85));

    fields.forEach(([label, value]) => {
      lines.push(
        ...wrapText(value ? `${label}: ${value}` : label)
      );
    });

    lines.push("");
  });

  const pageLines = [];

  for (let i = 0; i < lines.length; i += 46) {
    pageLines.push(lines.slice(i, i + 46));
  }

  const objects = [];

  const pageIds = pageLines.map(
    (_, index) => 4 + index * 2
  );

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";

  objects[2] =
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`;

  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  pageLines.forEach((page, index) => {
    const pageId = pageIds[index];
    const streamId = pageId + 1;

    const commands = [
      "BT",
      "/F1 16 Tf",
      "0.33 0.31 0.90 rg",
      "1 0 0 1 40 800 Tm",
      "(UATGen AI - Generated Test Cases) Tj",
      "/F1 10 Tf",
      "0.12 0.16 0.25 rg"
    ];

    page.forEach((line, lineIndex) => {
      const y = 765 - lineIndex * 15;

      commands.push(
        `1 0 0 1 40 ${y} Tm`,
        `(${escapePDF(line)}) Tj`
      );
    });

    commands.push(
      "1 0 0 1 40 35 Tm",
      `(Page ${index + 1} of ${pageLines.length}) Tj`,
      "ET"
    );

    const stream = commands.join("\n") + "\n";

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R
        /MediaBox [0 0 595 842]
        /Resources << /Font << /F1 3 0 R >> >>
        /Contents ${streamId} 0 R >>`;

    objects[streamId] =
      `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 1; i < objects.length; i++) {
    offsets[i] = encoder.encode(pdf).length;

    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xref = encoder.encode(pdf).length;

  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  downloadFile(
    pdf,
    `${safeFilename(projectName)}_TestCases.pdf`,
    "application/pdf"
  );
}