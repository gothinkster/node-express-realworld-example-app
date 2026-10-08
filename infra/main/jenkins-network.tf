resource "aws_vpc_peering_connection" "jenkins" {
  count = local.jenkins_peering_enabled ? 1 : 0

  vpc_id      = aws_vpc.app.id
  peer_vpc_id = var.jenkins.vpc_id
  auto_accept = true

  tags = {
    Name = "${local.name}-jenkins-peering"
  }
}

resource "aws_vpc_peering_connection_options" "jenkins" {
  count = local.jenkins_peering_enabled ? 1 : 0

  vpc_peering_connection_id = aws_vpc_peering_connection.jenkins[0].id

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  accepter {
    allow_remote_vpc_dns_resolution = true
  }
}

resource "aws_route" "app_to_jenkins" {
  count = local.jenkins_peering_enabled ? 1 : 0

  route_table_id            = aws_vpc.app.default_route_table_id
  destination_cidr_block    = var.jenkins.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.jenkins[0].id
}

resource "aws_route" "jenkins_to_app" {
  count = local.jenkins_peering_enabled ? 1 : 0

  route_table_id            = var.jenkins.route_table_id
  destination_cidr_block    = aws_vpc.app.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.jenkins[0].id
}
