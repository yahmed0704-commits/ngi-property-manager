import appConfig, { isRemoteEnabled } from '../config/appConfig';

/**
 * Sync manager — controls when and how local data syncs to the backend.
 *
 * In V1 (current App Store build): sync never runs because backendMode = 'local'.
 * In V2 (future): sync routes local mutations to the API server, which writes
 *   to Google Sheets. Optionally, a pull-on-launch flow refreshes local cache.
 *
 * TODO (V2 backend — implement these when API server is live):
 *
 *   syncOnLaunch():
 *     - Pull latest data from API server into local cache on app start
 *     - Handle conflict resolution (server wins by default)
 *
 *   syncOnMutation():
 *     - After every local write, POST/PATCH to API server
 *     - On failure: queue in an offline mutations store, retry on reconnect
 *
 *   offlineQueue:
 *     - Store failed API calls in AsyncStorage under 'ngi_offline_queue'
 *     - Replay on next successful API connection
 *
 *   conflictResolution:
 *     - For collaborative edits (multiple users on same property), use timestamps
 *     - Server timestamp wins unless user is offline
 */

export interface SyncStatus {
  lastSyncAt: string | null;
  pending: number;
  error: string | null;
}

let _status: SyncStatus = {
  lastSyncAt: null,
  pending: 0,
  error: null,
};

export function getSyncStatus(): SyncStatus {
  return { ..._status };
}

/**
 * Pull all data from the API server into local cache.
 * No-op when remote is not enabled.
 */
export async function syncFromRemote(): Promise<void> {
  if (!isRemoteEnabled()) {
    return;
  }
  // TODO (V2 backend): implement full pull sync
  _status.lastSyncAt = new Date().toISOString();
  _status.error = null;
}

/**
 * Push a local mutation to the API server.
 * No-op when remote is not enabled.
 */
export async function pushMutation(_entity: string, _payload: unknown): Promise<void> {
  if (!isRemoteEnabled()) {
    return;
  }
  // TODO (V2 backend): POST to /api/sync/mutation with entity + payload
}
