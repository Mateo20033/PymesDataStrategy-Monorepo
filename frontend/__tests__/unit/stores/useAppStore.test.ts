import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store/useAppStore'
import type { Dataset } from '@/types/dataset'
import { DATASET_STATUS } from '@/types/dataset'

const createMockDataset = (overrides: Partial<Dataset> = {}): Dataset => ({
  id: 'ds-1',
  name: 'Test Dataset',
  originalFileName: 'test.csv',
  fileSizeBytes: 1024,
  mimeType: 'text/csv',
  userId: 'user-001',
  status: DATASET_STATUS.PENDING,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      datasets: [],
      selectedDatasetId: null,
      isUploading: false,
      uploadProgress: 0,
      filter: {
        status: 'ALL',
        search: '',
      },
    })
  })

  describe('setDatasets', () => {
    it('should update datasets array', () => {
      // Arrange
      const datasets = [createMockDataset({ id: 'ds-1' }), createMockDataset({ id: 'ds-2' })]

      // Act
      useAppStore.getState().setDatasets(datasets)

      // Assert
      expect(useAppStore.getState().datasets).toHaveLength(2)
      expect(useAppStore.getState().datasets[0].id).toBe('ds-1')
      expect(useAppStore.getState().datasets[1].id).toBe('ds-2')
    })
  })

  describe('addDataset', () => {
    it('should append dataset to array', () => {
      // Arrange
      const initialDataset = createMockDataset({ id: 'ds-1' })
      const newDataset = createMockDataset({ id: 'ds-2' })
      useAppStore.setState({ datasets: [initialDataset] })

      // Act
      useAppStore.getState().addDataset(newDataset)

      // Assert
      expect(useAppStore.getState().datasets).toHaveLength(2)
      expect(useAppStore.getState().datasets[1].id).toBe('ds-2')
    })
  })

  describe('updateDataset', () => {
    it('should update specific dataset by id', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1', name: 'Original Name' })
      useAppStore.setState({ datasets: [dataset] })

      // Act
      useAppStore.getState().updateDataset('ds-1', { name: 'Updated Name' })

      // Assert
      expect(useAppStore.getState().datasets[0].name).toBe('Updated Name')
    })

    it('should not modify if id not found', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1', name: 'Original Name' })
      useAppStore.setState({ datasets: [dataset] })

      // Act
      useAppStore.getState().updateDataset('ds-999', { name: 'Updated Name' })

      // Assert
      expect(useAppStore.getState().datasets[0].name).toBe('Original Name')
    })
  })

  describe('removeDataset', () => {
    it('should remove dataset and clear selectedDatasetId if matches', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1' })
      useAppStore.setState({ datasets: [dataset], selectedDatasetId: 'ds-1' })

      // Act
      useAppStore.getState().removeDataset('ds-1')

      // Assert
      expect(useAppStore.getState().datasets).toHaveLength(0)
      expect(useAppStore.getState().selectedDatasetId).toBeNull()
    })
  })

  describe('selectDataset', () => {
    it('should update selectedDatasetId', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1' })
      useAppStore.setState({ datasets: [dataset] })

      // Act
      useAppStore.getState().selectDataset('ds-1')

      // Assert
      expect(useAppStore.getState().selectedDatasetId).toBe('ds-1')
    })
  })

  describe('setUploading', () => {
    it('should set isUploading and progress (default 0)', () => {
      // Act
      useAppStore.getState().setUploading(true)

      // Assert
      expect(useAppStore.getState().isUploading).toBe(true)
      expect(useAppStore.getState().uploadProgress).toBe(0)
    })

    it('should set isUploading with custom progress', () => {
      // Act
      useAppStore.getState().setUploading(true, 50)

      // Assert
      expect(useAppStore.getState().isUploading).toBe(true)
      expect(useAppStore.getState().uploadProgress).toBe(50)
    })
  })

  describe('setFilter', () => {
    it('should merge partial filter updates', () => {
      // Act
      useAppStore.getState().setFilter({ search: 'test' })

      // Assert
      expect(useAppStore.getState().filter.search).toBe('test')
      expect(useAppStore.getState().filter.status).toBe('ALL')
    })

    it('should update status filter', () => {
      // Act
      useAppStore.getState().setFilter({ status: DATASET_STATUS.READY })

      // Assert
      expect(useAppStore.getState().filter.status).toBe(DATASET_STATUS.READY)
      expect(useAppStore.getState().filter.search).toBe('')
    })
  })

  describe('getFilteredDatasets', () => {
    it('should filter by status', () => {
      // Arrange
      const datasets = [
        createMockDataset({ id: 'ds-1', status: DATASET_STATUS.PENDING }),
        createMockDataset({ id: 'ds-2', status: DATASET_STATUS.READY }),
        createMockDataset({ id: 'ds-3', status: DATASET_STATUS.PENDING }),
      ]
      useAppStore.setState({ 
        datasets, 
        filter: { status: DATASET_STATUS.PENDING, search: '' } 
      })

      // Act
      const filtered = useAppStore.getState().getFilteredDatasets()

      // Assert
      expect(filtered).toHaveLength(2)
      expect(filtered.every(d => d.status === DATASET_STATUS.PENDING)).toBe(true)
    })

    it('should filter by search (case insensitive)', () => {
      // Arrange
      const datasets = [
        createMockDataset({ id: 'ds-1', name: 'Sales Report', originalFileName: 'sales.csv' }),
        createMockDataset({ id: 'ds-2', name: 'User Data', originalFileName: 'users.csv' }),
        createMockDataset({ id: 'ds-3', name: 'Revenue', originalFileName: 'revenue_sales.xlsx' }),
      ]
      useAppStore.setState({ 
        datasets, 
        filter: { status: 'ALL', search: 'SALES' } 
      })

      // Act
      const filtered = useAppStore.getState().getFilteredDatasets()

      // Assert
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('ds-1')
      expect(filtered[1].id).toBe('ds-3')
    })

    it('should return all when status is ALL', () => {
      // Arrange
      const datasets = [
        createMockDataset({ id: 'ds-1', status: DATASET_STATUS.PENDING }),
        createMockDataset({ id: 'ds-2', status: DATASET_STATUS.READY }),
      ]
      useAppStore.setState({ 
        datasets, 
        filter: { status: 'ALL', search: '' } 
      })

      // Act
      const filtered = useAppStore.getState().getFilteredDatasets()

      // Assert
      expect(filtered).toHaveLength(2)
    })
  })

  describe('getSelectedDataset', () => {
    it('should return null when no selection', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1' })
      useAppStore.setState({ datasets: [dataset], selectedDatasetId: null })

      // Act
      const selected = useAppStore.getState().getSelectedDataset()

      // Assert
      expect(selected).toBeNull()
    })

    it('should return selected dataset when exists', () => {
      // Arrange
      const dataset = createMockDataset({ id: 'ds-1', name: 'Selected Dataset' })
      useAppStore.setState({ datasets: [dataset], selectedDatasetId: 'ds-1' })

      // Act
      const selected = useAppStore.getState().getSelectedDataset()

      // Assert
      expect(selected).not.toBeNull()
      expect(selected?.name).toBe('Selected Dataset')
    })
  })
})
