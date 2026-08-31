import React, { useState } from 'react';
import { ShieldCheck, Download, X, HardDrive } from 'lucide-react';
import { exportEntireLocalDatabase } from '../utils/storage';
import { triggerFileDownload } from '../utils/exportGenerators';

export const LocalBackupBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDownloadAllBackup = () => {
    const json = exportEntireLocalDatabase();
    const date = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      json,
      `scholarread_library_backup_${date}.json`,
      'application/json;charset=utf-8'
    );
  };

  return (
    <div
      id="local-privacy-banner"
      className="bg-[#EBE8E0] border-b border-[#D1D1D1] px-4 py-1 flex items-center justify-between text-[11px] text-[#4A5568] select-none shrink-0 font-sans"
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2C2C2C] shrink-0" />
        <span className="truncate text-xs">
          <strong className="text-[#2C2C2C]">Local-First & Offline Storage:</strong> Your research papers, highlights, and formatted citations are stored securely in your browser with 0 external tracking.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          onClick={handleDownloadAllBackup}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-[#F4F1EA] text-[#2C2C2C] border border-[#D1D1D1] text-[10px] font-bold transition shadow-2xs cursor-pointer"
          title="Download complete local JSON database"
        >
          <HardDrive className="w-3 h-3 text-[#4A5568]" />
          <span>Backup Database</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-0.5 rounded hover:bg-[#DCD8CF] text-[#8E9299] hover:text-[#2C2C2C] transition cursor-pointer"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

