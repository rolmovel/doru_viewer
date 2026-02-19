## Why

Necesitamos pasar de las especificaciones aprobadas a una plataforma funcional mínima que permita ingerir CSVs diarios, indexarlos y mostrarlos en la UI interna bajo controles de seguridad básicos.

## What Changes

- Provisionar la infraestructura AWS descrita en las capabilities (`data-ingestion`, `incident-index`, `analytics-ui`, `secure-access`, `observability-comms`, `infra-terraform`).
- Implementar pipeline de ingestión (S3 + Lambda + DynamoDB) y generación de agregados en S3.
- Implementar la SPA inicial con mapa/tabla y acceso a documentos firmados.
- Configurar seguridad básica (Cognito + usuarios de ingestión) y observabilidad con métricas/alertas.

## Impact

- Afecta specs: `data-ingestion`, `incident-index`, `analytics-ui`, `secure-access`, `observability-comms`, `infra-terraform`.
- Afecta código/infra: Terraform/CDK, Lambdas de ingestión y API, frontend SPA, configuraciones de seguridad y monitoreo.
