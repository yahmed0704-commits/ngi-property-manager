import { MaintenanceRequest } from '@/types';
import appConfig from '../config/appConfig';
import { storage } from '../storage/asyncStorageAdapter';

const LOCAL_KEY = 'ngi_maintenance';

/**
 * Maintenance request repository — local mode now, remote mode later.
 *
 * TODO (V2 backend): Wire remote branches:
 *   GET  /api/maintenance                   → list all (Admin/Partner/PM)
 *   GET  /api/maintenance?unitId=...        → by unit
 *   POST /api/maintenance                   → create (also notify Tenant via push?)
 *   PATCH /api/maintenance/:id              → update status / assign vendor
 *   PATCH /api/maintenance/:id/complete     → mark completed with actual cost
 *   DELETE /api/maintenance/:id            → delete (Admin only)
 */
export const maintenanceRepository = {
  async getAll(): Promise<MaintenanceRequest[]> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<MaintenanceRequest[]>('/api/maintenance');
    }
    return (await storage.get<MaintenanceRequest[]>(LOCAL_KEY)) ?? [];
  },

  async getByUnit(unitId: string): Promise<MaintenanceRequest[]> {
    const all = await this.getAll();
    return all.filter((r) => r.unitId === unitId);
  },

  async save(requests: MaintenanceRequest[]): Promise<void> {
    await storage.set(LOCAL_KEY, requests);
  },

  async create(request: MaintenanceRequest): Promise<MaintenanceRequest> {
    if (appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl) {
      // TODO (V2 backend): return apiRequest<MaintenanceRequest>('/api/maintenance', { method: 'POST', body: request });
    }
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, [...all, request]);
    return request;
  },

  async update(id: string, changes: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | null> {
    const all = await this.getAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    await storage.set(LOCAL_KEY, all);
    return all[idx];
  },

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    await storage.set(LOCAL_KEY, all.filter((r) => r.id !== id));
  },
};
