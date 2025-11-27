import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStorage } from 'src/composables/useGameStorage'

export const useProgressStore = defineStore('progress', () => {
  const storage = useGameStorage()

  // Orbs progress
  const orbs = ref({
    currentLevel: 1,
    highestLevel: 1,
    bestScore: 0,
    totalPlays: 0,
    perfectLevels: [],
  })

  const orbsProgress = computed(() => {
    return (orbs.value.currentLevel / 100) * 100
  })

  // Orbs methods
  function updateOrbsLevel(level, score, perfect) {
    orbs.value.currentLevel = level
    orbs.value.highestLevel = Math.max(orbs.value.highestLevel, level)
    orbs.value.bestScore = Math.max(orbs.value.bestScore, score)
    orbs.value.totalPlays++

    if (perfect && !orbs.value.perfectLevels.includes(level)) {
      orbs.value.perfectLevels.push(level)
    }

    saveToStorage()
  }

  async function saveToStorage() {
    try {
      const progressData = {
        orbs: orbs.value,
      }
      await storage.saveProgress(progressData)
      console.log('Progress saved successfully')
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  async function loadFromStorage() {
    try {
      const progressData = await storage.loadProgress()
      if (progressData) {
        if (progressData.orbs) {
          orbs.value = progressData.orbs
        } else if (progressData.chainReaction) {
          // Migrate old chainReaction data to orbs
          orbs.value = progressData.chainReaction
        }
        console.log('Progress loaded successfully')
      } else {
        console.log('No saved progress found, using defaults')
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  return {
    // Orbs
    orbs,
    orbsProgress,
    updateOrbsLevel,

    // Common
    saveToStorage,
    loadFromStorage,
  }
})
