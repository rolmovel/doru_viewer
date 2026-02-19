variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "handler" {
  description = "Lambda function handler (e.g., index.handler)"
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime (e.g., nodejs18.x, python3.11)"
  type        = string
  default     = "nodejs18.x"
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128
}

variable "source_code_path" {
  description = "Path to the Lambda function deployment package (zip file)"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "custom_policy_statements" {
  description = "Custom IAM policy statements for the Lambda execution role"
  type = list(object({
    Effect   = string
    Action   = list(string)
    Resource = list(string)
  }))
  default = []
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "vpc_subnet_ids" {
  description = "List of subnet IDs for VPC configuration (optional)"
  type        = list(string)
  default     = null
}

variable "vpc_security_group_ids" {
  description = "List of security group IDs for VPC configuration (optional)"
  type        = list(string)
  default     = null
}

variable "s3_trigger_bucket" {
  description = "S3 bucket ARN to trigger the Lambda (optional)"
  type        = string
  default     = null
}

variable "s3_trigger_events" {
  description = "S3 events to trigger the Lambda (e.g., ['s3:ObjectCreated:*'])"
  type        = list(string)
  default     = null
}

variable "s3_trigger_prefix" {
  description = "S3 key prefix filter for trigger"
  type        = string
  default     = ""
}

variable "s3_trigger_suffix" {
  description = "S3 key suffix filter for trigger"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
