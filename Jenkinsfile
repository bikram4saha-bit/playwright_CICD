// Jenkinsfile.windows
// Declarative Jenkins pipeline for Windows build agents


/*
Pipeline Stages:
1. Checkout: Checks out the source code from the repository.
2. Install Dependencies: Installs project dependencies using npm ci.
3. Install Playwright Browsers & Dependencies: Installs Playwright browsers and copies the .env.example file to .env if it doesn't exist.
4. Run Playwright Tests: Executes the selected Playwright test suite with the specified browser and mode (headless or headed).
5. Post Actions: Archives test reports, publishes JUnit and Allure reports, and cleans up allure-results on success.
6. Email Notification: Sends an email notification with the build status and links to the reports.
7. Parameters: Allows users to select the test suite, browser, and mode for the test execution.

*/

pipeline {
  agent any
  tools {
    git 'Default'
  }
  options { timestamps() }
  parameters {
    choice(
      name: 'BROWSER',
      choices: ['chromium', 'firefox', 'webkit'],
      description: 'Select the browser for tests'
    )
    choice(
      name: 'MODE',
      choices: ['headless', 'headed'],
      description: 'Run tests in headless or headed mode'
    )
  }
  environment {
    NODE_ENV = 'test'
    CI = '1'
  }
  stages {
    stage('🔄 Checkout') {
      steps {
        checkout scm
      }
    }
    stage('📦 Install Dependencies') {
      steps {
         powershell 'npm ci'
      }
    }
    stage('🤖 Install Playwright Browsers & Dependencies') {
      steps {
        powershell 'npx playwright install --with-deps'
        powershell 'Copy-Item .env.example .env -ErrorAction SilentlyContinue'
      }
    }
    
    stage('▶️ Run Playwright Tests') {
      steps {
        script {
          def browserFlag = "--project=${params.BROWSER}"
          def modeFlag = params.MODE == 'headed' ? '--headed' : ''
          powershell "npx playwright test ${browserFlag} ${modeFlag}"
        }
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
      junit testResults: 'test-results/results.xml', allowEmptyResults: true
      publishHTML([
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright HTML Report'
      ])
      emailext(
        subject: "Jenkins Build: ${env.JOB_NAME} #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
        body: """
            <h2>Playwright Test Execution Report</h2>
            <p><b>Job:</b> ${env.JOB_NAME}</p>
            <p><b>Build:</b> #${env.BUILD_NUMBER}</p>
            <p><b>Status:</b> ${currentBuild.currentResult}</p>
            <p><b>Browser:</b> ${params.BROWSER}</p>
            <p>
              <a href="${env.BUILD_URL}">Open Jenkins Build</a> |
              <a href="${env.BUILD_URL}Playwright_20HTML_20Report">Open Playwright HTML Report</a>
            </p>
        """,
        to: "biks222@gmail.com", //Replace with the recipient's email address
        from: "SENDER_EMAIL_ADDRESS", //Replace with the sender's email address
        replyTo: "RECIVER_EMAIL_ADDRESS",  //Replace with the recipient's email address
        mimeType: "text/html" //Defines the format of the email body. text/html allows HTML formatting (tables, colors, bold text, links, etc.).
      )
    }
  }
}
