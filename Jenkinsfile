

pipeline {
    agent any

    environment {
        AWS_REGION      = 'us-east-2'
        AWS_ACCOUNT_ID  = '429104603739'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        EKS_CLUSTER     = 'ecommerce-eks'
        /* الرابط الجديد والمخفف للسونار على AWS بعد التجديد */
        SONAR_URL       = "http://aac7c880091134e2c8660dc9cdac0590-1131011486.us-east-2.elb.amazonaws.com:9000"
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

        stage('Trivy File System Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    echo '🔍 Running Trivy File System Scan to discover vulnerabilities in source code...'
                    sh '''
                        trivy fs \
                          --exit-code 0 \
                          --severity HIGH,CRITICAL \
                          --format table \
                          .
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    withSonarQubeEnv('sonarqube') {
                        sh '''
                            # 1. إنشاء Dockerfile مؤقت
                            cat << 'EOF' > SonarDockerfile
                            FROM sonarsource/sonar-scanner-cli:latest
                            COPY . /usr/src
                            WORKDIR /usr/src
EOF

                            # 2. بناء حاوية السونار 
                            docker build -t local-sonar-scanner -f SonarDockerfile .

                            # 3. تشغيل الفحص
                            docker run --rm \
                              --net=host \
                              -e SONAR_HOST_URL=${SONAR_URL} \
                              -e SONAR_TOKEN=$SONAR_AUTH_TOKEN \
                              local-sonar-scanner \
                              -Dsonar.projectKey=e-commerce \
                              -Dsonar.projectName=e-commerce \
                              -Dsonar.sources=. \
                              -Dsonar.java.binaries=. \
                              -Dsonar.scm.disabled=true \
                              -Dsonar.exclusions="**/node_modules/**,**/build/**,**/dist/**,**/.gradle/**,**/target/**"

                            # 4. تنظيف الحاوية والملف
                            docker rmi local-sonar-scanner || true
                            rm -f SonarDockerfile
                        '''
                    }
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

        stage('Trivy Image Scan') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    echo '🛡️ Running Trivy Scan on all built Microservices Images...'
                    sh '''
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table --cache-dir /var/lib/trivy-cache --scanners vuln --skip-version-check --timeout 15m ${ECR_REGISTRY}/cart:${IMAGE_TAG}
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table --cache-dir /var/lib/trivy-cache --scanners vuln --skip-version-check --timeout 15m ${ECR_REGISTRY}/products:${IMAGE_TAG}
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table --cache-dir /var/lib/trivy-cache --scanners vuln --skip-version-check --timeout 15m ${ECR_REGISTRY}/search:${IMAGE_TAG}
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table --cache-dir /var/lib/trivy-cache --scanners vuln --skip-version-check --timeout 15m ${ECR_REGISTRY}/users:${IMAGE_TAG}
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table --cache-dir /var/lib/trivy-cache --scanners vuln --skip-version-check --timeout 15m ${ECR_REGISTRY}/store-ui:${IMAGE_TAG}
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

                        # إنشاء الـ namespaces لو مش موجودين
                        kubectl get namespace e-commerce || kubectl create namespace e-commerce
                        kubectl get namespace shared-services || kubectl create namespace shared-services

                        # deploy الـ shared services
                        kubectl apply -f infra/k8s/shared-services/base/redis/ -n shared-services || true
                        kubectl apply -f infra/k8s/shared-services/base/mongodb/ -n shared-services || true

                        # إنشاء الـ configmaps لو مش موجودين
                        kubectl get configmap cart-configmap -n e-commerce || \
                        kubectl create configmap cart-configmap \
                            --from-literal=SPRING_REDIS_HOST=redis-service.shared-services.svc.cluster.local \
                            --from-literal=SPRING_REDIS_PORT=6379 \
                            --from-literal=SPRING_REDIS_PASSWORD="" \
                            --from-literal=SPRING_DATA_REDIS_HOST=redis-service.shared-services.svc.cluster.local \
                            --from-literal=SPRING_DATA_REDIS_PORT=6379 \
                            --from-literal=SPRING_DATA_REDIS_PASSWORD="" \
                            -n e-commerce

                        kubectl get configmap products-configmap -n e-commerce || \
                        kubectl create configmap products-configmap \
                            --from-literal=MONGO_URI=mongodb://mongo-service.shared-services.svc.cluster.local:27017 \
                            --from-literal=DATABASE=products \
                            -n e-commerce

                        kubectl get configmap search-configmap -n e-commerce || \
                        kubectl create configmap search-configmap \
                            --from-literal=ELASTIC_URL=http://elasticsearch-service.shared-services.svc.cluster.local:9200 \
                            -n e-commerce

                        # deploy الـ apps
                        kubectl apply -f infra/k8s/apps/base/cart/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/products/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/search/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/users/ -n e-commerce || true
                        kubectl apply -f infra/k8s/apps/base/store-ui/ -n e-commerce || true

                        # expose الـ services المطلوبة للـ store-ui
                        kubectl get svc products-api -n e-commerce || \
                            kubectl expose deployment products-deployment --name=products-api --port=5000 --target-port=5000 -n e-commerce
                        kubectl get svc cart-api -n e-commerce || \
                            kubectl expose deployment cart-deployment --name=cart-api --port=8080 --target-port=8080 -n e-commerce
                        kubectl get svc search-api -n e-commerce || \
                            kubectl expose deployment search-deployment --name=search-api --port=4000 --target-port=4000 -n e-commerce
                        kubectl get svc users-api -n e-commerce || \
                            kubectl expose deployment users-deployment --name=users-api --port=9090 --target-port=9090 -n e-commerce

                        # update الـ images
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