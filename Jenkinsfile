pipeline {
    agent any
        environment {
            DOCKER_REGISTRY = 'DOCKER_REGISTRY_URL'
            LINODE_S3_BUCKET = 'jenkins-artifact-bucket'
            SLACK_CHANNEL = '#jenkins-cicd-testing'
        }

        stages {
            stage('Build') {
                steps {
                    sh 'docker build -t $DOCKER_REGISTRY/example-app-image .'
		    sh 'npm install'
                }

                post {
                    success {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Build complete!')
                    }
                    failure {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Build has failed. See the logs for details.')
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
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Testing passed!')
                    }
                    failure {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Testing has failed. See the logs for details.')
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
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Code analysis conducted! Review the logs for results.')
                    }
                }
            }

            stage('Package') {
                steps {
                    sh 'docker save $DOCKER_REGISTRY/example-app-image:latest > example-app-image.tar'
                    sh 'rclone copyto example-app-image.tar linodes3:$LINODE_S3_BUCKET/artifacts/example-app-image-$(date +%Y%m%d-%H%M%S).tar --config=/opt/rclone/rclone.conf'
                }

                post {
                    success {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Artifacts stored!')
                    }
                    failure {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Packaging has failed. See the logs for details.')
                    }
                    cleanup {
                        sh 'rm example-app-image.tar'
                    }
                }
            }

            stage('Deploy') {
                steps {
                    withCredentials([usernamePassword(credentialsId: 'jenkins-example-docker', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                        sh 'docker login $DOCKER_REGISTRY -u $USERNAME -p $PASSWORD'
                    }

                    withKubeConfig([credentialsId: 'jenkins-example-lke']) {
                        sh 'docker push $DOCKER_REGISTRY/example-app-image:latest'
                        sh 'sed -i "s;DOCKER_REGISTRY;$DOCKER_REGISTRY;" example-app-kube.yml'
                        sh 'kubectl apply -f example-app-kube.yml'
                    }
                }

                post {
                    success {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Deployment done!')
                    }
                    failure {
                        slackSend(channel: "${SLACK_CHANNEL}", message: 'Deployment has failed. See the logs for details.')
                    }
                }
            }
        }
}