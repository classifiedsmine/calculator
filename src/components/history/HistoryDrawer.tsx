import React from 'react';
import { X, Trash2, ArrowRight, Download, History as HistoryIcon, Clock } from 'lucide-react';
import { CalculationHistoryItem } from '../../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationHistoryItem[];
  onSelectHistoryItem: (item: CalculationHistoryItem) => void;
  onClearHistory: () => void;
  theme?: 'dark' | 'light';
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
  theme = 'light',
}) => {
  if (!isOpen) return null;
  const isLight = theme === 'light';

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `calcula-x-history-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md h-full shadow-2xl flex flex-col transition-colors border-l ${
        isLight ? 'bg-white border-black/10 text-[#11131A]' : 'bg-[#0C101A] border-white/[0.1] text-[#F7F8FC]'
      }`}>
        
        {/* Drawer Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-black/10' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-2">
            <HistoryIcon className={`w-4 h-4 ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`} />
            <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>Calculation History</h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-[#F4F6FB] text-[#475467] border-black/10' : 'bg-[#111725] text-[#9AA3B5] border-white/[0.06]'
            }`}>
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-[#8C95A6] hover:text-[#11131A] hover:bg-[#F4F6FB]' : 'text-[#5F6878] hover:text-[#F7F8FC] hover:bg-[#111725]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Actions */}
        {history.length > 0 && (
          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
            isLight ? 'bg-[#F4F6FB] border-black/10' : 'bg-[#080B12] border-white/[0.06]'
          }`}>
            <button
              onClick={handleExportJson}
              className={`flex items-center gap-1.5 font-mono text-[11px] cursor-pointer ${
                isLight ? 'text-[#475467] hover:text-[#11131A]' : 'text-[#9AA3B5] hover:text-[#F7F8FC]'
              }`}
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>
            <button
              onClick={onClearHistory}
              className={`flex items-center gap-1.5 font-mono text-[11px] cursor-pointer transition-colors ${
                isLight ? 'text-[#8C95A6] hover:text-[#FF5D73]' : 'text-[#5F6878] hover:text-[#FF5D73]'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                isLight ? 'bg-[#F4F6FB] border-black/10 text-[#8C95A6]' : 'bg-[#111725] border-white/[0.07] text-[#5F6878]'
              }`}>
                <Clock className="w-6 h-6" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>No Saved Calculations</h3>
              <p className={`text-xs max-w-xs ${isLight ? 'text-[#667085]' : 'text-[#5F6878]'}`}>
                Calculations you run and save will appear here for one-click reload and comparison.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-1.5 ${
                  isLight
                    ? 'bg-[#F4F6FB] hover:bg-white border-black/10 hover:border-[#6948FF]/40 shadow-xs'
                    : 'bg-[#111725] hover:bg-[#182133] border-white/[0.06] hover:border-[#8B6CFF]/30'
                }`}
              >
                <div className={`flex items-center justify-between text-[10px] font-mono ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
                  <span className={`uppercase font-semibold ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}>{item.category}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold transition-colors ${
                    isLight ? 'text-[#11131A] group-hover:text-[#6948FF]' : 'text-[#F7F8FC] group-hover:text-[#8B6CFF]'
                  }`}>
                    {item.calculatorTitle}
                  </h4>
                  <ArrowRight className={`w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`} />
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className={`text-[11px] ${isLight ? 'text-[#667085]' : 'text-[#9AA3B5]'}`}>{item.primaryLabel}</span>
                  <span className={`text-sm font-bold font-mono tabular-nums ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
                    {item.primaryFormatted}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
