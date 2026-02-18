# Capability: Analytics UI

## Overview

Aplicación web interna que muestra incidentes en un mapa interactivo y tabla paginada, con filtros por periodo, país y categoría. Debe ser responsiva, segura y reflejar datos en ≤15 minutos tras la ingesta.

## Requirements

### Requirement: Period Selection

La UI MUST ofrecer selector de periodo con presets (Últimas 24h, 7 días, 30 días) y rango personalizado dentro de los últimos 90 días.

#### Scenario: Preset selection

- **WHEN** el usuario elige "Últimas 24h"
- **THEN** la UI consulta `/map-aggregates` y `/reports` con `start_ts=now-24h` y actualiza mapa/tabla simultáneamente.

#### Scenario: Invalid custom range

- **WHEN** se selecciona un rango >90 días
- **THEN** se muestra error no bloqueante y se mantiene el rango previo.

### Requirement: Map Visualization

El mapa SHALL usar Google Maps o Mapbox, mostrar clusters por país con colores según categoría dominante y permitir tooltip con recuentos.

#### Scenario: Hover country

- **WHEN** el usuario pasa el cursor sobre un país
- **THEN** aparece tooltip con `country_name`, recuento total y breakdown por categoría.

#### Scenario: Drill-down click

- **WHEN** se hace click en un país/clúster
- **THEN** la tabla se filtra automáticamente por ese país manteniendo el periodo seleccionado.

### Requirement: Table Listing

La tabla MUST mostrar columnas `Category`, `Title`, `URL`, `Record Count`, `Timestamp` y soportar paginación de 25 filas.

#### Scenario: External link behavior

- **WHEN** se hace click en `URL`
- **THEN** se abre en nueva pestaña con atributo `rel="noopener"` y se registra evento de auditoría.

#### Scenario: Sorting

- **WHEN** se ordena por `Record Count`
- **THEN** la UI solicita `/reports?sort=record_count&order=desc` y refleja el orden en todas las páginas.

### Requirement: Document Access

Cada fila con `doc_path` válido MUST ofrecer botón "Ver documento" que obtenga URL firmada con expiración ≤15 minutos.

#### Scenario: Successful download

- **WHEN** el usuario pulsa "Ver documento"
- **THEN** se llama a `/documents/{report_id}` y, si la URL firmada existe, se abre en nueva pestaña; si falta, se muestra toast "Documento no disponible".

### Requirement: Performance & Responsiveness

La UI SHALL cargar en ≤3 s en desktop (P95) y ser usable en pantallas ≥360 px. Debe cachear la última respuesta para cambios de filtro rápidos (<300 ms re-render).

#### Scenario: Mobile layout

- **WHEN** el ancho es <600 px
- **THEN** la tabla pasa a formato cards y el mapa ocupa ancho completo encima.

#### Scenario: Throttled network

- **WHEN** la llamada a `/map-aggregates` supera 2 s
- **THEN** se muestra spinner y mensaje "Actualizando datos" hasta completar o fallar.

### Requirement: Access Control UI

La SPA ONLY SHALL cargarse si el usuario tiene sesión Cognito válida; de lo contrario se redirige al login o se muestra mensaje de acceso restringido.

#### Scenario: Expired token

- **WHEN** el JWT expira durante la sesión
- **THEN** la UI limpia storage, muestra aviso y redirige a login preservando la ruta deseada en query `redirect=`.
