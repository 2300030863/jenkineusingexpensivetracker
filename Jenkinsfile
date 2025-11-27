pipeline {
    agent any

    environment {
        // Use forward slashes to avoid backslash escaping issues
        TOMCAT = "C:/Program Files/Apache Software Foundation/Tomcat 9.8"
    }

    stages {

        // ===== FRONTEND BUILD =====
        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }

        // ===== FRONTEND DEPLOY =====
        stage('Deploy Frontend to Tomcat') {
            steps {
                // Use %TOMCAT% inside bat; wrap paths with quotes where they contain spaces
                bat """
                if exist "%TOMCAT%/webapps/expense-tracker" (
                    rmdir /S /Q "%TOMCAT%/webapps/expense-tracker"
                )
                mkdir "%TOMCAT%/webapps/expense-tracker"
                xcopy /E /I /Y "Frontend\\dist\\*" "%TOMCAT%/webapps/expense-tracker\\"
                """
            }
        }

        // ===== BACKEND BUILD =====
        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        // ===== BACKEND DEPLOY =====
        stage('Deploy Backend to Tomcat') {
            steps {
                bat """
                if exist "%TOMCAT%/webapps/ExpenseTrackerApplication.war" (
                    del /Q "%TOMCAT%/webapps/ExpenseTrackerApplication.war"
                )
                if exist "%TOMCAT%/webapps/ExpenseTrackerApplication" (
                    rmdir /S /Q "%TOMCAT%/webapps/ExpenseTrackerApplication"
                )
                copy /Y "backend\\target\\*.war" "%TOMCAT%/webapps\\"
                """
            }
        }

    }

    post {
        success {
            echo 'Deployment Successful!'
        }
        failure {
            echo 'Pipeline Failed.'
        }
    }
}
