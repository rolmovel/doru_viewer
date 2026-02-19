output "distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "distribution_domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "origin_access_identity_arn" {
  value = aws_cloudfront_origin_access_identity.this.iam_arn
}
