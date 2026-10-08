// Isolated network for Lambda and private RDS PostgreSQL.
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "app" {
  cidr_block           = "10.40.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.name}-vpc"
  }
}

resource "aws_subnet" "database" {
  count = 2

  vpc_id                  = aws_vpc.app.id
  cidr_block              = cidrsubnet(aws_vpc.app.cidr_block, 8, count.index + 1)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name}-database-${count.index + 1}"
    Tier = "private-database"
  }
}

resource "aws_db_subnet_group" "app" {
  name       = "${local.name}-db-subnets"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${local.name}-db-subnets"
  }
}

resource "aws_security_group" "lambda" {
  name        = "${local.name}-lambda"
  description = "Security group for the RealWorld Lambda functions."
  vpc_id      = aws_vpc.app.id

  egress {
    description = "Allow outbound traffic; there is no NAT gateway in this cost-conscious network."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name}-lambda"
  }
}

resource "aws_security_group" "secrets_manager_endpoint" {
  name        = "${local.name}-secrets-endpoint"
  description = "Allow HTTPS from the application Lambda to the Secrets Manager VPC endpoint."
  vpc_id      = aws_vpc.app.id

  ingress {
    description     = "HTTPS from the application Lambda."
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = {
    Name = "${local.name}-secrets-endpoint"
  }
}

resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = aws_vpc.app.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.database[0].id]
  security_group_ids  = [aws_security_group.secrets_manager_endpoint.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name}-secrets-manager"
  }
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.app.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_vpc.app.default_route_table_id]

  tags = {
    Name = "${local.name}-s3"
  }
}

resource "aws_security_group" "database" {
  name        = "${local.name}-database"
  description = "Allow PostgreSQL connections only from the application Lambda security group."
  vpc_id      = aws_vpc.app.id

  ingress {
    description     = "PostgreSQL from the application Lambda."
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  dynamic "ingress" {
    for_each = var.jenkins == null ? [] : [var.jenkins.security_group_id]

    content {
      description     = "PostgreSQL from the Jenkins EC2 security group over VPC peering."
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  egress {
    description = "Allow database response traffic."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name}-database"
  }
}
