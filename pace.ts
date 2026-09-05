import { DayDistance, RunActivity, WeeklyStats } from '../types';

/**
 * Calculates pace in seconds per kilometer
 */
export function calculatePaceSeconds(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0.001 || durationSeconds <= 0) return 0;
  return Math.round(durationSeconds / distanceKm);
}

/**
 * Formats pace in seconds into Strava-style "5'24\" /km"
 */
export function formatPace(paceSeconds: number): string {
  if (!paceSeconds || paceSeconds <= 0 || !isFinite(paceSeconds)) {
    return `--'--" /km`;
  }
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}'${paddedSec}" /km`;
}

/**
 * Formats duration in seconds into "00:00:00" or "00:00"
 */
export function formatDuration(totalSeconds: number, alwaysIncludeHours: boolean = false): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  if (hours > 0 || alwaysIncludeHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats duration in human friendly Indonesian text (misal: "1j 15m" atau "42m 10d")
 */
export function formatDurationHuman(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}j ${minutes}m ${seconds > 0 ? `${seconds}d` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}d`;
  }
  return `${seconds} detik`;
}

/**
 * Estimates calories burned while running
 * Formula based on MET ~ 9.8 for moderate running or ~ 1.036 kcal per kg per km
 */
export function estimateCalories(distanceKm: number, weightKg: number = 65): number {
  if (distanceKm <= 0) return 0;
  return Math.round(distanceKm * weightKg * 1.036);
}

/**
 * Format date in Indonesian locale
 */
export function formatIndonesianDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Gets the start (Monday 00:00:00) and end (Sunday 23:59:59) of a week
 */
export function getWeekBoundaries(referenceDate: Date = new Date(), offsetWeeks: number = 0): { start: Date; end: Date } {
  const date = new Date(referenceDate);
  // Apply week offset
  date.setDate(date.getDate() + offsetWeeks * 7);

  // Day in JS: 0 is Sunday, 1 is Monday ... 6 is Saturday
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Move to Monday

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

const INDONESIAN_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const INDONESIAN_SHORT_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/**
 * Calculate weekly statistics from a list of activities
 */
export function calculateWeeklyStats(
  activities: RunActivity[],
  offsetWeeks: number = 0,
  weeklyGoalKm: number = 25
): WeeklyStats {
  const { start, end } = getWeekBoundaries(new Date(), offsetWeeks);

  // Filter activities within this week
  const weekActivities = activities.filter((act) => {
    const actDate = new Date(act.date);
    return actDate >= start && actDate <= end;
  });

  // Prepare the 7 days (Monday to Sunday)
  const dailyDistances: DayDistance[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + i);
    const dayStr = currentDay.toISOString().split('T')[0];

    const dayActivities = weekActivities.filter((act) => {
      const actDayStr = new Date(act.date).toISOString().split('T')[0];
      return actDayStr === dayStr;
    });

    const dayDistance = dayActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const dayDuration = dayActivities.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const avgPace = calculatePaceSeconds(dayDistance, dayDuration);

    dailyDistances.push({
      dayName: INDONESIAN_DAYS[i],
      shortDay: INDONESIAN_SHORT_DAYS[i],
      dateStr: dayStr,
      distanceKm: parseFloat(dayDistance.toFixed(2)),
      avgPaceSeconds: avgPace,
      runsCount: dayActivities.length,
    });
  }

  const totalDistanceKm = parseFloat(
    weekActivities.reduce((sum, act) => sum + act.distanceKm, 0).toFixed(2)
  );
  const totalDurationSeconds = weekActivities.reduce((sum, act) => sum + act.durationSeconds, 0);
  const averagePaceSeconds = calculatePaceSeconds(totalDistanceKm, totalDurationSeconds);
  const totalCalories = weekActivities.reduce((sum, act) => sum + act.calories, 0);

  // Best pace (lowest seconds/km among runs with distance > 0.5km)
  const validPaceRuns = weekActivities.filter((a) => a.distanceKm >= 0.5 && a.paceSeconds > 0);
  const bestPaceSeconds = validPaceRuns.length > 0 ? Math.min(...validPaceRuns.map((a) => a.paceSeconds)) : 0;

  // Longest run
  const longestRunKm = weekActivities.length > 0 ? Math.max(...weekActivities.map((a) => a.distanceKm)) : 0;

  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    totalDistanceKm,
    totalDurationSeconds,
    averagePaceSeconds,
    totalCalories,
    totalRuns: weekActivities.length,
    dailyDistances,
    weeklyGoalKm,
    bestPaceSeconds,
    longestRunKm: parseFloat(longestRunKm.toFixed(2)),
  };
}
