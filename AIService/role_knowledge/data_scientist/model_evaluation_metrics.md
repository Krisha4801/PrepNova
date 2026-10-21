# Data Science: Model Evaluation Metrics, Validation, and Explainability

## Classification Evaluation Metrics
- Confusion Matrix: True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN).
- Accuracy: $(TP + TN) / Total$. Highly misleading in imbalanced datasets (e.g., fraud detection at 99.9% negative class).
- Precision: $TP / (TP + FP)$. Critical when cost of False Positives is severe (e.g., spam filtering, content takedown).
- Recall (Sensitivity): $TP / (TP + FN)$. Critical when cost of False Negatives is severe (e.g., cancer diagnosis, fraud detection).
- F1-Score: Harmonic mean of precision and recall; $F_\beta$ scores for weighted precision/recall trade-offs.
- ROC-AUC: Receiver Operating Characteristic Area Under Curve; threshold-independent measure of classifier discrimination.
- PR-AUC: Precision-Recall Area Under Curve; preferred over ROC-AUC for severe class imbalances.

## Regression Metrics
- Mean Absolute Error (MAE): robust to outliers, linear penalty.
- Mean Squared Error (MSE) and Root Mean Squared Error (RMSE): penalizes large errors quadratically.
- $R^2$ (Coefficient of Determination) and Adjusted $R^2$: proportion of variance explained by model predictors.

## Model Explainability (XAI)
- SHAP (SHapley Additive exPlanations): game-theoretic approach providing local and global feature attribution.
- LIME (Local Interpretable Model-agnostic Explanations): building local linear surrogate approximations around predictions.
