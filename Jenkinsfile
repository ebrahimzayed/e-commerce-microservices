pipeline {
    agent any

    environment {
        AWS_REGION      = 'us-east-2'
        AWS_ACCOUNT_ID  = '429104603739'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        EKS_CLUSTER     = 'ecommerce-eks'
        SONAR_URL       = "http://192.168.148.130:9001"
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
                          sonarsource/sonar-scanner-cli:latest \
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
                        sh '''
                            cd ./cart-cna-microservice
                            chmod +x gradlew
                            ./gradlew bootJar -x test
                            cd ..
                            docker build --no-cache -t ${ECR_REGISTRY}/cart:${IMAGE_TAG} ./cart-cna-microservice
                        '''
                    }
                }
                stage('Build Products') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/products:${IMAGE_TAG} ./products-cna-microservice'
                    }
                }
                stage('Build Search') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/search:${IMAGE_TAG} ./search-cna-microservice'
                    }
                }
                stage('Build Users') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/users:${IMAGE_TAG} ./users-cna-microservice'
                    }
                }
                stage('Build Store UI') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/store-ui:${IMAGE_TAG} ./store-ui'
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        trivy image \
                          --exit-code 0 \
                          --severity HIGH,CRITICAL \
                          --format table \
                          --cache-dir /var/lib/trivy-cache \
                          --scanners vuln \
                          --skip-version-check \
                          --timeout 15m \
                          ${ECR_REGISTRY}/cart:${IMAGE_TAG}
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

        stage('Update K8s Manifests') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-credentials']]) {
                    sh '''
                        aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER}

                        # Update image tags in deployments
                        kubectl set image deployment/cart-deployment \
                            cart=${ECR_REGISTRY}/cart:${IMAGE_TAG} -n e-commerce

                        kubectl set image deployment/products-deployment \
                            products=${ECR_REGISTRY}/products:${IMAGE_TAG} -n e-commerce

                        kubectl set image deployment/search-deployment \
                            search=${ECR_REGISTRY}/search:${IMAGE_TAG} -n e-commerce

                        kubectl set image deployment/users-deployment \
                            users=${ECR_REGISTRY}/users:${IMAGE_TAG} -n e-commerce

                        kubectl set image deployment/store-ui-deployment \
                            store-ui=${ECR_REGISTRY}/store-ui:${IMAGE_TAG} -n e-commerce

                        # Wait for rollout
                        kubectl rollout status deployment -n e-commerce --timeout=300s
                    '''
                }
            }
        }

        stage('KubeBench Scan') {
            steps {
                sh '''
                    docker run --rm \
                      --pid=host \
                      -v /etc:/etc:ro \
                      -v /var:/var:ro \
                      -v ~/.kube:/root/.kube:ro \
                      aquasec/kube-bench:latest run \
                      --exit-code 0
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