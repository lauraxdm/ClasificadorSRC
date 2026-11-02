FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 y compilación
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalarlos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Descargar datos de NLTK necesarios para el preprocesamiento dentro del contenedor
RUN python -c "import nltk; nltk.download('stopwords')"

# Copiar el código fuente y artefactos
COPY . .

EXPOSE 8000