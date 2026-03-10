# Architecture

Frontend:
- apps/web (Next.js)
- apps/mobile (Expo React Native)

Shared packages:
- @repo/auth
- @repo/api
- @repo/core
- @repo/config
- @repo/ui

Backend:
- Cognito
- API Gateway
- Lambda
- PostgreSQL (RDS + PostGIS)
- S3