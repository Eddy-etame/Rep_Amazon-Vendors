import { sha256Hex } from './crypto';

export async function buildFingerprint(): Promise<string> {
  const ua = navigator.userAgent ?? 'ua';
  const lang = navigator.language ?? 'lang';
  const platform = navigator.platform ?? 'platform';
  return sha256Hex(`${ua}|${lang}|${platform}`);
}
