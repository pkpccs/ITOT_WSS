pipeline {
    agent any

    parameters {
        string(name: 'TEST_ID', defaultValue: '', description: 'Enter specific test ID to run (e.g. LOG-TC-001). Leave blank to run all tests.')
    }

    environment {
        // Set environment variables if needed
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout source code from SCM
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Using bat since the environment is Windows
                bat 'npm install'
                bat 'npx playwright install --with-deps' // Install all Playwright browsers
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Run Tests') {
            steps {
                // catchError ensures the pipeline continues to the post block even if tests fail
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    script {
                        if (params.TEST_ID?.trim()) {
                            echo "Running specific test ID: ${params.TEST_ID}"
                            bat "npx playwright test -g \"${params.TEST_ID}\" --project=chromium --reporter=line,allure-playwright"
                        } else {
                            echo "Running default test suite"
                            bat 'npm run test:allure'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            // Publish Allure Report using the Jenkins Allure Plugin
            script {
                try {
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'allure-results']]
                    ])
                } catch (Exception e) {
                    echo "Jenkins Allure plugin not installed or configured."
                }
            }

            // Archive Playwright HTML report
            archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
            
            // Archive JUnit TestNG results
            archiveArtifacts artifacts: 'test-results/testng-results.xml', allowEmptyArchive: true
        }
        cleanup {
            // Clean workspace to save space
            cleanWs()
        }
    }
}
