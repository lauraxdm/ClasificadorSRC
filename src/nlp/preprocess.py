import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

nltk.download('stopwords', quiet=True)

stemmer = SnowballStemmer('spanish')
# Conservamos negaciones clave para que el modelo detecte reclamos correctamente
NEGACIONES = {'no', 'ni', 'nunca', 'jamas', 'jamás', 'sin', 'tampoco', 'nada', 'nadie'}
STOP_WORDS = set(stopwords.words('spanish')) - NEGACIONES

def explicar_preprocesamiento(texto: str) -> dict:
    normalizado = str(texto).lower().strip()
    normalizado = re.sub(r'[^a-záéíóúüñ0-9\s]', ' ', normalizado)
    normalizado = re.sub(r'\s+', ' ', normalizado).strip()
    
    tokens = normalizado.split()
    sin_stopwords = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    stems = [stemmer.stem(t) for t in sin_stopwords]
    
    return {
        "normalizado": normalizado,
        "tokens": tokens,
        "sin_stopwords": sin_stopwords,
        "stems": stems,
        "texto_final": " ".join(stems)
    }

def preprocesar_serie(textos):
    return [explicar_preprocesamiento(str(t))["texto_final"] for t in textos]