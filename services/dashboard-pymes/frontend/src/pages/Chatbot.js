import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enviarPregunta } from '../services/chatService';
import { getDatasets, getEmpresas } from '../services/uploadService';

const SUGERENCIAS = [
  '¿Cuál fue el mes con mayores ventas?',
  '¿Cuántos registros tiene el dataset?',
  'Resume los datos principales',
  '¿Cuál es el promedio de ventas?',
];

const Chatbot = () => {
  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      rol: 'bot',
      texto: '¡Hola! Soy tu asistente PYMES-AI. Puedo analizar tus datos y responder preguntas en lenguaje natural. ¿En qué te puedo ayudar hoy?',
      hora: new Date(),
    },
  ]);
  const [input, setInput]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const [seleccion, setSeleccion] = useState('todos'); // 'todos' | dataset_id como string
  const [datasets, setDatasets]   = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [cargando, setCargando]   = useState(true);
  const messagesEndRef            = useRef(null);

  // Cargar datasets y empresa
  useEffect(() => {
    Promise.all([getDatasets(), getEmpresas()])
      .then(([dsRes, empRes]) => {
        const ds  = dsRes.data.data.datasets || [];
        const emp = empRes.data.data.empresas || [];
        setDatasets(ds);
        if (emp.length > 0) setEmpresaId(emp[0].id);
        // Pre-seleccionar: si hay datasets, queda en 'todos'; si no hay, null
        setSeleccion(ds.length > 0 ? 'todos' : null);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const agregarMensaje = (rol, texto) =>
    setMensajes((prev) => [...prev, { id: Date.now(), rol, texto, hora: new Date() }]);

  const enviar = async (pregunta = input.trim()) => {
    if (!pregunta || enviando) return;

    setInput('');
    agregarMensaje('user', pregunta);
    setEnviando(true);

    try {
      // 'todos' → empresa_id; id numérico → dataset_id específico
      const dsId  = seleccion === 'todos' ? null : Number(seleccion);
      const empId = seleccion === 'todos' ? empresaId : null;
      const res   = await enviarPregunta(pregunta, dsId, empId);
      const respuesta = res.data?.respuesta || res.data?.answer || JSON.stringify(res.data);
      agregarMensaje('bot', respuesta);
    } catch (err) {
      agregarMensaje(
        'bot',
        !err.response
          ? '⚠️ No pude conectarme al agente IA. Asegúrate de que el servicio en el puerto 8000 esté corriendo.'
          : `Error: ${err.response?.data?.detail || err.response?.data?.message || 'Algo salió mal. Intenta de nuevo.'}`
      );
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const formatHora = (f) => f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const hayDatasets = datasets.length > 0;

  // ── Estado sin datasets ──────────────────────────────────────────────────────
  if (!cargando && !hayDatasets) {
    return (
      <div className="page page--chat">
        <div className="page__header">
          <div>
            <h1 className="page__title">Asistente IA</h1>
            <p className="page__subtitle">Consulta tus datos en lenguaje natural con Gemini</p>
          </div>
        </div>

        {/* CTA sin datos */}
        <div style={{
          background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb',
          padding: '52px 32px', textAlign: 'center', maxWidth: '520px', margin: '0 auto',
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#fff7f0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ff6600" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
            Aún no tienes datos para analizar
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
            Para usar el Asistente IA necesitas cargar al menos un archivo CSV con tus datos de ventas, gastos u otra información de tu empresa.
          </p>
          <Link to="/upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: '10px',
            background: '#ff6600', color: '#fff', fontWeight: 700, fontSize: '14px',
            boxShadow: '0 4px 14px rgba(255,102,0,0.35)',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Cargar mi primer CSV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--chat">
      <div className="page__header">
        <div>
          <h1 className="page__title">Asistente IA</h1>
          <p className="page__subtitle">Consulta tus datos en lenguaje natural con Gemini</p>
        </div>

        {/* Selector de dataset */}
        {!cargando && (
          <div className="chat-dataset-selector">
            <label className="form__label" htmlFor="datasetSelect">Analizar datos de</label>
            <select
              id="datasetSelect"
              className="form__input form__input--sm"
              value={seleccion ?? 'todos'}
              onChange={(e) => setSeleccion(e.target.value)}
            >
              <option value="todos">
                Todos los datasets ({datasets.length})
              </option>
              {datasets.map((ds) => (
                <option key={ds.id} value={String(ds.id)}>
                  {ds.nombre} ({ds.total_filas?.toLocaleString()} filas)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chip indicador del contexto activo */}
      {!cargando && (
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: '#fff7f0', border: '1px solid #ffcca3',
            fontSize: '12px', fontWeight: 600, color: '#cc5200',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff6600">
              <circle cx="12" cy="12" r="6"/>
            </svg>
            {seleccion === 'todos'
              ? `Analizando todos los datasets (${datasets.length})`
              : `Analizando: ${datasets.find(d => String(d.id) === seleccion)?.nombre ?? '—'}`}
          </span>
        </div>
      )}

      <div className="chat-container">
        {/* Historial */}
        <div className="chat-messages">
          {mensajes.map((msg) => (
            <div key={msg.id} className={`chat-bubble chat-bubble--${msg.rol}`}>
              {msg.rol === 'bot' && (
                <div className="chat-bubble__avatar">AI</div>
              )}
              <div className="chat-bubble__content">
                <p className="chat-bubble__text">{msg.texto}</p>
                <span className="chat-bubble__hora">{formatHora(msg.hora)}</span>
              </div>
            </div>
          ))}

          {enviando && (
            <div className="chat-bubble chat-bubble--bot">
              <div className="chat-bubble__avatar">AI</div>
              <div className="chat-bubble__content">
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias */}
        {mensajes.length <= 1 && (
          <div className="chat-suggestions">
            {SUGERENCIAS.map((s) => (
              <button key={s} className="chat-suggestion-btn" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={enviando}
          />
          <button
            className="chat-send-btn"
            onClick={() => enviar()}
            disabled={!input.trim() || enviando}
            title="Enviar"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
