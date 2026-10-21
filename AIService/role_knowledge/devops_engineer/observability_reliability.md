# DevOps: Observability, SRE Practices, and Incident Response

## Three Pillars of Observability
1. Metrics: numeric timeseries data (counters, gauges, histograms) aggregated via Prometheus / VictoriaMetrics. PromQL querying, alert manager routing.
2. Logs: structured JSON logs aggregated into centralized systems (Elasticsearch/Logstash/Kibana, Loki, OpenSearch). Correlation IDs across services.
3. Distributed Tracing: OpenTelemetry (OTel) instrumentation, spans, trace context propagation (W3C TraceContext headers), visualizing distributed bottlenecks in Jaeger or Datadog.

## Site Reliability Engineering (SRE) Principles
- Service Level Indicators (SLIs): quantifiable metrics of service behavior (e.g., HTTP request latency < 200ms, error rate < 0.01%).
- Service Level Objectives (SLOs): target percentage over time (e.g., 99.9% success rate over a rolling 30-day window).
- Service Level Agreements (SLAs): contractual obligations with customers accompanied by financial penalties.
- Error Budgets: remaining allowable unreliability (100% - SLO) used to balance rapid feature deployment against stability investments.

## Chaos Engineering and Disaster Recovery
- Chaos Engineering: injecting network delays, pod failures, packet loss in staging/production (Chaos Mesh, LitmusChaos) to validate resilience.
- Recovery Point Objective (RPO) and Recovery Time Objective (RTO): measuring allowable data loss and downtime during catastrophic outages.
