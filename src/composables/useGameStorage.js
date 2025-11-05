import { Preferences } from '@capacitor/preferences'

export function useGameStorage() {
  const KEYS = {
    SETTINGS: 'zenith_settings',
    PROGRESS: 'zenith_progress',
    STATS: 'zenith_stats',
  }

  async function saveSettings(settings) {
    try {
      await Preferences.set({
        key: KEYS.SETTINGS,
        value: JSON.stringify(settings),
      })
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  async function loadSettings() {
    try {
      const { value } = await Preferences.get({ key: KEYS.SETTINGS })
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error loading settings:', error)
      return null
    }
  }

  async function saveProgress(progress) {
    try {
      await Preferences.set({
        key: KEYS.PROGRESS,
        value: JSON.stringify(progress),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  async function loadProgress() {
    try {
      const { value } = await Preferences.get({ key: KEYS.PROGRESS })
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error loading progress:', error)
      return null
    }
  }

  async function clearAll() {
    try {
      await Preferences.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  return {
    saveSettings,
    loadSettings,
    saveProgress,
    loadProgress,
    clearAll,
  }
}
