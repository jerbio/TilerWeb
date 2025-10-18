import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { consentManager, ConsentPreferences } from './consent-manager';
import CookieConsentBanner from './cookie-consent-banner';
import PrivacySettingsModal from './privacy-settings-modal';

type ConsentContextType = {
  preferences: ConsentPreferences | null;
  hasConsent: boolean;
  openSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: ConsentPreferences) => void;
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

type ConsentProviderProps = {
  children: ReactNode;
};

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Initialize consent manager
    consentManager.initialize();

    // Load initial preferences
    const prefs = consentManager.getPreferences();
    setPreferences(prefs);
    setHasConsent(consentManager.hasConsent());

    // Subscribe to consent changes
    const unsubscribe = consentManager.subscribe(() => {
      setPreferences(consentManager.getPreferences());
      setHasConsent(consentManager.hasConsent());
    });

    return unsubscribe;
  }, []);

  const openSettings = () => {
    setSettingsOpen(true);
  };

  const acceptAll = () => {
    consentManager.acceptAll();
  };

  const rejectAll = () => {
    consentManager.rejectAll();
  };

  const savePreferences = (prefs: ConsentPreferences) => {
    consentManager.savePreferences(prefs);
  };

  return (
    <ConsentContext.Provider
      value={{
        preferences,
        hasConsent,
        openSettings,
        acceptAll,
        rejectAll,
        savePreferences,
      }}
    >
      {children}
      <CookieConsentBanner onOpenSettings={openSettings} />
      <PrivacySettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};

export default ConsentProvider;
