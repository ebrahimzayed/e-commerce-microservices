pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_TAG = "${BUILD_NUMBER}"
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