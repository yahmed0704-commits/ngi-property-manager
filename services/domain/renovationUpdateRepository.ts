import { RenovationUpdate } from '@/types';
import appConfig from '../config/appConfig';
import { storage } from '../storage/asyncStorageAdapter';

const LOCAL_KEY = 'ngi_renovation_updates_v1';

/**
 * Renovation update repository — local mode now, remote mode later.
 *
 * Renovation updates are progress log entries per property: title, phase,
 * percent complete, description, and optional photo references.
 *
 * TODO (V2 backend): Wire remote branches:
 *   GET  /api/renovation-updates?propertyId=...  → list by property
 *   POST /api/renovation-updates                  → create update + optional photos
 *   PATCH /api/renovation-updates/:id             → edit
 *   DELETE /api/renovation-updates/:id            → delete (Admin/PM only)
 */
export const renovationUpdateRepository = {
  async getAll(): Promise<RenovationUpdate[]> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<RenovationUpdate[]>('/api/renovation-updates');
    }
    return (await storage.get<RenovationUpdate[]>(LOCAL_KEY)) ?? [];
  },

  async getByProperty(propertyId: string): Promise<RenovationUpdate[]> {
    const all = await this.getAll();
    return all.filter((u) => u.propertyId === propertyId);
  },

  async create(update: RenovationUpdate): Promise<RenovationUpdate> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<RenovationUpdate>('/api/renovation-updates', { method: 'POST', body: update });
    }
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, [...all, update]);
    return update;
  },

  async update(id: string, changes: Partial<RenovationUpdate>): Promise<RenovationUpdate | null> {
    const all = await this.getAll();
    const idx = all.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    await storage.set(LOCAL_KEY, all);
    return all[idx];
  },

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, all.filter((u) => u.id !== id));
  },
};
