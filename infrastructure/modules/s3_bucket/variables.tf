variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for SSE-KMS encryption"
  type        = string
  default     = null
}

variable "enable_versioning" {
  description = "Enable versioning for the bucket"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules for the bucket"
  type = list(object({
    id              = string
    enabled         = bool
    transitions     = list(object({
      days          = number
      storage_class = string
    }))
    expiration_days = optional(number)
  }))
  default = []
}

variable "logging_target_bucket" {
  description = "Target bucket for access logs"
  type        = string
  default     = null
}

variable "logging_target_prefix" {
  description = "Prefix for access logs"
  type        = string
  default     = "logs/"
}

variable "tags" {
  description = "Tags to apply to the bucket"
  type        = map(string)
  default     = {}
}
