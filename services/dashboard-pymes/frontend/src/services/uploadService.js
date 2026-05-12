import api from './api';

export const getEmpresas  = ()  => api.get('/empresas');
export const initEmpresa  = ()  => api.post('/empresas/init');

export const uploadCSV = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

export const getDatasets = (empresaId) =>
  api.get('/upload/datasets', { params: empresaId ? { empresa_id: empresaId } : {} });

export const getRegistros = (datasetId, page = 1, limit = 100) =>
  api.get(`/upload/datasets/${datasetId}/registros`, { params: { page, limit } });

export const eliminarDataset = (id) => api.delete(`/upload/datasets/${id}`);
export const limpiarDatasets = ()  => api.delete('/upload/datasets');
