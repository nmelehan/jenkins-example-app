pipeline {
    agent any
        environment {
            DOCKER_REGISTRY = 'nmelehan'
            LINODE_S3_BUCKET = 'jenkins-artifact-bucket'
        }

        stages {
            stage('Build') {
                steps {
                    sh 'docker build -t $DOCKER_REGISTRY/example-app-image .'
		    sh 'npm install'
                }

                post {
                    success {
                        echo 'Build complete!'
                    }
                    failure {
                        echo 'Build has failed. See the logs for details.'
                    }
                }
            }

            stage('Test') {
                environment {
                    testTwoParam = 'Melissa'

                    testOneExpected = '{"message":"Hello, World!"}'
                    testTwoExpected = '{"message":"Hello, ' + "${testTwoParam}!" + '"}'
                }

                steps {
                    sh 'docker run -d -p 3000:3000 $DOCKER_REGISTRY/example-app-image'
                    sh 'sleep 5'

                    sh '''#!/bin/bash
                          TEST_ONE_OUTPUT=$(curl -s localhost:3000)
                          TEST_TWO_OUTPUT=$(curl -s localhost:3000/${testTwoParam})

                          echo "Does $TEST_ONE_OUTPUT equal ${testOneExpected}?"
                          echo "Does $TEST_TWO_OUTPUT equal ${testTwoExpected}?"

                          if [[ $TEST_ONE_OUTPUT == ${testOneExpected} && $TEST_TWO_OUTPUT == ${testTwoExpected} ]]
                          then
                              exit 0
                          else
                              exit 1
                          fi
                    '''
                }

                post {
                    success {
                        echo 'Testing passed!'
                    }
                    failure {
                        echo 'Testing has failed. See the logs for details.'
                    }
                    cleanup {
                        sh 'docker ps -aq | xargs docker stop | xargs docker rm'
                    }
                }
            }

            stage('Code Analysis') {
                steps {
		    sh 'npx eslint -f checkstyle . > eslint.xml'
                }

                post {
                    always {
                        recordIssues enabledForFailure: true, aggregatingResults: true, tool: checkStyle(pattern: 'eslint.xml')
                        echo 'Code analysis conducted! Review the logs for results.'
                    }
                }
            }

            stage('Package') {
                steps {
                    sh 'docker save $DOCKER_REGISTRY/example-app-image:latest > example-app-image.tar'
                }

                post {
                    success {
                        echo 'Artifacts stored!'
                    }
                    failure {
                        echo 'Packaging has failed. See the logs for details.'
                    }
                    cleanup {
                        sh 'rm example-app-image.tar'
                    }
                }
            }

            stage('Deploy') {
                steps {
                    withCredentials([usernamePassword(credentialsId: 'jenkins-example-docker', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh 'docker login https://index.docker.io/v2 -u $USERNAME -p $PASSWORD'
                    }

                    withKubeConfig([credentialsId: 'jenkins-example-lke']) {
                        sh 'docker push $DOCKER_REGISTRY/example-app-image:latest'
                        sh 'sed -i "s;DOCKER_REGISTRY;$DOCKER_REGISTRY;" example-app-kube.yml'
                        sh 'kubectl apply -f example-app-kube.yml'
                    }
                }

                post {
                    success {
                        echo 'Deployment done!'
                    }
                    failure {
                        echo 'Deployment has failed. See the logs for details.'
                    }
                }
            }
        }
}
