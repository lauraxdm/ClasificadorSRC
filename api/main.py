import json
import joblib
import io
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
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
            tokens=info_nlp.get("tokens", []),
            prediccion=prediccion,
            confianza=confianza
        )
    except Exception as e:
        print(f"Aviso al guardar en BD: {e}")

    tokens_lista = info_nlp.get("tokens", [])
    stems_lista = info_nlp.get("stems", tokens_lista)

    # 3. Paso 3 (Stop words)
    conservadas = info_nlp.get("conservadas", info_nlp.get("stop_words", tokens_lista))

    # 4. Paso 4 (Stemming)
    stems_detalle = info_nlp.get("stems_detalle", {})
    if not stems_detalle:
        
        stems_detalle = {
            orig: (stems_lista[i] if i < len(stems_lista) else orig)
            for i, orig in enumerate(tokens_lista)
        }

    return {
        "prediccion": prediccion,
        "confianza": confianza,
        "probabilidades": probabilidades,
        "procesamiento_nlp": {
            "texto_original": datos.texto,
            "normalizacion": info_nlp.get("normalizacion", texto_limpio),
            "tokens": tokens_lista,
            "conservadas": conservadas,         # <--- Alimenta el paso 3 en main.jsx
            "stems_detalle": stems_detalle,     # <--- Alimenta el paso 4 en main.jsx
            "texto_final": texto_limpio
        }
    }

@app.post("/api/predict-batch")
async def predecir_lote(file: UploadFile = File(...)):
    global modelo
    if modelo is None:
        if MODEL_PATH.exists():
            modelo = joblib.load(MODEL_PATH)
        else:
            raise HTTPException(status_code=503, detail="El modelo aún no está entrenado.")

    contents = await file.read()
    filename = file.filename.lower()
    textos = []

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
            columna = 'texto' if 'texto' in df.columns else df.columns[0]
            textos = df[columna].dropna().astype(str).tolist()
        elif filename.endswith('.txt'):
            textos = contents.decode('utf-8').splitlines()
            textos = [t.strip() for t in textos if t.strip()]
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Use .csv o .txt")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {e}")

    if len(textos) > 500:
        textos = textos[:500]

    resultados = []
    for t in textos:
        info_nlp = explicar_preprocesamiento(t)
        texto_limpio = info_nlp["texto_final"]
        prediccion = str(modelo.predict([texto_limpio])[0])
        probs = modelo.predict_proba([texto_limpio])[0]
        confianza = float(max(probs))
        resultados.append({
            "texto": t,
            "prediccion": prediccion,
            "confianza": confianza
        })

    return {"total": len(resultados), "resultados": resultados}

@app.get("/api/metrics")
def leer_metricas():
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)