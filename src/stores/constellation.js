import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConstellationStore = defineStore('constellation', () => {
  // All constellation data
  const constellations = ref([])

  // Currently selected constellation for gameplay
  const currentConstellation = ref(null)

  // Player progress for each constellation
  const progress = ref({
    // constellation_id: {
    //   completed: boolean,
    //   bestTime: number (seconds),
    //   timesPlayed: number,
    //   modesCompleted: ['guided', 'memory', 'timed']
    // }
  })

  // Game state
  const gameMode = ref('guided') // 'guided' | 'memory' | 'timed' | 'exploration' | 'challenge'
  const difficulty = ref('easy') // 'easy' | 'medium' | 'hard'

  // Filtered lists
  const availableConstellations = computed(() => {
    // Return all constellations ordered by difficulty (easiest first)
    // For now, make all available. Later we can add unlock mechanics.
    return constellations.value
      .sort((a, b) => a.difficulty - b.difficulty)
  })

  const completedConstellations = computed(() => {
    return constellations.value.filter(c => progress.value[c.id]?.completed)
  })

  const constellationsByHemisphere = computed(() => {
    return {
      northern: constellations.value.filter(c => c.hemisphere === 'northern' || c.hemisphere === 'both'),
      southern: constellations.value.filter(c => c.hemisphere === 'southern' || c.hemisphere === 'both'),
      both: constellations.value.filter(c => c.hemisphere === 'both')
    }
  })

  // Actions
  function loadConstellations(data) {
    constellations.value = data
  }

  function selectConstellation(constellationId) {
    const constellation = constellations.value.find(c => c.id === constellationId)
    if (constellation) {
      currentConstellation.value = constellation
    }
  }

  function updateProgress(constellationId, data) {
    if (!progress.value[constellationId]) {
      progress.value[constellationId] = {
        completed: false,
        bestTime: null,
        timesPlayed: 0,
        modesCompleted: []
      }
    }

    const constellationProgress = progress.value[constellationId]

    constellationProgress.timesPlayed++

    if (data.completed) {
      constellationProgress.completed = true

      // Update best time if better
      if (data.time && (!constellationProgress.bestTime || data.time < constellationProgress.bestTime)) {
        constellationProgress.bestTime = data.time
      }

      // Track mode completion
      if (data.mode && !constellationProgress.modesCompleted.includes(data.mode)) {
        constellationProgress.modesCompleted.push(data.mode)
      }
    }
  }

  function setGameMode(mode) {
    gameMode.value = mode
  }

  function setDifficulty(level) {
    difficulty.value = level
  }

  function resetCurrentConstellation() {
    currentConstellation.value = null
  }

  return {
    // State
    constellations,
    currentConstellation,
    progress,
    gameMode,
    difficulty,

    // Computed
    availableConstellations,
    completedConstellations,
    constellationsByHemisphere,

    // Actions
    loadConstellations,
    selectConstellation,
    updateProgress,
    setGameMode,
    setDifficulty,
    resetCurrentConstellation
  }
})
