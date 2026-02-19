# DynamoDB Table
module "reports_table" {
  source = "../../modules/dynamodb"

  table_name = "${var.project_name}-reports-${var.environment}"
  hash_key   = "report_id"

  attributes = [
    { name = "report_id", type = "S" },
    { name = "country_iso", type = "S" },
    { name = "category", type = "S" },
    { name = "timestamp", type = "S" }
  ]

  global_secondary_indexes = [
    {
      name            = "GSI_country"
      hash_key        = "country_iso"
      range_key       = "timestamp"
      projection_type = "ALL"
    },
    {
      name            = "GSI_category"
      hash_key        = "category"
      range_key       = "timestamp"
      projection_type = "ALL"
    }
  ]

  enable_point_in_time_recovery = true
  enable_encryption             = true
  kms_key_arn                   = aws_kms_key.main.arn

  tags = {
    Name = "Reports Table"
  }
}

# DynamoDB Table for Terraform State Lock
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "Terraform State Lock"
  }
}
