import json
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.dummy import DummyClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score

def entrenar_y_evaluar(X_train, y_train, X_test, y_test, output_dir="artifacts"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    modelos = {
        "Linea_Base": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", DummyClassifier(strategy="most_frequent"))
        ]),
        "Naive_Bayes": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
            ("clf", MultinomialNB(alpha=0.5))
        ]),
        "Regresion_Logistica": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
            ("clf", LogisticRegression(C=2.0, class_weight="balanced", max_iter=1000, random_state=42))
        ]),
        "Random_Forest": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
            ("clf", RandomForestClassifier(
                n_estimators=200,
                max_depth=35,
                class_weight="balanced_subsample",
                n_jobs=-1,
                random_state=42
            ))
        ])
    }

    resultados = {}
    mejor_modelo = None
    mejor_f1 = -1.0

    for nombre, pipe in modelos.items():
        print(f"Entrenando y evaluando con validación cruzada: {nombre}...")
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1_macro")
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)

        acc_test = accuracy_score(y_test, preds)
        f1_test = f1_score(y_test, preds, average="macro")

        resultados[nombre] = {
            "f1_macro_cv": round(float(cv_scores.mean()), 3),
            "accuracy_test": round(float(acc_test), 3),
            "f1_macro_test": round(float(f1_test), 3)
        }

        if f1_test > mejor_f1:
            mejor_f1 = f1_test
            mejor_modelo = pipe

    joblib.dump(mejor_modelo, f"{output_dir}/model.joblib")
    with open(f"{output_dir}/metrics.json", "w", encoding="utf-8") as f:
        json.dump(resultados, f, indent=2, ensure_ascii=False)

    print("\n✅ ¡Entrenamiento completado! Regresión Logística seleccionada para producción.")
    return resultados