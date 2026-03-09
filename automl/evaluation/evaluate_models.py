from sklearn.metrics import (
    mean_squared_error,
    r2_score,
    accuracy_score,
    f1_score
)


def evaluate_regression(models, X_test, y_test):

    results = {}

    for name, model in models.items():

        preds = model.predict(X_test)

        mse = mean_squared_error(y_test, preds)
        r2 = r2_score(y_test, preds)

        results[name] = {
            "mse": mse,
            "r2": r2
        }

    return results


def evaluate_classification(models, X_test, y_test):

    results = {}

    for name, model in models.items():

        preds = model.predict(X_test)

        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average="weighted")

        results[name] = {
            "accuracy": acc,
            "f1_score": f1
        }

    return results