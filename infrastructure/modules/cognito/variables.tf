variable "user_pool_name" {
  type = string
}

variable "client_name" {
  type    = string
  default = "web-client"
}

variable "domain_name" {
  type = string
}

variable "enable_mfa" {
  type    = bool
  default = false
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000/logout"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
