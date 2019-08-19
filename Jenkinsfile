@Library('pipeline-utils')_  // it's not a typo

def staging_url = "https://blog-module.staging.oregon.platform-os.com"

pipeline {
  agent any

  environment {
    MPKIT_TOKEN = credentials('POS_TOKEN')
    MPKIT_EMAIL = "darek+ci@near-me.com"
    CI = true
  }

  parameters {
    string(description: 'Instance URL. When empty then we deploy on staging and production', name: 'MP_URL', defaultValue: '')
  }

  options {
    disableConcurrentBuilds()
    timeout(time: 10, unit: 'MINUTES')
    buildDiscarder(logRotator(daysToKeepStr: '1', artifactDaysToKeepStr: '1'))
  }

  stages {
    stage('Install dependencies') {
      when { branch 'master' }

      agent { docker { image 'node:12-alpine'; args '-u root' } }

      steps {
        sh 'npm ci'
      }
    }

    stage('Deploy to URL') {
      when { expression { return !params.MP_URL.isEmpty() } }
      environment {
        MPKIT_URL = "${params.MP_URL}"
        CI = true
      }
      agent { docker { image 'platformos/pos-cli' } }
      steps {
        sh 'pos-cli deploy'
      }
    }

    stage('Test on URL') {
      when { expression { return !params.MP_URL.isEmpty() } }
      agent { docker { image "platformos/testcafe" } }
      environment { MP_URL = "${params.MP_URL}" }
      steps {
        sh 'npm run test-ci'
      }
      post { failure { archiveArtifacts "screenshots/" } }
    }

    stage('Deploy STG') {
      agent { docker { image 'platformos/pos-cli' } }

      environment {
        MPKIT_URL = "${staging_url}"
        CI = true
      }

      when {
        expression { return params.MP_URL.isEmpty() }
        anyOf { branch 'master' }
      }

      steps {
        sh 'pos-cli deploy'
      }
    }

    stage('Test STG') {
      when {
        expression { return params.MP_URL.isEmpty() }
        branch 'master'
      }

      environment {
        MP_URL = "${staging_url}"
      }

      agent { docker { image "platformos/testcafe" } }

      steps {
        sh 'npm run test-ci'
      }
      post { failure { archiveArtifacts "screenshots/" } }
    }
  }

  post {
    success {
      slackSend (channel: "#staging_sanity_check", color: '#00FF00', message: "Golfstix | SUCCESS: <${env.BUILD_URL}|Build #${env.BUILD_NUMBER}> - ${buildDuration()}. ${commitInfo()}")
    }

    failure {
      slackSend (channel: "#staging_sanity_check", color: '#FF0000', message: "Golfstix | FAILED: <${env.BUILD_URL}|Open build details> - ${buildDuration()}")
    }
  }
}

def commitInfo() {
  GITHUB_URL = "https://github.com/mdyd-dev/platformos-blog"

  commitSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
  commitAuthor = sh(returnStdout: true, script: 'git log --format="%an" -1').trim()
  commitMsg = sh(returnStdout: true, script: 'git log --format="%B" -1 ${commitSha}').trim()

  return "<${GITHUB_URL}/commit/${commitSha}|${commitSha}> - ${commitMsg}"
}