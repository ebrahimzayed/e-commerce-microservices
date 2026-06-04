output "vpc_id" {
  value = aws_vpc.Main.id
}

output "public_subnet_id" {
  value = aws_subnet.publicsubnets.id
}

output "private_subnet_id" {
  value = aws_subnet.privatesubnets.id
}