# Capability: Data Ingestion

## Purpose

Garantizar que los CSV y documentos provenientes del scraping se carguen de forma controlada, validada y trazable antes de alimentar los motores de consulta.

## Overview

Ingesta diaria de archivos CSV (y documentos adjuntos) generados por un pipeline de scraping externo. Garantiza que solo datos válidos y completos se almacenen en S3 y se transformen en registros normalizados listos para indexación y consulta.

## Requirements

### Requirement: CSV Upload Handling

Los Productores MUST poder cargar un archivo CSV por día que contenga hasta 100 registros siguiendo convención `/raw/{country}/{category}/YYYY/MM/DD/source.csv`.

#### Scenario: Successful upload

- **WHEN** un Productor sube un CSV con cabeceras válidas y tamaño ≤10 MB
- **THEN** el archivo se guarda en `reports-raw` bajo la ruta especificada y se dispara el pipeline de validación.

#### Scenario: Duplicate submission same day

- **WHEN** se sube un CSV con mismo `source_file` en la misma fecha
- **THEN** el sistema MUST rechazarlo a menos que incluya bandera `force_update=true` en metadatos, registrando el evento y notificando al Productor.

### Requirement: Schema Validation

Cada CSV MUST usar codificación UTF-8, delimitador `,` y contener columnas obligatorias `id,timestamp,country_iso,country_name,category,title,url,record_count,relevance_level,doc_path(optional)`.

#### Scenario: Missing columns

- **WHEN** falta alguna columna obligatoria
- **THEN** la Lambda de ingestión marca el archivo como inválido, mueve el CSV a `/rejected/` y envía alerta por email/Slack con detalle del error.

#### Scenario: Invalid country code

- **WHEN** `country_iso` no coincide con ISO-3166 alfa-2
- **THEN** el registro se descarta antes de insertar en DynamoDB y se agrega a un reporte de errores agregado.

### Requirement: Metadata Enrichment

El pipeline MUST normalizar categorías, generar `report_uuid` único y adjuntar `ingest_timestamp` y `source_file` a cada registro.

#### Scenario: Missing optional doc_path

- **WHEN** un registro no incluye `doc_path`
- **THEN** se conserva el enlace `url` original y el campo se marca como `null` sin bloquear la ingestión.

#### Scenario: Category normalization

- **WHEN** la categoría no está en la lista maestra (`Seguridad Física`, `General`, `Ruido/No relevante`, `Regulatorio`)
- **THEN** el sistema MUST almacenar la fila bajo `General` y registrar advertencia para revisión manual.

### Requirement: Attachments Storage

Los documentos asociados (PDF/imagen) MUST guardarse en `reports-docs` con convención `/documents/{country}/{category}/{YYYY}/{MM}/{DD}/{report_uuid}.{ext}` y cifrado SSE-KMS.

#### Scenario: Attachment upload success

- **WHEN** un Productor sube un adjunto firmado y su hash coincide con el metadato enviado
- **THEN** el archivo se almacena y se referencia desde el registro correspondiente.

#### Scenario: Attachment missing

- **WHEN** `doc_path` apunta a objeto inexistente en S3
- **THEN** el pipeline MUST marcar el registro como `document_status=missing` y la API no debe ofrecer descarga hasta que se resuelva.

### Requirement: Notifications & Monitoring

El sistema MUST emitir métricas en CloudWatch (archivos procesados, registros válidos, errores) y enviar notificaciones en fallos críticos.

#### Scenario: Validation failure alerts

- **WHEN** >5 % de registros de un CSV se descartan
- **THEN** se envía alerta a SOC vía SES/SNS con detalles del lote y se mantiene el CSV en `/raw/` para re-proceso manual.

#### Scenario: Daily completeness check

- **WHEN** no se recibe CSV antes de las 12:00 UTC del día siguiente
- **THEN** se dispara alarma `MissingDailyCSV` para que el equipo contacte al proveedor de scraping.
