variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = "study-key"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "hdevnews.net"
}

variable "subdomain" {
  description = "Full subdomain for the application"
  type        = string
  default     = "studyblog.hdevnews.net"
}
