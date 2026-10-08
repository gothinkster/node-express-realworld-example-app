data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "migration_artifacts" {
  bucket = "realworld-devops-artifacts-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "${local.name}-migration-artifacts"
  }
}

resource "aws_s3_bucket_public_access_block" "migration_artifacts" {
  bucket                  = aws_s3_bucket.migration_artifacts.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "migration_artifacts" {
  bucket = aws_s3_bucket.migration_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "migration_artifacts" {
  bucket = aws_s3_bucket.migration_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "migration_artifacts" {
  bucket = aws_s3_bucket.migration_artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"

    filter {
      prefix = "lambda/"
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "expire-old-migration-artifacts"
    status = "Enabled"

    filter {
      prefix = "migration/"
    }

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
