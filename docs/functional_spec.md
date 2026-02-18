# Documento Funcional v1 – Plataforma de Monitoreo de Incidentes

## 1. Objetivo y alcance
Plataforma interna que consolida noticias/incidentes de seguridad provenientes de procesos de *scraping*. Los registros llegan en CSV diario (~100 filas) y deben poder consultarse en una aplicación web privada que ofrece:
- Filtro por periodo (día, semana, mes, personalizado corto).
- Mapa mundial con agregados por país y categoría.
- Tabla paginada con detalles (categoría, título, URL, recuento).
- Acceso o descarga del documento original asociado a cada fila.

Fuera de alcance v1: OCR, ingesta directa desde scraping, análisis predictivo, notificaciones.

## 2. Perfiles y autenticación
| Perfil | Descripción | Capacidades |
| --- | --- | --- |
| Productor CSV | Equipo que valida manualmente el scraping y sube el CSV diario + adjuntos. | Carga de CSV y documentos en bucket restringido S3. |
| Analista | Usuarios internos que consumen la app. | Navegar mapa/tabla, filtrar, descargar documentos. |
| Administrador | Seguridad/ops. | Ver métricas, reintentar ingestas, gestionar accesos. |

- Acceso restringido mediante Amazon Cognito (SSO corporativo) **y/o** VPN corporativa. Las llamadas públicas estarán bloqueadas en CloudFront/API Gateway.

## 3. Flujo funcional
1. **Carga CSV diaria**
   1. Productor carga `YYYYMMDD_source.csv` en S3 (`/raw/{pais}/{categoria}/`).
   2. Disparador valida cabeceras, tipos y deduplica IDs.
   3. Registros válidos se insertan en DynamoDB y se generan agregados diarios.
   4. Errores se notifican por email/Slack.
2. **Consulta Analista**
   1. Usuario se autentica via Cognito; app obtiene *JWT*.
   2. Frontend solicita `/map-aggregates?date_range=...` para renderizar mapa.
   3. Tabla consume `/reports` con filtros (país, categoría, relevancia).
   4. Al abrir un documento, el backend genera URL firmada temporal desde S3.
3. **Descarga de evidencias**
   - Documentos (PDF/imagen) residen en S3 siguiendo `/documents/{pais}/{categoria}/{fecha}/{id}.{ext}` y requieren URL firmada.

## 4. Reglas de negocio
- CSV obligatorio en UTF-8 con cabeceras: `id,timestamp,country_iso,country_name,category,title,url,record_count,relevance_level,doc_path(optional)`.
- Máx. 24h de retraso entre evento y disponibilidad en la app.
- Deduplicación por `id` + `timestamp`. Duplicados generan advertencia y se ignoran salvo bandera `force_update`.
- Categorías válidas iniciales: `Seguridad Física`, `General`, `Ruido/No relevante`, `Regulatorio`. Configurable mediante tabla DynamoDB `categories`.
- País debe ser ISO-3166 alfa-2. Se almacena además nombre amigable para UI.
- Cada registro debe apuntar a URL externa o documento interno (`doc_path`).

## 5. Requisitos no funcionales
- **Disponibilidad**: 99% mensual para consulta.
- **Escalabilidad**: Soportar ≥500 registros/día sin rediseñar arquitectura (márgenes en DynamoDB/ Lambda).
- **Rendimiento**: Respuesta API ≤2s P95 para filtros comunes.
- **Seguridad**: Cifrado en reposo (S3 SSE-KMS, DynamoDB KMS) y en tránsito (TLS 1.2+). Acceso restringido a IPs corporativas o VPN. Auditoría de descargas.
- **Trazabilidad**: Logs CloudWatch con ID de ingestión y usuario que descarga documentos.
- **Retención**: CSV y documentos mínimo 1 año; aplicar lifecycle a frío (>90 días) y Glacier (>365 días) según política.

## 6. Pendientes / decisiones abiertas
1. Definir si la VPN es obligatoria o si bastará con Cognito + WAF/IP allowlist.
2. Política de reenvío de CSV corregidos (¿se sobrescribe ID existente?).
3. Formato de `record_count` (entero vs. rango). ¿Se almacena `source_confidence`?
4. Notificaciones automáticas en caso de ingestión fallida (email, Slack, ambos?).
5. Necesidad de exportar datos (CSV/Excel) desde la app en futuras versiones.
6. Estrategia de *disaster recovery* (multi-región vs. backups).
