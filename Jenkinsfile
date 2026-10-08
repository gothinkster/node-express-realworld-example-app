pipeline {
  agent { label 'aws-builder' }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    string(name: 'JENKINS_VPC_ID', defaultValue: 'vpc-048e94ddedf6863e1', description: 'VPC ID for the existing Jenkins EC2 instance')
    string(name: 'JENKINS_VPC_CIDR', defaultValue: '172.31.0.0/16', description: 'CIDR for the Jenkins VPC')
    string(name: 'JENKINS_ROUTE_TABLE_ID', defaultValue: 'rtb-044f0a70819010452', description: 'Jenkins subnet/VPC route table')
    string(name: 'JENKINS_SECURITY_GROUP_ID', defaultValue: 'sg-009baace5c5ee5c7c', description: 'Security group attached to Jenkins EC2')
    string(name: 'JENKINS_IAM_ROLE_NAME', defaultValue: 'TerraformEC2Role', description: 'EC2 instance-profile role name')
  }

  environment {
    AWS_DEFAULT_REGION = 'ap-south-1'
    FRONTEND_REPOSITORY = 'https://github.com/SUNILKUMAR-A/react-redux-realworld-app-frontent.git'
    FRONTEND_BRANCH = 'master'
    FRONTEND_PAGES_OWNER = 'SUNILKUMAR-A'
    FRONTEND_PAGES_REPOSITORY = 'react-redux-realworld-app-frontent'
    NPM_CONFIG_CACHE = '/home/ec2-user/.cache/jenkins/npm'
    DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/realworld?schema=public'
    DIRECT_URL = 'postgresql://placeholder:placeholder@localhost:5432/realworld?schema=public'
    APP_DB_USERNAME = 'realworld_app'
  }

  stages {
    stage('Checkout frontend') {
      steps {
        sh '''
          rm -rf frontend
          git clone --depth 1 --branch "$FRONTEND_BRANCH" "$FRONTEND_REPOSITORY" frontend
        '''
      }
    }

    stage('Install, test, and scan') {
      steps {
        sh '''
          mkdir -p "$NPM_CONFIG_CACHE"
          npm ci --cache "$NPM_CONFIG_CACHE"
          npx prisma generate
          npx nx build api --configuration=production
          npx nx test api --runInBand
          npm audit --json > backend-npm-audit.json || true
          cd frontend
          npm ci --legacy-peer-deps --cache "$NPM_CONFIG_CACHE"
          npm audit --json > ../frontend-npm-audit.json || true
          cd ..
          if command -v checkov >/dev/null 2>&1; then
            CHECKOV=checkov
          else
            python3 -m venv .venv-checkov
            .venv-checkov/bin/pip install --quiet checkov
            CHECKOV=.venv-checkov/bin/checkov
          fi
          "$CHECKOV" -d infra/main --framework terraform --soft-fail -o json > checkov-results.json || true
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: '*npm-audit.json,checkov-results.json', allowEmptyArchive: true
        }
      }
    }

    stage('Initialize infrastructure') {
      steps {
        script {
          def jenkinsNetwork = [
            vpc_id           : params.JENKINS_VPC_ID,
            vpc_cidr         : params.JENKINS_VPC_CIDR,
            route_table_id   : params.JENKINS_ROUTE_TABLE_ID,
            security_group_id: params.JENKINS_SECURITY_GROUP_ID,
            iam_role_name    : params.JENKINS_IAM_ROLE_NAME
          ]
          writeFile(
            file: 'infra/main/jenkins.auto.tfvars.json',
            text: groovy.json.JsonOutput.toJson([jenkins: jenkinsNetwork])
          )
        }
        sh '''
          terraform -chdir=infra/main init -input=false
          terraform -chdir=infra/main fmt -check -recursive
          terraform -chdir=infra/main validate
        '''
      }
    }

    stage('Package Lambda') {
      steps {
        sh '''
          set -eu
          mkdir -p dist/api/src/prisma
          cp -a src/prisma/schema.prisma src/prisma/migrations dist/api/src/prisma/
          mkdir -p "$NPM_CONFIG_CACHE"
          npm ci --omit=dev --cache "$NPM_CONFIG_CACHE" --prefix dist/api
          mkdir -p dist/api/node_modules/@prisma dist/api/node_modules/.prisma
          rm -rf dist/api/node_modules/@prisma/client dist/api/node_modules/.prisma/client
          cp -a node_modules/@prisma/client dist/api/node_modules/@prisma/
          cp -a node_modules/.prisma/client dist/api/node_modules/.prisma/
          mkdir -p infra/main
          rm -f infra/main/lambda.zip
          python3 -c "import shutil; shutil.make_archive('infra/main/lambda', 'zip', 'dist/api')"
          test -s infra/main/lambda.zip
          python3 -c "import collections,zipfile; z=zipfile.ZipFile('infra/main/lambda.zip'); d=collections.Counter(); [d.update({'/'.join(i.filename.split('/')[:3]):i.file_size}) for i in z.infolist() if i.filename.startswith('node_modules/')]; print('Largest Lambda package dependencies:\\n'+'\\n'.join(f'{size / 1024 / 1024:8.1f} MiB  {name}' for name,size in d.most_common(20)))"
          python3 -c "import zipfile; z=zipfile.ZipFile('infra/main/lambda.zip'); size=sum(item.file_size for item in z.infolist()); print(f'Lambda uncompressed size: {size / 1024 / 1024:.1f} MiB'); assert size < 262144000, 'Lambda package exceeds AWS 250 MiB unzipped limit'"
          aws s3 cp infra/main/lambda.zip \
            "s3://$(terraform -chdir=infra/main output -raw migration_artifact_bucket)/lambda/${GIT_COMMIT}-${BUILD_NUMBER}.zip"
        '''
      }
    }

    stage('Run database migrations') {
      steps {
        sh '''
          set -eu
          export DB_HOST="$(terraform -chdir=infra/main output -raw database_endpoint)"
          export DB_PORT="$(terraform -chdir=infra/main output -raw database_port)"
          export DB_NAME="$(terraform -chdir=infra/main output -raw database_name)"
          export RDS_MASTER_SECRET_ARN="$(terraform -chdir=infra/main output -raw database_master_secret_arn)"
          export APP_SECRET_ARN="$(terraform -chdir=infra/main output -raw database_app_secret_arn)"
          node scripts/provision-app-db-user.js
        '''
      }
    }

    stage('Terraform plan') {
      steps {
        sh '''
          terraform -chdir=infra/main init -input=false
          terraform -chdir=infra/main plan -input=false \
            -var="lambda_package_key=lambda/${GIT_COMMIT}-${BUILD_NUMBER}.zip" \
            -out=deployment.tfplan
          terraform -chdir=infra/main show -no-color deployment.tfplan
        '''
      }
    }

    stage('Approve Terraform apply') {
      steps {
        input message: 'Review the Terraform plan in Console Output. Confirm RDS is not destroyed or replaced before applying.', ok: 'Apply reviewed plan'
      }
    }

    stage('Terraform apply') {
      steps {
        sh '''
          terraform -chdir=infra/main apply -input=false deployment.tfplan
        '''
      }
    }

    stage('Deploy frontend') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'frontend-github-pages',
          usernameVariable: 'GH_USERNAME',
          passwordVariable: 'GH_TOKEN'
        )]) {
          sh '''
            set -eu
            API_URL="$(terraform -chdir=infra/main output -raw api_url)/api"
            FRONTEND_URL="https://${FRONTEND_PAGES_OWNER}.github.io/${FRONTEND_PAGES_REPOSITORY}/"
            cd frontend
            PUBLIC_URL="/${FRONTEND_PAGES_REPOSITORY}" REACT_APP_API_ROOT="$API_URL" npm run build
            cp build/index.html build/404.html
            cd build
            git init
            git add --all
            git -c user.name="Jenkins" \
              -c user.email="jenkins@users.noreply.github.com" \
              commit -m "Deploy ${GIT_COMMIT} build ${BUILD_NUMBER}"
            git remote add origin "$FRONTEND_REPOSITORY"
            ASKPASS="$WORKSPACE/.git-askpass"
            printf '%s\n' \
              '#!/bin/sh' \
              'case "$1" in' \
              '  *Username*) printf "%s" "$GH_USERNAME" ;;' \
              '  *Password*) printf "%s" "$GH_TOKEN" ;;' \
              '  *) exit 1 ;;' \
              'esac' > "$ASKPASS"
            chmod 700 "$ASKPASS"
            GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0 \
              git push --force origin HEAD:gh-pages
            rm -f "$ASKPASS"
            echo "Frontend deployed to ${FRONTEND_URL}"
          '''
        }
      }
    }

    stage('Smoke test') {
      steps {
        sh '''
          set -eu
          API_URL="$(terraform -chdir=infra/main output -raw api_url)"
          FRONTEND_URL="https://${FRONTEND_PAGES_OWNER}.github.io/${FRONTEND_PAGES_REPOSITORY}/"
          curl --fail --retry 12 --retry-delay 10 "$API_URL/"
          curl --fail --retry 12 --retry-delay 10 "$FRONTEND_URL/"
        '''
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}
