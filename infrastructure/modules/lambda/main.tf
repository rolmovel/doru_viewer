# Lambda Module
# Creates a Lambda function with IAM role, CloudWatch logging, and optional triggers

resource "aws_iam_role" "lambda" {
  name = "${var.function_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_custom" {
  count = length(var.custom_policy_statements) > 0 ? 1 : 0
  name  = "${var.function_name}-custom-policy"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = var.custom_policy_statements
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  role          = aws_iam_role.lambda.arn
  handler       = var.handler
  runtime       = var.runtime
  timeout       = var.timeout
  memory_size   = var.memory_size

  filename         = var.source_code_path
  source_code_hash = filebase64sha256(var.source_code_path)

  environment {
    variables = var.environment_variables
  }

  dynamic "vpc_config" {
    for_each = var.vpc_subnet_ids != null && var.vpc_security_group_ids != null ? [1] : []
    content {
      subnet_ids         = var.vpc_subnet_ids
      security_group_ids = var.vpc_security_group_ids
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# S3 Trigger
resource "aws_lambda_permission" "s3" {
  count         = var.s3_trigger_bucket != null ? 1 : 0
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.s3_trigger_bucket
}

resource "aws_s3_bucket_notification" "lambda" {
  count  = var.s3_trigger_bucket != null && var.s3_trigger_events != null ? 1 : 0
  bucket = var.s3_trigger_bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.this.arn
    events              = var.s3_trigger_events
    filter_prefix       = var.s3_trigger_prefix
    filter_suffix       = var.s3_trigger_suffix
  }

  depends_on = [aws_lambda_permission.s3]
}
