import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  Power, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ExternalLink, 
  LogOut, 
  Key, 
  Sliders, 
  Download, 
  Upload, 
  ArrowLeft,
  Filter,
  Sparkles,
  Activity,
  Layers,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { CALCULATORS, PARENT_CATEGORIES } from '../data/calculators';
import { SEOHead } from '../components/common/SEOHead';

interface AdminPageProps {
  theme: 'dark' | 'light';
}

export const AdminPage: React.FC<AdminPageProps> = ({ theme }) => {
  const isLight = theme === 'light';
  const {
    isAdminAuthenticated,
    disabledCalculators,
    toggleCalculator,
    enableCalculator,
    disableCalculator,
    enableAllCalculators,
    disableAllCalculators,
    isCalculatorDisabled,
    loginAdmin,
    logoutAdmin,
    updateAdminPassword,
  } = useAdmin();

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [activeTab, setActiveTab] = useState<'calculators' | 'settings'>('calculators');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginAdmin(passwordInput)) {
      setPasswordInput('');
      showToast('Successfully logged in as Admin');
    } else {
      setLoginError('Incorrect password. Default password is: admin123');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPassword.trim()) {
      setPwdMsg({ type: 'error', text: 'Password cannot be empty' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    updateAdminPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPwdMsg({ type: 'success', text: 'Admin password updated successfully!' });
  };

  const allCalculatorSlugsAndIds = useMemo(() => {
    const list: string[] = [];
    CALCULATORS.forEach((c) => {
      list.push(c.id);
      if (c.slug !== c.id) list.push(c.slug);
    });
    return list;
  }, []);

  const totalCalculators = CALCULATORS.length;

  const disabledCount = useMemo(() => {
    return CALCULATORS.filter((c) => isCalculatorDisabled(c.id) || isCalculatorDisabled(c.slug)).length;
  }, [disabledCalculators, isCalculatorDisabled]);

  const activeCount = totalCalculators - disabledCount;
  const availabilityPercent = Math.round((activeCount / totalCalculators) * 100);

  // Filtered list of calculators for admin view
  const filteredCalculators = useMemo(() => {
    return CALCULATORS.filter((c) => {
      const isDisabled = isCalculatorDisabled(c.id) || isCalculatorDisabled(c.slug);

      // Status filter
      if (statusFilter === 'active' && isDisabled) return false;
      if (statusFilter === 'disabled' && !isDisabled) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (c.parentCategoryId !== selectedCategory && c.category !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, statusFilter, disabledCalculators, isCalculatorDisabled]);

  // Handle Export Config
  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(disabledCalculators, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'calcula_x_admin_config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Configuration exported as JSON');
  };

  // If NOT authenticated, render Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <SEOHead
          title="Admin Login | CALCULA X"
          description="Access CALCULA X Administrative Control Panel to manage active calculators and features."
          noIndex={true}
        />

        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-6 transition-all ${
          isLight ? 'bg-white border-black/10 text-[#11131A]' : 'bg-[#0C101A] border-white/10 text-white'
        }`}>
          <div className="text-center space-y-3">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg border ${
              isLight ? 'bg-[#6948FF]/10 text-[#6948FF] border-[#6948FF]/30' : 'bg-[#8B6CFF]/20 text-[#8B6CFF] border-[#8B6CFF]/30'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Admin Console</h1>
            <p className={`text-xs ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              Enter administrative credentials to toggle calculators ON/OFF and manage system availability.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Passcode</span>
                <span className="text-[10px] text-[#6948FF]">Default: admin123</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin passcode"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#6948FF] transition-all ${
                    isLight ? 'bg-[#F8FAFC] border-neutral-300 text-neutral-900' : 'bg-[#111725] border-white/10 text-white'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#6948FF] hover:bg-[#5736ea] text-white font-bold text-sm shadow-lg shadow-[#6948FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEOHead
        title="Admin Control Console | CALCULA X"
        description="Manage calculator availability, toggle models ON/OFF, and configure administrative settings."
        noIndex={true}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-700 shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-[#6948FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-black/10' : 'bg-[#0C101A] border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#6948FF] text-white flex items-center justify-center font-bold shadow-lg shadow-[#6948FF]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Admin Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Control Connected
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
              Enable or disable calculators in real-time across the platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/"
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isLight ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </Link>

          <button
            onClick={() => {
              logoutAdmin();
              showToast('Logged out of Admin Console');
            }}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Total Calculators</span>
            <Layers className="w-4 h-4 text-[#6948FF]" />
          </div>
          <div className="text-2xl font-black">{totalCalculators}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Across 5 primary categories</div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Active (ON)</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-black text-green-500">{activeCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Visible to public users</div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Disabled (OFF)</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-500">{disabledCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Hidden / access locked</div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Platform Availability</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black">{availabilityPercent}%</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Operational readiness</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 gap-6">
        <button
          onClick={() => setActiveTab('calculators')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'calculators'
              ? 'border-[#6948FF] text-[#6948FF]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Calculator Controls ({totalCalculators})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'border-[#6948FF] text-[#6948FF]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Security & Backup Settings</span>
        </button>
      </div>

      {activeTab === 'calculators' ? (
        <div className="space-y-6">
          {/* Controls & Search Toolbar */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by calculator title, slug, or category..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6948FF] ${
                    isLight ? 'bg-[#F8FAFC] border-neutral-300 text-neutral-900' : 'bg-[#111725] border-white/10 text-white'
                  }`}
                />
              </div>

              {/* Status filter buttons */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#111725] p-1 rounded-xl border border-black/5 dark:border-white/5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  All ({totalCalculators})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-green-500'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('disabled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'disabled'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-red-500'
                  }`}
                >
                  Disabled ({disabledCount})
                </button>
              </div>
            </div>

            {/* Category filter pills & Batch actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
                <span className="text-neutral-400 text-[11px] font-bold mr-1">CATEGORY:</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-[#6948FF] text-white border-[#6948FF]'
                      : 'bg-neutral-100 dark:bg-[#111725] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  All Categories
                </button>
                <button
                  onClick={() => setSelectedCategory('finance')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'finance'
                      ? 'bg-[#6948FF] text-white border-[#6948FF]'
                      : 'bg-neutral-100 dark:bg-[#111725] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  Finance
                </button>
                <button
                  onClick={() => setSelectedCategory('health')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'health'
                      ? 'bg-[#6948FF] text-white border-[#6948FF]'
                      : 'bg-neutral-100 dark:bg-[#111725] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  Health
                </button>
                <button
                  onClick={() => setSelectedCategory('math')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'math'
                      ? 'bg-[#6948FF] text-white border-[#6948FF]'
                      : 'bg-neutral-100 dark:bg-[#111725] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  Math
                </button>
                <button
                  onClick={() => setSelectedCategory('science')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'science'
                      ? 'bg-[#6948FF] text-white border-[#6948FF]'
                      : 'bg-neutral-100 dark:bg-[#111725] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  Science
                </button>
              </div>

              {/* Global Batch Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    enableAllCalculators();
                    showToast('All calculators turned ON');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enable All</span>
                </button>

                <button
                  onClick={() => {
                    disableAllCalculators(allCalculatorSlugsAndIds);
                    showToast('All calculators turned OFF');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Disable All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calculator Grid */}
          {filteredCalculators.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center space-y-3 ${
              isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
            }`}>
              <Filter className="w-8 h-8 mx-auto text-neutral-400" />
              <h3 className="text-base font-bold">No calculators found matching criteria</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Try clearing your search query or switching filters to view calculators.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#6948FF] text-white text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalculators.map((calc) => {
                const isDisabled = isCalculatorDisabled(calc.id) || isCalculatorDisabled(calc.slug);

                return (
                  <div
                    key={calc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                      isDisabled
                        ? isLight
                          ? 'bg-red-50/50 border-red-200'
                          : 'bg-red-950/10 border-red-900/30'
                        : isLight
                          ? 'bg-white border-neutral-200 hover:border-[#6948FF]/40 shadow-sm'
                          : 'bg-[#0C101A] border-white/10 hover:border-[#6948FF]/40'
                    }`}
                  >
                    {/* Top Status & Category Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          calc.parentCategoryId === 'finance'
                            ? 'bg-blue-500/10 text-blue-500'
                            : calc.category === 'health'
                              ? 'bg-pink-500/10 text-pink-500'
                              : calc.category === 'math'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {calc.subCategoryName || calc.category}
                        </span>
                        <h3 className="font-bold text-sm leading-snug">{calc.title}</h3>
                      </div>

                      {/* Interactive ON/OFF Switch */}
                      <button
                        onClick={() => {
                          toggleCalculator(calc.id);
                          if (calc.slug !== calc.id) {
                            toggleCalculator(calc.slug);
                          }
                          showToast(`${calc.title} turned ${isDisabled ? 'ON' : 'OFF'}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                          isDisabled
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                            : 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                        }`}
                        title={isDisabled ? 'Click to enable calculator' : 'Click to disable calculator'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isDisabled ? 'OFF' : 'ON'}</span>
                      </button>
                    </div>

                    <p className={`text-xs line-clamp-2 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {calc.tagline || calc.description}
                    </p>

                    {/* Bottom Metadata & Launch Link */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-400 truncate max-w-[150px]">
                        /calculator/{calc.slug}
                      </span>

                      <Link
                        to={`/calculator/${calc.slug}`}
                        target="_blank"
                        className={`flex items-center gap-1 hover:underline ${
                          isDisabled ? 'text-red-500 font-bold' : 'text-[#6948FF] font-semibold'
                        }`}
                      >
                        <span>{isDisabled ? 'Preview (Locked)' : 'Test Calculator'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Settings & Security Tab */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Change Password Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
            isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6948FF]/10 text-[#6948FF] flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Change Admin Passcode</h3>
                <p className="text-xs text-neutral-500">Update the administrative password used to unlock this panel.</p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">New Passcode</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new admin passcode"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6948FF] ${
                    isLight ? 'bg-[#F8FAFC] border-neutral-300' : 'bg-[#111725] border-white/10'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Confirm New Passcode</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new admin passcode"
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6948FF] ${
                    isLight ? 'bg-[#F8FAFC] border-neutral-300' : 'bg-[#111725] border-white/10'
                  }`}
                />
              </div>

              {pwdMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  pwdMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'
                }`}>
                  {pwdMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#6948FF] hover:bg-[#5736ea] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Configuration Export & Backup Card */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
            isLight ? 'bg-white border-neutral-200' : 'bg-[#0C101A] border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Export & Backup Configuration</h3>
                <p className="text-xs text-neutral-500">Export your current ON/OFF calculator statuses to a JSON backup file.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExportConfig}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Configuration JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
