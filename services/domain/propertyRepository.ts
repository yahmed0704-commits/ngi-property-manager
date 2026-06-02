import { Property } from '@/types';
import appConfig from '../config/appConfig';
import { storage } from '../storage/asyncStorageAdapter';
import { apiRequest } from '../api/apiClient';

const LOCAL_KEY = 'ngi_properties_v2';

/**
 * Property repository — local mode now, remote mode later.
 *
 * In 'local' mode:  reads/writes directly from AsyncStorage.
 * In 'sheets' mode: delegates to the secure NGI API server.
 *
 * TODO (V2 backend): Wire the remote branches to the API server endpoints:
 *   GET  /api/properties          → list all
 *   POST /api/properties          → create
 *   PATCH /api/properties/:id     → update
 *   DELETE /api/properties/:id    → delete
 */
export const propertyRepository = {
  async getAll(): Promise<Property[]> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<Property[]>('/api/properties');
    }
    return (await storage.get<Property[]>(LOCAL_KEY)) ?? [];
  },

  async save(properties: Property[]): Promise<void> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): bulk save via API
      return;
    }
    await storage.set(LOCAL_KEY, properties);
  },

  async create(property: Property): Promise<Property> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<Property>('/api/properties', { method: 'POST', body: property });
    }
    const all = await this.getAll();
    const updated = [...all, property];
    await storage.set(LOCAL_KEY, updated);
    return property;
  },

  async update(id: string, changes: Partial<Property>): Promise<Property | null> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<Property>(`/api/properties/${id}`, { method: 'PATCH', body: changes });
    }
    const all = await this.getAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    await storage.set(LOCAL_KEY, all);
    return all[idx];
  },

  async delete(id: string): Promise<void> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): await apiRequest<void>(`/api/properties/${id}`, { method: 'DELETE' });
      return;
    }
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, all.filter((p) => p.id !== id));
  },
};
