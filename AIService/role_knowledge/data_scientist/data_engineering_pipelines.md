# Data Science: Data Pipelines, SQL, and Feature Stores

## Data Processing Architectures
- Batch vs Streaming:
  - Batch: processing bounded datasets at scheduled intervals using Apache Spark, Polars, or DuckDB.
  - Streaming: processing unbounded real-time event streams with Apache Kafka, Apache Flink, or Faust.
- ETL (Extract, Transform, Load) vs ELT (Extract, Load, Transform): raw ingestion into cloud data lakes (S3, GCS) with transformation in modern cloud data warehouses (Snowflake, BigQuery, Databricks).

## SQL Mastery for Data Science
- Window Functions: `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LEAD()`, `LAG()`, running totals via `SUM() OVER (PARTITION BY ... ORDER BY ...)`.
- Advanced Joins: Inner, Left Outer, Full Outer, Cross Joins, Anti-Joins, and handling null-safe equality.
- Common Table Expressions (CTEs) and query optimization: indexing, partitioning, avoiding subquery duplication.

## Feature Stores and Data Drift
- Feature Store (Feast, Hopsworks): unified repository for online low-latency inference features and offline batch training features.
- Data Drift: shifts in input feature distributions $P(X)$ over time (measured via Kolmogorov-Smirnov test, Population Stability Index PSI).
- Concept Drift: shifts in statistical relationship between features and target labels $P(Y|X)$.
