/**
 * Download a server-generated file (PDF, etc.) and open the native share sheet.
 *
 * Uses fetch (with auth cookie) so it works with POST endpoints that require
 * authentication — `FileSystem.downloadAsync` is GET-only and `Linking.openURL`
 * has neither method control nor auth.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_URL } from '@/constants/config';
import { getToken } from '@/lib/auth';

export async function downloadAndShareFile(opts: {
  path: string;          // e.g. /api/admin/certifications/42/generate-pdf
  method?: 'GET' | 'POST';
  filename: string;      // local filename, e.g. rapport-cert-42.pdf
  mimeType?: string;     // defaults to application/pdf
  dialogTitle?: string;
}): Promise<void> {
  const token = await getToken();
  const url = `${API_URL}${opts.path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'POST',
    headers: token ? { Cookie: `token=${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Téléchargement échoué (HTTP ${res.status})`);
  }

  // Convert response → base64 → file on disk
  const blob = await res.blob();
  const base64 = await blobToBase64(blob);
  const fileUri = `${FileSystem.cacheDirectory}${opts.filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Le partage n\'est pas disponible sur cet appareil.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType:    opts.mimeType   ?? 'application/pdf',
    dialogTitle: opts.dialogTitle ?? opts.filename,
    UTI:         opts.mimeType === 'application/pdf' || !opts.mimeType ? 'com.adobe.pdf' : undefined,
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:application/pdf;base64," prefix
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.substring(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}
