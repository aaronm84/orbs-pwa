import { ref } from 'vue'
import { useSettingsStore } from 'src/stores/settings'

// Audio manager for game sounds
export function useGameAudio() {
  const settingsStore = useSettingsStore()
  const audioContext = ref(null)
  const isInitialized = ref(false)
  const bellBuffers = ref([])
  const bellsLoaded = ref(false)

  // Bell sound paths in musical order (C major scale)
  // Using public folder paths (served directly, not processed by Vite)
  const bellPaths = [
    '/audio/bells/144495__wuola__medieval-bell-c4.m4a', // C4
    '/audio/bells/144494__wuola__medieval-bell-d4.m4a', // D4
    '/audio/bells/144492__wuola__medieval-bell-e3.m4a', // E3
    '/audio/bells/144491__wuola__medieval-bell-f3.m4a', // F3
    '/audio/bells/144490__wuola__medieval-bell-g3.m4a', // G3
    '/audio/bells/144497__wuola__medieval-bell-a3.m4a', // A3
    '/audio/bells/144496__wuola__medieval-bell-bb3.m4a', // Bb3
    '/audio/bells/144493__wuola__medieval-bell-d3.m4a', // D3
  ]

  // Current bell index for cycling through sounds
  let currentBellIndex = 0

  // Initialize audio context (must be called after user interaction)
  function init() {
    if (isInitialized.value) return

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContext.value = new AudioContext()
      isInitialized.value = true
      console.log('Audio context initialized')

      // Load bell sounds
      loadBellSounds()
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  // Load and decode bell audio files
  async function loadBellSounds() {
    if (bellsLoaded.value) return

    try {
      const ctx = audioContext.value
      const loadPromises = bellPaths.map(async (path) => {
        const response = await fetch(path)
        const arrayBuffer = await response.arrayBuffer()
        return ctx.decodeAudioData(arrayBuffer)
      })

      bellBuffers.value = await Promise.all(loadPromises)
      bellsLoaded.value = true
      console.log('Bell sounds loaded successfully')
    } catch (error) {
      console.error('Failed to load bell sounds:', error)
      bellsLoaded.value = false
    }
  }

  // Resume audio context if suspended (required by browser autoplay policies)
  async function resume() {
    if (audioContext.value && audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }
  }

  // Generate a simple beep/tone sound
  function playTone(frequency = 440, duration = 0.1, volume = 0.3) {
    if (!settingsStore.settings.soundEffectsEnabled) return
    if (!isInitialized.value) init()

    resume()

    try {
      const ctx = audioContext.value
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Apply volume from settings
      const effectiveVolume = volume * settingsStore.settings.soundEffectsVolume

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(effectiveVolume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (error) {
      console.error('Failed to play tone:', error)
    }
  }

  // Create a "pop" sound effect for explosions
  function playExplosion(pitch = 1.0) {
    if (!settingsStore.settings.soundEffectsEnabled) return
    if (!isInitialized.value) init()

    resume()

    try {
      const ctx = audioContext.value
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Apply volume from settings
      const volume = 0.15 * settingsStore.settings.soundEffectsVolume

      // Start high, sweep down (explosion effect)
      const startFreq = 200 * pitch
      const endFreq = 50 * pitch

      oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.15)
      oscillator.type = 'sawtooth'

      // Filter for more realistic sound
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1000, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)

      // Envelope
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    } catch (error) {
      console.error('Failed to play explosion:', error)
    }
  }

  // Play bell sound for ball captures (cycles through bells musically)
  function playCapture() {
    if (!settingsStore.settings.soundEffectsEnabled) return
    if (!isInitialized.value) init()

    resume()

    try {
      // If bells are loaded, play them; otherwise fall back to synthesized sound
      if (bellsLoaded.value && bellBuffers.value.length > 0) {
        const ctx = audioContext.value
        const source = ctx.createBufferSource()
        const gainNode = ctx.createGain()

        source.buffer = bellBuffers.value[currentBellIndex]
        source.connect(gainNode)
        gainNode.connect(ctx.destination)

        // Apply volume from settings (reduced to 0.15 for gentler sound)
        const volume = 0.15 * settingsStore.settings.soundEffectsVolume
        gainNode.gain.value = volume

        source.start(0)

        // Cycle to next bell for musical chime effect
        currentBellIndex = (currentBellIndex + 1) % bellBuffers.value.length
      } else {
        // Fallback to synthesized tone
        const ctx = audioContext.value
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        const volume = 0.2 * settingsStore.settings.soundEffectsVolume
        oscillator.frequency.value = 800
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(volume, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.08)
      }
    } catch (error) {
      console.error('Failed to play capture:', error)
    }
  }

  // Reset bell sequence (call when starting a new level)
  function resetBellSequence() {
    currentBellIndex = 0
  }

  // Create a success jingle for level complete
  function playLevelComplete() {
    if (!settingsStore.settings.soundEffectsEnabled) return
    if (!isInitialized.value) init()

    resume()

    try {
      const ctx = audioContext.value
      const volume = 0.15 * settingsStore.settings.soundEffectsVolume

      // Play a simple ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      const noteDuration = 0.15

      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        const startTime = ctx.currentTime + index * noteDuration
        const endTime = startTime + noteDuration * 1.5

        gainNode.gain.setValueAtTime(volume, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)

        oscillator.start(startTime)
        oscillator.stop(endTime)
      })
    } catch (error) {
      console.error('Failed to play level complete:', error)
    }
  }

  // Create a descending tone for failure
  function playLevelFailed() {
    if (!settingsStore.settings.soundEffectsEnabled) return
    if (!isInitialized.value) init()

    resume()

    try {
      const ctx = audioContext.value
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      const volume = 0.15 * settingsStore.settings.soundEffectsVolume

      // Descending tone
      oscillator.frequency.setValueAtTime(400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3)
      oscillator.type = 'triangle'

      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (error) {
      console.error('Failed to play level failed:', error)
    }
  }

  // Simple UI click sound
  function playClick() {
    playTone(600, 0.05, 0.1)
  }

  return {
    init,
    playTone,
    playExplosion,
    playCapture,
    playLevelComplete,
    playLevelFailed,
    playClick,
    resetBellSequence,
  }
}
