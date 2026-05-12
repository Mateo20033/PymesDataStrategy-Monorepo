import React from 'react';

const COLORS = {
  indigo:  { bg: '#fff0e6', icon: '#ff6600', border: '#ff6600' },
  green:   { bg: '#d1fae5', icon: '#059669', border: '#059669' },
  orange:  { bg: '#fef3c7', icon: '#d97706', border: '#d97706' },
  red:     { bg: '#fee2e2', icon: '#dc2626', border: '#dc2626' },
};

const MetricCard = ({ titulo, valor, subtitulo, icono, color = 'indigo', tendencia }) => {
  const c = COLORS[color] || COLORS.indigo;
  const esPositive = tendencia >= 0;

  return (
    <div className="metric-card" style={{ borderLeft: `4px solid ${c.border}` }}>
      <div className="metric-card__header">
        <div>
          <p className="metric-card__titulo">{titulo}</p>
          <p className="metric-card__valor">{valor}</p>
        </div>
        <div className="metric-card__icon" style={{ backgroundColor: c.bg, color: c.icon }}>
          {icono}
        </div>
      </div>
      <div className="metric-card__footer">
        {tendencia !== undefined && (
          <span
            className="metric-card__tendencia"
            style={{ color: esPositive ? '#059669' : '#dc2626' }}
          >
            {esPositive ? '▲' : '▼'} {Math.abs(tendencia)}%
          </span>
        )}
        {subtitulo && <span className="metric-card__subtitulo">{subtitulo}</span>}
      </div>
    </div>
  );
};

export default MetricCard;
