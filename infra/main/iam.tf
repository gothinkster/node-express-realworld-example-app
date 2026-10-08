data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name}-api-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name = "${local.name}-api-lambda"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}-api"
  retention_in_days = 7

  tags = {
    Name = "${local.name}-api-lambda-logs"
  }
}

data "aws_iam_policy_document" "lambda_runtime" {
  statement {
    sid       = "ReadApplicationCredentials"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app_credentials.arn]
  }

  statement {
    sid       = "WriteFunctionLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.lambda.arn}:*"]
  }
}

resource "aws_iam_role_policy" "lambda_runtime" {
  name   = "${local.name}-api-runtime"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_runtime.json
}

data "aws_iam_policy_document" "jenkins_migrations" {
  statement {
    sid       = "ReadRdsManagedCredentials"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_db_instance.app.master_user_secret[0].secret_arn]
  }

  statement {
    sid       = "ReadAndWriteApplicationCredentials"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:PutSecretValue"]
    resources = [aws_secretsmanager_secret.app_credentials.arn]
  }
}

resource "aws_iam_role_policy" "jenkins_migrations" {
  count = local.jenkins_peering_enabled ? 1 : 0

  name   = "${local.name}-jenkins-migrations"
  role   = var.jenkins.iam_role_name
  policy = data.aws_iam_policy_document.jenkins_migrations.json
}

data "aws_iam_policy_document" "jenkins_deploy" {
  statement {
    sid       = "LocateDeploymentArtifactBucket"
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation"]
    resources = [aws_s3_bucket.migration_artifacts.arn]
  }

  statement {
    sid    = "PublishLambdaArtifacts"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:GetObjectVersion",
    ]
    resources = ["${aws_s3_bucket.migration_artifacts.arn}/lambda/*"]
  }

}

resource "aws_iam_role_policy" "jenkins_deploy" {
  count = local.jenkins_peering_enabled ? 1 : 0

  name   = "${local.name}-jenkins-deploy"
  role   = var.jenkins.iam_role_name
  policy = data.aws_iam_policy_document.jenkins_deploy.json
}
