# Cloud Engineering: Cloud Architecture and Multi-Cloud Infrastructure

## Core Cloud Principles (AWS / GCP / Azure)
- Shared Responsibility Model: cloud provider manages hardware, virtualization, and physical security; customer manages OS configuration, network firewall rules, IAM, and data encryption.
- Multi-Availability Zone (Multi-AZ) and Multi-Region Architectures: designing for high availability (HA) and disaster recovery (DR) using Active-Active or Active-Passive failover patterns.
- High Availability Primitives: stateless application tiers behind Elastic Load Balancers (ALB, NLB), auto-scaling groups with dynamic scaling policies based on request count or CPU utilization.

## Cloud Storage Tiering
- Object Storage (S3, GCS, Azure Blob): lifecycle rules transitioning hot data to Infrequent Access (IA), Glacier, and Deep Archive. Bucket policies and cross-region replication.
- Block Storage (EBS, Persistent Disk): SSD (gp3, io2) vs HDD (st1) storage performance, IOPS vs throughput provisioning, automated snapshot lifecycles.
- Network File Systems (EFS, Filestore): distributed POSIX-compliant shared file storage for multi-instance access.
