import re
import unicodedata
import nltk
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

nltk.download('stopwords', quiet=True)

stemmer = SnowballStemmer('spanish')
NEGACIONES = {'no', 'ni', 'nunca', 'jamas', 'sin', 'tampoco', 'nada', 'nadie'}

def quitar_acentos(texto: str) -> str:
    texto = texto.replace('ñ', '\001').replace('Ñ', '\002')
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return texto.replace('\001', 'ñ').replace('\002', 'ñ')

STOP_WORDS_ES = {quitar_acentos(w) for w in stopwords.words('spanish')} - NEGACIONES

def explicar_preprocesamiento(texto: str) -> dict:
    texto_orig = str(texto)
    norm = quitar_acentos(texto_orig.lower().strip())
    norm = re.sub(r'[^a-zñ0-9\s]', ' ', norm)
    norm = re.sub(r'\s+', ' ', norm).strip()
    
    tokens = norm.split()
    
    eliminadas = [t for t in tokens if t in STOP_WORDS_ES or len(t) <= 1]
    conservadas = [t for t in tokens if t not in STOP_WORDS_ES and len(t) > 1]
    
    stems_map = {t: stemmer.stem(t) for t in conservadas}
    stems_list = list(stems_map.values())
    
    texto_final = " ".join(stems_list)
    
    return {
        "texto_original": texto_orig,
        "normalizacion": norm,
        "tokens": tokens,
        "eliminadas": eliminadas,
        "conservadas": conservadas,
        "stems_detalle": stems_map,
        "stems": stems_list,
        "texto_final": texto_final,
        "sin_stopwords": conservadas,
        "normalizado": norm
    }

def preprocesar_serie(textos):
    return [explicar_preprocesamiento(str(t))["texto_final"] for t in textos]