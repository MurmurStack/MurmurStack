resource "aws_lb" "prod" {
  name            = "murmur-prod"
  security_groups = ["sg-0b10ecb541bbf10f4"]
  subnets         = ["subnet-0282d77542c8d0944", "subnet-0065cc608c9d24dfb"]
  idle_timeout    = 4000
}

resource "aws_lb_listener" "prod" {
  load_balancer_arn = aws_lb.prod.arn
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.api.arn
  port              = 443

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod.arn
  }
}

resource "aws_lb_listener" "prod_redirect" {
  load_balancer_arn = aws_lb.prod.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      protocol    = "HTTPS"
      port        = 443
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "prod" {
  name     = "murmur-prod"
  vpc_id   = "vpc-08dfe781fd1c63330"
  protocol = "HTTP"
  port     = 30004

  health_check {
    path     = "/health"
    protocol = "HTTP"
  }
}


resource "aws_lb" "main" {
  name            = "murmurstack"
  security_groups = ["sg-0b10ecb541bbf10f4"]
  subnets         = ["subnet-0282d77542c8d0944", "subnet-0065cc608c9d24dfb"]
  idle_timeout    = 4000
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.api.arn
  port              = 443

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_listener" "redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      protocol    = "HTTPS"
      port        = 443
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "main" {
  name     = "murmurstack"
  vpc_id   = "vpc-08dfe781fd1c63330"
  protocol = "HTTP"
  port     = 30003

  health_check {
    path     = "/health"
    protocol = "HTTP"
  }
}