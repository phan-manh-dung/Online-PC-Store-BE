pipeline {
    agent any
    tools {
        nodejs "NodeJS" // Tên Node.js đã cấu hình ở Global Tool Configuration
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm 
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build' // Nếu dự án của bạn có script build
            }
        }
    }
    post {
        success {
            echo "Pipeline completed successfully on branch ${env.BRANCH_NAME}!"
        }
        failure {
            echo "Pipeline failed on branch ${env.BRANCH_NAME}!"
        }
    }
}