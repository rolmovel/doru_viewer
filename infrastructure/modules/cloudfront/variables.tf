variable "origin_domain_name" {
  type = string
}

variable "origin_id" {
  type    = string
  default = "S3Origin"
}

variable "comment" {
  type    = string
  default = "CloudFront Distribution"
}

variable "default_root_object" {
  type    = string
  default = "index.html"
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}

variable "tags" {
  type    = map(string)
  default = {}
}
