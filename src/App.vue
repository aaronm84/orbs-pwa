<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from 'src/stores/settings'
import { useProgressStore } from 'src/stores/progress'
import { useThemeStore } from 'src/stores/theme'
import { useStatusBar } from 'src/composables/useStatusBar'

const settingsStore = useSettingsStore()
const progressStore = useProgressStore()
const themeStore = useThemeStore()
const statusBar = useStatusBar()

// Load saved data on app startup
onMounted(async () => {
  await settingsStore.loadSettings()
  await progressStore.loadFromStorage()

  // Restore theme override preference
  const themeOverride = settingsStore.settings.themeOverride
  if (themeOverride && themeOverride !== 'auto') {
    themeStore.setThemeOverride(themeOverride)
  }

  // Configure status bar for overlay mode with light content
  await statusBar.setLightContent()
})
</script>
