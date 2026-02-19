variable "api_name" {
  type = string
}

variable "endpoint_type" {
  type    = string
  default = "REGIONAL"
}

variable "stage_name" {
  type    = string
  default = "prod"
}

variable "routes" {
  type = map(object({
    path                = string
    method              = string
    lambda_invoke_arn   = string
    lambda_function_name = string
    authorization       = string
    authorizer_id       = optional(string)
  }))
}

variable "tags" {
  type    = map(string)
  default = {}
}
