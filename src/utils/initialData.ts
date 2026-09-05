import { RunActivity } from '../types';

export const INITIAL_ACTIVITIES: RunActivity[] = [
  {
    id: 'run-seed-1',
    title: 'Morning Easy Run Gelora Bung Karno',
    date: '2026-09-04T06:15:00.000Z', // Today (Friday)
    distanceKm: 5.24,
    durationSeconds: 1684, // 28m 04s
    paceSeconds: 321, // 5'21" /km
    paceFormatted: "5'21\" /km",
    calories: 354,
    type: 'easy',
    notes: 'Pagi cerah dan udara segar. Lari santai menjaga detak jantung di Zona 2.',
    rpe: 5,
    syncedToSheets: true,
    splits: [
      { km: 1, paceFormatted: "5'28\" /km", durationSeconds: 328 },
      { km: 2, paceFormatted: "5'22\" /km", durationSeconds: 322 },
      { km: 3, paceFormatted: "5'19\" /km", durationSeconds: 319 },
      { km: 4, paceFormatted: "5'18\" /km", durationSeconds: 318 },
      { km: 5, paceFormatted: "5'15\" /km", durationSeconds: 315 },
    ],
  },
  {
    id: 'run-seed-2',
    title: 'Tempo Threshold Run Senayan',
    date: '2026-09-02T17:40:00.000Z', // Wednesday
    distanceKm: 7.5,
    durationSeconds: 2205, // 36m 45s
    paceSeconds: 294, // 4'54" /km
    paceFormatted: "4'54\" /km",
    calories: 512,
    type: 'tempo',
    notes: 'Target pace sub-5 berhasil dipertahankan stabil dari km ke-2 sampai selesai!',
    rpe: 8,
    syncedToSheets: true,
    splits: [
      { km: 1, paceFormatted: "5'10\" /km", durationSeconds: 310 },
      { km: 2, paceFormatted: "4'56\" /km", durationSeconds: 296 },
      { km: 3, paceFormatted: "4'52\" /km", durationSeconds: 292 },
      { km: 4, paceFormatted: "4'50\" /km", durationSeconds: 290 },
      { km: 5, paceFormatted: "4'49\" /km", durationSeconds: 289 },
      { km: 6, paceFormatted: "4'55\" /km", durationSeconds: 295 },
      { km: 7, paceFormatted: "4'58\" /km", durationSeconds: 298 },
    ],
  },
  {
    id: 'run-seed-3',
    title: 'Recovery Run Keliling Komplek',
    date: '2026-08-31T06:30:00.000Z', // Monday
    distanceKm: 4.1,
    durationSeconds: 1476, // 24m 36s
    paceSeconds: 360, // 6'00" /km
    paceFormatted: "6'00\" /km",
    calories: 275,
    type: 'easy',
    notes: 'Pemulihan pasca long run akhir pekan. Kaki terasa ringan.',
    rpe: 4,
    syncedToSheets: true,
  },
  {
    id: 'run-seed-4',
    title: 'Sunday Long Run Bintaro Loop',
    date: '2026-08-30T05:45:00.000Z', // Previous Sunday
    distanceKm: 14.2,
    durationSeconds: 4771, // 1h 19m 31s
    paceSeconds: 336, // 5'36" /km
    paceFormatted: "5'36\" /km",
    calories: 968,
    type: 'long',
    notes: 'Hydration stop di km 7 dan 11. Kondisi hidrasi bagus sepanjang rute.',
    rpe: 7,
    syncedToSheets: true,
  },
  {
    id: 'run-seed-5',
    title: 'Interval 8x400m Track Session',
    date: '2026-08-27T19:00:00.000Z', // Previous Thursday
    distanceKm: 6.0,
    durationSeconds: 1800, // 30m 00s
    paceSeconds: 300, // 5'00" /km
    paceFormatted: "5'00\" /km",
    calories: 420,
    type: 'intervals',
    notes: '8 repetisi 400m dengan istirahat 90 detik antar repetisi.',
    rpe: 9,
    syncedToSheets: true,
  },
];
