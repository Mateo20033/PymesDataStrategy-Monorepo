"use client";
import { useState, useRef, useEffect } from 'react';

interface Mensaje {
  rol: 'user' | 'ai';
  texto: string;
  hora: string;
}

interface Dataset {
  id: string | number;
  nombre: string;
  total_filas?: number;
}

interface Props {
  datasets: Dataset[];
  defaultDatasetId?: string | number | null;
  onClose: () => void;
}

function horaActual() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const enviarPregunta = (pregunta: string, datasetId: unknown, empresaId: unknown) =>
  fetch('/api/dashboard/agent/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta, dataset_id: datasetId, empresa_id: empresaId }),
  }).then(r => r.json());

export default function AsistenteIAModal({ datasets, defaultDatasetId, onClose }: Props) {
  const [datasetId, setDatasetId] = useState<string | number | null>(
    defaultDatasetId ?? datasets[0]?.id ?? null
  );
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: 'ai',
      texto: '¡Hola! Soy tu asistente PYMES-AI. Puedo analizar tus datos y responder preguntas en lenguaje natural. ¿En qué te puedo ayudar hoy?',
      hora: horaActual(),
    },
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const dataset = datasets.find(d => String(d.id) === String(datasetId));

  const enviar = async () => {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;
    setInput('');
    setMensajes(prev => [...prev, { rol: 'user', texto: pregunta, hora: horaActual() }]);
    setCargando(true);
    try {
      const res = await enviarPregunta(pregunta, datasetId, 1);
      setMensajes(prev => [
        ...prev,
        {
          rol: 'ai',
          texto: res.respuesta ?? 'No se obtuvo respuesta del asistente.',
          hora: horaActual(),
        },
      ]);
    } catch {
      setMensajes(prev => [
        ...prev,
        { rol: 'ai', texto: 'Hubo un error al consultar el asistente. Intenta de nuevo.', hora: horaActual() },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ia-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        .ia-dot { animation: ia-bounce 1.4s infinite; display: inline-block; }
        .ia-dot:nth-child(2) { animation-delay: 0.2s; }
        .ia-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px',
        }}
      >
        <div style={{
          background: '#fff', borderRadius: '16px',
          width: '100%', maxWidth: '620px',
          height: '82vh', maxHeight: '720px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {/* Cabecera */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                Asistente IA
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>
                Consulta tus datos en lenguaje natural con Gemini
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {datasets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <label style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>
                    Analizar datos de
                  </label>
                  <select
                    value={String(datasetId ?? '')}
                    onChange={e => setDatasetId(e.target.value)}
                    style={{
                      fontSize: '12px', border: '1px solid #e5e7eb',
                      borderRadius: '6px', padding: '4px 8px',
                      color: '#374151', background: '#fff', cursor: 'pointer',
                      maxWidth: '200px',
                    }}
                  >
                    {datasets.map(d => (
                      <option key={d.id} value={String(d.id)}>
                        {d.nombre}{d.total_filas ? ` (${d.total_filas.toLocaleString()} filas)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  border: '1px solid #e5e7eb', background: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#6b7280', fontSize: '18px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Dataset pill activo */}
          {dataset && (
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 10px', borderRadius: '20px',
                background: '#fff0e6', color: '#cc5200',
                fontSize: '11px', fontWeight: 600,
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#ff6600', display: 'inline-block',
                }} />
                Analizando: {dataset.nombre}
              </span>
            </div>
          )}

          {/* Mensajes */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.rol === 'user' ? 'flex-end' : 'flex-start',
                gap: '8px', alignItems: 'flex-end',
              }}>
                {m.rol === 'ai' && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#ff6600', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#fff',
                  }}>
                    AI
                  </div>
                )}
                <div style={{ maxWidth: '76%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.rol === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.rol === 'user' ? '#ff6600' : '#f1f5f9',
                    color: m.rol === 'user' ? '#fff' : '#1f2937',
                    fontSize: '13px', lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.texto}
                  </div>
                  <div style={{
                    fontSize: '10px', color: '#9ca3af', marginTop: '3px',
                    textAlign: m.rol === 'user' ? 'right' : 'left',
                  }}>
                    {m.hora}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {cargando && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#ff6600', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                }}>
                  AI
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '14px 14px 14px 4px',
                  background: '#f1f5f9', display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="ia-dot" style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#9ca3af',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              disabled={cargando}
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              style={{
                flex: 1, padding: '10px 14px',
                borderRadius: '10px', border: '1.5px solid #e5e7eb',
                fontSize: '13px', color: '#1f2937', outline: 'none',
                background: cargando ? '#f9fafb' : '#fff',
              }}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || cargando}
              title="Enviar pregunta"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                border: 'none', flexShrink: 0,
                background: input.trim() && !cargando ? '#ff6600' : '#e5e7eb',
                color: '#fff',
                cursor: input.trim() && !cargando ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
