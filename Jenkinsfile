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
                sh 'npm test' // Jest sẽ chạy thông qua lệnh npm test
            }
        }
      stage('Build Docker Image') {
            steps {
                sh 'docker-compose build' // Build image từ docker-compose.yml
            }
        }
        stage('Deploy to Docker (Test)') {
            steps {
                sh 'docker-compose down || true' // Dừng container cũ (nếu có)
                sh 'docker-compose up -d' // Chạy container mới
            }
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