# Data Science: Machine Learning Foundations and Algorithms

## Core Machine Learning Taxonomy
- Supervised Learning:
  - Regression: Linear Regression, Ridge (L2), Lasso (L1 regularization), Polynomial Regression.
  - Classification: Logistic Regression, Decision Trees, Random Forests, Gradient Boosted Decision Trees (XGBoost, LightGBM, CatBoost), Support Vector Machines (SVM).
- Unsupervised Learning:
  - Clustering: K-Means (Elbow method, Silhouette score), DBSCAN (density-based clustering), Hierarchical clustering.
  - Dimensionality Reduction: Principal Component Analysis (PCA), t-SNE, UMAP for visualization and feature compression.
- Semi-Supervised and Self-Supervised Learning: contrastive learning, masked autoencoders, pseudo-labeling.

## Feature Engineering and Preprocessing
- Missing Value Imputation: mean/median, KNN imputation, multiple imputation by chained equations (MICE).
- Categorical Encoding: One-Hot Encoding, Ordinal Encoding, Target / Mean Encoding with out-of-fold regularization to avoid target leakage.
- Numerical Transformations: Standard Scaler (z-score), Min-Max Normalization, Box-Cox or Log transforms for skewed distributions.
- Feature Selection: Recursive Feature Elimination (RFE), feature importance via tree split gains or SHAP values.

## The Bias-Variance Trade-off
- High Bias (Underfitting): model fails to capture underlying patterns; addressed by increasing model complexity, adding polynomial features, reducing regularization.
- High Variance (Overfitting): model learns noise in training data; addressed by cross-validation, pruning trees, increasing regularization, gathering more data, or ensemble bagging.
