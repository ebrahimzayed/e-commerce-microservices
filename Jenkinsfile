pipeline {
    agent any

    environment {
        AWS_REGION      = 'eu-west-1'
        AWS_ACCOUNT_ID  = '429104603739'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        // 🔥 FIX: use Git commit instead of build number
        IMAGE_TAG       = "${env.GIT_COMMIT.take(7)}"

        EKS_CLUSTER     = 'ecommerce-eks'

        SONAR_URL       = "http://localhost:9001"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/ebrahimzayed/e-commerce-microservices.git'
                    ]]
                )
            }
        }

        stage('Trivy File System Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        trivy fs \
                          --exit-code 0 \
                          --severity HIGH,CRITICAL \
                          --format table .
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_AUTH_TOKEN')]) {
                        sh '''
                            cat << 'EOF' > SonarDockerfile
FROM sonarsource/sonar-scanner-cli:latest
COPY . /usr/src
WORKDIR /usr/src
EOF

                            docker build -t local-sonar-scanner -f SonarDockerfile .

                            docker run --rm --network host \
                              -e SONAR_HOST_URL="${SONAR_URL}" \
                              -e SONAR_TOKEN=${SONAR_AUTH_TOKEN} \
                              local-sonar-scanner \
                              -Dsonar.projectKey=e-commerce \
                              -Dsonar.projectName=e-commerce \
                              -Dsonar.sources=. \
                              -Dsonar.java.binaries=. \
                              -Dsonar.scm.disabled=true \
                              -Dsonar.exclusions="**/node_modules/**,**/build/**,**/dist/**,**/.gradle/**,**/target/**"

                            docker rmi local-sonar-scanner || true
                            rm -f SonarDockerfile
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
                            cd cart-cna-microservice
                            chmod +x gradlew
                            ./gradlew bootJar -x test
                            cd ..

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
                        for service in cart products search users store-ui; do
                            trivy image \
                              --exit-code 0 \
                              --severity HIGH,CRITICAL \
                              --format table \
                              --cache-dir /var/lib/trivy-cache \
                              --scanners vuln \
                              --skip-version-check \
                              --timeout 15m \
                              ${ECR_REGISTRY}/${service}:${IMAGE_TAG}
                        done
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

                        kubectl apply -f infra/k8s/shared-services/base/redis/ -n shared-services
                        kubectl apply -f infra/k8s/shared-services/base/mongodb/ -n shared-services

                        kubectl apply -f infra/k8s/apps/base/cart/ -n e-commerce
                        kubectl apply -f infra/k8s/apps/base/products/ -n e-commerce
                        kubectl apply -f infra/k8s/apps/base/search/ -n e-commerce
                        kubectl apply -f infra/k8s/apps/base/users/ -n e-commerce
                        kubectl apply -f infra/k8s/apps/base/store-ui/ -n e-commerce

                        # 🔥 IMPORTANT: ONLY set image (no latest usage)
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

                        # 🔥 FIX: explicit rollout per service
                        kubectl rollout status deployment/cart-deployment -n e-commerce --timeout=300s
                        kubectl rollout status deployment/products-deployment -n e-commerce --timeout=300s
                        kubectl rollout status deployment/search-deployment -n e-commerce --timeout=300s
                        kubectl rollout status deployment/users-deployment -n e-commerce --timeout=300s
                        kubectl rollout status deployment/store-ui-deployment -n e-commerce --timeout=300s
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
            echo '✅ Pipeline succeeded'
        }

        failure {
            echo '❌ Pipeline failed'
        }
    }
}