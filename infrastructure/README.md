# Deployment Configuration

This directory contains the infrastructure as code for the DORU platform.

## Structure

```
infrastructure/
├── modules/
│   ├── s3_bucket/      # S3 bucket with encryption
│   ├── lambda/         # Lambda functions
│   ├── dynamodb/       # DynamoDB tables
│   ├── api_gateway/    # API Gateway
│   ├── cognito/        # Cognito authentication
│   └── cloudfront/     # CloudFront CDN
└── envs/
    ├── dev/           # Development environment
    └── prod/          # Production environment
```

## Prerequisites

- AWS CLI installed and configured
- Terraform >= 1.6.0
- Node.js 18+ (for Lambda packaging)

## First Time Setup

1. Create S3 bucket for Terraform state:
```bash
aws s3 mb s3://terraform-state-doru --region us-east-1
aws s3api put-bucket-versioning --bucket terraform-state-doru --versioning-configuration Status=Enabled
```

2. Create DynamoDB table for state locking:
```bash
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Deployment Steps

1. Navigate to environment:
```bash
cd infrastructure/envs/dev
```

2. Initialize Terraform:
```bash
terraform init
```

3. Plan changes:
```bash
terraform plan
```

4. Apply changes:
```bash
terraform apply
```

## Building Lambda Functions

Each Lambda function needs to be packaged as a ZIP file before deployment:

```bash
cd src/lambdas/csv-validator
npm install csv-parser
zip -r ../../../infrastructure/envs/dev/lambda-packages/csv-validator.zip .
```

Repeat for each Lambda function.

## Frontend Deployment

Build the frontend and deploy to S3:

```bash
cd frontend
npm install
npm run build
aws s3 sync build/ s3://<frontend-bucket-name> --delete
```

## Environment Variables

Create a `terraform.tfvars` file in the environment directory:

```hcl
aws_region = "us-east-1"
environment = "dev"
project_name = "doru"
```

## Important Notes

- The backend S3 bucket must exist before running `terraform init`
- Lambda functions must be packaged before running `terraform apply`
- CloudFront distributions take ~15 minutes to deploy
- DynamoDB tables are created with on-demand billing by default
