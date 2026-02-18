# Project Context

## Purpose

Centralizar y consultar incidentes/noticias de seguridad recopilados por scraping externo. Los registros llegan en CSV diarios (~100 entradas) y deben almacenarse en AWS para su consulta segura mediante una aplicación web con mapa y tabla filtrable.

## Tech Stack

- AWS serverless: S3, Lambda, DynamoDB, EventBridge, API Gateway, CloudFront, Cognito, CloudWatch, SES/SNS.
- Frontend SPA (React/TypeScript) servida desde S3 + CloudFront.
- Diagrams generados con Python `diagrams` + Graphviz para documentación.

## Project Conventions

### Code Style

- JavaScript/TypeScript: ESLint + Prettier default, camelCase para variables, PascalCase para componentes.
- Infra/Terraform/CDK: snake_case para recursos, comentarios breves solo cuando no sea autoexplicativo.
- Markdown: encabezados numerados cuando aplique, tablas rodeadas por líneas en blanco, escenarios siempre con `#### Scenario:`.

### Architecture Patterns

- Ingesta orientada a eventos: S3 → Lambda → DynamoDB.
- API BFF ligero (Lambda + API Gateway) que expone endpoints REST y genera URLs firmadas.
- Datos analíticos precalculados (JSON/Parquet) para mapas.
- CloudFront + Cognito como perímetro; opción de VPN/IP allowlist según seguridad corporativa.

### Testing Strategy

- Pendiente de implementación. Objetivo: pruebas unitarias para Lambdas (Jest/Pytest según lenguaje) y smoke tests para ingestión/API. Validaciones automáticas de CSV en pipeline.

### Git Workflow

- Branch principal `main`. Para cada change: rama `feature/<change-id>` asociada a propuesta OpenSpec. PR obligatorio con revisión antes de merge.

## Domain Context

- Categorías iniciales: Seguridad Física, General, Ruido/No relevante, Regulatorio.
- Cada registro debe incluir país (ISO-3166), título, URL origen, recuento de casos y relevancia.
- Usuarios principales: analistas internos; acceso restringido (SSO/VPN).

## Important Constraints

- Sin OCR: datos provienen de CSV filtrados manualmente.
- SLA de disponibilidad consulta ≥99%, respuesta API ≤2s P95.
- Retención mínima 1 año, cifrado en reposo (SSE-KMS) y en tránsito.
- Cumplir políticas corporativas de red (posible VPN obligatoria).

## External Dependencies

- Google Maps / Mapbox para visualización (según licencia final).
- Fuentes de scraping externas (RSS/noticieros) → pipeline ajeno entrega CSV.
- Servicios de notificación SOC (email/Slack) integrados vía SES/SNS.
