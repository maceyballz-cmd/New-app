import React, { useState } from 'react';
import { Cloud, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSync } from '../context/SyncContext';
import { CloudSyncModal } from './CloudSyncModal';

export const CloudSyncButton: React.FC = () => {
  const { user, syncStatus } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {user ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 shadow-2xs"
          title="Web and Desktop data are synchronized via Firebase Cloud"
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
          ) : (
            <div className="relative">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
          <span className="hidden sm:inline">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Cloud Synced'}
          </span>
          <span className="sm:hidden">
            {syncStatus === 'syncing' ? 'Syncing' : 'Synced'}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100 shadow-2xs"
          title="Sync data between Web and Desktop app"
        >
          <Cloud className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Sync Web & Desktop</span>
          <span className="sm:hidden">Sync</span>
        </button>
      )}

      <CloudSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
