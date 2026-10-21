# DevOps: Containerization and Kubernetes Orchestration

## Container Fundamentals
- Docker Architecture: namespaces (PID, NET, IPC, MNT, UTS), cgroups (resource constraints: CPU, memory), layered union filesystems (OverlayFS).
- Multi-stage Docker Builds: separating compile-time dependencies from minimal production runtime images (distroless, alpine) to minimize CVE attack surfaces.
- Image Security: non-root user execution, read-only root filesystems, vulnerability scanning with Trivy/Clair.

## Kubernetes Architecture & Primitives
- Control Plane: kube-apiserver, etcd (distributed consensus store), kube-scheduler, kube-controller-manager.
- Worker Nodes: kubelet, kube-proxy, container runtime interface (CRI: containerd).
- Core Resources:
  - Pods: atomic execution unit, sidecar patterns (logging, service mesh proxies).
  - Deployments & ReplicaSets: declarative updates, rolling updates, rollbacks, surge and unavailable limits.
  - Services & Ingress: ClusterIP, NodePort, LoadBalancer; Ingress controllers (Nginx, Traefik) and Service Mesh (Istio, Linkerd) for mTLS.
  - ConfigMaps & Secrets: decoupled configuration, external secret operators (HashiCorp Vault, AWS Secrets Manager).
- Resource Management & Auto-scaling: requests vs limits, Horizontal Pod Autoscaler (HPA metrics: CPU, custom metrics), Vertical Pod Autoscaler (VPA), Cluster Autoscaler.
