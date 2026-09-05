export type RunType = 'easy' | 'tempo' | 'long' | 'intervals' | 'race' | 'trail';

export interface RunActivity {
  id: string;
  title: string;
  date: string; // ISO format e.g. 2026-09-04T07:30:00.000Z
  distanceKm: number;
  durationSeconds: number;
  paceSeconds: number; // in seconds per kilometer
  paceFormatted: string; // e.g. "5'14\" /km"
  calories: number;
  type: RunType;
  notes?: string;
  rpe?: number; // 1-10 Effort scale
  syncedToSheets?: boolean;
  syncedAt?: string;
  splits?: { km: number; paceFormatted: string; durationSeconds: number }[];
}

export interface DayDistance {
  dayName: string;
  shortDay: string;
  dateStr: string;
  distanceKm: number;
  avgPaceSeconds: number;
  runsCount: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  averagePaceSeconds: number;
  totalCalories: number;
  totalRuns: number;
  dailyDistances: DayDistance[];
  weeklyGoalKm: number;
  bestPaceSeconds: number;
  longestRunKm: number;
}

export interface AppsScriptConfig {
  webAppUrl: string;
  sheetName: string;
  lastSyncTime?: string;
  autoSync: boolean;
  spreadsheetUrl?: string;
}

export type ViewTab = 'dashboard' | 'tracker' | 'history' | 'settings';
