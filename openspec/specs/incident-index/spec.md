# Capability: Incident Index

## Purpose

Mantener un registro estructurado y consultable de los incidentes ingeridos, garantizando acceso rápido, agregados consistentes y retención controlada.

## Overview

Responsable de transformar registros validados en entidades consultables: almacena datos estructurados en DynamoDB, calcula agregados para el mapa/tabla, y garantiza consultas rápidas y consistentes bajo SLAs definidos.

## Requirements

### Requirement: Normalized Storage

Cada registro válido SHALL persistirse en la tabla DynamoDB `reports` con clave primaria `report_id` y atributos mínimos `country_iso`, `country_name`, `category`, `timestamp`, `title`, `url`, `record_count`, `relevance`, `doc_path`, `ingest_timestamp`, `source_file`.

#### Scenario: Successful write

- **WHEN** la Lambda de ingestión valida un registro
- **THEN** inserta el documento en DynamoDB con TTL opcional y confirma que la escritura no exceda 100 ms P95.

#### Scenario: Duplicate report_id

- **WHEN** llega un registro con `report_id` existente
- **THEN** se sobrescribe solo si `force_update=true`, de lo contrario se ignora y se agrega al resumen de duplicados.

### Requirement: Indexing & Query Patterns

La tabla MUST exponer índices secundarios globales (GSI) para consultas por país y categoría: `GSI_country` (`country_iso`, sort `timestamp`) y `GSI_category` (`category`, sort `timestamp`).

#### Scenario: Query by country and period

- **WHEN** la API solicita incidentes para `country_iso=ES` entre dos fechas
- **THEN** la consulta usa `GSI_country` y filtra por rango temporal, respondiendo ≤2s P95 para ≤30k items.

#### Scenario: Category trend

- **WHEN** se consulta por categoría `Seguridad Física`
- **THEN** `GSI_category` devuelve los registros ordenados por `timestamp` y permite paginación basada en `LastEvaluatedKey`.

### Requirement: Aggregated Datasets

El sistema SHALL generar agregados diarios en S3 `analytics/` (GeoJSON o Parquet) con recuentos por país y categoría para alimentar el mapa y barras.

#### Scenario: GeoJSON generation

- **WHEN** finaliza la ingestión de un CSV diario
- **THEN** se crea/actualiza `analytics/date=YYYY-MM-DD/geo.json` con cada país, categoría y `record_count`, firmando el archivo para lectura pública limitada.

#### Scenario: Rebuild aggregates

- **WHEN** se reprocesa un CSV histórico
- **THEN** el pipeline recalcula los agregados afectados y versiona el archivo previo en `analytics/archive/`.

### Requirement: SLA & Consistency

Los datos MUST estar disponibles en ≤15 minutos tras cada ingestión y mantener consistencia eventual entre DynamoDB y archivos agregados.

#### Scenario: Late data arrival

- **WHEN** un CSV llega después de la ventana diaria
- **THEN** se procesa igualmente y se registra un evento `late_ingest=true` para el monitoreo.

#### Scenario: DynamoDB throttling

- **WHEN** se detecta `ProvisionedThroughputExceeded`
- **THEN** se activa auto-scaling para RCUs/WCUs y se emite alerta `IncidentIndexThrottling`.

### Requirement: Data Retention & Lifecycle

La plataforma MUST implementar retención mínima de 12 meses con políticas: S3 `analytics` pasa a IA a los 90 días y a Glacier al año, DynamoDB habilita PITR y opcionalmente TTL para datos >24 meses.

#### Scenario: PITR restore

- **WHEN** se necesita restaurar la tabla a un punto del último mes
- **THEN** el equipo puede iniciar DynamoDB PITR y restaurar en tabla de staging antes de cortar tráfico.

#### Scenario: Lifecycle verification

- **WHEN** una política expira un objeto en Glacier
- **THEN** se registra auditoría en CloudWatch Logs confirmando borrado para cumplimiento.
