import json
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from src.config import DATABASE_URL

def get_conn():
    return psycopg2.connect(DATABASE_URL)

def cargar_csv_en_bd(csv_path: str, forzar_recarga: bool = False):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM solicitudes;")
    total = cur.fetchone()[0]

    if total > 0 and not forzar_recarga:
        print(f"La tabla 'solicitudes' ya contiene {total} registros. Omitiendo carga.")
        cur.close()
        conn.close()
        return

    if forzar_recarga:
        cur.execute("TRUNCATE TABLE solicitudes RESTART IDENTITY;")

    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["texto", "categoria"])
    registros = list(df[["texto", "categoria", "canal"]].itertuples(index=False, name=None))

    execute_values(
        cur,
        "INSERT INTO solicitudes (texto, categoria, canal) VALUES %s",
        registros
    )
    conn.commit()
    print(f"Cargados {len(registros)} registros en PostgreSQL.")
    cur.close()
    conn.close()

def leer_solicitudes_bd() -> pd.DataFrame:
    conn = get_conn()
    df = pd.read_sql("SELECT id, texto, categoria, canal FROM solicitudes;", conn)
    conn.close()
    return df

def guardar_prediccion(texto_original: str, texto_procesado: str, tokens: list, prediccion: str, confianza: float):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO historial_predicciones (texto_original, texto_procesado, tokens, prediccion, confianza)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (texto_original, texto_procesado, json.dumps(tokens, ensure_ascii=False), prediccion, confianza)
    )
    conn.commit()
    cur.close()
    conn.close()

def obtener_historial(limite: int = 50) -> list:
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "SELECT id, texto_original, texto_procesado, tokens, prediccion, confianza, fecha "
        "FROM historial_predicciones ORDER BY fecha DESC LIMIT %s;",
        (limite,)
    )
    filas = cur.fetchall()
    cur.close()
    conn.close()
    return filas