import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Flame,
  Zap,
  Gauge,
  Sheet,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { RunActivity, RunType } from '../types';
import { formatDuration, formatIndonesianDate } from '../utils/pace';

interface ActivityDetailModalProps {
  activity: RunActivity | null;
  onClose: () => void;
  onSync: (activity: RunActivity) => Promise<void>;
  isSheetsConnected: boolean;
}

const TYPE_NAMES: Record<RunType, string> = {
  easy: 'Easy Run (Santai)',
  tempo: 'Tempo Run (Threshold)',
  long: 'Long Run (Jarak Jauh)',
  intervals: 'Intervals (Kecepatan)',
  race: 'Race (Perlombaan)',
  trail: 'Trail Run (Lintas Alam)',
};

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  onSync,
  isSheetsConnected,
}) => {
  if (!activity) return null;

  const avgSpeed =
    activity.durationSeconds > 0 && activity.distanceKm > 0
      ? ((activity.distanceKm / activity.durationSeconds) * 3600).toFixed(1)
      : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#111111] border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5 font-mono">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5">
          <div>
            <span className="text-[10px] font-bold text-[#e1ff00] uppercase tracking-[0.2em]">
              {TYPE_NAMES[activity.type] || activity.type}
            </span>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white mt-0.5">{activity.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatIndonesianDate(activity.date)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#050505] p-4 border border-zinc-800 text-center font-mono">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Distance</span>
            <div className="text-2xl font-black text-white mt-1">
              {activity.distanceKm.toFixed(2)}{' '}
              <span className="text-xs text-[#e1ff00]">KM</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Pace</span>
            <div className="text-2xl font-black text-[#e1ff00] mt-1">
              {activity.paceFormatted.replace(' /km', '')}
            </div>
            <span className="text-[9px] text-zinc-500">/KM</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Duration</span>
            <div className="text-2xl font-black text-white mt-1">
              {formatDuration(activity.durationSeconds)}
            </div>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-2 font-mono">
          <div className="rounded-2xl bg-[#050505] p-3 border border-zinc-800">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
              <Flame className="h-3 w-3 text-rose-400" />
              Calories
            </div>
            <div className="text-sm font-bold text-white mt-1">{activity.calories} KCAL</div>
          </div>
          <div className="rounded-2xl bg-[#050505] p-3 border border-zinc-800">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
              <Zap className="h-3 w-3 text-zinc-400" />
              Speed
            </div>
            <div className="text-sm font-bold text-white mt-1">{avgSpeed} KM/H</div>
          </div>
          <div className="rounded-2xl bg-[#050505] p-3 border border-zinc-800">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500">
              <Gauge className="h-3 w-3 text-[#e1ff00]" />
              Effort
            </div>
            <div className="text-sm font-bold text-white mt-1">{activity.rpe || 5} / 10</div>
          </div>
        </div>

        {/* Notes */}
        {activity.notes && (
          <div className="rounded-2xl bg-[#050505] p-3.5 border border-zinc-800 font-mono">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Activity Notes
            </span>
            <p className="text-xs text-zinc-300 italic leading-relaxed">
              "{activity.notes}"
            </p>
          </div>
        )}

        {/* Splits (if any) */}
        {activity.splits && activity.splits.length > 0 && (
          <div className="space-y-2 font-mono">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-[#e1ff00]" />
              Kilometer Splits
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-2xl bg-[#050505] p-2.5 border border-zinc-800">
              {activity.splits.map((s) => (
                <div
                  key={s.km}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#111111]"
                >
                  <span className="font-bold text-zinc-400">Kilometer {s.km}</span>
                  <span className="font-bold text-[#e1ff00]">{s.paceFormatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync status */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 font-mono">
          <div className="flex items-center gap-2 text-xs">
            <Sheet className="h-4 w-4 text-[#e1ff00]" />
            {activity.syncedToSheets ? (
              <span className="text-[#e1ff00] font-bold flex items-center gap-1 text-xs uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" /> Synced to Sheets
              </span>
            ) : (
              <span className="text-zinc-500 text-xs uppercase">Stored locally</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!activity.syncedToSheets && isSheetsConnected && (
              <button
                onClick={() => onSync(activity)}
                className="rounded-2xl bg-[#e1ff00] px-4 py-2 text-xs font-mono font-black uppercase text-black hover:brightness-110 transition shadow-lg shadow-[#e1ff00]/20"
              >
                Sync Now
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
