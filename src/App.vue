<template>
  <LoadingScreen ref="loadingScreen" />
  <router-view v-slot="{ Component }">
    <component :is="Component" ref="currentPage" />
  </router-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from 'src/stores/settings'
import { useProgressStore } from 'src/stores/progress'
import { useThemeStore } from 'src/stores/theme'
import { useStatusBar } from 'src/composables/useStatusBar'
import LoadingScreen from 'src/components/LoadingScreen.vue'

const settingsStore = useSettingsStore()
const progressStore = useProgressStore()
const themeStore = useThemeStore()
const statusBar = useStatusBar()
const loadingScreen = ref(null)
const currentPage = ref(null)

// Load saved data on app startup
onMounted(async () => {
  try {
    // Load all data
    await Promise.all([
      settingsStore.loadSettings(),
      progressStore.loadFromStorage()
    ])

    // Restore theme override preference
    const themeOverride = settingsStore.settings.themeOverride
    if (themeOverride && themeOverride !== 'auto') {
      themeStore.setThemeOverride(themeOverride)
    }

    // Configure status bar for overlay mode with light content
    await statusBar.setLightContent()

    // Minimum loading time for better UX (show loading for at least 1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Hide loading screen with transition
    if (loadingScreen.value) {
      loadingScreen.value.hide()
    }

    // Reveal index page title right when loading title reaches position (0.8s transition)
    setTimeout(() => {
      if (currentPage.value && currentPage.value.revealTitle) {
        currentPage.value.revealTitle()
      }
    }, 800) // Start fading in exactly when loading title stops moving
  } catch (error) {
    console.error('Error during app initialization:', error)
    // Hide loading screen even if there's an error
    if (loadingScreen.value) {
      loadingScreen.value.hide()
    }
  }
})
</script>
