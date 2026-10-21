# Cloud Engineering: Serverless Computing, Event-Driven Architecture, and Cost Optimization

## Serverless Compute & Event-Driven Patterns
- AWS Lambda / Cloud Functions / Cloud Run: ephemeral stateless compute, cold start mitigations (provisioned concurrency), memory and timeout provisioning.
- Event Sources & Decoupling:
  - Messaging queues: Amazon SQS, Cloud Pub/Sub, dead-letter queues (DLQ), message visibility timeouts.
  - Event streaming: Amazon Kinesis, Kafka for ordered event replay and partition-level scaling.
  - Event routers: EventBridge, CloudEvents for schema discovery and event filtering.
- API Gateways: throttling, rate limiting, request validation, authentication authorizers, CORS configuration.

## Cloud Financial Management (FinOps) & Cost Control
- Compute Optimization: Compute Savings Plans, Reserved Instances, Spot Instances for fault-tolerant worker nodes.
- Storage Optimization: S3 Intelligent-Tiering, automated deletion of incomplete multipart uploads.
- Cost Monitoring & Governance: AWS Cost Explorer, Budgets with SNS alert triggers, tagging enforcement policies.
