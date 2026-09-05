import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Flame,
  Zap,
  Clock,
  Gauge,
  CheckCircle2,
  Sheet,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { RunActivity, RunType } from '../types';
import {
  calculatePaceSeconds,
  formatPace,
  formatDuration,
  estimateCalories,
} from '../utils/pace';
import { sounds } from '../utils/audio';

interface LiveTrackerProps {
  onSaveRun: (activity: RunActivity) => Promise<{ success: boolean; message: string }>;
  isSheetsConnected: boolean;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({
  onSaveRun,
  isSheetsConnected,
}) => {
  // Tracking State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [paceSeconds, setPaceSeconds] = useState(0);

  // Simulation speed preset (for testing anytime)
  const [simSpeedPreset, setSimSpeedPreset] = useState<'easy' | 'moderate' | 'tempo' | 'manual'>(
    'moderate'
  );

  // Saving Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [runTitle, setRunTitle] = useState('Lari Pagi');
  const [runType, setRunType] = useState<RunType>('easy');
  const [runRpe, setRunRpe] = useState(5);
  const [runNotes, setRunNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Splits tracking (each 1 km)
  const [splits, setSplits] = useState<{ km: number; paceFormatted: string; durationSeconds: number }[]>([]);
  const lastSplitKmRef = useRef<number>(0);

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speed mapping for simulation (in meters per second)
  // Easy: ~5'30" /km -> 3.03 m/s
  // Moderate: ~5'00" /km -> 3.33 m/s
  // Tempo: ~4'20" /km -> 3.84 m/s
  const getSpeedMetersPerSec = () => {
    switch (simSpeedPreset) {
      case 'easy':
        return 3.03; // ~5:30/km
      case 'moderate':
        return 3.33; // ~5:00/km
      case 'tempo':
        return 3.84; // ~4:20/km
      default:
        return 3.33;
    }
  };

  // Stopwatch effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prevSec) => {
          const newSec = prevSec + 1;

          // Increment distance based on speed
          const mps = getSpeedMetersPerSec();
          // Add subtle natural variation +/- 3%
          const jitter = 1 + (Math.random() * 0.06 - 0.03);
          const addedKm = (mps * jitter) / 1000;

          setDistanceKm((prevDist) => {
            const newDist = parseFloat((prevDist + addedKm).toFixed(3));

            // Check if 1 km mark passed for split notification
            const completedKms = Math.floor(newDist);
            if (completedKms > lastSplitKmRef.current && completedKms > 0) {
              lastSplitKmRef.current = completedKms;
              sounds.playSplitLap();
              const lapPaceSec = calculatePaceSeconds(newDist, newSec);
              setSplits((prev) => [
                ...prev,
                {
                  km: completedKms,
                  paceFormatted: formatPace(lapPaceSec),
                  durationSeconds: newSec,
                },
              ]);
            }

            // Calculate current live pace
            const livePace = calculatePaceSeconds(newDist, newSec);
            setPaceSeconds(livePace);

            return newDist;
          });

          return newSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, simSpeedPreset]);

  // Handle Controls
  const handleStart = () => {
    sounds.playStart();
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    sounds.playPause();
    setIsPaused(true);
  };

  const handleResume = () => {
    sounds.playStart();
    setIsPaused(false);
  };

  const handleFinishPrompt = () => {
    sounds.playFinish();
    setIsPaused(true);

    // Auto title based on time of day
    const hour = new Date().getHours();
    let timeGreeting = 'Lari Pagi';
    if (hour >= 11 && hour < 15) timeGreeting = 'Lari Siang';
    else if (hour >= 15 && hour < 18) timeGreeting = 'Lari Sore';
    else if (hour >= 18) timeGreeting = 'Lari Malam';

    setRunTitle(`${timeGreeting} (${distanceKm.toFixed(2)} km)`);
    setShowSaveModal(true);
  };

  const handleReset = () => {
    if (isRunning && distanceKm > 0) {
      if (!window.confirm('Batalkan sesi lari ini dan reset meteran?')) return;
    }
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setDistanceKm(0);
    setPaceSeconds(0);
    setSplits([]);
    lastSplitKmRef.current = 0;
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distanceKm <= 0.05) {
      alert('Jarak lari terlalu pendek untuk disimpan (minimal 0.05 km).');
      return;
    }

    setIsSubmitting(true);
    setSaveStatusMessage('Menyimpan data dan sinkronisasi ke Google Sheets...');

    const calculatedPaceSec = calculatePaceSeconds(distanceKm, elapsedSeconds);
    const calories = estimateCalories(distanceKm);

