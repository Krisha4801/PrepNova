# Cloud Engineering: Cloud Networking, Identity (IAM), and Security

## Cloud Virtual Private Cloud (VPC) Networking
- Subnet Topology: public subnets (Internet Gateways, public ALBs) and private subnets (NAT Gateways, application instances, RDS databases).
- Route Tables & CIDR Block Planning: non-overlapping RFC 1918 private IPv4 allocations (/16 to /24 subnets).
- Network Security Layers:
  - Security Groups: stateful firewall rules evaluated at the network interface level.
  - Network Access Control Lists (NACLs): stateless subnet-level rule evaluation (allow/deny rules).
  - VPC Peering, Transit Gateways, and Direct Connect / VPN for hybrid enterprise connectivity.

## Identity and Access Management (IAM)
- Principle of Least Privilege: granting minimal required action and resource access (`Action: [s3:GetObject], Resource: [arn:aws:s3:::my-bucket/*]`).
- Roles vs Users vs Service Accounts: eliminating static long-lived credentials in favor of short-lived STS tokens, IRSA (IAM Roles for Service Accounts in EKS), and instance profiles.
- Permission Boundaries and Service Control Policies (SCPs) in AWS Organizations.
