import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  Search,
  Sheet,
  Trash2,
  Zap,
  CheckCircle2,
  RefreshCw,
  Eye,
  Filter,
} from 'lucide-react';
import { RunActivity, RunType } from '../types';
import { formatDuration, formatIndonesianDate } from '../utils/pace';

interface ActivityHistoryProps {
  activities: RunActivity[];
  onDeleteActivity: (id: string) => void;
  onSyncSingleActivity: (activity: RunActivity) => Promise<void>;
  onSelectActivity: (activity: RunActivity) => void;
  isSheetsConnected: boolean;
}

const TYPE_CONFIG: Record<RunType, { label: string; bg: string; text: string }> = {
  easy: { label: 'Easy Run', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-300' },
  tempo: { label: 'Tempo', bg: 'bg-[#e1ff00]/10 border-[#e1ff00]/30', text: 'text-[#e1ff00]' },
  long: { label: 'Long Run', bg: 'bg-zinc-900 border-zinc-700', text: 'text-white' },
  intervals: { label: 'Intervals', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-400' },
  race: { label: 'Race', bg: 'bg-[#e1ff00]/20 border-[#e1ff00]/40', text: 'text-[#e1ff00]' },
  trail: { label: 'Trail', bg: 'bg-zinc-900 border-zinc-800', text: 'text-zinc-300' },
};

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  onDeleteActivity,
  onSyncSingleActivity,
  onSelectActivity,
  isSheetsConnected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Filter activities
  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.notes && act.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || act.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSyncClick = async (e: React.MouseEvent, act: RunActivity) => {
    e.stopPropagation();
    setSyncingId(act.id);
    try {
      await onSyncSingleActivity(act);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Hapus aktivitas "${title}" dari daftar riwayat?`)) {
      onDeleteActivity(id);
    }
  };

  return (
    <div id="activity-history-container" className="space-y-5">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-[#111111] p-4 border border-zinc-800 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search activities or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl bg-[#050505] pl-11 pr-4 py-2.5 text-xs font-mono text-white border border-zinc-800 focus:border-[#e1ff00] focus:outline-none transition"
          />
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-zinc-500 shrink-0 ml-1 mr-0.5" />
          {['all', 'easy', 'tempo', 'long', 'intervals'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-tight whitespace-nowrap transition ${
                selectedType === t
                  ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'all'
                ? 'All Runs'
                : TYPE_CONFIG[t as RunType]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#111111] p-12 text-center shadow-xl">
          <Activity className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">No Recorded Activities</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono">
            Log a new session manually or launch the Live GPS Tracker to start recording runs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => {
            const typeConf = TYPE_CONFIG[act.type] || TYPE_CONFIG.easy;
            const isSyncingThis = syncingId === act.id;

            return (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-3xl bg-[#111111] p-5 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-xl transition cursor-pointer gap-4"
              >
                {/* Left: Info & Date */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${typeConf.bg} ${typeConf.text}`}
                    >
                      {typeConf.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {formatIndonesianDate(act.date)}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-[#e1ff00] transition truncate uppercase tracking-tight">
                    {act.title}
                  </h4>

                  {act.notes && (
                    <p className="text-xs text-zinc-400 line-clamp-1 italic font-mono">
                      "{act.notes}"
                    </p>
                  )}
                </div>

                {/* Center: Running Metrics */}
                <div className="flex items-center gap-6 sm:gap-8 border-t sm:border-t-0 border-zinc-800/80 pt-3 sm:pt-0">
                  {/* Distance */}
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Distance</span>
                    <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-white">
                      {act.distanceKm.toFixed(2)}{' '}
                      <span className="text-xs font-mono font-bold text-[#e1ff00]">KM</span>
                    </div>
                  </div>

                  {/* Pace */}
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5 text-[#e1ff00]" />
                      Pace
                    </span>
                    <div className="text-lg sm:text-xl font-mono font-bold text-[#e1ff00]">
                      {act.paceFormatted.replace(' /km', '')}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5 text-zinc-400" />
                      Time
                    </span>
                    <div className="text-lg sm:text-xl font-mono font-bold text-white">
                      {formatDuration(act.durationSeconds)}
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="hidden md:block">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 flex items-center gap-0.5">
                      <Flame className="h-2.5 w-2.5 text-rose-400" />
                      Burn
                    </span>
                    <div className="text-base font-mono font-bold text-zinc-300">
                      {act.calories} <span className="text-xs text-zinc-500">KCAL</span>
                    </div>
                  </div>
                </div>

                {/* Right: Sync Status & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                  {/* Google Sheets Sync Indicator */}
                  {act.syncedToSheets ? (
                    <span
                      title="Data tersimpan di Google Sheets"
                      className="flex items-center gap-1.5 rounded-full bg-[#e1ff00]/10 px-3 py-1 text-[10px] font-mono font-bold text-[#e1ff00] border border-[#e1ff00]/30 uppercase"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Synced</span>
                    </span>
                  ) : isSheetsConnected ? (
                    <button
                      onClick={(e) => handleSyncClick(e, act)}
                      disabled={isSyncingThis}
                      title="Kirim aktivitas ini ke Google Sheets sekarang"
                      className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-mono font-bold text-[#e1ff00] hover:bg-[#e1ff00] hover:text-black border border-zinc-700 transition uppercase"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isSyncingThis ? 'animate-spin' : ''}`}
                      />
                      <span>Sync Sheet</span>
                    </button>
                  ) : (
                    <span
                      title="Hanya tersimpan di penyimpanan lokal"
                      className="flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[10px] font-mono text-zinc-500 uppercase"
                    >
                      <Sheet className="h-3 w-3" />
                      Local
                    </span>
                  )}

                  {/* View Details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectActivity(act);
                    }}
                    title="Lihat Detail & Split KM"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, act.id, act.title)}
                    title="Hapus aktivitas"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
