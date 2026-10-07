// Standard RFC 4180 compliant CSV serializer
function escapeCsvValue(val) {
  if (val === null || val === undefined) {
    return '';
  }

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  const str = String(val);

  // If contains double quote, comma, carriage return, or newline, wrap in quotes and escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function generateCsv(columns, data) {
  // Header row
  const header = columns.map((col) => escapeCsvValue(col.label || col.key)).join(',');

  // Data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val;
        if (typeof col.accessor === 'function') {
          val = col.accessor(item);
        } else {
          val = item[col.key];
        }
        return escapeCsvValue(val);
      })
      .join(',');
  });

  return [header, ...rows].join('\r\n');
}

module.exports = {
  escapeCsvValue,
  generateCsv,
};
