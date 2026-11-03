import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [metricas, setMetricas] = useState(null)
  const [tab, setTab] = useState("analizar")
  const [modeloMatriz, setModeloMatriz] = useState("")
  
  const [archivo, setArchivo] = useState(null)
  const [resultadoLote, setResultadoLote] = useState(null)
  const [loadingLote, setLoadingLote] = useState(false)

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(data => {
        setMetricas(data);
        if (data && data.modelo_produccion) {
          setModeloMatriz(data.modelo_produccion);
        }
      })
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

  const handleAnalizarLote = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setLoadingLote(true);
    const formData = new FormData();
    formData.append("file", archivo);

    try {
      const res = await fetch("/api/predict-batch", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setResultadoLote(data);
    } catch (err) {
      alert("Error al procesar el archivo");
    } finally {
      setLoadingLote(false);
    }
  };

  const probarCon = (ejemplo) => {
    setTexto(ejemplo);
  };

  const getBadgeStyle = (clase) => {
    const c = clase.toLowerCase();
    if (c.includes("reclamo") || c.includes("negativo")) {
      return { background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: "14px", fontWeight: "600", fontSize: "13px", display: "inline-block", textTransform: "capitalize" };
    }
    if (c.includes("solicitud") || c.includes("neutro")) {
      return { background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "14px", fontWeight: "600", fontSize: "13px", display: "inline-block", textTransform: "capitalize" };
    }
    return { background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "14px", fontWeight: "600", fontSize: "13px", display: "inline-block", textTransform: "capitalize" };
  };

  const modProdKey = metricas?.modelo_produccion;
  const modProdData = metricas?.modelos?.[modProdKey];
  const modSeleccionadoKey = modeloMatriz || modProdKey;
  const modSeleccionadoData = metricas?.modelos?.[modSeleccionadoKey];
  const listaClases = metricas?.clases || ["Consulta", "Reclamo", "Solicitud"];

  const terminosMostrar = (modProdData?.terminos_influyentes && Object.keys(modProdData.terminos_influyentes).length > 0)
    ? modProdData.terminos_influyentes
    : metricas?.modelos?.Regresion_Logistica?.terminos_influyentes;

  return (
    <div style={{ maxWidth: "1250px", margin: "30px auto", padding: "0 20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#1e293b" }}>
      
      <header style={{ textAlign: "center", marginBottom: "30px", borderBottom: "1px solid #e2e8f0", paddingBottom: "20px" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "32px", margin: "0 0 10px 0" }}>
          Clasificador de Solicitudes, Reclamos y Consultas
        </h1>
        <p style={{ color: "#7f8c8d", fontSize: "16px", margin: "0 0 20px 0" }}>
          Sistema de clasificación automática de tickets con procesamiento de lenguaje natural
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
          <button onClick={() => setTab("analizar")} style={btnTabStyle(tab === "analizar")}>Analizar</button>
          <button onClick={() => setTab("lote")} style={btnTabStyle(tab === "lote")}>Lote</button>
          <button onClick={() => setTab("metricas")} style={btnTabStyle(tab === "metricas")}>Métricas</button>
        </div>
      </header>

      {tab === "analizar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "20px", color: "#1e293b", marginTop: 0 }}>Redacta o pega una solicitud, reclamo o consulta:</h2>
              
              <form onSubmit={handleAnalizar}>
                <textarea
                  rows="5"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
                  placeholder="Ej. No he recibido mi pedido y ya pasaron 5 días desde la fecha límite..."
                  style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{texto.length} / 1000</span>
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? "Analizando..." : "Analizar"}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: "15px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <span style={{ fontSize: "13px", color: "#64748b", display: "block", marginBottom: "8px" }}>Probar con ejemplos:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <button type="button" onClick={() => probarCon("No he recibido mi reembolso y ya pasaron más de 10 días desde que cancelé la compra.")} style={pillStyle}>Reclamo</button>
                  <button type="button" onClick={() => probarCon("Necesito cambiar la dirección de envío de mi pedido actual y actualizar mi correo.")} style={pillStyle}>Solicitud</button>
                  <button type="button" onClick={() => probarCon("¿Cuáles son los métodos de pago disponibles y cuánto tiempo tarda el envío?")} style={pillStyle}>Consulta</button>
                </div>
              </div>
            </div>

            {resultado && (
              <div style={{ background: resultado.prediccion?.toLowerCase() === 'reclamo' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${resultado.prediccion?.toLowerCase() === 'reclamo' ? '#fca5a5' : '#bbf7d0'}`, padding: "20px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", margin: "0 0 8px 0", color: resultado.prediccion?.toLowerCase() === 'reclamo' ? '#991b1b' : '#166534', textTransform: "uppercase" }}>
                  Clasificación: {resultado.prediccion}
                </h3>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#334155", margin: "0 0 15px 0" }}>
                  Confianza: {((resultado.confianza || 0) * 100).toFixed(2)}%
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(resultado.probabilidades || {}).map(([clase, prob]) => (
                    <div key={clase} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px" }}>
                      <strong style={{ textTransform: "capitalize" }}>{clase}:</strong>
                      <div style={{ flex: 1, margin: "0 10px", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${(prob || 0) * 100}%`, background: clase.toLowerCase() === resultado.prediccion?.toLowerCase() ? '#0f766e' : '#94a3b8', height: "100%" }}></div>
                      </div>
                      <span style={{ width: "45px", textAlign: "right" }}>{((prob || 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: "20px", color: "#1e293b", marginTop: 0 }}>Cómo se procesó el texto</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>Los mismos pasos que se usaron al entrenar, ejecutados por el pipeline guardado.</p>

            {resultado && resultado.procesamiento_nlp ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>Texto original</h4>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", color: "#334155" }}>
                    {resultado.procesamiento_nlp.texto_original}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>1 · Normalización</h4>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", color: "#334155" }}>
                    {resultado.procesamiento_nlp.normalizacion}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>2 · Tokenización</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {(resultado.procesamiento_nlp.tokens || []).map((t, i) => (
                      <span key={i} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>3 · Stop words</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {(resultado.procesamiento_nlp.conservadas || []).map((t, i) => (
                      <span key={i} style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>4 · Stemming (Snowball)</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {Object.entries(resultado.procesamiento_nlp.stems_detalle || {}).map(([orig, stem], i) => (
                      <span key={i} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                        {orig} → <strong>{stem}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: "#1577da", margin: "0 0 5px 0" }}>5 · Entrada a TF-IDF</h4>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", color: "#334155", fontFamily: "monospace" }}>
                    {resultado.procesamiento_nlp.texto_final}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                Analiza una solicitud para ver cada paso detallado del NLP.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "lote" && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "20px", color: "#1e293b", marginTop: 0 }}>Analizar un archivo</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
            Un <code>.txt</code> con una solicitud por línea, o un <code>.csv</code> con una columna llamada «texto». Máximo 500 solicitudes y 1 MB.
          </p>

          <form onSubmit={handleAnalizarLote} style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
            <input 
              type="file" 
              accept=".csv,.txt" 
              onChange={(e) => setArchivo(e.target.files[0])}
              style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc" }}
            />
            <button type="submit" disabled={loadingLote || !archivo} style={primaryBtn}>
              {loadingLote ? "Clasificando..." : "Clasificar"}
            </button>
          </form>

          {resultadoLote && (
            <div style={{ marginTop: "25px" }}>
              <h3 style={{ fontSize: "18px", color: "#0f766e" }}>Resultados del lote ({resultadoLote.total} elementos procesados):</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
                <thead>
                  <tr style={{ background: "#0f766e", color: "white" }}>
                    <th style={thTd}>Texto</th>
                    <th style={thTd}>Predicción</th>
                    <th style={thTd}>Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadoLote.resultados.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={thTd}>{item.texto}</td>
                      <td style={{ ...thTd, fontWeight: "bold", textTransform: "uppercase", color: item.prediccion.toLowerCase() === 'reclamo' ? '#991b1b' : '#0f766e' }}>
                        {item.prediccion}
                      </td>
                      <td style={thTd}>{(item.confianza * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "metricas" && metricas && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {modProdData && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 6px 0" }}>
                En producción: {modProdData.nombre_mostrar || modProdKey.replace("_", " ")}
              </h2>
              <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 20px 0" }}>
                {modProdData.configuracion}
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                <div style={metricBoxStyle}>
                  <div style={metricValStyle}>
                    {Number(modProdData.f1_macro_cv).toFixed(3)} ± {Number(modProdData.cv_std || 0).toFixed(3)}
                  </div>
                  <div style={metricLabelStyle}>F1 macro (validación cruzada)</div>
                </div>
                <div style={metricBoxStyle}>
                  <div style={metricValStyle}>
                    {Number(modProdData.f1_macro_test).toFixed(3)}
                  </div>
                  <div style={metricLabelStyle}>F1 macro (prueba)</div>
                </div>
                <div style={metricBoxStyle}>
                  <div style={metricValStyle}>
                    {(modProdData.accuracy_test * 100).toFixed(1)} %
                  </div>
                  <div style={metricLabelStyle}>Exactitud (prueba)</div>
                </div>
                <div style={metricBoxStyle}>
                  <div style={metricValStyle}>
                    {modProdData.vocab_size || "—"}
                  </div>
                  <div style={metricLabelStyle}>Términos en el vocabulario TF-IDF</div>
                </div>
              </div>

              <p style={{ color: "#64748b", fontSize: "12.5px", margin: "18px 0 0 0" }}>
                Elegido por F1 macro en validación cruzada sobre entrenamiento. El conjunto de prueba solo se usó para reportar estas cifras. {metricas.version && `Versión ${metricas.version}.`}
              </p>
            </div>
          )}

          
          <div style={cardStyle}>
            <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 6px 0" }}>Comparación de modelos</h2>
            <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 18px 0" }}>
              Cada modelo con su mejor configuración. La línea base demuestra que el modelo aporta valor.
            </p>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                    <th style={thClean}>Modelo</th>
                    <th style={thClean}>Configuración</th>
                    <th style={{ ...thClean, textAlign: "right" }}>F1 macro CV</th>
                    <th style={{ ...thClean, textAlign: "right" }}>Exactitud prueba</th>
                    <th style={{ ...thClean, textAlign: "right" }}>F1 macro prueba</th>
                    {listaClases.map(c => (
                      <th key={c} style={{ ...thClean, textAlign: "right" }}>F1 {c.toLowerCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricas.modelos && Object.entries(metricas.modelos).map(([key, m]) => {
                    const esProd = key === modProdKey;
                    return (
                      <tr key={key} style={{ borderBottom: "1px solid #f1f5f9", background: esProd ? "#e6f4ea" : "transparent" }}>
                        <td style={{ ...tdClean, fontWeight: esProd ? "600" : "500", color: "#0f172a" }}>
                          {m.nombre_mostrar || key.replace("_", " ")}
                        </td>
                        <td style={{ ...tdClean, color: "#334155", maxWidth: "360px" }}>
                          {m.configuracion}
                        </td>
                        <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                          {Number(m.f1_macro_cv).toFixed(3)}
                        </td>
                        <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                          {(m.accuracy_test * 100).toFixed(1)} %
                        </td>
                        <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                          {Number(m.f1_macro_test).toFixed(3)}
                        </td>
                        {listaClases.map(c => {
                          const f1s = m.f1_por_clase || {};
                          const val = f1s[c] ?? f1s[c.toLowerCase()] ?? f1s[c.toUpperCase()];
                          return (
                            <td key={c} style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                              {val !== undefined ? Number(val).toFixed(3) : "0.000"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          
          {modSeleccionadoData && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 6px 0" }}>Matriz de confusión y métricas por clase</h2>
              <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 16px 0" }}>Conjunto de prueba.</p>

              {/* Botones selectores de modelo */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "22px" }}>
                {Object.entries(metricas.modelos || {}).map(([key, m]) => {
                  const activo = key === modSeleccionadoKey;
                  return (
                    <button
                      key={key}
                      onClick={() => setModeloMatriz(key)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "6px",
                        border: activo ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                        background: activo ? "#f0fdf4" : "white",
                        color: activo ? "#0f766e" : "#334155",
                        fontWeight: activo ? "600" : "400",
                        fontSize: "13.5px",
                        cursor: "pointer"
                      }}
                    >
                      {m.nombre_mostrar || key.replace("_", " ")}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "35px", alignItems: "start" }}>
                {/* Sub-tabla Izquierda: Matriz de Confusión */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                        <th style={thClean}>Real ↓ / Predicho →</th>
                        {listaClases.map(c => (
                          <th key={c} style={{ ...thClean, textAlign: "center", textTransform: "capitalize" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(modSeleccionadoData.matriz_confusion || []).map((fila, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...tdClean, color: "#475569", fontWeight: "500", textTransform: "capitalize" }}>
                            {listaClases[i]}
                          </td>
                          {fila.map((celda, j) => {
                            const esDiagonal = i === j;
                            const bg = esDiagonal
                              ? (celda > 0 ? "#2e8555" : "#e2e8f0")
                              : (celda > 0 ? "#f8e8e8" : "#f8fafc");
                            const fg = esDiagonal && celda > 0 ? "white" : "#0f172a";
                            return (
                              <td
                                key={j}
                                style={{
                                  padding: "12px",
                                  textAlign: "center",
                                  background: bg,
                                  color: fg,
                                  fontWeight: "600",
                                  fontFamily: "monospace",
                                  fontSize: "14px",
                                  border: "1px solid white"
                                }}
                              >
                                {celda}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sub-tabla Derecha: Precisión, Recall, F1 y Soporte por Clase */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                        <th style={thClean}>Clase</th>
                        <th style={{ ...thClean, textAlign: "right" }}>Precisión</th>
                        <th style={{ ...thClean, textAlign: "right" }}>Recall</th>
                        <th style={{ ...thClean, textAlign: "right" }}>F1</th>
                        <th style={{ ...thClean, textAlign: "right" }}>Soporte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaClases.map(c => {
                        const infoCls = modSeleccionadoData.metricas_por_clase?.[c] || {};
                        return (
                          <tr key={c} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={tdClean}>
                              <span style={getBadgeStyle(c)}>{c}</span>
                            </td>
                            <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                              {infoCls.precision !== undefined ? Number(infoCls.precision).toFixed(3) : "0.000"}
                            </td>
                            <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                              {infoCls.recall !== undefined ? Number(infoCls.recall).toFixed(3) : "0.000"}
                            </td>
                            <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                              {infoCls.f1 !== undefined ? Number(infoCls.f1).toFixed(3) : "0.000"}
                            </td>
                            <td style={{ ...tdClean, textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                              {infoCls.soporte !== undefined ? infoCls.soporte : 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BLOQUE 4: Efecto de cada decisión */}
          {metricas.efecto_decisiones && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 6px 0" }}>Efecto de cada decisión</h2>
              <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 20px 0" }}>
                Mejor F1 macro en validación cruzada alcanzado con cada opción.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "25px" }}>
                {Object.entries(metricas.efecto_decisiones).map(([categoria, opciones]) => (
                  <div key={categoria}>
                    <h4 style={{ fontSize: "14.5px", color: "#0f172a", margin: "0 0 10px 0" }}>{categoria}</h4>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {opciones.map((op, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                            borderBottom: "1px dotted #e2e8f0",
                            fontSize: "13.5px"
                          }}
                        >
                          <span style={{ color: "#334155", paddingRight: "8px" }}>{op.nombre}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap" }}>
                            <strong style={{ fontFamily: "monospace", fontSize: "13.5px" }}>
                              {Number(op.f1).toFixed(3)}
                            </strong>
                            <span
                              style={{
                                fontSize: "12.5px",
                                fontWeight: "600",
                                color: op.es_mejor ? "#15803d" : "#b91c1c",
                                minWidth: "55px",
                                textAlign: "right"
                              }}
                            >
                              {op.etiqueta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BLOQUE 5: Términos más influyentes */}
          {terminosMostrar && Object.keys(terminosMostrar).length > 0 && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 6px 0" }}>Términos más influyentes</h2>
              <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 20px 0" }}>
                Los que más empujan la predicción hacia cada clase en el modelo en producción.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "35px" }}>
                {Object.entries(terminosMostrar).map(([clase, terms]) => (
                  <div key={clase}>
                    <div style={{ marginBottom: "12px" }}>
                      <span style={getBadgeStyle(clase)}>{clase}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {terms.map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid #f8fafc",
                            fontSize: "13.5px"
                          }}
                        >
                          <code style={{ color: "#0f172a", fontFamily: "monospace" }}>{t.termino}</code>
                          <span style={{ color: "#475569", fontFamily: "monospace" }}>{Number(t.peso).toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

const btnTabStyle = (active) => ({
  padding: "10px 20px",
  background: active ? "#1784f1" : "#f1f5f9",
  color: active ? "white" : "#1577da",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px"
});

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0"
};

const metricBoxStyle = {
  background: "#f8fafc",
  padding: "16px 18px",
  borderRadius: "8px",
  border: "1px solid #f1f5f9"
};

const metricValStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#0f172a"
};

const metricLabelStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "4px"
};

const primaryBtn = {
  background: "#1577da",
  color: "white",
  padding: "10px 22px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px"
};

const pillStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  cursor: "pointer",
  color: "#334155",
  fontWeight: "500"
};

const thTd = {
  padding: "12px",
  textAlign: "left"
};

const thClean = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "13px"
};

const tdClean = {
  padding: "12px",
  textAlign: "left"
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />)