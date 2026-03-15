from .data_split.split_data import split_data
from .models.regression_models import get_regression_models
from .models.classification_models import get_classification_models
from .training.train_models import train_models
from .evaluation.evaluate_models import evaluate_regression, evaluate_classification
from .selection.select_best_model import select_best_regression_model, select_best_classification_model


def run_automl(df, target_column, problem_type):
    X_train, X_test, y_train, y_test = split_data(df, target_column)
    if problem_type == "regression":
        models = get_regression_models()
        trained_models, training_time_sec = train_models(models, X_train, y_train)
        results = evaluate_regression(trained_models, X_test, y_test)
        best_model = select_best_regression_model(results)
    else:
        models = get_classification_models()
        trained_models, training_time_sec = train_models(models, X_train, y_train)
        results = evaluate_classification(trained_models, X_test, y_test)
        best_model = select_best_classification_model(results)
    return {
        "best_model": best_model,
        "metrics": results,
        "trained_models": trained_models,
        "training_time_sec": training_time_sec,
    }


def build_leaderboard(problem_type, metrics, training_time_sec):
    leaderboard = []
    for model_name, m in (metrics or {}).items():
        row = {
            "model_name": model_name,
            "training_time_sec": (training_time_sec or {}).get(model_name),
            "accuracy": None, "precision": None, "recall": None, "f1_score": None,
            "r2": None, "rmse": None, "mse": None,
        }
        if problem_type == "regression":
            row["r2"] = m.get("r2")
            row["rmse"] = m.get("rmse")
            row["mse"] = m.get("mse")
        else:
            row["accuracy"] = m.get("accuracy")
            row["precision"] = m.get("precision")
            row["recall"] = m.get("recall")
            row["f1_score"] = m.get("f1_score")
        leaderboard.append(row)
    return leaderboard
