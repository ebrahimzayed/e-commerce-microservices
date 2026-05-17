pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = '192.168.148.130:8084'
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_URL = "http://192.168.148.130:9001"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/ebrahimzayed/e-commerce-microservices.git']]
                )
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                        docker run --rm \
                          -e SONAR_HOST_URL=${SONAR_URL} \
                          -e SONAR_TOKEN=$SONAR_AUTH_TOKEN \
                          -v $(pwd):/usr/src \
                          sonarsource/sonar-scanner-cli \
                          -Dsonar.projectKey=e-commerce \
                          -Dsonar.sources=.
                    '''
                }
            }
        }
        
        stage('Build Images') {
            parallel {
                stage('Build Cart') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/cart:${IMAGE_TAG} ./cart-cna-microservice'
                    }
                }
                stage('Build Products') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/products:${IMAGE_TAG} ./products-cna-microservice'
                    }
                }
                stage('Build Search') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/search:${IMAGE_TAG} ./search-cna-microservice'
                    }
                }
                stage('Build Users') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/users:${IMAGE_TAG} ./users-cna-microservice'
                    }
                }
                stage('Build Store UI') {
                    steps {
                        sh 'docker build -t ${DOCKER_REGISTRY}/store-ui:${IMAGE_TAG} ./store-ui'
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    trivy image \
                      --exit-code 0 \
                      --severity HIGH,CRITICAL \
                      --format table \
                      --cache-dir /tmp/trivy-cache \
                      --scanners vuln \
                      ${DOCKER_REGISTRY}/cart:${IMAGE_TAG}
                '''
            }
        }

        stage('Push to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-credentials', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        echo $NEXUS_PASS | docker login ${DOCKER_REGISTRY} -u $NEXUS_USER --password-stdin
                        docker push ${DOCKER_REGISTRY}/cart:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/products:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/search:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/users:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/store-ui:${IMAGE_TAG}
                    '''
                }
            }
        }
        
        stage('Deploy to K8s') {
            steps {
                sh '''
                    minikube image load ${DOCKER_REGISTRY}/cart:${IMAGE_TAG}
                    minikube image load ${DOCKER_REGISTRY}/products:${IMAGE_TAG}
                    minikube image load ${DOCKER_REGISTRY}/search:${IMAGE_TAG}
                    minikube image load ${DOCKER_REGISTRY}/users:${IMAGE_TAG}
                    minikube image load ${DOCKER_REGISTRY}/store-ui:${IMAGE_TAG}
                    kubectl rollout restart deployment -n e-commerce
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline succeeded!'
            mail to: 'ebrahimzayed123456789@gmail.com',
                 subject: "✅ Pipeline Succeeded - Build #${BUILD_NUMBER}",
                 body: """
                    Build #${BUILD_NUMBER} succeeded!
                    
                    Project: e-commerce-microservices
                    Status: SUCCESS ✅
                    
                    Check details: ${BUILD_URL}
                 """
        }
        failure {
            echo '❌ Pipeline failed!'
            mail to: 'ebrahimzayed123456789@gmail.com',
                 subject: "❌ Pipeline Failed - Build #${BUILD_NUMBER}",
                 body: """
                    Build #${BUILD_NUMBER} failed!
                    
                    Project: e-commerce-microservices
                    Status: FAILURE ❌
                    
                    Check details: ${BUILD_URL}
                 """
        }
    }
}