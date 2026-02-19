# Capability: Secure Access

## Purpose

Definir el mínimo control de identidad y seguridad necesario para que analistas y proveedores accedan al sistema de forma segura sin gestión compleja de roles.

## Overview

Garantiza que solo usuarios autorizados puedan cargar CSV y acceder a la aplicación web. Incluye autenticación Cognito, soporte para VPN/IP allowlist, políticas de S3/KMS, generación de URLs firmadas y auditoría de descargas.

## Requirements

### Requirement: Web Authentication

Los usuarios de la aplicación web MUST autenticarse mediante Amazon Cognito (o IdP corporativo equivalente) antes de cargar el bundle. No se requieren roles complejos, solo verificación de identidad y pertenencia a la organización.

#### Scenario: Successful login

- **WHEN** un analista inicia sesión con credenciales válidas
- **THEN** Cognito emite tokens JWT básicos que permiten acceder a la SPA y consumir APIs.

#### Scenario: Access from unauthorized network

- **WHEN** la petición proviene de IP fuera de la VPN/allowlist
- **THEN** CloudFront/WAF rechaza la solicitud con `403` antes de llegar a la SPA/API.

### Requirement: Ingestion Credentials

La carga de CSVs SHALL realizarse mediante usuarios de plataforma (IAM Users o Service Accounts) con permisos mínimos sobre los buckets necesarios. Alta/baja de estos usuarios se gestionará manualmente.

#### Scenario: Provision ingestion user

- **WHEN** se incorpora un nuevo proveedor de scraping
- **THEN** se crea un usuario IAM con permisos `s3:PutObject` sobre `reports-raw`/`reports-docs` y se entrega credencial fuera de banda.

#### Scenario: Credential rotation

- **WHEN** las credenciales cumplen 90 días
- **THEN** se generan nuevas claves, se revocan las anteriores y se comunica al proveedor.

### Requirement: Presigned Document URLs

Las descargas de documentos internos MUST usarse mediante URLs firmadas de S3 con expiración ≤15 minutos y acceso restringido a objetos cifrados SSE-KMS.

#### Scenario: URL generation success

- **WHEN** `/documents/{report_id}` recibe solicitud válida
- **THEN** genera URL firmada con cabeceras `Content-Disposition` y la devuelve; la URL expira automáticamente.

#### Scenario: Revoked document

- **WHEN** el documento se marca como confidencial
- **THEN** `documents` endpoint no genera URL, responde `410 Gone` y notifica a seguridad.

### Requirement: Storage Security

Buckets `reports-raw`, `reports-docs`, `analytics` MUST estar privados, sin acceso público, cifrados con KMS dedicado y con CloudTrail habilitado.

#### Scenario: Public ACL attempt

- **WHEN** alguien intenta aplicar ACL pública
- **THEN** la política de bucket lo bloquea y genera evento AWS Config NonCompliant.

#### Scenario: KMS failure

- **WHEN** la clave KMS no está disponible
- **THEN** la operación falla y se dispara alarma `KMSAccessError` para intervención inmediata.

### Requirement: Audit & Session Management

El sistema SHALL registrar eventos básicos (login, descargas) en CloudWatch Logs/SIEM y soportar revocación de sesión a nivel Cognito.

#### Scenario: Logout

- **WHEN** el usuario cierra sesión
- **THEN** la SPA revoca tokens, limpia storage y notifica a Cognito para invalidar refresh tokens.

#### Scenario: Suspicious activity

- **WHEN** se detectan >5 intentos fallidos en 5 minutos
- **THEN** se bloquea temporalmente la IP y se envía alerta SOC.
