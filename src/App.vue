<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from 'src/stores/settings'
import { useProgressStore } from 'src/stores/progress'

const settingsStore = useSettingsStore()
const progressStore = useProgressStore()

// Load saved data on app startup
onMounted(async () => {
  await settingsStore.loadSettings()
  await progressStore.loadFromStorage()
})
</script>
