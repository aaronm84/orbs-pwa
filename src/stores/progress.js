import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStorage } from 'src/composables/useGameStorage'

export const useProgressStore = defineStore('progress', () => {
  const storage = useGameStorage()

  const chainReaction = ref({
    currentLevel: 1,
    highestLevel: 1,
    bestScore: 0,
    totalPlays: 0,
    perfectLevels: [],
  })

  const chainReactionProgress = computed(() => {
    return (chainReaction.value.currentLevel / 100) * 100
  })

  function updateChainReactionLevel(level, score, perfect) {
    chainReaction.value.currentLevel = level
    chainReaction.value.highestLevel = Math.max(chainReaction.value.highestLevel, level)
    chainReaction.value.bestScore = Math.max(chainReaction.value.bestScore, score)
    chainReaction.value.totalPlays++

    if (perfect && !chainReaction.value.perfectLevels.includes(level)) {
      chainReaction.value.perfectLevels.push(level)
    }

    saveToStorage()
  }

  async function saveToStorage() {
    try {
      const progressData = {
        chainReaction: chainReaction.value,
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
      if (progressData && progressData.chainReaction) {
        chainReaction.value = progressData.chainReaction
        console.log('Progress loaded successfully')
      } else {
        console.log('No saved progress found, using defaults')
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  return {
    chainReaction,
    chainReactionProgress,
    updateChainReactionLevel,
    saveToStorage,
    loadFromStorage,
  }
})
