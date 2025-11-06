import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStorage } from 'src/composables/useGameStorage'

export const useProgressStore = defineStore('progress', () => {
  const storage = useGameStorage()

  // Chain Reaction (Orbs) progress
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

  // Solitaire progress
  const solitaire = ref({
    gamesPlayed: 0,
    gamesWon: 0,
    fastestTime: null, // in seconds
    totalMoves: 0,
    bestMoveCount: null, // fewest moves to win
  })

  const solitaireWinRate = computed(() => {
    if (solitaire.value.gamesPlayed === 0) return 0
    return (solitaire.value.gamesWon / solitaire.value.gamesPlayed) * 100
  })

  // Ripple progress
  const ripple = ref({
    currentLevel: 1,
    highestLevel: 1,
    totalPlays: 0,
    perfectLevels: [], // levels completed with minimum taps
  })

  const rippleProgress = computed(() => {
    return (ripple.value.currentLevel / 100) * 100
  })

  // Chain Reaction methods
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

  // Solitaire methods
  function updateSolitaireStats(won, timeInSeconds, moveCount) {
    solitaire.value.gamesPlayed++

    if (won) {
      solitaire.value.gamesWon++

      // Update fastest time
      if (!solitaire.value.fastestTime || timeInSeconds < solitaire.value.fastestTime) {
        solitaire.value.fastestTime = timeInSeconds
      }

      // Update best move count
      if (!solitaire.value.bestMoveCount || moveCount < solitaire.value.bestMoveCount) {
        solitaire.value.bestMoveCount = moveCount
      }
    }

    solitaire.value.totalMoves += moveCount
    saveToStorage()
  }

  // Ripple methods
  function updateRippleLevel(level, perfect) {
    ripple.value.currentLevel = level
    ripple.value.highestLevel = Math.max(ripple.value.highestLevel, level)
    ripple.value.totalPlays++

    if (perfect && !ripple.value.perfectLevels.includes(level)) {
      ripple.value.perfectLevels.push(level)
    }

    saveToStorage()
  }

  async function saveToStorage() {
    try {
      const progressData = {
        chainReaction: chainReaction.value,
        solitaire: solitaire.value,
        ripple: ripple.value,
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
        if (progressData.chainReaction) {
          chainReaction.value = progressData.chainReaction
        }
        if (progressData.solitaire) {
          solitaire.value = progressData.solitaire
        }
        if (progressData.ripple) {
          ripple.value = progressData.ripple
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
    // Chain Reaction
    chainReaction,
    chainReactionProgress,
    updateChainReactionLevel,

    // Solitaire
    solitaire,
    solitaireWinRate,
    updateSolitaireStats,

    // Ripple
    ripple,
    rippleProgress,
    updateRippleLevel,

    // Common
    saveToStorage,
    loadFromStorage,
  }
})
