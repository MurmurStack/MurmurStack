resource "aws_acm_certificate" "api" {
  domain_name               = "*.murmurstack.com"
  subject_alternative_names = ["*.murmurstack.com"]
  validation_method         = "EMAIL"
}
