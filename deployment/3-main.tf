terraform {
  backend "s3" {
    bucket  = "chatty-app-terraform-state-vvd"
    key     = "production/chatapp.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}

locals {
  prefix = "${var.prefix}-${terraform.workspace}"

  common_tags = {
    Environment = terraform.workspace
    Project     = var.project
    ManagedBy   = "Terraform"
    Owner       = "Vladislav Dandara"
  }
}
