import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import argparse
from src.config import load_params, MODEL_PATH
from src.db import cargar_csv_en_bd, leer_solicitudes_bd
from src.data.prepare import limpiar_y_dividir
from src.nlp.preprocess import preprocesar_serie
from src.models.train import entrenar_y_evaluar

def main():
    parser = argparse.ArgumentParser(description="Pipeline de datos y entrenamiento de Clasificador de PQRS")
    parser.add_argument("--reload-data", action="store_true", help="Recarga el CSV en PostgreSQL y fuerza reentrenamiento")
    args = parser.parse_args()

    params = load_params()
    csv_path = params["data"]["raw_csv"]

    cargar_csv_en_bd(csv_path, forzar_recarga=args.reload_data)

    if MODEL_PATH.exists() and not args.reload_data:
        print(f"El modelo ya existe en {MODEL_PATH}. Omitiendo entrenamiento.")
        return

    df = leer_solicitudes_bd()
    X_train, X_test, y_train, y_test = limpiar_y_dividir(
        df,
        test_size=params["data"]["test_size"],
        random_state=params["data"]["random_state"]
    )

    print("Procesando textos con pipeline NLP...")
    X_train_nlp = preprocesar_serie(X_train)
    X_test_nlp = preprocesar_serie(X_test)

    resultados = entrenar_y_evaluar(X_train_nlp, y_train, X_test_nlp, y_test)
    print("Métricas obtenidas:", resultados)

if __name__ == "__main__":
    main()