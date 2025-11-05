import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTimeOfDay } from 'src/composables/useTimeOfDay'

export const useThemeStore = defineStore('theme', () => {
  const timeOfDay = useTimeOfDay()

  // Expose time-of-day colors
  const colors = computed(() => timeOfDay.colors.value)
  const period = computed(() => timeOfDay.currentPeriod.value)

  return {
    colors,
    period,
  }
})
