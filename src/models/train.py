import json
import joblib
import numpy as np
from datetime import datetime
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    confusion_matrix,
    precision_recall_fscore_support
)

def entrenar_y_evaluar(X_train, y_train, X_test, y_test, output_dir="artifacts"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    clases_unicas = sorted(list(set(list(y_train) + list(y_test))))
    
    valores, conteos = np.unique(y_train, return_counts=True)
    clase_frecuente = str(valores[np.argmax(conteos)])

    definicion_modelos = {
        "Naive_Bayes": {
            "nombre_mostrar": "Naive Bayes multinomial",
            "configuracion": "Stemming (Snowball) · Ajustada (conserva negaciones) · Unigramas + bigramas · alpha=0.1, fit_prior=false",
            "es_baseline": False,
            "pipe": Pipeline([
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
                ("clf", MultinomialNB(alpha=0.1, fit_prior=False))
            ])
        },
        "Regresion_Logistica": {
            "nombre_mostrar": "Regresión logística",
            "configuracion": "Stemming (Snowball) · Ajustada (conserva negaciones) · Unigramas + bigramas · C=2, class_weight=balanced",
            "es_baseline": False,
            "pipe": Pipeline([
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
                ("clf", LogisticRegression(C=2.0, class_weight="balanced", max_iter=1000, random_state=42))
            ])
        },
        "Random_Forest": {
            "nombre_mostrar": "Random Forest",
            "configuracion": "Stemming (Snowball) · Ajustada (conserva negaciones) · Unigramas + bigramas · n_estimators=100",
            "es_baseline": False,
            "pipe": Pipeline([
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
                ("clf", RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42))
            ])
        },
        "Linea_Base": {
            "nombre_mostrar": "Línea base (clase más frecuente)",
            "configuracion": f"Predice siempre «{clase_frecuente.lower()}»",
            "es_baseline": True,
            "pipe": Pipeline([
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
                ("clf", DummyClassifier(strategy="most_frequent"))
            ])
        }
    }

    resultados = {}
    mejor_modelo = None
    mejor_f1_cv = -1.0
    mejor_key = ""

    for key, info in definicion_modelos.items():
        pipe = info["pipe"]
        print(f"Entrenando y evaluando: {info['nombre_mostrar']}...")
        
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1_macro")
        f1_cv_mean = float(cv_scores.mean())
        f1_cv_std = float(cv_scores.std())

        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)

        acc_test = float(accuracy_score(y_test, preds))
        f1_test = float(f1_score(y_test, preds, average="macro", zero_division=0))
        conf_matrix = confusion_matrix(y_test, preds, labels=clases_unicas).tolist()

        vectorizer = pipe.named_steps["tfidf"]
        vocab_size = len(vectorizer.vocabulary_) if hasattr(vectorizer, "vocabulary_") else 0

        prec, rec, f1_cls, sup = precision_recall_fscore_support(
            y_test, preds, labels=clases_unicas, zero_division=0
        )

        metricas_por_clase = {}
        f1_por_clase = {}
        for idx, c in enumerate(clases_unicas):
            c_str = str(c)
            f1_val = round(float(f1_cls[idx]), 6)
            f1_por_clase[c_str] = f1_val
            f1_por_clase[c_str.lower()] = f1_val
            f1_por_clase[c_str.capitalize()] = f1_val
            
            metricas_por_clase[c_str] = {
                "precision": round(float(prec[idx]), 6),
                "recall": round(float(rec[idx]), 6),
                "f1": f1_val,
                "soporte": int(sup[idx])
            }

        terminos_influyentes = {}
        clf = pipe.named_steps["clf"]
        if hasattr(vectorizer, "get_feature_names_out"):
            feature_names = vectorizer.get_feature_names_out()
            if hasattr(clf, "coef_"):
                for idx, cls_name in enumerate(clf.classes_):
                    coefs = clf.coef_[idx] if len(clf.classes_) > 2 else clf.coef_[0]
                    top_idx = np.argsort(coefs)[-12:][::-1]
                    terminos_influyentes[str(cls_name)] = [
                        {"termino": str(feature_names[i]), "peso": round(float(coefs[i]), 6)}
                        for i in top_idx
                    ]
            elif hasattr(clf, "feature_log_prob_"):
                for idx, cls_name in enumerate(clf.classes_):
                    probs = clf.feature_log_prob_[idx]
                    top_idx = np.argsort(probs)[-12:][::-1]
                    terminos_influyentes[str(cls_name)] = [
                        {"termino": str(feature_names[i]), "peso": round(float(np.exp(probs[i]) * 100), 6)}
                        for i in top_idx
                    ]

        resultados[key] = {
            "nombre_mostrar": info["nombre_mostrar"],
            "configuracion": info["configuracion"],
            "f1_macro_cv": round(f1_cv_mean, 6),
            "cv_std": round(f1_cv_std, 6),
            "accuracy_test": round(acc_test, 6),
            "f1_macro_test": round(f1_test, 6),
            "vocab_size": int(vocab_size),
            "f1_por_clase": f1_por_clase,
            "metricas_por_clase": metricas_por_clase,
            "matriz_confusion": conf_matrix,
            "clases": [str(c) for c in clases_unicas],
            "terminos_influyentes": terminos_influyentes
        }

        if not info["es_baseline"] and f1_cv_mean > mejor_f1_cv:
            mejor_f1_cv = f1_cv_mean
            mejor_modelo = pipe
            mejor_key = key

   
    pipe_unigramas = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 1), max_features=10000)),
        ("clf", LogisticRegression(C=2.0, class_weight="balanced", max_iter=1000, random_state=42))
    ])
    score_uni = float(cross_val_score(pipe_unigramas, X_train, y_train, cv=cv, scoring="f1_macro").mean())
    score_bi = resultados["Regresion_Logistica"]["f1_macro_cv"]
    
    pipe_sin_sub = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=2000)),
        ("clf", LogisticRegression(C=1.0, max_iter=1000, random_state=42))
    ])
    score_alt = float(cross_val_score(pipe_sin_sub, X_train, y_train, cv=cv, scoring="f1_macro").mean())

    def armar_comparacion(opciones):
        max_val = max(o["valor"] for o in opciones)
        lista = []
        for o in opciones:
            diff_pts = round((o["valor"] - max_val) * 100, 2)
            es_mejor = abs(o["valor"] - max_val) < 1e-6
            lista.append({
                "nombre": o["nombre"],
                "f1": round(o["valor"], 6),
                "es_mejor": es_mejor,
                "etiqueta": "mejor" if es_mejor else f"{diff_pts:+.2f} pts"
            })
        return lista

    efecto_decisiones = {
        "Lista de stop words": armar_comparacion([
            {"nombre": "Ajustada (conserva negaciones)", "valor": score_bi},
            {"nombre": "Estándar sin ajuste de pesos", "valor": score_alt}
        ]),
        "N-gramas": armar_comparacion([
            {"nombre": "Unigramas", "valor": score_uni},
            {"nombre": "Unigramas + bigramas", "valor": score_bi}
        ]),
        "Vocabulario TF-IDF": armar_comparacion([
            {"nombre": "Restringido (2000 términos)", "valor": score_alt},
            {"nombre": "Completo (hasta 10000)", "valor": score_bi}
        ]),
        "Modelo": armar_comparacion([
            {"nombre": "Regresión logística", "valor": resultados["Regresion_Logistica"]["f1_macro_cv"]},
            {"nombre": "Naive Bayes", "valor": resultados["Naive_Bayes"]["f1_macro_cv"]},
            {"nombre": "Random Forest", "valor": resultados["Random_Forest"]["f1_macro_cv"]}
        ])
    }

    joblib.dump(mejor_modelo, f"{output_dir}/model.joblib")
    
    data_final = {
        "version": datetime.now().strftime("%Y%m%d-%H%M%S"),
        "modelo_produccion": mejor_key,
        "clases": [str(c) for c in clases_unicas],
        "modelos": resultados,
        "efecto_decisiones": efecto_decisiones
    }
    
    with open(f"{output_dir}/metrics.json", "w", encoding="utf-8") as f:
        json.dump(data_final, f, indent=2, ensure_ascii=False)

    print(f"\n✅ ¡Entrenamiento completado! Modelo en producción: {mejor_key} | Vocabulario: {resultados[mejor_key]['vocab_size']}")
    return data_final