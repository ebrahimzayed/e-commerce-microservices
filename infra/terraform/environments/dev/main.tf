provider "aws" {
  region = var.region
}

module "vpc" {
  source          = "../../modules/vpc"
  region          = var.region
  main_vpc_cidr   = var.main_vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "ec2" {
  source           = "../../modules/ec2"
  vpc_id           = module.vpc.vpc_id
  public_subnet_id = module.vpc.public_subnet_id
  ami_id           = var.ami_id
  key_name         = var.key_name
}
