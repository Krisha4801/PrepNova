# DevOps: Continuous Integration, Continuous Delivery, and Infrastructure as Code

## CI/CD Pipeline Architecture
- Trunk-Based Development: short-lived feature branches, automated integration tests on pull request, feature flags for decoupled releases.
- Pipeline Stages: Linting & Static Analysis -> Unit Tests -> Security Scans (SAST/DAST) -> Container Build -> Integration Tests -> Artifact Registry Push -> Progressive Deployment.
- Deployment Strategies:
  - Rolling Updates: zero-downtime gradual pod replacement.
  - Blue/Green Deployments: duplicate identical environments; traffic switchover via router/load balancer.
  - Canary Releases: routing 5% of production traffic to new version; automated rollback if error rates breach threshold (using Argo Rollouts / Flagger).
- GitOps: declarative state stored in Git repository as the single source of truth; automated reconciliation loop (ArgoCD, Flux).

## Infrastructure as Code (IaC)
- Terraform / OpenTofu: declarative HCL, state management, remote backends with state locking (S3 + DynamoDB), module reusability, drift detection.
- Immutable Infrastructure vs Configuration Management: baking machine images (Packer) vs procedural configuration (Ansible, Chef).
- Cloud-Init and bootstrapping compute instances securely with least privilege IAM instance profiles.
