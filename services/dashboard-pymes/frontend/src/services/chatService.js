import axios from 'axios';

const agentApi = axios.create({
  baseURL: process.env.REACT_APP_AGENT_URL || 'http://localhost:8000',
  timeout: 90000,
});

export const enviarPregunta = (pregunta, datasetId = null, empresaId = null) =>
  agentApi.post('/query', {
    pregunta,
    dataset_id: datasetId ? Number(datasetId) : null,
    empresa_id: empresaId ? Number(empresaId) : null,
  });
