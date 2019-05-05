
node {
  stage('scm checkout') {
      echo "scm checkout"
      git branch: 'dev', 
      credentialsId: '6107d8e5-fe4e-43c2-ae69-8730c09edecb', 
      url: 'https://github.com/wintoo/node-express-realworld-example-app.git'
  }
  
  stage('build') {
      sh 'npm install'
  }
  
  stage('test') {
      echo "test"
  }
  
  stage('deploy') {
      echo "deploy"
  }
    
}
