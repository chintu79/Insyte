def select_best_regression_model(results):

    best_model = None
    best_score = -float("inf")

    for model_name, metrics in results.items():

        if metrics["r2"] > best_score:
            best_score = metrics["r2"]
            best_model = model_name

    return best_model


def select_best_classification_model(results):

    best_model = None
    best_score = -float("inf")

    for model_name, metrics in results.items():

        if metrics["accuracy"] > best_score:
            best_score = metrics["accuracy"]
            best_model = model_name

    return best_model