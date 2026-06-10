resource "aws_security_group" "k8s_sg" {
  name        = "k8s-security-group-v2"
  description = "Security group for Kubernetes cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "control_plane" {
  count                       = 0 # 👈 غيري دي لـ 0 عشان نلغي السيرفر ده تماماً
  ami                         = "ami-0d940f23d5a7efd70"
  instance_type               = "t3.medium"
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [aws_security_group.k8s_sg.id]
  key_name                    = var.key_name
  associate_public_ip_address = true

  tags = {
    Name = "k8s-control-plane"
    Role = "control-plane"
  }
}

resource "aws_instance" "workers" {
  count                       = 0 # 👈 غيري دي لـ 0 برضه عشان نلغي السيرفرات دي
  ami                         = "ami-0d940f23d5a7efd70"
  instance_type               = "t3.medium"
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [aws_security_group.k8s_sg.id]
  key_name                    = var.key_name
  associate_public_ip_address = true

  tags = {
    Name = "k8s-worker-${count.index + 1}"
    Role = "worker"
  }
}