<template>
  <q-page class="settings-page" :style="{ background: themeStore.colors.gradient }">
    <div class="settings-container">
      <h3 class="text-h4 text-white q-mb-lg q-pt-md">Settings</h3>

      <!-- Audio Settings -->
      <q-card class="settings-card q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md text-white">Audio</div>

          <q-toggle
            v-model="settings.soundEffectsEnabled"
            label="Sound Effects"
            @update:model-value="saveSettings"
          />

          <q-slider
            v-model="settings.soundEffectsVolume"
            :min="0"
            :max="1"
            :step="0.1"
            label
            label-always
            :disable="!settings.soundEffectsEnabled"
            class="q-mt-md"
            @change="saveSettings"
          />

          <q-separator class="q-my-md" />

          <q-toggle
            v-model="settings.musicEnabled"
            label="Music"
            @update:model-value="saveSettings"
          />

          <q-slider
            v-model="settings.musicVolume"
            :min="0"
            :max="1"
            :step="0.1"
            label
            label-always
            :disable="!settings.musicEnabled"
            class="q-mt-md"
            @change="saveSettings"
          />
        </q-card-section>
      </q-card>

      <!-- Haptics Settings -->
      <q-card class="settings-card q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md text-white">Haptics</div>

          <q-toggle
            v-model="settings.hapticsEnabled"
            label="Haptic Feedback"
            @update:model-value="saveSettings"
          />

          <q-select
            v-model="settings.hapticsIntensity"
            :options="['light', 'medium', 'heavy']"
            label="Intensity"
            :disable="!settings.hapticsEnabled"
            class="q-mt-md"
            @update:model-value="saveSettings"
          />
        </q-card-section>
      </q-card>

      <!-- Display Settings -->
      <q-card class="settings-card q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md text-white">Display</div>

          <div class="text-caption text-white q-mb-md" style="opacity: 0.8;">
            Orbs' theme automatically changes throughout the day based on the time. However, feel free to change it to whatever theme fits your mood.
          </div>

          <q-select
            v-model="selectedTheme"
            :options="themeOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Theme"
            @update:model-value="updateTheme"
          />

          <q-toggle
            v-model="settings.reducedMotion"
            label="Reduced Motion"
            class="q-mt-md"
            @update:model-value="saveSettings"
          />
        </q-card-section>
      </q-card>

      <!-- Gameplay Settings -->
      <q-card class="settings-card q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md text-white">Gameplay</div>

          <q-toggle
            v-model="settings.showTutorials"
            label="Show Tutorials"
            @update:model-value="saveSettings"
          />

          <q-toggle
            v-model="settings.confirmations"
            label="Confirm Actions"
            class="q-mt-md"
            @update:model-value="saveSettings"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from 'src/stores/settings'
import { useThemeStore } from 'src/stores/theme'
import { useHaptics } from 'src/composables/useHaptics'

const settingsStore = useSettingsStore()
const themeStore = useThemeStore()
const haptics = useHaptics()

const settings = computed(() => settingsStore.settings)

// Theme selection
const selectedTheme = ref('auto')

const themeOptions = computed(() => {
  const options = [
    { label: 'Auto (Based on time)', value: 'auto' }
  ]

  // Add all time-of-day themes
  Object.entries(themeStore.timeSchemes).forEach(([key, scheme]) => {
    options.push({
      label: scheme.name,
      value: key
    })
  })

  return options
})

function updateTheme(value) {
  haptics.light()
  if (value === 'auto') {
    themeStore.setThemeOverride(null)
  } else {
    themeStore.setThemeOverride(value)
  }
  selectedTheme.value = value

  // Save theme preference to settings
  settingsStore.updateSetting('themeOverride', value)
}

onMounted(() => {
  // Initialize selected theme based on saved preference
  selectedTheme.value = settingsStore.settings.themeOverride || 'auto'
})

async function saveSettings() {
  haptics.light()
  await settingsStore.saveSettings()
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  transition: background 2s ease;
}

.settings-container {
  width: 100%;
  max-width: 600px;
  padding: 24px;
  padding-top: max(40px, env(safe-area-inset-top) + 24px);
  margin: 0 auto;
}

.settings-card {
  border-radius: 12px;
  background: v-bind('themeStore.colors.cardBg');
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  // Make all text white
  :deep(*) {
    color: white !important;
  }

  // Style the separator
  :deep(.q-separator) {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
