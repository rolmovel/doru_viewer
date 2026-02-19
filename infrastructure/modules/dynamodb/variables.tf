variable "table_name" {
  type = string
}

variable "billing_mode" {
  type    = string
  default = "PAY_PER_REQUEST"
}

variable "hash_key" {
  type = string
}

variable "range_key" {
  type    = string
  default = null
}

variable "attributes" {
  type = list(object({
    name = string
    type = string
  }))
}

variable "global_secondary_indexes" {
  type = list(object({
    name            = string
    hash_key        = string
    range_key       = optional(string)
    projection_type = string
    read_capacity   = optional(number)
    write_capacity  = optional(number)
  }))
  default = []
}

variable "enable_point_in_time_recovery" {
  type    = bool
  default = true
}

variable "enable_encryption" {
  type    = bool
  default = true
}

variable "kms_key_arn" {
  type    = string
  default = null
}

variable "ttl_attribute" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
