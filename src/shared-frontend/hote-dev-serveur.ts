/**
 * Browser hostname for dev API URLs (localhost vs 127.0.0.1). Shared by users / vendors / admin apps.
 */
export function hoteDevServeur(): string {
  if (typeof globalThis !== 'undefined' && 'location' in globalThis && globalThis.location?.hostname) {
    return globalThis.location.hostname;
  }
  return 'localhost';
}
