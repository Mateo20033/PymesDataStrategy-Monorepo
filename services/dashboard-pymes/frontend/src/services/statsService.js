import api from './api';

export const getDashboardStats = (datasetIds) => {
  const params = datasetIds && datasetIds.length > 0
    ? { dataset_ids: datasetIds.join(',') }
    : {};
  return api.get('/stats/dashboard', { params });
};
