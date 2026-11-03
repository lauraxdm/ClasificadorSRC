# Dataset de Solicitudes y Reclamos (PQRS)

## Origen y Licencia
- **Fuente original:** Bitext Customer Support Dataset (Spanish adaptation) - Hugging Face (`Faramir/Bitext-customer-support-llm-chatbot-training-dataset-spanish`).
- **Licencia:** Apache-2.0 / CDLA-Sharing-1.0
- **Fecha de descarga:** 2026-10-30
- **Registros totales:** 3525 filas.

## Diccionario de Datos (`data/raw/solicitudes_limpio.csv`)
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `texto` | `TEXT` | Mensaje original en español del usuario. |
| `categoria` | `VARCHAR(50)` | Etiqueta objetivo: `reclamo`, `solicitud`, `consulta`. |
| `canal` | `VARCHAR(50)` | Área o departamento de origen (`order`, `payment`, `shipping`, etc.). |
| `intent_original` | `VARCHAR(50)` | Intención específica original del corpus. |
