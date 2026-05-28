/**
 * Tiny RFC-4180-ish CSV parser. Handles quoted fields with embedded commas,
 * embedded newlines, and "" escaped quotes. Returns rows as objects keyed by
 * the header row. Adequate for the SimpleMaps US Cities Basic CSV.
 */
export function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      for (let c = 0; c < header.length; c++) {
        obj[header[c]] = r[c] ?? "";
      }
      return obj;
    });
}
