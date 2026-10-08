terraform {
  backend "s3" {
    bucket       = "realworld-devops-tfstate-539839244635-ap-south-1"
    key          = "realworld/dev/main/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
