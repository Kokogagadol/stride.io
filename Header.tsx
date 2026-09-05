import React from 'react';
import { Activity, Flame, Plus, RefreshCw, Sheet, Timer } from 'lucide-react';
import { AppsScriptConfig, ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  config: AppsScriptConfig;
  onOpenConfigModal: () => void;
  onOpenManualModal: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  config,
  onOpenConfigModal,
  onOpenManualModal,
  isSyncing,
  onManualSync,
}) => {
  const isSheetsConnected = Boolean(config.webAppUrl && config.webAppUrl.trim().length > 10);

  return (
    <header id="app-header" className="sticky top-0 z-30 border-b border-zinc-800 bg-[#050505]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e1ff00] rounded-xl flex items-center justify-center shadow-lg shadow-[#e1ff00]/10">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter italic uppercase text-white">
                STRIDE<span className="text-[#e1ff00]">.IO</span>
              </h1>
              <span className="hidden rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#e1ff00] uppercase sm:inline-block">
                PRO-RUNNER
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">GPS Engine & Google Sheets Live Sync</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-2xl bg-[#111111] p-1.5 border border-zinc-800 shadow-xl">
          <button
            id="nav-tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Statistik Mingguan
          </button>
          <button
            id="nav-tab-tracker"
            onClick={() => onTabChange('tracker')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              currentTab === 'tracker'
                ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            Live Tracker
          </button>
          <button
            id="nav-tab-history"
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              currentTab === 'history'
                ? 'bg-[#e1ff00] text-black shadow-md shadow-[#e1ff00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Riwayat Lari
          </button>
        </nav>

        {/* Right Actions: Sheets Status & Add Run */}
        <div className="flex items-center gap-3">
          {/* Athlete badge / level indicator */}
          <div className="hidden lg:block text-right">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">ATHLETE LEVEL</p>
            <p className="text-xs font-mono font-bold text-[#e1ff00]">PRO-MARATHONER</p>
          </div>

          {/* Google Sheets Status Badge */}
          <button
            id="btn-open-sheets-config"
            onClick={onOpenConfigModal}
            title={isSheetsConnected ? 'Google Sheets Terhubung (Klik untuk melihat skrip)' : 'Hubungkan Google Apps Script'}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
              isSheetsConnected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-[#e1ff00]/50 hover:text-white'
            }`}
          >
            <Sheet className="h-3.5 w-3.5 text-[#e1ff00]" />
            <span className="hidden sm:inline font-mono">
              {isSheetsConnected ? 'Sheets Live' : 'Connect Sheet'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                isSheetsConnected ? 'bg-[#e1ff00] animate-pulse' : 'bg-zinc-600'
              }`}
            />
          </button>

          {/* Sync Button if connected */}
          {isSheetsConnected && (
            <button
              id="btn-manual-sync"
              onClick={onManualSync}
              disabled={isSyncing}
              title="Sinkronkan data dengan Google Sheets"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-[#111111] text-zinc-300 hover:bg-zinc-800 hover:text-[#e1ff00] transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[#e1ff00]' : ''}`} />
            </button>
          )}

          {/* Manual Run Entry Button */}
          <button
            id="btn-open-manual-modal"
            onClick={onOpenManualModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#e1ff00] text-black px-3.5 py-2 text-xs font-black uppercase tracking-tight hover:brightness-110 active:scale-95 transition shadow-lg shadow-[#e1ff00]/10"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden xs:inline">Catat Lari</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden border-t border-zinc-800/80 bg-[#050505] px-2 py-2 justify-around">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition ${
            currentTab === 'dashboard' ? 'text-[#e1ff00] bg-[#e1ff00]/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Flame className="h-4 w-4 mb-0.5" />
          Statistik
        </button>
        <button
          onClick={() => onTabChange('tracker')}
          className={`flex flex-col items-center py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition ${
            currentTab === 'tracker' ? 'text-[#e1ff00] bg-[#e1ff00]/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Timer className="h-4 w-4 mb-0.5" />
          Live Tracker
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition ${
            currentTab === 'history' ? 'text-[#e1ff00] bg-[#e1ff00]/10' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Activity className="h-4 w-4 mb-0.5" />
          Riwayat
        </button>
      </div>
    </header>
  );
};
