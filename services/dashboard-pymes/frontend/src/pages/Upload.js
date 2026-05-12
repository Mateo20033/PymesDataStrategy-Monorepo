import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { uploadCSV, getDatasets, getEmpresas, initEmpresa } from '../services/uploadService';

const Upload = () => {
  const [archivo, setArchivo]           = useState(null);
  const [empresaId, setEmpresaId]       = useState('');
  const [empresas, setEmpresas]         = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [nombreDataset, setNombre]      = useState('');
  const [progreso, setProgreso]         = useState(0);
  const [estado, setEstado]             = useState('idle'); // idle | uploading | success | error
  const [mensajeError, setMensajeError] = useState('');
  const [datasets, setDatasets]         = useState([]);
  const [loadingList, setLoadingList]   = useState(true);

  // Cargar empresas del usuario; si no tiene ninguna, crear la empresa por defecto
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const res = await getEmpresas();
        let lista = res.data.data.empresas;

        if (lista.length === 0) {
          // Crear empresa por defecto e intentar de nuevo
          try {
            await initEmpresa();
          } catch (initErr) {
            console.error('Error creando empresa por defecto:', initErr);
          }
          const res2 = await getEmpresas();
          lista = res2.data.data.empresas;
        }

        setEmpresas(lista);
        if (lista.length > 0) setEmpresaId(String(lista[0].id));
      } catch (err) {
        console.error('Error cargando empresas:', err?.response?.data || err.message);
      } finally {
        setLoadingEmpresas(false);
      }
    };
    cargarEmpresas();
  }, []);

  // Cargar lista de datasets al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getDatasets();
        setDatasets(res.data.data.datasets);
      } catch {
        // silencioso
      } finally {
        setLoadingList(false);
      }
    };
    cargar();
  }, [estado]);  // recargar cuando se suba un nuevo dataset

  const onDrop = useCallback((acceptedFiles, rejected) => {
    if (rejected.length > 0) {
      setMensajeError('Solo se aceptan archivos CSV.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setArchivo(acceptedFiles[0]);
      setMensajeError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const handleUpload = async () => {
    if (!archivo) return setMensajeError('Selecciona un archivo CSV.');
    if (!empresaId.trim()) return setMensajeError('El ID de empresa es obligatorio.');

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('empresa_id', empresaId);
    if (nombreDataset) formData.append('nombre_dataset', nombreDataset);
    formData.append('tipo_dataset', 'general'); // el motor detecta el tipo automáticamente

    setEstado('uploading');
    setProgreso(0);
    setMensajeError('');

    try {
      await uploadCSV(formData, (pct) => setProgreso(pct));
      setEstado('success');
      setArchivo(null);
      setNombre('');
    } catch (err) {
      setEstado('error');
      setMensajeError(err.response?.data?.message || 'Error al subir el archivo');
    }
  };

  const resetear = () => {
    setEstado('idle');
    setArchivo(null);
    setProgreso(0);
    setMensajeError('');
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Cargar datos</h1>
          <p className="page__subtitle">Importa archivos CSV para analizar en el dashboard</p>
        </div>
      </div>

      <div className="upload-grid">
        {/* Panel de carga */}
        <div className="card">
          <h3 className="card__title">Nuevo dataset</h3>

          {estado === 'success' ? (
            <div className="upload-success">
              <div className="upload-success__icon">✓</div>
              <h4>¡Archivo cargado correctamente!</h4>
              <p>Los datos ya están disponibles en tu cuenta.</p>

              {/* CTA: ir al dashboard o al asistente */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '10px 20px', borderRadius: '9px',
                  background: '#fff7f0', border: '1.5px solid #ffcca3',
                  color: '#cc5200', fontWeight: 600, fontSize: '13px',
                }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Ver Dashboard
                </Link>
                <Link to="/chatbot" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '10px 20px', borderRadius: '9px',
                  background: '#ff6600', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(255,102,0,0.35)',
                }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Analizar con IA
                </Link>
              </div>

              <button className="btn btn--primary btn--full" onClick={resetear} style={{ background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', boxShadow: 'none', marginTop: '0' }}>
                Cargar otro archivo
              </button>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${archivo ? 'dropzone--has-file' : ''}`}
              >
                <input {...getInputProps()} />
                {archivo ? (
                  <div className="dropzone__file">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="dropzone__filename">{archivo.name}</p>
                      <p className="dropzone__filesize">{formatBytes(archivo.size)}</p>
                    </div>
                    <button
                      type="button"
                      className="dropzone__remove"
                      onClick={(e) => { e.stopPropagation(); setArchivo(null); }}
                    >✕</button>
                  </div>
                ) : (
                  <div className="dropzone__placeholder">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p><strong>Arrastra tu CSV aquí</strong> o haz clic para seleccionar</p>
                    <p className="dropzone__hint">Máximo 10 MB · Solo archivos .csv</p>
                  </div>
                )}
              </div>

              {/* Campos adicionales */}
              <div className="form__group" style={{ marginTop: '1.25rem' }}>
                <label className="form__label" htmlFor="empresaId">
                  Empresa <span className="form__required">*</span>
                </label>
                {loadingEmpresas ? (
                  <p className="text-muted">Cargando empresas…</p>
                ) : empresas.length === 0 ? (
                  <p className="form__error">No tienes empresas registradas. Contacta al administrador.</p>
                ) : (
                  <select
                    id="empresaId"
                    className="form__input"
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                  >
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} (ID: {e.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form__group">
                <label className="form__label" htmlFor="nombreDataset">Nombre del dataset</label>
                <input
                  id="nombreDataset"
                  type="text"
                  className="form__input"
                  placeholder="Ej: Inventario Q1 2024"
                  value={nombreDataset}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              {/* Barra de progreso */}
              {estado === 'uploading' && (
                <div className="progress-bar">
                  <div className="progress-bar__track">
                    <div className="progress-bar__fill" style={{ width: `${progreso}%` }} />
                  </div>
                  <span className="progress-bar__label">{progreso}%</span>
                </div>
              )}

              {mensajeError && <p className="form__error">{mensajeError}</p>}

              <button
                className="btn btn--primary btn--full"
                onClick={handleUpload}
                disabled={estado === 'uploading' || !archivo}
                style={{ marginTop: '1rem' }}
              >
                {estado === 'uploading' ? 'Subiendo…' : 'Cargar archivo'}
              </button>
            </>
          )}
        </div>

        {/* Lista de datasets */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <h3 className="card__title">Datasets cargados</h3>
          {loadingList ? (
            <p className="text-muted">Cargando…</p>
          ) : datasets.length === 0 ? (
            <div className="empty-state">
              <p>No tienes datasets aún.</p>
              <p className="text-muted">Sube tu primer archivo CSV.</p>
            </div>
          ) : (
            <>
              <div className="dataset-list">
                {datasets.map((ds) => (
                  <div key={ds.id} className="dataset-item">
                    <div className="dataset-item__icon">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff6600" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="dataset-item__info">
                      <p className="dataset-item__name">{ds.nombre}</p>
                      <p className="dataset-item__meta">
                        {ds.total_filas?.toLocaleString()} filas · {ds.empresa_nombre}
                        {ds.tipo_dataset && ds.tipo_dataset !== 'general' && (
                          <span style={{ marginLeft: '6px', textTransform: 'capitalize', color: '#4f46e5', fontWeight: 600 }}>
                            · {ds.tipo_dataset}
                          </span>
                        )}
                      </p>
                      <p className="dataset-item__date">
                        {new Date(ds.created_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className="badge badge--green">{ds.total_filas} reg.</span>
                  </div>
                ))}
              </div>

              {/* CTAs de navegación */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#fafafa',
                borderRadius: '10px',
                border: '1px solid #f0f0f0',
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: 500 }}>
                  ¿Qué deseas hacer con tus datos?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link to="/dashboard" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '9px',
                    background: '#fff', border: '1.5px solid #e5e7eb',
                    color: '#374151', fontSize: '13px', fontWeight: 600,
                    transition: 'border-color .15s',
                  }}>
                    <span style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: '#fff7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#ff6600" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </span>
                    <div>
                      <p style={{ margin: 0, color: '#111827' }}>Ver Dashboard</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>
                        Gráficas y métricas de tus datos
                      </p>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link to="/chatbot" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '9px',
                    background: '#ff6600', border: '1.5px solid #ff6600',
                    color: '#fff', fontSize: '13px', fontWeight: 600,
                  }}>
                    <span style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </span>
                    <div>
                      <p style={{ margin: 0 }}>Analizar con Asistente IA</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
                        Haz preguntas en lenguaje natural
                      </p>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.8)" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
