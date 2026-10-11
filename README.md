# Playwright CI

The Jenkins pipeline runs Playwright tests and publishes Playwright HTML, JUnit,
Allure, and custom HTML reports.

## Jenkins report setup

Install and configure the Jenkins **Allure**, **HTML Publisher**, and
**Email Extension** plugins. Configure an Allure Commandline installation in
Jenkins under **Manage Jenkins → Tools**.

The pipeline writes:

- `playwright-report/` — Playwright HTML report
- `test-results/results.xml` — JUnit results
- `allure-results/` — Allure raw results
- `custom-report/index.html` — custom test summary
