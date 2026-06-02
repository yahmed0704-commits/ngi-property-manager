export type BackendMode = 'local' | 'sheets';

export interface AppConfig {
  backendMode: BackendMode;
  apiBaseUrl: string;
}

/**
 * Central app configuration.
 *
 * backendMode: 'local'  → all data reads/writes go through AsyncStorage (default, App Store build)
 * backendMode: 'sheets' → all data reads/writes go through the secure API server,
 *                         which talks to Google Sheets on behalf of the user.
 *
 * apiBaseUrl: empty string means no backend is configured. Remote sync will not run.
 *
 * TODO (V2 backend): Replace these defaults by reading from a secure env config or
 * a user-authenticated settings endpoint. Never store Google credentials here.
 */
const appConfig: AppConfig = {
  backendMode: 'local',
  apiBaseUrl: '',
};

export function isRemoteEnabled(): boolean {
  return appConfig.backendMode === 'sheets' && appConfig.apiBaseUrl.length > 0;
}

export default appConfig;
