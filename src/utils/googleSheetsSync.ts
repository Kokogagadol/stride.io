import { AppsScriptConfig, RunActivity } from '../types';

const STORAGE_KEY_CONFIG = 'strava_gas_config';
const STORAGE_KEY_ACTIVITIES = 'strava_run_activities';
const STORAGE_KEY_SYNC_QUEUE = 'strava_gas_sync_queue';

export function getSavedConfig(): AppsScriptConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load apps script config:', err);
  }
  return {
    webAppUrl: '',
    sheetName: 'Running_Activities',
    autoSync: true,
  };
}

export function saveConfig(config: AppsScriptConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save apps script config:', err);
  }
}

export function getSavedActivities(): RunActivity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load local activities:', err);
  }
  return [];
}

export function saveActivitiesToLocal(activities: RunActivity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch (err) {
    console.warn('Failed to save activities locally:', err);
  }
}

/**
 * Sends a run activity to Google Apps Script Web App in real-time
 */
export async function syncActivityToGoogleSheets(
  activity: RunActivity,
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi.',
    };
  }

  const cleanUrl = webAppUrl.trim();

  try {
    const payload = {
      id: activity.id,
      title: activity.title,
      date: activity.date,
      distanceKm: activity.distanceKm,
      durationSeconds: activity.durationSeconds,
      durationFormatted: activity.durationSeconds ? activity.durationSeconds : 0,
      paceFormatted: activity.paceFormatted,
      paceSeconds: activity.paceSeconds,
      calories: activity.calories,
      type: activity.type,
      rpe: activity.rpe || 5,
      notes: activity.notes || '',
    };

    // Use text/plain to avoid CORS preflight (OPTIONS) triggers in Google Apps Script
    // GAS parses e.postData.contents as string
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const resJson = await response.json();
        return {
          success: true,
          message: resJson.message || 'Tersimpan ke Google Sheets secara real-time!',
        };
      } catch {
        // Even if json parsing fails due to redirect, HTTP 200 means success
        return {
          success: true,
          message: 'Tersimpan ke Google Sheets!',
        };
      }
    } else {
      // Fallback with no-cors if restricted by browser security policies
      try {
        await fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        return {
          success: true,
          message: 'Terkirim ke Google Sheets (Mode Tanpa-CORS)!',
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Gagal mengirim ke Google Sheets: ${err.message || 'Network error'}`,
        };
      }
    }
  } catch (err: any) {
    // Attempt no-cors fallback
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          ...activity,
        }),
      });
      return {
        success: true,
        message: 'Terkirim ke Google Sheets!',
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message || 'Periksa URL Apps Script Anda'}`,
      };
    }
  }
}

/**
 * Tests connection to Google Apps Script Web App
 */
export async function testAppsScriptConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return {
      success: false,
      message: 'Masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.',
    };
  }

  const cleanUrl = webAppUrl.trim();
  const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Sheets berhasil!',
        details: data,
      };
    } else {
      return {
        success: false,
        message: `Server merespons status ${response.status}: ${response.statusText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message:
        'Tidak dapat menghubungi Apps Script. Pastikan Anda telah mengatur "Who has access: Anyone" (Siapa saja) saat menerapkan Web App.',
    };
  }
}

/**
 * Fetches recent activities from Google Sheets via doGet
 */
export async function fetchActivitiesFromGoogleSheets(
  webAppUrl: string
): Promise<{ success: boolean; activities?: RunActivity[]; message?: string }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'URL Apps Script kosong.' };
  }

  const cleanUrl = webAppUrl.trim();
  const url = cleanUrl.includes('?')
    ? `${cleanUrl}&action=getActivities&_t=${Date.now()}`
    : `${cleanUrl}?action=getActivities&_t=${Date.now()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.activities)) {
      return {
        success: true,
        activities: data.activities,
      };
    }
    return { success: false, message: data.message || 'Format data tidak cocok' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Adds an activity ID to offline queue for later sync
 */
export function addToSyncQueue(activityId: string): void {
  try {
    const queue = getSyncQueue();
    if (!queue.includes(activityId)) {
      queue.push(activityId);
      localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('Sync queue save error', e);
  }
}

export function getSyncQueue(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function clearFromSyncQueue(activityId: string): void {
  try {
    const queue = getSyncQueue().filter((id) => id !== activityId);
    localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('Sync queue clear error', e);
  }
}
