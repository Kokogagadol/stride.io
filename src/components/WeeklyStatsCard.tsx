import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Zap,
  Clock,
  Flame,
  Target,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { WeeklyStats } from '../types';
import { formatDurationHuman, formatPace } from '../utils/pace';

interface WeeklyStatsCardProps {
  stats: WeeklyStats;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetToCurrentWeek: () => void;
  onUpdateGoal: (newGoal: number) => void;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({
  stats,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onResetToCurrentWeek,
  onUpdateGoal,
}) => {
  const [chartType, setChartType] = useState<'distance' | 'pace'>('distance');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(stats.weeklyGoalKm.toString());

  const startDate = new Date(stats.weekStart);
  const endDate = new Date(stats.weekEnd);

  const formatWeekRange = () => {
    const startStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
      startDate
    );
    const endStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(endDate);
    return `${startStr} – ${endStr}`;
  };

  const progressPct = Math.min(100, Math.round((stats.totalDistanceKm / stats.weeklyGoalKm) * 100));

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempGoal);
    if (!isNaN(val) && val > 0) {
      onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  // Prepare chart data for daily bars
  const chartData = stats.dailyDistances.map((d) => ({
    name: d.shortDay,
    fullName: d.dayName,
    date: d.dateStr,
    distance: d.distanceKm,
    paceSeconds: d.avgPaceSeconds,
    paceFormatted: d.avgPaceSeconds > 0 ? formatPace(d.avgPaceSeconds) : '-',
    runsCount: d.runsCount,
  }));

  // Today ISO date string to highlight today's bar
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div id="weekly-stats-card" className="space-y-6">
      {/* Top Header: Navigation & Target Goal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-[#111111] p-6 border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-[#e1ff00]">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight uppercase italic text-white">Weekly Performance</h2>
              {weekOffset === 0 ? (
                <span className="rounded-full bg-[#e1ff00]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#e1ff00] border border-[#e1ff00]/30 uppercase tracking-wider">
                  Active Week
                </span>
              ) : (
                <button
                  onClick={onResetToCurrentWeek}
                  className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-mono text-[#e1ff00] hover:bg-zinc-700 transition"
                >
                  Jump to Current Week
                </button>
              )}
            </div>
            <p className="text-xs font-mono font-medium text-zinc-400 mt-0.5">{formatWeekRange()}</p>
          </div>
        </div>

        {/* Week navigation arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-prev-week"
            onClick={onPrevWeek}
            aria-label="Minggu sebelumnya"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white transition active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            id="btn-next-week"
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            aria-label="Minggu selanjutnya"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 transition ${
              weekOffset >= 0
                ? 'cursor-not-allowed opacity-30 text-zinc-600'
                : 'text-zinc-300 hover:border-zinc-700 hover:text-white active:scale-95'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Metric Highlight Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {/* Total Distance */}
        <div className="col-span-2 sm:col-span-2 rounded-3xl bg-[#111111] p-6 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <span>Total Distance</span>
              <Target className="h-4 w-4 text-[#e1ff00]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white">
                {stats.totalDistanceKm.toFixed(2)}
              </span>
              <span className="text-sm font-mono font-bold text-[#e1ff00]">KM</span>
            </div>
          </div>

          {/* Goal Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-400 font-medium">
                Goal: <span className="font-mono font-bold text-white">{stats.weeklyGoalKm} km</span>
              </span>
              <span className="font-mono font-bold text-[#e1ff00]">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-[#e1ff00] transition-all duration-500 shadow-sm shadow-[#e1ff00]/50"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
              {isEditingGoal ? (
                <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5 w-full mt-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="500"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-18 rounded-xl bg-zinc-900 px-2.5 py-1 text-xs font-mono text-white border border-zinc-700 focus:outline-none focus:border-[#e1ff00]"
                  />
                  <span className="text-xs font-mono">km</span>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#e1ff00] text-black px-2.5 py-1 text-xs font-black uppercase hover:brightness-110"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Batal
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setTempGoal(stats.weeklyGoalKm.toString());
                    setIsEditingGoal(true);
                  }}
                  className="text-zinc-400 hover:text-[#e1ff00] transition underline underline-offset-4 text-[11px]"
                >
                  Ubah target mingguan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Average Pace */}
        <div className="col-span-1 rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <span>Avg Pace</span>
            <Zap className="h-4 w-4 text-[#e1ff00]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {formatPace(stats.averagePaceSeconds).replace(' /km', '')}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">/KM</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-[#e1ff00] bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 font-bold">
            {stats.averagePaceSeconds > 0
              ? `${(3600 / stats.averagePaceSeconds).toFixed(1)} KM/H`
              : 'NO SESSIONS'}
          </div>
        </div>

        {/* Total Duration */}
        <div className="col-span-1 rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <span>Active Time</span>
            <Clock className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {stats.totalDurationSeconds > 0
                ? formatDurationHuman(stats.totalDurationSeconds)
                : '0m'}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{stats.totalRuns} SESSIONS</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
            MOVING TIME
          </div>
        </div>

        {/* Calories */}
        <div className="col-span-1 rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <span>Calories</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {stats.totalCalories.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">KCAL</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
            EST. BURN
          </div>
        </div>

        {/* Best Pace / Highlights */}
        <div className="col-span-1 rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
            <span>Best Pace</span>
            <Trophy className="h-4 w-4 text-[#e1ff00]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#e1ff00] tracking-tight">
              {stats.bestPaceSeconds > 0
                ? formatPace(stats.bestPaceSeconds).replace(' /km', '')
                : '--'}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              MAX: {stats.longestRunKm > 0 ? `${stats.longestRunKm} KM` : '-'}
            </p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-[#e1ff00] bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
            WEEK RECORD
          </div>
        </div>
      </div>

      {/* Intuitive Chart Section */}
      <div className="rounded-3xl bg-[#111111] p-6 sm:p-8 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Performance Curve</h3>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-mono text-[#e1ff00]">LIVE STATS</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {chartType === 'distance'
                ? 'Daily running volume & intensity breakdown'
                : 'Pace efficiency curve (lower value = faster pace)'}
            </p>
          </div>

          {/* Chart Toggle */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 p-1.5 border border-zinc-800 self-start sm:self-auto">
            <button
              onClick={() => setChartType('distance')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition uppercase tracking-tight ${
                chartType === 'distance'
                  ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              DIST (KM)
            </button>
            <button
              onClick={() => setChartType('pace')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition uppercase tracking-tight ${
                chartType === 'pace'
                  ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              PACE (/KM)
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'distance' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                  unit=" km"
                  domain={[0, (dataMax: number) => Math.max(8, Math.ceil(dataMax + 2))]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(225, 255, 0, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-zinc-700 bg-[#050505] p-3.5 shadow-2xl font-mono">
                          <p className="text-xs font-bold text-white mb-1.5 uppercase">{data.fullName}</p>
                          <div className="space-y-1 text-xs">
                            <p className="text-[#e1ff00] font-bold">
                              Distance: <span className="text-white">{data.distance} KM</span>
                            </p>
                            <p className="text-zinc-300">
                              Pace: <span className="text-white">{data.paceFormatted}</span>
                            </p>
                            <p className="text-zinc-500 text-[11px]">
                              Runs: <span className="text-white">{data.runsCount}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="distance" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {chartData.map((entry, index) => {
                    const isToday = entry.date === todayStr;
                    const hasRun = entry.distance > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          hasRun
                            ? isToday
                              ? '#e1ff00' // Electric volt
                              : '#52525b' // Zinc-600
                            : '#27272a' // Zinc-800
                        }
                        stroke={isToday ? '#ffffff' : undefined}
                        strokeWidth={isToday ? 1.5 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                  reversed={true} // In running, lower pace is faster/better
                  domain={[180, 480]} // 3:00 to 8:00 min/km
                  tickFormatter={(val: number) => {
                    const mins = Math.floor(val / 60);
                    const secs = Math.floor(val % 60);
                    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-zinc-700 bg-[#050505] p-3.5 shadow-2xl font-mono">
                          <p className="text-xs font-bold text-white mb-1.5 uppercase">{data.fullName}</p>
                          <div className="space-y-1 text-xs">
                            <p className="text-[#e1ff00] font-bold">
                              Avg Pace: <span className="text-white">{data.paceFormatted}</span>
                            </p>
                            <p className="text-zinc-400">
                              Dist:{' '}
                              <span className="text-white">
                                {data.distance > 0 ? `${data.distance} KM` : 'Rest Day'}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="paceSeconds"
                  stroke="#e1ff00"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#e1ff00', stroke: '#050505', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#ffffff', stroke: '#e1ff00', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Daily Mini Ticker Cards */}
        <div className="mt-6 grid grid-cols-7 gap-2 border-t border-zinc-800 pt-5">
          {stats.dailyDistances.map((d, i) => {
            const isToday = d.dateStr === todayStr;
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-2xl p-2.5 text-center transition ${
                  isToday
                    ? 'bg-[#e1ff00]/10 border border-[#e1ff00]'
                    : d.distanceKm > 0
                    ? 'bg-zinc-900 border border-zinc-800'
                    : 'bg-zinc-950/60 border border-zinc-900'
                }`}
              >
                <span
                  className={`text-[10px] font-mono font-bold uppercase ${
                    isToday ? 'text-[#e1ff00]' : 'text-zinc-500'
                  }`}
                >
                  {d.shortDay}
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white my-1">
                  {d.distanceKm > 0 ? `${d.distanceKm}` : '-'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {d.distanceKm > 0 ? 'KM' : 'REST'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
