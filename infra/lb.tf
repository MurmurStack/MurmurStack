
resource "aws_lb" "main" {
  name            = "sestream"
  security_groups = ["sg-0b10ecb541bbf10f4"]
  subnets         = ["subnet-0282d77542c8d0944", "subnet-0065cc608c9d24dfb"]
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  protocol          = "HTTP"
  port              = 80

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_target_group" "main" {
  name     = "sestream"
  vpc_id   = "vpc-08dfe781fd1c63330"
  protocol = "HTTP"
  port     = 30003

  health_check {
    path     = "/health"
    protocol = "HTTP"
  }
}