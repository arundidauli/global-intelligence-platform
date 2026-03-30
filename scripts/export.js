const EXPORT_SCHEMAS = {
  business: [
    ['name', 'Business Name'],
    ['type', 'Lead Type'],
    ['category', 'Category'],
    ['phone', 'Phone'],
    ['website', 'Website'],
    ['rating', 'Rating'],
    ['reviews', 'Reviews'],
    ['address', 'Address'],
    ['city', 'City'],
    ['state', 'State / Region'],
    ['country', 'Country'],
    ['hours', 'Hours'],
    ['verified', 'Verified'],
    ['url', 'Source URL'],
    ['placeId', 'Place ID'],
  ],
  jobs: [
    ['title', 'Job Title'],
    ['company', 'Company'],
    ['location', 'Location'],
    ['type', 'Employment Type'],
    ['remote', 'Remote'],
    ['salary', 'Salary'],
    ['posted', 'Posted'],
    ['source', 'Source'],
    ['skills', 'Skills'],
    ['description', 'Description'],
    ['url', 'Apply URL'],
  ],
  people: [
    ['name', 'Name'],
    ['title', 'Title / Role'],
    ['company', 'Company'],
    ['location', 'Location'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['seniority', 'Seniority'],
    ['source', 'Source'],
    ['linkedin', 'LinkedIn URL'],
    ['summary', 'Summary'],
  ],
};

function getExportRows(module, filter = 'all') {
  const rows = window.leadScope.state[module].all;

  if (filter === 'all') {
    return rows;
  }

  return rows.filter((row) => {
    if (filter === 'phone') return Boolean(row.phone);
    if (filter === 'website') return Boolean(row.website);
    if (filter === 'both') return Boolean(row.phone && row.website);
    return true;
  });
}

function buildExportRecords(module, filter = 'all') {
  const rows = getExportRows(module, filter);
  const schema = EXPORT_SCHEMAS[module] || [];

  return rows.map((row, index) => {
    const record = {
      'Row #': index + 1,
    };

    schema.forEach(([key, label]) => {
      record[label] = formatExportValue(key, row[key]);
    });

    return record;
  });
}

function formatExportValue(key, value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (key === 'rating') {
    return value ? Number(value).toFixed(1) : '';
  }

  if (key === 'reviews') {
    return Number.isFinite(Number(value)) ? String(value) : '';
  }

  return String(value).trim();
}

function toDelimitedValue(value, separator) {
  const normalized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const safeValue =
    /^[=+\-@]/.test(normalized) && normalized !== '' ? `'${normalized}` : normalized;

  if (separator === '\t') {
    return safeValue.replace(/\t/g, ' ');
  }

  return `"${safeValue.replace(/"/g, '""')}"`;
}

function buildDelimitedFile(records, separator) {
  if (!records.length) {
    return '';
  }

  const headers = Object.keys(records[0]);
  const lines = [
    headers.map((header) => toDelimitedValue(header, separator)).join(separator),
    ...records.map((record) =>
      headers.map((header) => toDelimitedValue(record[header], separator)).join(separator)
    ),
  ];

  return lines.join('\r\n');
}

function exportData(module, format = 'csv', filter = 'all') {
  const records = buildExportRecords(module, filter);
  if (!records.length) {
    alert('No data to export. Run a search first.');
    return;
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    dl(blob, `leadscope_${module}_${Date.now()}.json`);
    return;
  }

  if (format === 'sheet') {
    openSheetView(module, filter, records);
    return;
  }

  const separator = format === 'tsv' ? '\t' : ',';
  const extension = format === 'tsv' ? 'tsv' : 'csv';
  const mimeType = format === 'tsv' ? 'text/tab-separated-values;charset=utf-8' : 'text/csv;charset=utf-8';
  const fileContents = buildDelimitedFile(records, separator);
  const payload = format === 'csv' ? `\uFEFF${fileContents}` : fileContents;

  dl(new Blob([payload], { type: mimeType }), `leadscope_${module}_${Date.now()}.${extension}`);
}

function openSheetView(module, filter, records) {
  const newWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!newWindow) {
    alert('Browser blocked the sheet preview. Allow pop-ups for this page and try again.');
    return;
  }

  const heading = `${module.charAt(0).toUpperCase() + module.slice(1)} Export`;
  const subtitle = `Rows: ${records.length} | Filter: ${filter} | Exported: ${new Date().toLocaleString()}`;
  const headers = Object.keys(records[0]);
  const tableHead = headers.map((header) => `<th>${esc(header)}</th>`).join('');
  const tableBody = records
    .map(
      (record) =>
        `<tr>${headers
          .map((header) => `<td>${esc(record[header])}</td>`)
          .join('')}</tr>`
    )
    .join('');
  const csvData = buildDelimitedFile(records, ',');
  const csvDownloadName = `leadscope_${module}_${Date.now()}.csv`;

  newWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(heading)}</title>
<style>
  body {
    margin: 0;
    background: #0b1020;
    color: #e8edf7;
    font-family: Arial, sans-serif;
  }
  .wrap {
    padding: 24px;
  }
  .toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 16px;
  }
  .toolbar a {
    display: inline-flex;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
  }
  .toolbar p {
    margin: 0;
    color: #9fb0d0;
    font-size: 14px;
  }
  .table-shell {
    overflow: auto;
    border: 1px solid #22304d;
    border-radius: 12px;
    background: #11182c;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 960px;
  }
  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid #22304d;
    text-align: left;
    vertical-align: top;
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  th {
    position: sticky;
    top: 0;
    background: #16213a;
    color: #8fd3ff;
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${esc(heading)}</h1>
    <div class="toolbar">
      <a download="${esc(csvDownloadName)}" href="data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csvData}`)}">Download CSV</a>
      <p>${esc(subtitle)}</p>
    </div>
    <div class="table-shell">
      <table>
        <thead><tr>${tableHead}</tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
  newWindow.document.close();
}

function dl(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function clearResults(module) {
  const store = window.leadScope.state[module];
  store.all = [];
  store.filtered = [];
  store.page = 1;
  store.filter = 'all';
  store.search = '';

  const prefix = window.leadScope.prefixes[module];
  const navBadgeIds = {
    business: 'nb-biz',
    jobs: 'nb-jobs',
    people: 'nb-people',
  };

  document.getElementById(`${prefix}-results`).style.display = 'none';
  document.getElementById(`${prefix}-grid`).innerHTML = '';
  document.getElementById(navBadgeIds[module]).textContent = '0';

  if (module === 'business') {
    updateBizStats();
  }
  if (module === 'jobs') {
    updateJobStats();
  }
  if (module === 'people') {
    updatePeopleStats();
  }

  updateExportStats();
}

function exportFromCenter() {
  const dataset = document.getElementById('exp-dataset').value;
  const format = document.getElementById('exp-format').value;
  const filter = document.getElementById('exp-filter').value;
  exportData(dataset, format, filter);
}

function updateExportStats() {
  const container = document.getElementById('exp-stats');
  const businessCount = window.leadScope.state.business.all.length;
  const jobCount = window.leadScope.state.jobs.all.length;
  const peopleCount = window.leadScope.state.people.all.length;
  const total = businessCount + jobCount + peopleCount;

  if (!total) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  document.getElementById('exp-biz-ct').textContent = businessCount;
  document.getElementById('exp-job-ct').textContent = jobCount;
  document.getElementById('exp-ppl-ct').textContent = peopleCount;
  document.getElementById('exp-total-ct').textContent = total;
}
