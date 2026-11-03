# Clasificador Automático Solicitudes, Reclamos y Consultas

Un sistema de clasificación automática de **Solicitudes, Reclamos y Consultas** de Tickets de Atencion al Cliente desarrollado con una arquitectura moderna de **FastAPI** (Backend) y **React** (Frontend), inspirado en herramientas avanzadas de explicabilidad e interpretabilidad de Machine Learning.

---

## 🚀 Características Principales

- **Procesamiento de Lenguaje Natural (NLP) Transparente:** Pipeline detallado paso a paso en la interfaz web (Normalización, Tokenización, Stop Words, Stemming con Snowball y Vectorización TF-IDF).
- **Dashboard de Métricas Avanzadas:** 
  - Tarjetas de resumen para el modelo en producción (F1 Macro, Exactitud, y conteo exacto del vocabulario TF-IDF).
  - Tabla comparativa multimodelo que evalúa *Naive Bayes*, *Regresión Logística*, *Random Forest* y un modelo de *Línea Base*.
  - Desglose de F1-score individual por cada clase (*Consulta, Reclamo, Solicitud*).
- **Explicabilidad e Interpretabilidad:** Visualización de los **términos más influyentes** (pesos y coeficientes de las características) que empujan las predicciones hacia cada categoría.
- **Predicción Individual y por Lotes:** Soporte para clasificar texto en tiempo real o procesar lotes mediante archivos `.csv` y `.txt`.

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Python, FastAPI, Scikit-learn, Pandas, Joblib.
- **Frontend:** React (JSX), JavaScript moderno, Estilos limpios y modulares.
- **Contenedores:** Docker & Docker Compose.

---

## 📦 Estructura del Proyecto

```text
clasificadorPQRS/
│
├── artifacts/          # Modelos entrenados (.joblib) y métricas (metrics.json)
├── src/
│   ├── nlp/            # Módulos de preprocesamiento, tokenización y stemming
│   ├── models/         # Scripts de entrenamiento y evaluación multimodelo (train.py)
│   ├── db.py           # Conexión y almacenamiento de predicciones
│   └── pipeline.py     # Orquestador del pipeline de datos y entrenamiento
│
├── main.py             # API principal de FastAPI
├── main.jsx            # Interfaz de usuario interactiva en React
├── Dockerfile          # Configuración del contenedor de la aplicación
├── docker-compose.yml  # Orquestador de servicios
└── README.md
```

---

## ⚙️ Instalación y Ejecución con Docker

La forma más rápida y limpia de ejecutar el proyecto es utilizando **Docker Compose**:

1. Clona el repositorio y sitúate en la carpeta raíz del proyecto.
2. Construye y levanta los contenedores ejecutando:
   ```powershell
   docker compose up --build -d
   ```
3. Para entrenar o reentrenar los modelos con tus datos actualizados dentro del contenedor, ejecuta:
   ```powershell
   docker compose exec api python src/pipeline.py --reload-data
   docker compose restart api
   ```
4. Abre tu navegador web e ingresa a:
   ```text
   http://localhost:8000
   ```

---

## 📊 Uso de la Interfaz

1. **Pestaña Analizar:** Escribe o pega una solicitud, reclamo o consulta. Observa en tiempo real cómo actúa cada etapa del pipeline NLP y el desglose de probabilidades de confianza.
2. **Pestaña Lotes:** Sube un archivo CSV con una columna llamada `texto` o un archivo de texto plano para clasificar hasta 500 solicitudes de manera automática.
3. **Pestaña Métricas:** Audita el rendimiento del modelo en producción, compara métricas de validación cruzada frente a la línea base y analiza las palabras más influyentes del vocabulario.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo los términos de la licencia MIT.