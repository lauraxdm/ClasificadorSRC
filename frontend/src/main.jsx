import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [metricas, setMetricas] = useState(null)
  const [tab, setTab] = useState("analizar")

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(data => setMetricas(data))
      .catch(err => console.error(err));
  }, []);

  const handleAnalizar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto })
      });
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      alert("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#2c3e50" }}>📊 Clasificador de Solicitudes, Reclamos y Consultas</h1>
        <p style={{ color: "#7f8c8d" }}>Sistema de clasificación automática de tickets con procesamiento de lenguaje natural</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
          <button onClick={() => setTab("analizar")} style={btnStyle(tab === "analizar")}>Analizar Texto</button>
          <button onClick={() => setTab("metricas")} style={btnStyle(tab === "metricas")}>Métricas de Modelos</button>
        </div>
      </header>

      {tab === "analizar" && (
        <div style={cardStyle}>
          <h2>Redacta o pega una solicitud, reclamo o consulta:</h2>
          <form onSubmit={handleAnalizar}>
            <textarea
              rows="4"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. No he recibido mi pedido y ya pasaron 5 días desde la fecha límite..."
              style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
            />
            <button type="submit" disabled={loading} style={{ ...primaryBtn, marginTop: "10px" }}>
              {loading ? "Analizando..." : "Clasificar con IA"}
            </button>
          </form>

          {resultado && (
            <div style={{ marginTop: "25px", padding: "20px", background: "#e8f4fd", borderRadius: "8px", borderLeft: "5px solid #3498db" }}>
              <h3>Resultado del Análisis:</h3>
              <p><strong>Clasificación Predicha:</strong> <span style={{ textTransform: "uppercase", color: "#2980b9", fontWeight: "bold" }}>{resultado.prediccion}</span></p>
              <p><strong>Confianza del Modelo:</strong> {(resultado.confianza * 100).toFixed(2)}%</p>
              
              <h4 style={{ marginTop: "15px" }}>Distribución de Probabilidades:</h4>
              <ul>
                {Object.entries(resultado.probabilidades).map(([clase, prob]) => (
                  <li key={clase}><strong>{clase}:</strong> {(prob * 100).toFixed(2)}%</li>
                ))}
              </ul>

              <h4 style={{ marginTop: "15px" }}>Procesamiento NLP:</h4>
              <p><strong>Tokens limpios (sin stop words):</strong> {resultado.procesamiento_nlp.sin_stopwords.join(", ")}</p>
              <p><strong>Stems (Raíces Snowball):</strong> {resultado.procesamiento_nlp.stems.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {tab === "metricas" && (
        <div style={cardStyle}>
          <h2>Evaluación Comparativa de Modelos</h2>
          <p>Resultados de validación cruzada (5-fold CV) y pruebas:</p>
          {metricas ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
              <thead>
                <tr style={{ background: "#2c3e50", color: "white" }}>
                  <th style={thTd}>Modelo</th>
                  <th style={thTd}>F1 Macro (CV)</th>
                  <th style={thTd}>Exactitud (Test)</th>
                  <th style={thTd}>F1 Macro (Test)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metricas).map(([nombre, m]) => (
                  <tr key={nombre} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={thTd}><strong>{nombre}</strong></td>
                    <td style={thTd}>{m.f1_macro_cv}</td>
                    <td style={thTd}>{m.accuracy_test * 100}%</td>
                    <td style={thTd}>{m.f1_macro_test}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>Cargando métricas...</p>}
        </div>
      )}
    </div>
  )
}

const btnStyle = (active) => ({
  padding: "10px 20px",
  background: active ? "#2c3e50" : "#ecf0f1",
  color: active ? "white" : "#2c3e50",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
});

const primaryBtn = {
  background: "#3498db",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
};

const thTd = {
  padding: "10px",
  textAlign: "left"
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />)