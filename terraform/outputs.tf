output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.studyblog.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.studyblog.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.studyblog.public_dns
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "http://${aws_instance.studyblog.public_ip}:3000"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_instance.studyblog.public_ip}:8082"
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/study-key.pem ec2-user@${aws_instance.studyblog.public_ip}"
}
