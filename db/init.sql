CREATE TABLE IF NOT EXISTS solicitudes (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    canal VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_predicciones (
    id SERIAL PRIMARY KEY,
    texto_original TEXT NOT NULL,
    texto_procesado TEXT,
    tokens JSONB,
    prediccion VARCHAR(50) NOT NULL,
    confianza FLOAT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);