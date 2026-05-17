pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
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
                        sh 'docker build -t cart:${IMAGE_TAG} ./cart-cna-microservice'
                    }
                }
                stage('Build Products') {
                    steps {
                        sh 'docker build -t products:${IMAGE_TAG} ./products-cna-microservice'
                    }
                }
                stage('Build Search') {
                    steps {
                        sh 'docker build -t search:${IMAGE_TAG} ./search-cna-microservice'
                    }
                }
                stage('Build Users') {
                    steps {
                        sh 'docker build -t users:${IMAGE_TAG} ./users-cna-microservice'
                    }
                }
                stage('Build Store UI') {
                    steps {
                        sh 'docker build -t store-ui:${IMAGE_TAG} ./store-ui'
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v /tmp/trivy-cache:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --exit-code 0 \
                      --severity HIGH,CRITICAL \
                      --format table \
                      --timeout 30m \
                      --scanners vuln \
                      cart:${IMAGE_TAG}
                '''
            }
        }
        
        stage('Deploy to K8s') {
            steps {
                sh '''
                    minikube image load cart:${IMAGE_TAG}
                    minikube image load products:${IMAGE_TAG}
                    minikube image load search:${IMAGE_TAG}
                    minikube image load users:${IMAGE_TAG}
                    minikube image load store-ui:${IMAGE_TAG}
                    kubectl rollout restart deployment -n e-commerce
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
