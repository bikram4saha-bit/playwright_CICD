const fs = require('node:fs');
const path = require('node:path');

const resultsPath = path.join('test-results', 'playwright-results.json');
const outputDirectory = 'custom-report';
const outputPath = path.join(outputDirectory, 'index.html');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function collectTests(suite, parents = []) {
  const titles = suite.title ? [...parents, suite.title] : parents;
  const tests = [];

  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const result = results.at(-1) ?? {};
      tests.push({
        title: [...titles, spec.title].filter(Boolean).join(' › '),
        project: test.projectName ?? '',
        status: test.status ?? result.status ?? 'unknown',
        duration: result.duration ?? 0,
        retries: Math.max(0, results.length - 1),
        error: result.error?.message ?? '',
      });
    }
  }

  for (const childSuite of suite.suites ?? []) {
    tests.push(...collectTests(childSuite, titles));
  }

  return tests;
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const tests = (results.suites ?? []).flatMap((suite) => collectTests(suite));
const stats = results.stats ?? {};
const passed = tests.filter((test) => test.status === 'expected' || test.status === 'passed').length;
const failed = tests.filter((test) => test.status === 'unexpected' || test.status === 'failed').length;
const skipped = tests.filter((test) => test.status === 'skipped').length;
const flaky = tests.filter((test) => test.status === 'flaky').length;

const rows = tests.map((test) => `
  <tr>
    <td>${escapeHtml(test.title)}</td>
    <td>${escapeHtml(test.project)}</td>
    <td class="status ${escapeHtml(test.status)}">${escapeHtml(test.status)}</td>
    <td>${(test.duration / 1000).toFixed(2)}s</td>
    <td>${test.retries}</td>
    <td>${escapeHtml(test.error)}</td>
  </tr>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Custom Playwright Test Report</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 1200px; padding: 0 1rem; color: #17212b; }
    h1 { margin-bottom: .25rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; }
    .summary div { background: #f1f5f9; border-radius: .4rem; min-width: 7rem; padding: .8rem 1rem; }
    .summary strong { display: block; font-size: 1.4rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #d7dee7; padding: .65rem; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .passed, .expected { color: #137333; }
    .failed, .unexpected { color: #b3261e; }
    .flaky { color: #a15c00; }
    .skipped { color: #59636e; }
    td.status { font-weight: 700; }
  </style>
</head>
<body>
  <h1>Custom Playwright Test Report</h1>
  <p>Generated from Playwright test results.</p>
  <section class="summary" aria-label="Test summary">
    <div><strong>${stats.total ?? tests.length}</strong>Total</div>
    <div><strong>${stats.expected ?? passed}</strong>Passed</div>
    <div><strong>${stats.unexpected ?? failed}</strong>Failed</div>
    <div><strong>${stats.flaky ?? flaky}</strong>Flaky</div>
    <div><strong>${stats.skipped ?? skipped}</strong>Skipped</div>
  </section>
  <table>
    <thead><tr><th>Test</th><th>Project</th><th>Status</th><th>Duration</th><th>Retries</th><th>Error</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6">No test cases were present in the Playwright results.</td></tr>'}</tbody>
  </table>
</body>
</html>
`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Generated custom report: ${outputPath}`);
