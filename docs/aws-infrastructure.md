# AWS Infrastructure

Services created:

- Cognito (authentication)
- RDS PostgreSQL + PostGIS
- S3 bucket (media storage)
- Lambda backend
- API Gateway

Architecture:

React / React Native
        ↓
      Cognito
        ↓
     API Gateway
        ↓
       Lambda
      /     \
PostgreSQL   S3