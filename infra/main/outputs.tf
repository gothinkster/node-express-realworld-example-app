// Non-secret connection metadata for the Lambda configuration.
output "vpc_id" {
  description = "VPC hosting the private database and application Lambda."
  value       = aws_vpc.app.id
}

output "lambda_security_group_id" {
  description = "Attach this security group to the application Lambda."
  value       = aws_security_group.lambda.id
}

output "lambda_execution_role_arn" {
  description = "Execution role with VPC, logging, and RDS secret-read permissions."
  value       = aws_iam_role.lambda.arn
}

output "secrets_manager_vpc_endpoint_id" {
  description = "Private interface endpoint Lambda uses to retrieve RDS-managed credentials."
  value       = aws_vpc_endpoint.secrets_manager.id
}

output "database_endpoint" {
  description = "Private PostgreSQL endpoint. It is reachable only from the Lambda security group."
  value       = aws_db_instance.app.address
}

output "database_port" {
  value = aws_db_instance.app.port
}

output "database_name" {
  value = aws_db_instance.app.db_name
}

output "database_app_secret_arn" {
  description = "Secrets Manager ARN for restricted application credentials, populated by the migration job."
  value       = aws_secretsmanager_secret.app_credentials.arn
}

output "database_master_secret_arn" {
  description = "Secrets Manager ARN for RDS-managed master credentials; Jenkins uses it only for migrations."
  value       = aws_db_instance.app.master_user_secret[0].secret_arn
}

output "jenkins_vpc_peering_connection_id" {
  description = "VPC peering connection between the Jenkins EC2 VPC and the private database VPC."
  value       = try(aws_vpc_peering_connection.jenkins[0].id, null)
}

output "migration_artifact_bucket" {
  description = "Private S3 bucket for Jenkins-generated deployment artifacts."
  value       = aws_s3_bucket.migration_artifacts.bucket
}

output "api_url" {
  description = "Invoke URL for the HTTP API."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch application dashboard."
  value       = aws_cloudwatch_dashboard.application.dashboard_name
}
