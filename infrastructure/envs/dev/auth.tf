# Cognito User Pool
module "cognito" {
  source = "../../modules/cognito"

  user_pool_name = "${var.project_name}-users-${var.environment}"
  client_name    = "web-app"
  domain_name    = "${var.project_name}-${var.environment}"
  enable_mfa     = false

  callback_urls = ["http://localhost:3000/callback"]
  logout_urls   = ["http://localhost:3000/logout"]

  tags = {
    Name = "User Authentication"
  }
}
