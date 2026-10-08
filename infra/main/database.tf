// Development RDS instance; credentials are managed by AWS Secrets Manager.
data "aws_rds_engine_version" "postgres" {
  engine  = "postgres"
  version = "15"
  latest  = true
}

resource "aws_cloudwatch_log_group" "postgresql" {
  name              = "/aws/rds/instance/${local.name}/postgresql"
  retention_in_days = 7

  tags = {
    Name = "${local.name}-postgresql-logs"
  }
}

resource "aws_cloudwatch_log_group" "postgresql_upgrade" {
  name              = "/aws/rds/instance/${local.name}/upgrade"
  retention_in_days = 7

  tags = {
    Name = "${local.name}-postgresql-upgrade-logs"
  }
}

resource "aws_secretsmanager_secret" "app_credentials" {
  name                    = "${local.name}/application-database"
  description             = "Restricted application database credentials provisioned by the migration job."
  recovery_window_in_days = 7

  tags = {
    Name = "${local.name}-application-database"
  }
}

resource "aws_db_instance" "app" {
  identifier                      = local.name
  engine                          = data.aws_rds_engine_version.postgres.engine
  engine_version                  = data.aws_rds_engine_version.postgres.version
  instance_class                  = var.db_instance_class
  allocated_storage               = var.db_storage_gib
  storage_type                    = "gp3"
  storage_encrypted               = true
  db_name                         = "realworld"
  username                        = "realworld_admin"
  manage_master_user_password     = true
  publicly_accessible             = false
  multi_az                        = false
  db_subnet_group_name            = aws_db_subnet_group.app.name
  vpc_security_group_ids          = [aws_security_group.database.id]
  backup_retention_period         = 1
  auto_minor_version_upgrade      = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  apply_immediately               = true
  deletion_protection             = false
  skip_final_snapshot             = true
  copy_tags_to_snapshot           = true
  performance_insights_enabled    = false

  depends_on = [
    aws_cloudwatch_log_group.postgresql,
    aws_cloudwatch_log_group.postgresql_upgrade,
  ]

  tags = {
    Name = "${local.name}-postgres"
  }
}
