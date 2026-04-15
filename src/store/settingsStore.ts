import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  siteName: string;
  siteLogo: string;
  setSiteSettings: (name: string, logo: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      siteName: 'Pracker',
      siteLogo: '',
      setSiteSettings: (siteName, siteLogo) => set({ siteName, siteLogo }),
    }),
    { name: 'pracker-site-settings' }
  )
);
