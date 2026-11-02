import json
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.config import MODEL_PATH, METRICS_PATH
from src.nlp.preprocess import explicar_preprocesamiento
from src.db import guardar_prediccion

app = FastAPI(title="API Clasificador de PQRS")

modelo = None

@app.on_event("startup")
def cargar_modelo():
    global modelo
    if MODEL_PATH.exists():
        modelo = joblib.load(MODEL_PATH)

class SolicitudInput(BaseModel):
    texto: str

@app.post("/api/predict")
def predecir(datos: SolicitudInput):
    global modelo
    if modelo is None:
        if MODEL_PATH.exists():
            modelo = joblib.load(MODEL_PATH)
        else:
            raise HTTPException(status_code=503, detail="El modelo aún no está entrenado.")

    info_nlp = explicar_preprocesamiento(datos.texto)
    texto_limpio = info_nlp["texto_final"]

    prediccion = str(modelo.predict([texto_limpio])[0])
    probs = modelo.predict_proba([texto_limpio])[0]
    clases = modelo.classes_

    probabilidades = {str(c): float(p) for c, p in zip(clases, probs)}
    confianza = float(max(probs))

    try:
        guardar_prediccion(
            texto_original=datos.texto,
            texto_procesado=texto_limpio,
            tokens=info_nlp["stems"],
            prediccion=prediccion,
            confianza=confianza
        )
    except Exception as e:
        print(f"Aviso al guardar en BD: {e}")

    return {
        "prediccion": prediccion,
        "confianza": confianza,
        "probabilidades": probabilidades,
        "procesamiento_nlp": info_nlp
    }

@app.get("/api/metrics")
def leer_metricas():
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)