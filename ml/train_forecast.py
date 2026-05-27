import json
import math
import sys
from datetime import datetime

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    from sklearn.model_selection import train_test_split

    SKLEARN_AVAILABLE = True
except ModuleNotFoundError:
    SKLEARN_AVAILABLE = False


def parse_month(label):
    return datetime.strptime(label, "%b %Y")


def format_month(date):
    return date.strftime("%b %Y")


def add_months(date, months):
    month = date.month - 1 + months
    year = date.year + month // 12
    month = month % 12 + 1
    return datetime(year, month, 1)


def build_frame(records):
    frame = pd.DataFrame(records)
    frame["date"] = frame["month"].apply(parse_month)
    frame = frame.sort_values("date").reset_index(drop=True)
    frame["month_index"] = np.arange(len(frame))
    frame["calendar_month"] = frame["date"].dt.month
    frame["quarter"] = frame["date"].dt.quarter
    frame["festival_season"] = frame["calendar_month"].isin([10, 11, 12]).astype(int)
    frame["revenue_lag_1"] = frame["revenue"].shift(1).fillna(frame["revenue"].mean())
    frame["orders_lag_1"] = frame["orders"].shift(1).fillna(frame["orders"].mean())
    return frame


def metrics(y_true, y_pred):
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    denominator = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1.0 - float(np.sum((y_true - y_pred) ** 2) / denominator) if denominator else 1.0
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 3),
    }


def train_with_sklearn(frame, features):
    x = frame[features]
    y = frame["revenue"]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=42, shuffle=False
    )

    candidates = [
        ("Linear Regression", LinearRegression()),
        (
            "Random Forest Regressor",
            RandomForestRegressor(n_estimators=120, random_state=42, min_samples_leaf=2),
        ),
    ]

    trained = []
    for name, model in candidates:
        model.fit(x_train, y_train)
        prediction = model.predict(x_test)
        trained.append(
            {
                "name": name,
                "model": model,
                "metrics": {
                    "mae": round(float(mean_absolute_error(y_test, prediction)), 2),
                    "rmse": round(float(math.sqrt(mean_squared_error(y_test, prediction))), 2),
                    "r2": round(float(r2_score(y_test, prediction)), 3),
                },
            }
        )

    best = min(trained, key=lambda item: item["metrics"]["mae"])
    best["model"].fit(x, y)
    return best, len(x_train), len(x_test)


def train_with_numpy(frame, features):
    x = frame[features].to_numpy(dtype=float)
    y = frame["revenue"].to_numpy(dtype=float)
    split_index = max(3, int(len(frame) * 0.75))
    x_train = x[:split_index]
    y_train = y[:split_index]
    x_test = x[split_index:]
    y_test = y[split_index:]

    train_matrix = np.c_[np.ones(len(x_train)), x_train]
    coefficients = np.linalg.lstsq(train_matrix, y_train, rcond=None)[0]

    test_matrix = np.c_[np.ones(len(x_test)), x_test]
    prediction = test_matrix @ coefficients

    class NumpyRegressor:
        def __init__(self, fitted_coefficients):
            self.coefficients = fitted_coefficients

        def predict(self, values):
            matrix = np.c_[np.ones(len(values)), values.to_numpy(dtype=float)]
            return matrix @ self.coefficients

    return (
        {
            "name": "NumPy Linear Regression Fallback",
            "model": NumpyRegressor(coefficients),
            "metrics": metrics(y_test, prediction),
        },
        len(x_train),
        len(x_test),
    )


def forecast_future(frame, model, features, months=6):
    recent_order_growth = frame["orders"].pct_change().tail(5).mean()
    if not np.isfinite(recent_order_growth):
        recent_order_growth = 0.04

    future_rows = []
    last_date = frame.iloc[-1]["date"]
    last_revenue = float(frame.iloc[-1]["revenue"])
    last_orders = float(frame.iloc[-1]["orders"])

    for step in range(1, months + 1):
        future_date = add_months(last_date, step)
        month_number = future_date.month
        festival = 1 if month_number in [10, 11, 12] else 0
        projected_orders = round(last_orders * ((1 + recent_order_growth) ** step))
        row = {
            "month": format_month(future_date),
            "month_index": len(frame) + step - 1,
            "calendar_month": month_number,
            "quarter": ((month_number - 1) // 3) + 1,
            "festival_season": festival,
            "orders": projected_orders,
            "orders_lag_1": last_orders if step == 1 else future_rows[-1]["orders"],
            "revenue_lag_1": last_revenue if step == 1 else future_rows[-1]["revenue"],
        }
        predicted = float(model.predict(pd.DataFrame([row])[features])[0])
        seasonal_floor = row["revenue_lag_1"] * (1.05 if festival else 1.01)
        row["revenue"] = int(round(max(predicted, seasonal_floor)))
        row["type"] = "ML Forecast"
        future_rows.append(row)

    return [
        {
            "month": row["month"],
            "revenue": row["revenue"],
            "orders": int(row["orders"]),
            "type": row["type"],
        }
        for row in future_rows
    ]


def main():
    payload = json.load(sys.stdin)
    frame = build_frame(payload["monthlySales"])
    features = [
        "month_index",
        "calendar_month",
        "quarter",
        "festival_season",
        "orders",
        "orders_lag_1",
        "revenue_lag_1",
    ]

    if SKLEARN_AVAILABLE:
        trained, train_rows, test_rows = train_with_sklearn(frame, features)
        library_status = "Scikit-learn model trained successfully"
    else:
        trained, train_rows, test_rows = train_with_numpy(frame, features)
        library_status = "Scikit-learn is not installed; NumPy regression fallback used"

    forecast = forecast_future(frame, trained["model"], features)
    result = {
        "historical": [
            {
                "month": row["month"],
                "revenue": int(row["revenue"]),
                "orders": int(row["orders"]),
                "type": "Historical",
            }
            for row in frame[["month", "revenue", "orders"]].to_dict("records")
        ],
        "forecast": forecast,
        "method": (
            "Machine learning sales forecast using data preprocessing, feature engineering, "
            f"train/test split, and {trained['name']}."
        ),
        "machineLearning": {
            "enabled": True,
            "model": trained["name"],
            "libraryStatus": library_status,
            "features": features,
            "trainingRows": train_rows,
            "testingRows": test_rows,
            "metrics": trained["metrics"],
            "preprocessingSteps": [
                "Cleaned and sorted historical monthly sales records",
                "Created month index, calendar month, quarter, and festival season features",
                "Added lag features for previous revenue and previous orders",
                "Split data into training and testing sets",
                "Evaluated prediction accuracy using MAE, RMSE, and R2 score",
            ],
        },
        "insights": [
            f"ML model selected: {trained['name']} with MAE ₹{trained['metrics']['mae']:,.0f}.",
            f"Expected revenue may reach ₹{forecast[-1]['revenue']:,} by {forecast[-1]['month']}.",
            "Festival-season feature increases demand planning support for Oct-Dec sales.",
        ],
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
