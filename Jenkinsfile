
node {
  stage('scm checkout') {
	git url: 'https://github.com/wintoo/node-express-realworld-example-app.git',
	branch: 'dev',
	credentialsId: '6107d8e5-fe4e-43c2-ae69-8730c09edecb'

//	checkout([$class: 'GitSCM',
//		branches: [[name: 'origin/dev']],
//		extensions: [[$class: 'WipeWorkspace']],
//		credentialsId: '6107d8e5-fe4e-43c2-ae69-8730c09edecb',
//		userRemoteConfigs: [[url: 'https://github.com/wintoo/node-express-realworld-example-app.git']]
//		])	
  }
  
  stage('build') {
      sh 'npm install'
  }
  
  stage('test') {
      sh 'sleep 90'
  }
  
  stage('deploy') {
      sh 'sleep 90'
  }
    
}
