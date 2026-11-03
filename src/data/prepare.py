import pandas as pd
from sklearn.model_selection import train_test_split

def limpiar_y_dividir(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42):
    df = df.dropna(subset=["texto", "categoria"]).copy()
    df["texto"] = df["texto"].astype(str).str.strip()
    df = df[df["texto"].str.len() > 3]

    antes = len(df)
    df = df.drop_duplicates(subset=["texto"]).reset_index(drop=True)
    print(f"Limpieza completada: {antes - len(df)} duplicados eliminados. Total útil: {len(df)}")

    X = df["texto"]
    y = df["categoria"].astype(str).str.strip().str.lower()

    return train_test_split(X, y, test_size=test_size, stratify=y, random_state=random_state)