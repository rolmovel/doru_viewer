resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  mfa_configuration = var.enable_mfa ? "OPTIONAL" : "OFF"

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name         = var.client_name
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  allowed_oauth_flows  = ["implicit"]
  allowed_oauth_scopes = ["openid", "email"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.domain_name
  user_pool_id = aws_cognito_user_pool.this.id
}
