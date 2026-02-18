# Capability: Infra Terraform

## Overview

Define la infraestructura como código para desplegar la plataforma en AWS usando Terraform (preferido) o AWS CDK equivalente. Incluye módulos, variables, estados remotos y guía operativa para múltiples entornos.

## Requirements

### Requirement: Module Structure

El repositorio MUST incluir módulos reutilizables (`modules/s3_bucket`, `modules/lambda`, `modules/api_gateway`, etc.) y stacks por entorno (`envs/dev`, `envs/prod`).

#### Scenario: Module reusability

- **WHEN** se necesita crear un nuevo bucket
- **THEN** se instancia `module "s3_bucket"` con políticas KMS y logging sin duplicar código.

#### Scenario: Environment stack

- **WHEN** se despliega `envs/prod`
- **THEN** Terraform aplica módulos para todos los componentes (S3, DynamoDB, API, Cognito, CloudFront, EventBridge, CloudWatch) usando variables de entorno.

### Requirement: State Management

Terraform state SHALL almacenarse en S3 backend cifrado con DynamoDB lock para evitar `terraform apply` simultáneos.

#### Scenario: State backend init

- **WHEN** un desarrollador ejecuta `terraform init`
- **THEN** se configura backend remoto (`s3://infra-state/<env>`) y la tabla DynamoDB de locks.

### Requirement: Variables & Secrets

Variables MUST gestionarse mediante archivos `.tfvars` por entorno; secretos (p.ej. Slack webhook) se inyectan vía AWS Secrets Manager y nunca en texto plano.

#### Scenario: Missing secret

- **WHEN** falta un secreto requerido
- **THEN** el plan falla con mensaje indicando usar `aws secretsmanager put-secret-value` antes del deploy.

### Requirement: Deployment Guide

Debe existir guía `docs/infra/deploy.md` con pasos: prerequisitos (AWS CLI, Terraform >=1.6), comandos (`terraform init/plan/apply`), y rollback.

#### Scenario: First-time setup

- **WHEN** un ingeniero nuevo sigue la guía
- **THEN** puede provisionar `dev` en <30 min con instrucciones claras y comandos copy/paste.

### Requirement: CI/CD Integration

Los planes y applies SHALL ejecutarse vía pipeline (GitHub Actions o similar) con aprobaciones manuales para producción.

#### Scenario: Pull request plan

- **WHEN** se abre PR que toca infra
- **THEN** el pipeline corre `terraform plan -out=plan.tfplan` y publica resumen en el PR.

#### Scenario: Manual approval

- **WHEN** se promociona a prod
- **THEN** requiere aprobación explícita en el pipeline antes de `terraform apply`.

### Requirement: Drift Detection

Se MUST programar `terraform plan` semanal en modo read-only para detectar drift y enviar reporte al equipo.

#### Scenario: Drift found

- **WHEN** el plan detecta cambios no aplicados
- **THEN** se crea ticket con diffs y se coordina corrección.
