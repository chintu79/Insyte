from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor


def get_regression_models():
    """Return a dict of regression models to train and compare."""
    models = {
        "linear_regression":    LinearRegression(),
        "random_forest":        RandomForestRegressor(n_estimators=100, random_state=42),
        "gradient_boosting":    GradientBoostingRegressor(random_state=42),
    }
    return models