import pandas as pd
from datasets import load_dataset
from pathlib import Path
from datetime import datetime

def descargar_y_preparar_dataset():
    raw_dir = Path("data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    csv_path = raw_dir / "solicitudes.csv"
    readme_path = Path("data/README.md")

    print("Descargando dataset real de atención al cliente en español desde Hugging Face...")
    ds = load_dataset(
        "Faramir/Bitext-customer-support-llm-chatbot-training-dataset-spanish",
        split="train"
    )
    df = ds.to_pandas()

    # Mapeo de intenciones reales de soporte
    mapa_pqrs = {
        "complaint": "reclamo",
        "get_refund": "reclamo",
        "track_refund": "reclamo",
        "payment_issue": "reclamo",
        "contact_human_agent": "reclamo",
        "review": "reclamo",
        "cancel_order": "solicitud",
        "change_order": "solicitud",
        "place_order": "solicitud",
        "change_shipping_address": "solicitud",
        "set_up_shipping_address": "solicitud",
        "create_account": "solicitud",
        "delete_account": "solicitud",
        "edit_account": "solicitud",
        "switch_account": "solicitud",
        "recover_password": "solicitud",
        "get_invoice": "solicitud",
        "newsletter_subscription": "solicitud",
        "check_invoice": "consulta",
        "check_payment_methods": "consulta",
        "check_refund_policy": "consulta",
        "check_cancellation_fee": "consulta",
        "delivery_options": "consulta",
        "delivery_period": "consulta",
        "track_order": "consulta",
        "contact_customer_service": "consulta",
        "registration_problems": "reclamo"
    }

    df["intent_clean"] = df["intent"].astype(str).str.lower().str.strip()
    df["categoria"] = df["intent_clean"].map(lambda x: mapa_pqrs.get(x, "solicitud"))

    df_pqrs = pd.DataFrame({
        "texto": df["instruction"],
        "categoria": df["categoria"],
        "canal": df["category"].astype(str).str.lower(),
        "intent_original": df["intent_clean"]
    })

    # Muestra y adición de duplicados para limpieza
    df_muestra = df_pqrs.sample(n=min(3500, len(df_pqrs)), random_state=42).reset_index(drop=True)
    duplicados = df_muestra.sample(n=25, random_state=42)
    df_final = pd.concat([df_muestra, duplicados], ignore_index=True)

    df_final.to_csv(csv_path, index=False, encoding="utf-8")
    print(f"\n✅ Archivo generado exitosamente en: {csv_path}")
    print(f"Total de filas guardadas: {len(df_final)}")
    print("\nDistribución por clase:")
    print(df_final["categoria"].value_counts())

    fecha_hoy = datetime.now().strftime("%Y-%m-%d")
    readme_contenido = f"""# Dataset de Solicitudes y Reclamos (PQRS)

## Origen y Licencia
- **Fuente original:** Bitext Customer Support Dataset (Spanish adaptation) - Hugging Face (`Faramir/Bitext-customer-support-llm-chatbot-training-dataset-spanish`).
- **Licencia:** Apache-2.0 / CDLA-Sharing-1.0
- **Fecha de descarga:** {fecha_hoy}
- **Registros totales:** {len(df_final)} filas.

## Diccionario de Datos (`data/raw/solicitudes.csv`)
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `texto` | `TEXT` | Mensaje original en español del usuario. |
| `categoria` | `VARCHAR(50)` | Etiqueta objetivo: `reclamo`, `solicitud`, `consulta`. |
| `canal` | `VARCHAR(50)` | Área o departamento de origen (`order`, `payment`, `shipping`, etc.). |
| `intent_original` | `VARCHAR(50)` | Intención específica original del corpus. |
"""
    readme_path.write_text(readme_contenido, encoding="utf-8")
    print(f"✅ Documentación creada en: {readme_path}")

if __name__ == "__main__":
    descargar_y_preparar_dataset()