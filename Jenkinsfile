// GreenLeaves landing — Jenkins pipeline (static deploy)
// Branch: gl
// Deploys to /var/www/greenleaves/public/ on 37.60.240.199
//
// Much simpler than the carbon-app pipeline:
//   1. checkout
//   2. rsync to live folder
//   3. nginx serves it — no restart needed

pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 5, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    DEPLOY_USER = 'deployer'
    TARGET_DIR  = '/var/www/greenleaves/public'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/gl']],
          extensions: [
            [$class: 'CloneOption', shallow: true, depth: 1, noTags: true],
            [$class: 'CleanBeforeCheckout']
          ],
          userRemoteConfigs: [[
            url: 'https://github.com/MoctarSidibe/carbontrack.git'
            // For private repo: credentialsId: 'github-token'
          ]]
        ])
      }
    }

    stage('Deploy: rsync to live') {
      steps {
        sh '''
          set -eux
          # Ensure target exists
          sudo -u ${DEPLOY_USER} mkdir -p ${TARGET_DIR}

          # Mirror workspace → live folder. --delete removes files no longer in the branch.
          # Exclude git + jenkins metadata.
          sudo -u ${DEPLOY_USER} rsync -a --delete \
            --exclude='.git' \
            --exclude='.gitignore' \
            --exclude='Jenkinsfile' \
            --exclude='deploy/' \
            ./ ${TARGET_DIR}/
        '''
      }
    }

    stage('Smoke test') {
      steps {
        sh '''
          set -eu
          # index.html must exist and be non-empty
          test -s ${TARGET_DIR}/index.html
          # styles.css must exist
          test -s ${TARGET_DIR}/styles.css
          # Local hit through nginx (uses default vhost or hostname routing)
          curl -fsS -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\\n' \
            http://127.0.0.1/ -H 'Host: greenleaves.ga'
        '''
      }
    }
  }

  post {
    success { echo "✅ GreenLeaves landing #${env.BUILD_NUMBER} deployed" }
    failure { echo "❌ GreenLeaves landing #${env.BUILD_NUMBER} FAILED — previous deploy still live" }
  }
}
