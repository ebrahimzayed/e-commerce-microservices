pipeline {
    agent any

    environment {
        AWS_REGION      = 'eu-west-1'
        AWS_ACCOUNT_ID  = '429104603739'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        EKS_CLUSTER     = 'ecommerce-eks'
        
        // استخدام الـ Service Name الداخلي المباشر والمستقر تماماً
        SONAR_URL       = "http://sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
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
                        trivy fs --exit-code 0 --severity HIGH,CRITICAL .
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // استخدام الـ Credentials المعتمدة للسونار بأمان ونظافة
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_AUTH_TOKEN')]) {
                    // تعريف بيئة السونار الرسمية المدمجة داخل جينكينز
                    withSonarQubeEnv('sonarqube') {
                        script {
                            // 🚀 الحل السحري: استدعاء أداة الاسكانر المحلية لجينكينز لفحص المجلد الحالي مباشرة
                            def scannerHome = tool 'sonarqube'
                            sh """
                                echo "Starting Native SonarQube Scan on Workspace..."
                                ${scannerHome}/bin/sonar-scanner \
                                  -Dsonar.host.url="${SONAR_URL}" \
                                  -Dsonar.login="${SONAR_AUTH_TOKEN}" \
                                  -Dsonar.projectKey=e-commerce \
                                  -Dsonar.projectName=e-commerce \
                                  -Dsonar.sources=. \
                                  -Dsonar.java.binaries=. \
                                  -Dsonar.scm.disabled=true \
                                  -Dsonar.qualitygate.wait=false \
                                  -Dsonar.exclusions="**/node_modules/**,**/build/**,**/dist/**,**/.gradle/**,**/target/**"
                            """
                        }
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
                            docker build -t ${ECR_REGISTRY}/cart:${IMAGE_TAG} -t ${ECR_REGISTRY}/cart:latest cart-cna-microservice
                        '''
                    }
                }

                stage('Products') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/products:${IMAGE_TAG} -t ${ECR_REGISTRY}/products:latest products-cna-microservice'
                    }
                }

                stage('Search') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/search:${IMAGE_TAG} -t ${ECR_REGISTRY}/search:latest search-cna-microservice'
                    }
                }

                stage('Users') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/users:${IMAGE_TAG} -t ${ECR_REGISTRY}/users:latest users-cna-microservice'
                    }
                }

                stage('Store UI') {
                    steps {
                        sh 'docker build -t ${ECR_REGISTRY}/store-ui:${IMAGE_TAG} -t ${ECR_REGISTRY}/store-ui:latest store-ui'
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh '''
                        for img in cart products search users store-ui; do
                          trivy image --timeout 15m --exit-code 0 --severity HIGH,CRITICAL \
                          ${ECR_REGISTRY}/$img:${IMAGE_TAG}
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

                        docker push ${ECR_REGISTRY}/cart:latest
                        docker push ${ECR_REGISTRY}/products:latest
                        docker push ${ECR_REGISTRY}/search:latest
                        docker push ${ECR_REGISTRY}/users:latest
                        docker push ${ECR_REGISTRY}/store-ui:latest
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

                        kubectl create namespace e-commerce --dry-run=client -o yaml | kubectl apply -f -
                        kubectl create namespace shared-services --dry-run=client -o yaml | kubectl apply -f -

                        kubectl apply -f infra/k8s/shared-services/base/redis/ -n shared-services || true
                        kubectl apply -f infra/k8s/shared-services/base/mongodb/ -n shared-services || true

                        kubectl apply -f infra/k8s/apps/base/cart/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/products/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/search/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/users/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/store-ui/ -n e-commerce || true

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
                      -v ~/.kube:/root/.kube:ro \
                      aquasec/kube-bench:latest run --exit-code 0
                '''
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline SUCCESS ✅"
        }
        failure {
            echo "CI/CD Pipeline FAILED ❌"
        }
    }
}