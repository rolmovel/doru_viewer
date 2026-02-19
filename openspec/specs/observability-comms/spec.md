# Capability: Observability & Communications

## Purpose

Establecer la cobertura mínima de métricas, alertas y comunicación operativa para detectar fallos en la ingesta, almacenamiento y UI.

## Overview

Define métricas, alertas y notificaciones para la ingesta, almacenamiento y UI. Abarca CloudWatch, SNS/SES/Slack, dashboards y runbooks básicos para responder a incidentes operativos.

## Requirements

### Requirement: Metrics Coverage

Todas las Lambdas y APIs MUST reportar métricas clave: duración, recuento de invocaciones, errores, registros procesados y porcentaje de descartes.

#### Scenario: Ingest metrics

- **WHEN** se procesa un CSV
- **THEN** la Lambda publica métricas `RecordsValid`, `RecordsRejected`, `ProcessingLatency` y etiqueta `source_file`.

#### Scenario: API latency

- **WHEN** `/reports` responde >2 s (P95)
- **THEN** se incrementa métrica `SlowResponses` para monitoreo y se anota en CloudWatch Logs.

### Requirement: Dashboards

El equipo SHALL mantener dashboard CloudWatch con widgets para ingesta, DynamoDB, API y uso de Cognito. Debe incluir mapa de calor diario de CSV recibidos y carta de latencia.

#### Scenario: Dashboard availability

- **WHEN** se despliega un nuevo entorno
- **THEN** se replica el dashboard vía IaC y se comparte enlace con el SOC.

### Requirement: Alert Policies

Alertas MUST cubrir: faltante de CSV diario, tasa de error API >2%, DynamoDB throttling, KMS failures y almacenamiento >80% de cuota prevista.

#### Scenario: Missing CSV alert

- **WHEN** no hay `RecordsValid` para una fecha antes de 12:00 UTC
- **THEN** se envía alerta `MissingDailyCSV` por SNS (correo + Slack) con instrucciones de contacto.

#### Scenario: Throttling alert

- **WHEN** DynamoDB registra `ProvisionedThroughputExceeded > 5/min`
- **THEN** se dispara alarma `IncidentIndexThrottling` y se crea ticket automático.

### Requirement: Notification Channels

Todas las alertas críticas SHALL entregarse por SES (email SOC) y Slack Webhook; advertencias menores pueden ser solo email.

#### Scenario: Multi-channel delivery

- **WHEN** falla la entrega por Slack
- **THEN** SNS reintenta y marca el evento; si persiste, se envía SMS opcional al on-call.

### Requirement: Runbook References

Cada alerta SHALL enlazar a un runbook con pasos de diagnóstico (ubicado en `docs/runbooks/`).

#### Scenario: On-call response

- **WHEN** llega alerta `MissingDailyCSV`
- **THEN** el mensaje incluye link `docs/runbooks/missing-csv.md` con pasos para revisar S3 y contactar proveedor.

### Requirement: Logging & Retention

Logs de ingestión y API MUST mantenerse 30 días en CloudWatch y exportarse semanalmente a S3 Glacier para retención anual.

#### Scenario: Export job

- **WHEN** es domingo 00:00 UTC
- **THEN** se ejecuta job automatizado que exporta logs de la última semana a `logs-archive/` y reporta éxito/fallo.
