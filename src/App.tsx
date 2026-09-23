import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FloatingCommandDock } from './components/common/FloatingCommandDock';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CommandPalette } from './components/common/CommandPalette';
import { HistoryDrawer } from './components/history/HistoryDrawer';
import { Footer } from './components/common/Footer';
import { CURRENCIES } from './lib/formatters';
import { CurrencyCode, CalculationHistoryItem } from './types';
import { AdminProvider } from './context/AdminContext';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Command palette and history modal state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Persistent Calculation History in LocalStorage
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calcula_x_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleSaveHistory = (item: CalculationHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 50);
      try {
        localStorage.setItem('calcula_x_history_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('calcula_x_history_v1');
    } catch (e) {}
  };

  // Keyboard shortcut for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentCurrencyConfig = CURRENCIES[currency] || CURRENCIES.INR;
  const isLight = theme === 'light';

  return (
    <AdminProvider>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${
        isLight 
          ? 'bg-[#F8FAFC] text-[#11131A] selection:bg-[#6948FF]/20 selection:text-[#11131A]' 
          : 'bg-[#05060A] text-[#F7F8FC] selection:bg-[#8B6CFF]/30 selection:text-white'
      }`}>
        
        {/* Subtle Dynamic Ambient Lighting Overlay */}
        <div 
          className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b ${
            isLight 
              ? 'from-[#6948FF]/6 via-[#009DD9]/4 to-transparent' 
              : 'from-[#8B6CFF]/8 via-[#29D8FF]/4 to-transparent'
          } blur-3xl pointer-events-none transition-all duration-700`} 
        />

        {/* Floating Command Dock Header */}
        <FloatingCommandDock
          onGoHome={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currency={currency}
          setCurrency={setCurrency}
          theme={theme}
          setTheme={setTheme}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        {/* Main Content Stage with Search Engine Friendly Routes */}
        <main className="flex-1 w-full pt-20 pb-16">
          <Routes>
            <Route 
              path="/" 
              element={<HomePage currency={currentCurrencyConfig} theme={theme} />} 
            />
            <Route 
              path="/admin" 
              element={<AdminPage theme={theme} />} 
            />
            <Route 
              path="/calculators/:slug" 
              element={
                <CalculatorPage
                  currency={currentCurrencyConfig}
                  theme={theme}
                  onSaveHistory={handleSaveHistory}
                />
              } 
            />
            <Route 
              path="*" 
              element={<NotFoundPage theme={theme} />} 
            />
          </Routes>
        </main>

        {/* Footer */}
        <Footer theme={theme} />

        {/* Global Command Center (Cmd+K) */}
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          theme={theme}
          onSelectCalculator={(id) => {
            navigate(`/calculators/${id}`);
            setIsCommandOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          recentHistory={history}
        />

        {/* History Slide-Over Drawer */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          theme={theme}
          onSelectHistoryItem={(item) => {
            navigate(`/calculators/${item.calculatorId}`);
            setIsHistoryOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onClearHistory={handleClearHistory}
        />

      </div>
    </AdminProvider>
  );
}
