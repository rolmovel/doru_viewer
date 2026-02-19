# S3 Buckets
module "reports_raw_bucket" {
  source = "../../modules/s3_bucket"

  bucket_name       = "${var.project_name}-reports-raw-${var.environment}"
  enable_versioning = true
  kms_key_id        = aws_kms_key.main.arn

  lifecycle_rules = [
    {
      id      = "transition-to-ia"
      enabled = true
      transitions = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        }
      ]
      expiration_days = null
    }
  ]

  tags = {
    Name = "Reports Raw Data"
  }
}

module "reports_docs_bucket" {
  source = "../../modules/s3_bucket"

  bucket_name       = "${var.project_name}-reports-docs-${var.environment}"
  enable_versioning = true
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "Reports Documents"
  }
}

module "analytics_bucket" {
  source = "../../modules/s3_bucket"

  bucket_name       = "${var.project_name}-analytics-${var.environment}"
  enable_versioning = false
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "Analytics Data"
  }
}

module "frontend_bucket" {
  source = "../../modules/s3_bucket"

  bucket_name       = "${var.project_name}-frontend-${var.environment}"
  enable_versioning = false

  tags = {
    Name = "Frontend Assets"
  }
}

# KMS Key
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-key-${var.environment}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}
