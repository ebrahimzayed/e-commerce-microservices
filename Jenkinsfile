pipeline {
    agent any

    environment {
        AWS_REGION      = 'eu-west-1'
        AWS_ACCOUNT_ID  = '429104603739'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        EKS_CLUSTER     = 'ecommerce-eks'
        SONAR_URL       = "http://localhost:9001"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Trivy FS Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        trivy fs . --exit-code 0 --severity HIGH,CRITICAL --format table
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_AUTH_TOKEN')]) {
                        sh '''
                            docker run --rm --network host \
                              -v "$PWD:/usr/src" \
                              sonarsource/sonar-scanner-cli:latest \
                              -Dsonar.host.url=${SONAR_URL} \
                              -Dsonar.token=${SONAR_AUTH_TOKEN} \
                              -Dsonar.projectKey=e-commerce \
                              -Dsonar.projectName=e-commerce \
                              -Dsonar.sources=.
                        '''
                    }
                }
            }
        }

        stage('Build Images') {
            parallel {

                stage('Cart') {
                    steps {
                        sh '''
                            docker build -t ${ECR_REGISTRY}/cart:${IMAGE_TAG} ./cart-cna-microservice
                        '''
                    }
                }

                stage('Products') {
                    steps {
                        sh '''
                            docker build -t ${ECR_REGISTRY}/products:${IMAGE_TAG} ./products-cna-microservice
                        '''
                    }
                }

                stage('Search') {
                    steps {
                        sh '''
                            docker build -t ${ECR_REGISTRY}/search:${IMAGE_TAG} ./search-cna-microservice
                        '''
                    }
                }

                stage('Users') {
                    steps {
                        sh '''
                            docker build -t ${ECR_REGISTRY}/users:${IMAGE_TAG} ./users-cna-microservice
                        '''
                    }
                }

                stage('Store UI') {
                    steps {
                        sh '''
                            docker build -t ${ECR_REGISTRY}/store-ui:${IMAGE_TAG} ./store-ui
                        '''
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        trivy image ${ECR_REGISTRY}/cart:${IMAGE_TAG} --exit-code 0 --severity HIGH,CRITICAL
                        trivy image ${ECR_REGISTRY}/products:${IMAGE_TAG} --exit-code 0 --severity HIGH,CRITICAL
                        trivy image ${ECR_REGISTRY}/search:${IMAGE_TAG} --exit-code 0 --severity HIGH,CRITICAL
                        trivy image ${ECR_REGISTRY}/users:${IMAGE_TAG} --exit-code 0 --severity HIGH,CRITICAL
                        trivy image ${ECR_REGISTRY}/store-ui:${IMAGE_TAG} --exit-code 0 --severity HIGH,CRITICAL
                    '''
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-credentials']]) {
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${ECR_REGISTRY}/cart:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/products:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/search:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/users:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/store-ui:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-credentials']]) {
                    sh '''
                        aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER}

                        kubectl get namespace e-commerce || kubectl create namespace e-commerce
                        kubectl get namespace shared-services || kubectl create namespace shared-services

                        # Shared Services (Kustomize FIXED)
                        kubectl apply -k infra/k8s/shared-services/base/redis -n shared-services
                        kubectl apply -k infra/k8s/shared-services/base/mongodb -n shared-services

                        # Apps (Kustomize FIXED)
                        kubectl apply -k infra/k8s/apps/base/cart -n e-commerce
                        kubectl apply -k infra/k8s/apps/base/products -n e-commerce
                        kubectl apply -k infra/k8s/apps/base/search -n e-commerce
                        kubectl apply -k infra/k8s/apps/base/users -n e-commerce
                        kubectl apply -k infra/k8s/apps/base/store-ui -n e-commerce

                        # Update images (safe & correct)
                        kubectl set image deployment/cart-deployment cart=${ECR_REGISTRY}/cart:${IMAGE_TAG} -n e-commerce
                        kubectl set image deployment/products-deployment products=${ECR_REGISTRY}/products:${IMAGE_TAG} -n e-commerce
                        kubectl set image deployment/search-deployment search=${ECR_REGISTRY}/search:${IMAGE_TAG} -n e-commerce
                        kubectl set image deployment/users-deployment users=${ECR_REGISTRY}/users:${IMAGE_TAG} -n e-commerce
                        kubectl set image deployment/store-ui-deployment store-ui=${ECR_REGISTRY}/store-ui:${IMAGE_TAG} -n e-commerce

                        kubectl rollout status deployment -n e-commerce --timeout=300s
                    '''
                }
            }
        }

        stage('KubeBench') {
            steps {
                sh '''
                    docker run --rm \
                      --pid=host \
                      -v /etc:/etc:ro \
                      -v /var:/var:ro \
                      aquasec/kube-bench:latest run --exit-code 0
                '''
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline SUCCESS 🚀"
        }

        failure {
            echo "CI/CD Pipeline FAILED ❌"
        }
    }
}