import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, Sheet, Zap, Clock, Flame } from 'lucide-react';
import { RunActivity, RunType } from '../types';
import {
  calculatePaceSeconds,
  formatPace,
  estimateCalories,
} from '../utils/pace';

interface ManualRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRun: (activity: RunActivity) => Promise<{ success: boolean; message: string }>;
  isSheetsConnected: boolean;
}

export const ManualRunModal: React.FC<ManualRunModalProps> = ({
  isOpen,
  onClose,
  onSaveRun,
  isSheetsConnected,
}) => {
  const [title, setTitle] = useState('Lari Sore');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM
  const [distanceKmStr, setDistanceKmStr] = useState('5.0');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('27');
  const [seconds, setSeconds] = useState('30');
  const [type, setType] = useState<RunType>('easy');
  const [rpe, setRpe] = useState(6);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live pace & duration
  const totalDurationSeconds =
    (parseInt(hours) || 0) * 3600 +
    (parseInt(minutes) || 0) * 60 +
    (parseInt(seconds) || 0);

  const distanceKm = parseFloat(distanceKmStr) || 0;
  const paceSeconds = calculatePaceSeconds(distanceKm, totalDurationSeconds);
  const paceFormatted = formatPace(paceSeconds);
  const estimatedCalories = estimateCalories(distanceKm);
  const avgSpeed =
    totalDurationSeconds > 0 && distanceKm > 0
      ? ((distanceKm / totalDurationSeconds) * 3600).toFixed(1)
      : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distanceKm <= 0) {
      setErrorMsg('Masukkan jarak tempuh lari yang valid (lebih dari 0 km).');
      return;
    }
    if (totalDurationSeconds <= 0) {
      setErrorMsg('Masukkan durasi lari yang valid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const activity: RunActivity = {
      id: `run-${Date.now()}`,
      title: title.trim() || 'Aktivitas Lari',
      date: new Date(date).toISOString(),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationSeconds: totalDurationSeconds,
      paceSeconds,
      paceFormatted,
      calories: estimatedCalories,
      type,
      rpe,
      notes: notes.trim(),
    };

    try {
      await onSaveRun(activity);
      setIsSubmitting(false);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FC5200', '#F97316', '#10B981'],
      });

      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal menyimpan aktivitas lari.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#111111] p-6 sm:p-7 border border-zinc-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Manual Run Logger</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Input session metrics to compute pace splits & sync with Google Sheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
              Activity Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Easy Tempo 5K Session"
              className="w-full rounded-2xl bg-[#050505] px-4 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
              Date & Timestamp
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl bg-[#050505] px-4 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
            />
          </div>

          {/* Distance & Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Distance */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                Distance (Kilometers)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="150"
                  required
                  value={distanceKmStr}
                  onChange={(e) => setDistanceKmStr(e.target.value)}
                  placeholder="5.00"
                  className="w-full rounded-2xl bg-[#050505] px-4 py-2.5 text-xs font-mono font-bold text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none pr-12"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-[#e1ff00]">
                  KM
                </span>
              </div>
            </div>

            {/* Duration (Hours, Minutes, Seconds) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                Duration (H : M : S)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full rounded-2xl bg-[#050505] px-2 py-2.5 text-center text-xs font-mono font-bold text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                  />
                  <span className="block text-center text-[9px] font-mono text-zinc-500 uppercase mt-0.5">HR</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full rounded-2xl bg-[#050505] px-2 py-2.5 text-center text-xs font-mono font-bold text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                  />
                  <span className="block text-center text-[9px] font-mono text-zinc-500 uppercase mt-0.5">MIN</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    className="w-full rounded-2xl bg-[#050505] px-2 py-2.5 text-center text-xs font-mono font-bold text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                  />
                  <span className="block text-center text-[9px] font-mono text-zinc-500 uppercase mt-0.5">SEC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Badge: Pace & Speed */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#050505] p-3.5 border border-zinc-800 font-mono">
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
                <Zap className="h-3 w-3 text-[#e1ff00]" />
                Avg Pace
              </div>
              <div className="text-base font-bold text-[#e1ff00] mt-0.5">
                {paceFormatted}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
                <Clock className="h-3 w-3 text-zinc-400" />
                Avg Speed
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {avgSpeed} <span className="text-xs text-zinc-500">KM/H</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
                <Flame className="h-3 w-3 text-rose-400" />
                Est Burn
              </div>
              <div className="text-base font-bold text-zinc-300 mt-0.5">
                {estimatedCalories} <span className="text-xs text-zinc-500">KCAL</span>
              </div>
            </div>
          </div>

          {/* Type & RPE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
                Run Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RunType)}
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
                Effort (RPE: {rpe}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full accent-[#e1ff00] mt-1.5"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span>Light</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5 font-mono">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shoe wear, weather condition, cadence, route remarks..."
              className="w-full rounded-2xl bg-[#050505] px-4 py-2 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
            />
          </div>

          {/* Sheets Status indicator */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#050505] p-3 text-xs border border-zinc-800">
            <Sheet className="h-4 w-4 text-[#e1ff00] shrink-0" />
            <span className="text-xs font-mono text-zinc-300">
              {isSheetsConnected
                ? 'Google Sheets integration active. Row will append in real-time.'
                : 'Google Sheets not yet linked. Activity saved to local storage.'}
            </span>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-rose-400 font-semibold">{errorMsg}</p>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-2xl bg-[#e1ff00] px-6 py-2.5 text-xs font-mono font-black uppercase text-black shadow-lg shadow-[#e1ff00]/20 hover:brightness-110 disabled:opacity-50 transition active:scale-95"
            >
              {isSubmitting ? 'Saving...' : 'Save & Sync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
