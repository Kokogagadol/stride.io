/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Flame,
  Plus,
  Sheet,
  Timer,
  X,
} from 'lucide-react';
import { AppsScriptConfig, RunActivity, ViewTab } from './types';
import { calculateWeeklyStats } from './utils/pace';
import {
  getSavedActivities,
  getSavedConfig,
  saveActivitiesToLocal,
  saveConfig,
  syncActivityToGoogleSheets,
  testAppsScriptConnection,
  fetchActivitiesFromGoogleSheets,
} from './utils/googleSheetsSync';
import { INITIAL_ACTIVITIES } from './utils/initialData';
import { Header } from './components/Header';
import { WeeklyStatsCard } from './components/WeeklyStatsCard';
import { LiveTracker } from './components/LiveTracker';
import { ActivityHistory } from './components/ActivityHistory';
import { ManualRunModal } from './components/ManualRunModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';

export default function App() {
  // Activities state
  const [activities, setActivities] = useState<RunActivity[]>(() => {
    const saved = getSavedActivities();
    if (saved && saved.length > 0) {
      return saved;
    }
    return INITIAL_ACTIVITIES;
  });

  // Config state
  const [config, setConfig] = useState<AppsScriptConfig>(() => getSavedConfig());

  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState<number>(() => {
    try {
      const savedGoal = localStorage.getItem('strava_weekly_goal_km');
      return savedGoal ? parseFloat(savedGoal) : 25;
    } catch {
      return 25;
    }
  });

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<RunActivity | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Save activities to local storage whenever they change
  useEffect(() => {
    saveActivitiesToLocal(activities);
  }, [activities]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save a new run (from LiveTracker or ManualRunModal)
  const handleSaveRun = async (
    newRun: RunActivity
  ): Promise<{ success: boolean; message: string }> => {
    let synced = false;
    let syncMsg = 'Tersimpan di perangkat lokal.';

    // Try real-time sync if Google Apps Script URL is set
    if (config.webAppUrl && config.webAppUrl.trim().length > 10) {
      try {
        const syncRes = await syncActivityToGoogleSheets(newRun, config.webAppUrl);
        if (syncRes.success) {
          synced = true;
          syncMsg = 'Tersimpan & disinkronkan ke Google Sheets secara real-time!';
          showToast(syncMsg, 'success');
        } else {
          showToast(`Lokal tersimpan. Gagal sync: ${syncRes.message}`, 'info');
        }
      } catch (err: any) {
        showToast('Tersimpan di memori lokal.', 'info');
      }
    } else {
      showToast('Aktivitas tersimpan di memori lokal.', 'info');
    }

    const runToStore: RunActivity = {
      ...newRun,
      syncedToSheets: synced,
      syncedAt: synced ? new Date().toISOString() : undefined,
    };

    setActivities((prev) => [runToStore, ...prev]);

    return { success: true, message: syncMsg };
  };

  // Sync a single activity manually
  const handleSyncSingleActivity = async (activity: RunActivity) => {
    if (!config.webAppUrl || !config.webAppUrl.trim()) {
      setIsConfigModalOpen(true);
      return;
    }

    try {
      const res = await syncActivityToGoogleSheets(activity, config.webAppUrl);
      if (res.success) {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === activity.id
              ? { ...a, syncedToSheets: true, syncedAt: new Date().toISOString() }
              : a
          )
        );
        showToast(`Aktivitas "${activity.title}" berhasil dikirim ke Google Sheets!`, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error');
    }
  };

  // Sync all unsynced activities
  const handleManualSyncAll = async () => {
    if (!config.webAppUrl || !config.webAppUrl.trim()) {
      setIsConfigModalOpen(true);
      return;
    }

    const unsynced = activities.filter((a) => !a.syncedToSheets);
    if (unsynced.length === 0) {
      showToast('Semua data aktivitas sudah tersinkron ke Google Sheets!', 'info');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;

    for (const act of unsynced) {
      try {
        const res = await syncActivityToGoogleSheets(act, config.webAppUrl);
        if (res.success) {
          successCount++;
          setActivities((prev) =>
            prev.map((a) => (a.id === act.id ? { ...a, syncedToSheets: true } : a))
          );
        }
      } catch (err) {
        console.warn('Sync failed for item', act.id, err);
      }
    }

    setIsSyncing(false);
    showToast(
      `Berhasil mensinkronkan ${successCount} dari ${unsynced.length} aktivitas ke Google Sheets!`,
      'success'
    );
  };

  // Delete activity
  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    showToast('Aktivitas berhasil dihapus.', 'info');
  };

  // Update config
  const handleSaveConfig = (newConfig: AppsScriptConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    showToast('Konfigurasi Google Apps Script berhasil disimpan!', 'success');
  };

  // Update weekly goal
  const handleUpdateWeeklyGoal = (newGoal: number) => {
    setWeeklyGoalKm(newGoal);
    try {
      localStorage.setItem('strava_weekly_goal_km', newGoal.toString());
    } catch {}
    showToast(`Target mingguan diperbarui menjadi ${newGoal} km`, 'success');
  };

  // Test connection
  const handleTestConnection = async (url: string) => {
    return await testAppsScriptConnection(url);
  };

  // Fetch activities from Google Sheets
  const handleFetchFromSheets = async (url: string) => {
    const res = await fetchActivitiesFromGoogleSheets(url);
    if (res.success && res.activities) {
      // Merge with existing avoiding duplicates
      const newItems = res.activities;
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const filteredNew = newItems.filter((a) => !existingIds.has(a.id));
        return [...filteredNew, ...prev];
      });
      return { success: true, count: newItems.length };
    }
    return { success: false, message: res.message };
  };

  // Calculate current weekly stats based on weekOffset
  const weeklyStats = calculateWeeklyStats(activities, weekOffset, weeklyGoalKm);
  const isSheetsConnected = Boolean(config.webAppUrl && config.webAppUrl.trim().length > 10);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col selection:bg-[#e1ff00] selection:text-black font-mono">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-2xl transition-all border font-mono ${
            toastMessage.type === 'success'
              ? 'bg-[#111111] text-[#e1ff00] border-[#e1ff00]/40 shadow-[#e1ff00]/10'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/60'
              : 'bg-[#111111] text-zinc-300 border-zinc-800 shadow-black/80'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#e1ff00]" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        config={config}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        isSyncing={isSyncing}
        onManualSync={handleManualSyncAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Quick Connection Helper Banner if not connected */}
        {!isSheetsConnected && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-[#111111] p-5 border border-zinc-800 shadow-2xl font-mono">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e1ff00]/10 text-[#e1ff00] border border-[#e1ff00]/20 shrink-0">
                <Sheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Real-time Google Sheets Synchronization
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Deploy the 1-minute Apps Script template to log all run activities automatically.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="rounded-2xl bg-[#e1ff00] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition self-start sm:self-auto shadow-lg shadow-[#e1ff00]/20 shrink-0 active:scale-95"
            >
              Setup Apps Script
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD & STATISTIK MINGGUAN */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Weekly performance cards & interactive charts */}
            <WeeklyStatsCard
              stats={weeklyStats}
              weekOffset={weekOffset}
              onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
              onNextWeek={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
              onResetToCurrentWeek={() => setWeekOffset(0)}
              onUpdateGoal={handleUpdateWeeklyGoal}
            />

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setCurrentTab('tracker')}
                className="group cursor-pointer rounded-3xl bg-[#111111] p-6 border border-zinc-800 hover:border-[#e1ff00]/60 transition-all shadow-xl flex items-center justify-between font-mono"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1ff00]">
                    Live GPS Tracker
                  </span>
                  <h4 className="text-base font-black uppercase italic tracking-tight text-white mt-1 group-hover:text-[#e1ff00] transition">
                    Start Run Now
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Live stopwatch, dynamic pace & auto-sync
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e1ff00] text-black shadow-lg shadow-[#e1ff00]/20 group-hover:scale-105 transition">
                  <Timer className="h-6 w-6" />
                </div>
              </div>

              <div
                onClick={() => setIsManualModalOpen(true)}
                className="group cursor-pointer rounded-3xl bg-[#111111] p-6 border border-zinc-800 hover:border-zinc-700 transition-all shadow-xl flex items-center justify-between font-mono"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Manual Entry
                  </span>
                  <h4 className="text-base font-black uppercase italic tracking-tight text-white mt-1 group-hover:text-white transition">
                    Log Activity
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Enter distance & duration, instant pace
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:scale-105 transition">
                  <Plus className="h-6 w-6" />
                </div>
              </div>

              <div
                onClick={() => setIsConfigModalOpen(true)}
                className="group cursor-pointer rounded-3xl bg-[#111111] p-6 border border-zinc-800 hover:border-[#e1ff00]/40 transition-all shadow-xl flex items-center justify-between font-mono"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1ff00]">
                    Google Sheets Cloud
                  </span>
                  <h4 className="text-base font-black uppercase italic tracking-tight text-white mt-1 group-hover:text-[#e1ff00] transition">
                    Apps Script Sync
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isSheetsConnected
                      ? 'Connected to Spreadsheet ✓'
                      : 'View script & 1-minute setup'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e1ff00]/10 text-[#e1ff00] border border-[#e1ff00]/20 group-hover:scale-105 transition">
                  <Sheet className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Recent Activities Preview */}
            <div className="rounded-3xl bg-[#111111] p-6 border border-zinc-800 font-mono shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                  <Activity className="h-4 w-4 text-[#e1ff00]" />
                  Recent Activities
                </h3>
                <button
                  onClick={() => setCurrentTab('history')}
                  className="text-xs font-bold text-[#e1ff00] hover:underline uppercase tracking-wider transition"
                >
                  View All ({activities.length}) →
                </button>
              </div>

              <ActivityHistory
                activities={activities.slice(0, 4)}
                onDeleteActivity={handleDeleteActivity}
                onSyncSingleActivity={handleSyncSingleActivity}
                onSelectActivity={(act) => setSelectedActivity(act)}
                isSheetsConnected={isSheetsConnected}
              />
            </div>
          </div>
        )}

        {/* TAB 2: LIVE TRACKER */}
        {currentTab === 'tracker' && (
          <div className="max-w-3xl mx-auto">
            <LiveTracker
              onSaveRun={handleSaveRun}
              isSheetsConnected={isSheetsConnected}
            />
          </div>
        )}

        {/* TAB 3: ACTIVITY HISTORY */}
        {currentTab === 'history' && (
          <div className="space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white">All Running Activities</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Total {activities.length} sessions logged locally & synchronized to Google Sheets
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-[#e1ff00] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-lg shadow-[#e1ff00]/20 transition self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Log New Run
              </button>
            </div>

            <ActivityHistory
              activities={activities}
              onDeleteActivity={handleDeleteActivity}
              onSyncSingleActivity={handleSyncSingleActivity}
              onSelectActivity={(act) => setSelectedActivity(act)}
              isSheetsConnected={isSheetsConnected}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-[#050505] py-6 px-4 text-center text-xs text-zinc-500 font-mono">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[#e1ff00]" />
            <span className="font-bold text-white uppercase tracking-wider">
              STRAVA LIVE APPS SCRIPT
            </span>
            <span className="text-zinc-600">—</span>
            <span className="text-zinc-400">Google Sheets Real-time Cloud Sync</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-zinc-400 hover:text-[#e1ff00] transition uppercase tracking-wider"
            >
              Apps Script Guide
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all activities to demo seed data?')) {
                  setActivities(INITIAL_ACTIVITIES);
                  saveActivitiesToLocal(INITIAL_ACTIVITIES);
                  showToast('Demo data reloaded.', 'info');
                }
              }}
              className="text-zinc-400 hover:text-white transition uppercase tracking-wider"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <ManualRunModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveRun={handleSaveRun}
        isSheetsConnected={isSheetsConnected}
      />

      <GoogleSheetsModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onTestConnection={handleTestConnection}
        onFetchFromSheets={handleFetchFromSheets}
      />

      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onSync={handleSyncSingleActivity}
        isSheetsConnected={isSheetsConnected}
      />
    </div>
  );
}