    const newActivity: RunActivity = {
      id: `run-${Date.now()}`,
      title: runTitle.trim() || 'Aktivitas Lari',
      date: new Date().toISOString(),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationSeconds: elapsedSeconds,
      paceSeconds: calculatedPaceSec,
      paceFormatted: formatPace(calculatedPaceSec),
      calories,
      type: runType,
      notes: runNotes.trim(),
      rpe: runRpe,
      splits,
    };

    try {
      const result = await onSaveRun(newActivity);
      setIsSubmitting(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FC5200', '#F97316', '#10B981', '#FBBF24'],
      });

      setShowSaveModal(false);
      handleReset();
    } catch (err: any) {
      setIsSubmitting(false);
      setSaveStatusMessage(`Peringatan: ${err.message || 'Gagal menyimpan'}`);
    }
  };

  const currentCalories = estimateCalories(distanceKm);
  const currentSpeed =
    elapsedSeconds > 0 && distanceKm > 0
      ? ((distanceKm / elapsedSeconds) * 3600).toFixed(1)
      : '0.0';

  return (
    <div id="live-tracker-container" className="space-y-6">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between rounded-2xl bg-[#111111] p-4 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isRunning
                ? isPaused
                  ? 'bg-amber-400'
                  : 'bg-[#e1ff00] animate-ping'
                : 'bg-zinc-600'
            }`}
          />
          <span className="text-xs font-mono font-bold uppercase tracking-wide text-zinc-300">
            {!isRunning
              ? 'GPS Tracker Standby'
              : isPaused
              ? 'Session Paused'
              : 'Tracking Active Run...'}
          </span>
        </div>

        {/* Real-time Google Sheets status indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Sheet className="h-3.5 w-3.5 text-[#e1ff00]" />
          <span>
            {isSheetsConnected ? (
              <span className="text-[#e1ff00] font-bold uppercase">Google Sheets Live Sync</span>
            ) : (
              <span className="text-zinc-500 uppercase">Local Storage Mode</span>
            )}
          </span>
        </div>
      </div>

      {/* Hero Display Panel */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-10 border border-zinc-800 shadow-2xl text-center">
        {/* Main Distance */}
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1 font-mono">
            Elapsed Distance
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-black italic tracking-tighter text-white">
              {distanceKm.toFixed(2)}
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#e1ff00]">KM</span>
          </div>
        </div>

        {/* Secondary Metrics Row: Pace, Time, Calories */}
        <div className="grid grid-cols-3 gap-3 border-y border-zinc-800 py-6">
          {/* Live Pace */}
          <div className="border-r border-zinc-800 pr-2">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              <Zap className="h-3.5 w-3.5 text-[#e1ff00]" />
              Pace
            </div>
            <div className="text-2xl sm:text-4xl font-mono font-bold text-[#e1ff00]">
              {formatPace(paceSeconds).replace(' /km', '')}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">/KM</div>
          </div>

          {/* Duration */}
          <div className="border-r border-zinc-800 px-2">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Duration
            </div>
            <div className="text-2xl sm:text-4xl font-mono font-bold text-white tracking-wider">
              {formatDuration(elapsedSeconds)}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">TIME</div>
          </div>

          {/* Calories / Speed */}
          <div className="pl-2">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              Calories
            </div>
            <div className="text-2xl sm:text-4xl font-mono font-bold text-white">
              {currentCalories}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">{currentSpeed} KM/H</div>
          </div>
        </div>

        {/* Simulation Pace Selector (Easy, Moderate, Tempo) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
          <span className="text-zinc-500 flex items-center gap-1 text-xs">
            <Sliders className="h-3.5 w-3.5" /> Pacing Preset:
          </span>
          {(['easy', 'moderate', 'tempo'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setSimSpeedPreset(preset)}
              className={`rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-tight transition ${
                simSpeedPreset === preset
                  ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {preset === 'easy' && "Easy (5'30\")"}
              {preset === 'moderate' && "Normal (5'00\")"}
              {preset === 'tempo' && "Tempo (4'20\")"}
            </button>
          ))}
        </div>

        {/* Big Action Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {!isRunning ? (
            <button
              id="btn-start-run"
              onClick={handleStart}
              className="flex items-center gap-3 rounded-2xl bg-[#e1ff00] px-9 py-4 text-base font-black tracking-wider uppercase text-black shadow-2xl shadow-[#e1ff00]/20 hover:brightness-110 active:scale-95 transition"
            >
              <Play className="h-5 w-5 fill-black" />
              START RUN
            </button>
          ) : (
            <>
              {/* Pause or Resume */}
              {isPaused ? (
                <button
                  id="btn-resume-run"
                  onClick={handleResume}
                  className="flex items-center gap-2 rounded-2xl bg-[#e1ff00] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition"
                >
                  <Play className="h-4 w-4 fill-black" />
                  RESUME
                </button>
              ) : (
                <button
                  id="btn-pause-run"
                  onClick={handlePause}
                  className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-700 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 active:scale-95 transition"
                >
                  <Pause className="h-4 w-4 fill-white" />
                  PAUSE
                </button>
              )}

              {/* Finish & Save */}
              <button
                id="btn-finish-run"
                onClick={handleFinishPrompt}
                className="flex items-center gap-2 rounded-2xl bg-[#e1ff00] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#e1ff00]/20 hover:brightness-110 active:scale-95 transition"
              >
                <Square className="h-4 w-4 fill-black" />
                FINISH & SAVE
              </button>

              {/* Reset */}
              <button
                id="btn-reset-run"
                onClick={handleReset}
                title="Reset Meteran"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Split Lap List */}
      {splits.length > 0 && (
        <div className="rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2 font-mono">
            <Gauge className="h-4 w-4 text-[#e1ff00]" />
            Kilometer Splits
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {splits.map((s) => (
              <div key={s.km} className="rounded-2xl bg-[#050505] p-3 border border-zinc-800 font-mono">
                <span className="text-[10px] uppercase font-bold text-zinc-500">KM {s.km}</span>
                <div className="text-base font-bold text-[#e1ff00] my-0.5">{s.paceFormatted}</div>
                <span className="text-[10px] text-zinc-500">{formatDuration(s.durationSeconds)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Save Activity to Google Sheets */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#111111] p-6 sm:p-7 border border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Save Run Activity</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Real-time synchronization to Google Sheets & local cache.
                </p>
              </div>
              <span className="rounded-full bg-[#e1ff00]/15 px-3 py-1 text-xs font-mono font-bold text-[#e1ff00] border border-[#e1ff00]/30">
                {distanceKm.toFixed(2)} KM
              </span>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  placeholder="e.g. Morning Progression Run"
                  className="w-full rounded-2xl bg-[#050505] px-4 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                />
              </div>

              {/* Type & RPE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                    Run Category
                  </label>
                  <select
                    value={runType}
                    onChange={(e) => setRunType(e.target.value as RunType)}
                    className="w-full rounded-2xl bg-[#050505] px-3.5 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                  >
                    <option value="easy">Easy Run</option>
                    <option value="tempo">Tempo Run</option>
                    <option value="long">Long Run</option>
                    <option value="intervals">Intervals</option>
                    <option value="race">Race</option>
                    <option value="trail">Trail Run</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                    Effort (RPE: {runRpe}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={runRpe}
                    onChange={(e) => setRunRpe(parseInt(e.target.value))}
                    className="w-full accent-[#e1ff00] mt-2"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>1 (Light)</span>
                    <span>10 (Max)</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats Pill */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#050505] p-3 border border-zinc-800 text-center font-mono">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500">Distance</span>
                  <div className="text-sm font-bold text-white mt-0.5">{distanceKm.toFixed(2)} KM</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500">Time</span>
                  <div className="text-sm font-bold text-white mt-0.5">{formatDuration(elapsedSeconds)}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Pace</span>
                  <div className="text-sm font-bold text-[#e1ff00] mt-0.5">
                    {formatPace(calculatePaceSeconds(distanceKm, elapsedSeconds))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                  Activity Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                  placeholder="Weather conditions, trail feedback, running shoes..."
                  className="w-full rounded-2xl bg-[#050505] px-4 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                />
              </div>

              {/* Sheets status info */}
              <div className="flex items-center gap-2.5 text-xs rounded-2xl p-3 bg-[#050505] border border-zinc-800">
                {isSheetsConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#e1ff00] shrink-0" />
                    <span className="text-xs font-mono text-zinc-300">
                      Real-time Google Sheets sync ready. Row will append automatically.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-mono text-zinc-300">
                      Google Apps Script not connected. Run will save in local storage.
                    </span>
                  </>
                )}
              </div>

              {saveStatusMessage && (
                <p className="text-xs font-mono text-rose-400">{saveStatusMessage}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-2xl bg-[#e1ff00] px-6 py-2.5 text-xs font-mono font-bold uppercase text-black shadow-lg shadow-[#e1ff00]/20 hover:brightness-110 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
