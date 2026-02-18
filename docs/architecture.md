# Arquitectura AWS – Plataforma de Monitoreo de Incidentes (v1)

![AWS Architecture](diagrams/aws_architecture.png)

## 1. Resumen

Arquitectura serverless en AWS para ingerir CSV diarios (~100 registros) y servir una aplicación web privada. Se prioriza simplicidad y componentes administrados: S3, Lambda, DynamoDB, API Gateway, CloudFront y Cognito.

## 2. Componentes clave

| Capa | Servicios AWS | Descripción |
| --- | --- | --- |
| Ingesta | Amazon S3 (`reports-raw`, `reports-docs`) | Almacenan CSV diarios y documentos asociados siguiendo convención `/country/category/date`. |
| Procesamiento | AWS Lambda (Ingest), Amazon EventBridge, Amazon SES, Amazon CloudWatch | Lambda se activa por eventos S3, valida CSV, normaliza registros, inserta datos y genera métricas/alertas; EventBridge permite reintentos / pasos futuros; SES/CloudWatch notifican fallos. |
| Datos | Amazon DynamoDB (tabla `reports`), Amazon S3 (`analytics`) | DynamoDB guarda registros indexados (GSI por país, categoría y fecha). Agregados diarios se escriben como Parquet/JSON en S3 para mapas. |
| Acceso | Amazon Cognito, Amazon API Gateway + Lambda, Amazon CloudFront (hosting estático) | Cognito controla acceso (SSO / MFA). API Gateway expone endpoints `/reports`, `/map-aggregates`, `/documents/{id}`; CloudFront sirve la SPA y hace *edge auth* (WAF/IP allowlist). |
| Seguridad/Red | AWS WAF, AWS Client VPN / IP allowlist, AWS KMS, IAM | WAF bloquea tráfico no deseado, acceso puede restringirse a VPN corporativa o IPs; KMS cifra buckets y tabla; IAM aplica *least privilege*. |

## 3. Flujos principales

### 3.1 Ingesta CSV

1. Productor sube CSV a `reports-raw` y adjuntos a `reports-docs` (mediante consola, CLI o presigned URL).
2. Evento S3 dispara Lambda Ingest.
3. Lambda valida cabeceras (`id,timestamp,country_iso,...`), normaliza categorías y genera UUID si falta.
4. Registros válidos → DynamoDB; se calculan agregados y se guardan en `analytics/` (JSON/Parquet) para mapas.
5. Errores → CloudWatch Logs + métrica, y aviso por Amazon SES/Slack (SNS futura iteración).

### 3.2 Consulta de analistas

1. Usuario accede a SPA hospedada en CloudFront; se autentica con Cognito (o mediante VPN + IAM). Se obtiene JWT.
2. Front llama a API Gateway con JWT. Authorizer valida contra Cognito.
3. Lambda API consulta DynamoDB/GSI y devuelve resultados paginados. Para mapa, lee agregados en S3.
4. Para descargar documento, backend genera URL firmada S3 con validez corta y la devuelve al cliente.

## 4. Datos y esquemas

- **Tabla DynamoDB `reports`**
  - PK: `report_id` (string). SK opcional `ingest_date`.
  - Atributos: `country_iso`, `country_name`, `category`, `timestamp`, `title`, `url`, `record_count`, `relevance`, `doc_path`, `created_at`, `source_file`.
  - GSI1: `country_iso + timestamp`; GSI2: `category + timestamp`.
- **Agregados S3**: `analytics/date=YYYY-MM-DD/geo.json` con recuentos por país/categoría para renderizado rápido.

## 5. Seguridad

- Buckets S3 privados con SSE-KMS y políticas que permitan solo a Lambdas/API roles específicos. Bloqueo de acceso público y habilitar Access Logs.
- DynamoDB cifrado con KMS y PITR activo.
- Cognito con MFA opcional, grupos para Analistas/Admins. Alternativa: federar con IdP corporativo.
- API Gateway + WAF para throttling y bloqueo geográfico. Opcional: restringir a IPs VPN mediante header personalizado o AWS Client VPN + PrivateLink.
- CloudFront Signed Cookies/Headers para asegurar que solo usuarios autenticados acceden a SPA y recursos estáticos.
- Auditoría: CloudTrail habilitado para S3/ DynamoDB/ Cognito.

## 6. Observabilidad y operaciones

- CloudWatch Logs + Metrics para Lambda Ingest (latencia, errores, recuento registros). Alarmas SNS → email/on-call.
- DynamoDB metrics (throttles, RCUs/ WCUs). Ajustar *auto scaling* a 500 registros/día con margen x5.
- S3 Storage Lens para controlar crecimiento. Lifecycle: Standard → Infrequent Access (90d) → Glacier (365d).
- IaC recomendado: AWS CDK o Terraform con módulos por capa.

## 7. Escalabilidad y evolución

- Volumen actual (100/día) cabe en una sola Lambda + DynamoDB sin particiones. Escalado futuro: usar AWS Glue para ETL más complejo o AWS Step Functions para orquestación multi-etapa.
- Si se necesita búsqueda textual/modelo analítico, añadir Amazon OpenSearch Serverless o Athena sobre Parquet.
- DR: habilitar replicación S3 (CRR) y export periódica de DynamoDB a S3; restauración en región secundaria bajo necesidad.

## 8. Pendientes técnicos

1. Formalizar contrato CSV (cabeceras obligatorias, tipos, codificación, delimitador).
2. Definir política de reenvío/correcciones (¿se borra y reingesta?).
3. Seleccionar mecanismo de acceso seguro final (VPN obligatoria vs. Cognito + WAF/IP allowlist).
4. Reglas de retención específicas por categoría/país (compliance).
5. Notificaciones definitivas (SES, Slack, PagerDuty) y runbook de fallos.
6. Estrategia de backups para documentos grandes (Glacier Deep Archive?).

## 9. Estimación de costes (mensual, USD aprox.)

Suposiciones: 100 registros/día (≈3k/mes), CSV de 1 MB y documentos promedio 3 MB, 20 analistas con 1 GB/mes de transferencia por usuario, región `eu-west-1`. No incluye VPN corporativa ni soporte premium.

| Componente | Supuesto clave | Coste estimado |
| --- | --- | --- |
| S3 `reports-raw` + `reports-docs` | 50 GB almacenados + 5 M requests PUT/GET | ~8 USD |
| S3 `analytics` | 5 GB Parquet + 100k lecturas | ~1 USD |
| Lambda Ingest | 1 invocación/día, 1 GB-s | <1 USD |
| Lambda API | 100k invocaciones/mes, 512 MB-s | ~2 USD |
| API Gateway REST | 100k solicitudes (principalmente lectura) | ~3 USD |
| DynamoDB on-demand | 3k writes + 30k reads/mes, 5 GB almacenados | ~6 USD |
| CloudFront + S3 hosting SPA | 20 GB transferencia + 1M requests | ~5 USD |
| Cognito | 20 MAUs autenticados | <1 USD |
| CloudWatch Logs/Métricas | 2 GB ingest + 5 dashboards | ~2 USD |
| SES/SNS notificaciones | 1k emails/mes | ~1 USD |

**Total estimado v1:** ~29–30 USD/mes. Margen adicional recomendado del 30 % para picos (≈40 USD/mes). Escalando a 500 registros/día, los costes dominantes serían DynamoDB, API Gateway y transferencia CloudFront (≈+20 USD/mes adicionales).
