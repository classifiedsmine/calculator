import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  disabledCalculators: Record<string, boolean>; // calcId -> true if disabled
  toggleCalculator: (calcIdOrSlug: string) => void;
  enableCalculator: (calcIdOrSlug: string) => void;
  disableCalculator: (calcIdOrSlug: string) => void;
  enableAllCalculators: () => void;
  disableAllCalculators: (allIds: string[]) => void;
  isCalculatorDisabled: (calcIdOrSlug: string) => boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  updateAdminPassword: (newPwd: string) => void;
}

const STORAGE_KEY_DISABLED = 'calcula_x_disabled_calcs_v1';
const STORAGE_KEY_AUTH = 'calcula_x_admin_authed_v1';
const STORAGE_KEY_PWD = 'calcula_x_admin_pwd_v1';

const DEFAULT_PASSWORD = 'admin123';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [disabledCalculators, setDisabledCalculators] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISABLED);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PWD) || DEFAULT_PASSWORD;
    } catch {
      return DEFAULT_PASSWORD;
    }
  });

  // Save disabled state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISABLED, JSON.stringify(disabledCalculators));
    } catch (e) {
      console.error('Failed to save disabled calculators state', e);
    }
  }, [disabledCalculators]);

  const loginAdmin = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {}
  };

  const updateAdminPassword = (newPwd: string) => {
    if (!newPwd.trim()) return;
    setAdminPassword(newPwd);
    try {
      localStorage.setItem(STORAGE_KEY_PWD, newPwd);
    } catch {}
  };

  const isCalculatorDisabled = (calcIdOrSlug: string): boolean => {
    return !!disabledCalculators[calcIdOrSlug];
  };

  const toggleCalculator = (calcIdOrSlug: string) => {
    setDisabledCalculators((prev) => {
      const copy = { ...prev };
      if (copy[calcIdOrSlug]) {
        delete copy[calcIdOrSlug];
      } else {
        copy[calcIdOrSlug] = true;
      }
      return copy;
    });
  };

  const enableCalculator = (calcIdOrSlug: string) => {
    setDisabledCalculators((prev) => {
      const copy = { ...prev };
      delete copy[calcIdOrSlug];
      return copy;
    });
  };

  const disableCalculator = (calcIdOrSlug: string) => {
    setDisabledCalculators((prev) => ({
      ...prev,
      [calcIdOrSlug]: true,
    }));
  };

  const enableAllCalculators = () => {
    setDisabledCalculators({});
  };

  const disableAllCalculators = (allIds: string[]) => {
    const map: Record<string, boolean> = {};
    allIds.forEach((id) => {
      map[id] = true;
    });
    setDisabledCalculators(map);
  };

  return (
    <AdminContext.Provider
      value={{
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
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
