import React, { useState } from 'react';
import {
  X,
  Sheet,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Code2,
  Send,
  Download,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { AppsScriptConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/appsScriptCode';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppsScriptConfig;
  onSaveConfig: (newConfig: AppsScriptConfig) => void;
  onTestConnection: (url: string) => Promise<{ success: boolean; message: string }>;
  onFetchFromSheets: (url: string) => Promise<{ success: boolean; count?: number; message?: string }>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
  onFetchFromSheets,
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'code' | 'url'>('url');
  const [urlInput, setUrlInput] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [hasCopied, setHasCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [fetchResult, setFetchResult] = useState<{
    status: 'idle' | 'fetching' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    } catch {
      // Fallback
      setHasCopied(true);
    }
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Menghubungi Google Apps Script...' });
    const res = await onTestConnection(urlInput.trim());

    if (res.success) {
      setTestResult({ status: 'success', message: res.message });
      // Auto save on successful test
      onSaveConfig({
        ...config,
        webAppUrl: urlInput.trim(),
        autoSync,
      });
    } else {
      setTestResult({ status: 'error', message: res.message });
    }
  };

  const handleFetchData = async () => {
    if (!urlInput.trim()) {
      setFetchResult({
        status: 'error',
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setFetchResult({ status: 'fetching', message: 'Mengambil data aktivitas dari Google Sheets...' });
    const res = await onFetchFromSheets(urlInput.trim());

    if (res.success) {
      setFetchResult({
        status: 'success',
        message: `Berhasil mengimpor ${res.count || 0} aktivitas dari Google Sheets!`,
      });
    } else {
      setFetchResult({
        status: 'error',
        message: res.message || 'Gagal mengambil data dari Google Sheets.',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      webAppUrl: urlInput.trim(),
      autoSync,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-[#111111] border border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e1ff00]/10 text-[#e1ff00] border border-[#e1ff00]/20">
              <Sheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2 font-mono">
                Google Sheets Sync
                <span className="rounded-full bg-[#e1ff00]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#e1ff00] border border-[#e1ff00]/30">
                  REAL-TIME
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Automated continuous sync to your Google Apps Script endpoint.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-[#050505]/60 px-5 font-mono">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'url'
                ? 'border-[#e1ff00] text-[#e1ff00]'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Send className="h-4 w-4" />
            Connect Web App
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'setup'
                ? 'border-[#e1ff00] text-[#e1ff00]'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            1-Min Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'code'
                ? 'border-[#e1ff00] text-[#e1ff00]'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Apps Script (.gs)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto font-mono">
          {/* TAB 1: URL & CONNECTION */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#050505] p-4 border border-zinc-800">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 font-mono">
                  Google Apps Script Web App URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 rounded-2xl bg-[#111111] px-4 py-2.5 text-xs text-white font-mono border border-zinc-800 focus:border-[#e1ff00] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing'}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#e1ff00] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {testResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                  Obtain this URL after deploying the Web App script in Google Sheets (refer to "1-Min Setup Guide").
                </p>
              </div>

              {/* Test Connection Alert */}
              {testResult.message && (
                <div
                  className={`rounded-2xl p-3.5 text-xs flex items-start gap-2 border font-mono ${
                    testResult.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : testResult.status === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="font-semibold">{testResult.message}</span>
                </div>
              )}

              {/* Pull Data From Sheets */}
              <div className="rounded-2xl bg-[#050505] p-4 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                    <Download className="h-4 w-4 text-[#e1ff00]" />
                    Fetch History from Google Sheets
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                    Import existing historical run entries from your connected Google Spreadsheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchData}
                  disabled={fetchResult.status === 'fetching'}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-800 transition self-start sm:self-auto disabled:opacity-50"
                >
                  {fetchResult.status === 'fetching' ? 'Importing...' : 'Sync Import'}
                </button>
              </div>

              {fetchResult.message && (
                <div
                  className={`rounded-2xl p-3.5 text-xs flex items-start gap-2 border font-mono ${
                    fetchResult.status === 'success'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span className="font-semibold">{fetchResult.message}</span>
                </div>
              )}

              {/* Real-time toggle */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#050505] border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="h-4 w-4 accent-[#e1ff00] rounded"
                />
                <div className="text-xs font-mono">
                  <span className="font-bold text-white block uppercase tracking-wider">
                    Enable Real-Time Cloud Sync
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Activities will instantly append to Google Sheets upon completion.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP GUIDE */}
          {activeTab === 'setup' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-mono">
              <div className="flex items-center justify-between rounded-2xl bg-[#e1ff00]/10 p-4 border border-[#e1ff00]/20">
                <span className="font-semibold text-[#e1ff00]">
                  Quick 1-Minute Setup Guide for Google Sheets:
                </span>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-[#e1ff00] px-3.5 py-1.5 text-xs font-black uppercase text-black hover:brightness-110 transition shrink-0"
                >
                  Open sheets.new <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-[#050505] p-4 border border-zinc-800">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e1ff00] text-black font-black text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">Open Google Sheets & Apps Script</h5>
                    <p className="text-zinc-400 mt-1 text-[11px]">
                      Create a new spreadsheet at{' '}
                      <span className="text-[#e1ff00] font-mono">sheets.new</span>.
                      Go to menu: <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#050505] p-4 border border-zinc-800">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e1ff00] text-black font-black text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">Copy & Paste Script Code</h5>
                    <p className="text-zinc-400 mt-1 text-[11px]">
                      Open the <strong>Apps Script (.gs)</strong> tab above and click{' '}
                      <strong>"Copy All Code"</strong>. Replace the placeholder code in your script editor and paste.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#050505] p-4 border border-zinc-800">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e1ff00] text-black font-black text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">Deploy as Web App</h5>
                    <p className="text-zinc-400 mt-1 text-[11px]">
                      Click <strong>Deploy</strong> (top right) &gt; <strong>New deployment</strong>.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-300 font-medium text-[11px]">
                      <li>Select type: <strong>Web app</strong></li>
                      <li>Execute as: <strong>Me (your email)</strong></li>
                      <li>
                        Who has access:{' '}
                        <strong className="text-[#e1ff00] underline">Anyone</strong>{' '}
                        (Required for the applet to sync seamlessly).
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#050505] p-4 border border-zinc-800">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e1ff00] text-black font-black text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">Paste Web App URL</h5>
                    <p className="text-zinc-400 mt-1 text-[11px]">
                      Copy the generated <strong>Web App URL</strong> (ends in{' '}
                      <span className="font-mono text-[#e1ff00]">/exec</span>), paste it into{' '}
                      <strong>Connect Web App</strong> tab, and click "Test Connection"!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCRIPT CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  Google Apps Script (Code.gs):
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-xl bg-[#e1ff00] px-4 py-2 text-xs font-black uppercase text-black hover:brightness-110 transition shadow-lg shadow-[#e1ff00]/20"
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-black" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code (.gs)
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl bg-[#050505] border border-zinc-800 p-4 overflow-hidden">
                <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-80 leading-5">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl bg-[#050505] p-3.5 border border-zinc-800 text-[11px] text-zinc-400">
                <AlertTriangle className="h-4 w-4 text-[#e1ff00] shrink-0" />
                <span>
                  This script automatically provisions the <strong>"Running_Activities"</strong> sheet with formatted header rows and formula metrics.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 p-5 bg-[#050505] font-mono">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-[#e1ff00] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-lg shadow-[#e1ff00]/20 transition active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
