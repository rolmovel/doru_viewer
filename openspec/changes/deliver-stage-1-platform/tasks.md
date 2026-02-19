## 1. Implementation Tasks

### 1.1 Infrastructure Foundation
- [ ] 1.1.1 Crear estructura de módulos Terraform (`modules/s3_bucket`, `modules/lambda`, `modules/api_gateway`, `modules/dynamodb`, `modules/cognito`, `modules/cloudfront`)
- [ ] 1.1.2 Configurar backend remoto de estado Terraform (S3 + DynamoDB lock)
- [ ] 1.1.3 Implementar stack `envs/dev` con todos los componentes base
- [ ] 1.1.4 Crear guía de despliegue en `docs/infra/deploy.md`

### 1.2 Data Ingestion Pipeline
- [ ] 1.2.1 Implementar Lambda de validación de CSV (schema, encoding, columnas)
- [ ] 1.2.2 Configurar S3 triggers para `reports-raw` bucket
- [ ] 1.2.3 Implementar Lambda de normalización y escritura a DynamoDB
- [ ] 1.2.4 Crear Lambda de generación de agregados GeoJSON en `analytics/`
- [ ] 1.2.5 Configurar SQS/SNS para notificaciones de fallos

### 1.3 API Layer
- [ ] 1.3.1 Implementar API Gateway con endpoints:
  - `/map-aggregates` - GeoJSON para el mapa
  - `/reports` - Listado paginado con filtros
  - `/documents/{report_id}` - Generación de URLs firmadas
- [ ] 1.3.2 Implementar Lambdas de API con validación de JWT Cognito
- [ ] 1.3.3 Configurar CORS y throttling en API Gateway

### 1.4 Frontend SPA
- [ ] 1.4.1 Configurar proyecto React/TypeScript base
- [ ] 1.4.2 Implementar autenticación Cognito (login/logout)
- [ ] 1.4.3 Crear componente de selector de periodo (24h, 7d, 30d, custom)
- [ ] 1.4.4 Integrar mapa (Google Maps/Mapbox) con clusters y tooltips
- [ ] 1.4.5 Implementar tabla paginada con ordenación
- [ ] 1.4.6 Añadir botón "Ver documento" con descarga firmada
- [ ] 1.4.7 Configurar build y despliegue a S3/CloudFront

### 1.5 Security Configuration
- [ ] 1.5.1 Configurar Cognito User Pool básico
- [ ] 1.5.2 Crear usuarios IAM de ingestión para proveedores
- [ ] 1.5.3 Configurar WAF/IP allowlist para restricción de red
- [ ] 1.5.4 Verificar políticas S3 (privado, SSE-KMS, no ACL público)

### 1.6 Observability Setup
- [ ] 1.6.1 Configurar CloudWatch dashboards (ingesta, API, DynamoDB)
- [ ] 1.6.2 Crear alarmas: CSV faltante, throttling, errores >2%
- [ ] 1.6.3 Configurar SNS topics para notificaciones SOC
- [ ] 1.6.4 Implementar métricas custom en Lambdas
- [ ] 1.6.5 Crear runbook básico `docs/runbooks/missing-csv.md`

## 2. Testing Tasks

- [ ] 2.1 Validar ingestión de CSV de prueba (~10 registros)
- [ ] 2.2 Verificar aparición de datos en DynamoDB y agregados S3
- [ ] 2.3 Probar endpoints API con tokens válidos/inválidos
- [ ] 2.4 Validar flujo completo: login → mapa → tabla → descarga documento
- [ ] 2.5 Verificar alarmas CloudWatch (simular errores)

## 3. Documentation Tasks

- [ ] 3.1 Completar `docs/infra/deploy.md` con comandos exactos
- [ ] 3.2 Crear `docs/runbooks/missing-csv.md`
- [ ] 3.3 Documentar estructura de CSV esperado para proveedores
- [ ] 3.4 Crear guía de usuario básica para analistas

## 4. Deployment Tasks

- [ ] 4.1 Ejecutar `terraform plan` en dev y revisar
- [ ] 4.2 Aplicar infraestructura dev (`terraform apply`)
- [ ] 4.3 Desplegar SPA a dev
- [ ] 4.4 Validar funcionamiento end-to-end en dev
- [ ] 4.5 Promocionar a prod (con aprobación manual)
