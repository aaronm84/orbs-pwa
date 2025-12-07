import { ref } from 'vue'
import { useSettingsStore } from 'src/stores/settings'

// Audio manager for game sounds
export function useGameAudio() {
  const settingsStore = useSettingsStore()
  const audioContext = ref(null)
  const isInitialized = ref(false)
  const bellBuffers = ref([])
  const bellsLoaded = ref(false)
  const backgroundMusic = ref(null)
  const isMusicPlaying = ref(false)
  let appStateListener = null
  let capacitorApp = null
  let capacitorCore = null

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

      // Set up app state listener for iOS background/foreground handling
      setupAppStateListener()
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  // Handle app returning from background on iOS
  async function setupAppStateListener() {
    try {
      // Dynamically import Capacitor modules (only available in native builds)
      capacitorCore = await import('@capacitor/core').catch(() => null)
      capacitorApp = await import('@capacitor/app').catch(() => null)

      // Only set up listener on native platforms
      if (!capacitorCore || !capacitorCore.Capacitor.isNativePlatform()) {
        console.log('Not a native platform, skipping app state listener')
        return
      }

      // Remove existing listener if any
      if (appStateListener) {
        appStateListener.remove()
      }

      appStateListener = await capacitorApp.App.addListener('appStateChange', async ({ isActive }) => {
        console.log('App state changed, isActive:', isActive)

        if (isActive) {
          // App returned to foreground - resume audio context
          await resumeAudioContext()

          // Also resume background music if it was playing
          if (backgroundMusic.value && settingsStore.settings.musicEnabled) {
            try {
              await backgroundMusic.value.play()
              isMusicPlaying.value = true
            } catch (error) {
              console.log('Could not auto-resume music:', error)
            }
          }
        } else {
          // App going to background - pause music to avoid issues
          if (backgroundMusic.value && isMusicPlaying.value) {
            backgroundMusic.value.pause()
          }
        }
      })

      console.log('App state listener set up for audio context management')
    } catch (error) {
      console.log('Could not set up app state listener (not in native context):', error)
    }
  }

  // Force resume audio context (for iOS background return)
  async function resumeAudioContext() {
    if (!audioContext.value) return

    try {
      if (audioContext.value.state === 'suspended' || audioContext.value.state === 'interrupted') {
        console.log('Resuming audio context from state:', audioContext.value.state)
        await audioContext.value.resume()
        console.log('Audio context resumed, new state:', audioContext.value.state)
      }
    } catch (error) {
      console.error('Failed to resume audio context:', error)

      // If resume fails, try recreating the audio context
      try {
        console.log('Attempting to recreate audio context...')
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioContext.value = new AudioContext()
        // Reload bell sounds with new context
        bellsLoaded.value = false
        await loadBellSounds()
        console.log('Audio context recreated successfully')
      } catch (recreateError) {
        console.error('Failed to recreate audio context:', recreateError)
      }
    }
  }

  // Cleanup listener when composable is destroyed
  function cleanup() {
    if (appStateListener) {
      appStateListener.remove()
      appStateListener = null
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
    await resumeAudioContext()
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

  // Space ambient music tracks
  const musicTracks = [
    '/audio/space - music/calm-space-music-312291.mp3',
    '/audio/space - music/ambient-background-music-312295.mp3',
    '/audio/space - music/cinematic-304561.mp3',
    '/audio/space - music/doomed-calm-dark-ambient-music-318236.mp3',
    '/audio/space - music/nwhere-calm-ambient-music-by-vvk-305850.mp3',
    '/audio/space - music/solas-x-interstellar-piano-223676.mp3',
  ]

  // Play background music (randomly select a track)
  function playBackgroundMusic(trackIndex = null) {
    if (!settingsStore.settings.musicEnabled) return
    if (!isInitialized.value) init()

    try {
      // Stop current music if playing
      if (backgroundMusic.value) {
        backgroundMusic.value.pause()
        backgroundMusic.value.currentTime = 0
      }

      // Select a random track if not specified
      const selectedTrack = trackIndex !== null
        ? musicTracks[trackIndex]
        : musicTracks[Math.floor(Math.random() * musicTracks.length)]

      // Create audio element
      backgroundMusic.value = new Audio(selectedTrack)
      backgroundMusic.value.loop = true
      backgroundMusic.value.volume = settingsStore.settings.musicVolume

      // Play the music
      backgroundMusic.value.play()
        .then(() => {
          isMusicPlaying.value = true
          console.log('Background music started:', selectedTrack)
        })
        .catch((error) => {
          console.error('Failed to play background music:', error)
          isMusicPlaying.value = false
        })

      // Handle track ending (though loop should prevent this)
      backgroundMusic.value.addEventListener('ended', () => {
        isMusicPlaying.value = false
      })
    } catch (error) {
      console.error('Failed to initialize background music:', error)
    }
  }

  // Pause background music
  function pauseBackgroundMusic() {
    if (backgroundMusic.value && isMusicPlaying.value) {
      backgroundMusic.value.pause()
      isMusicPlaying.value = false
    }
  }

  // Resume background music
  function resumeBackgroundMusic() {
    if (backgroundMusic.value && !isMusicPlaying.value) {
      backgroundMusic.value.play()
        .then(() => {
          isMusicPlaying.value = true
        })
        .catch((error) => {
          console.error('Failed to resume background music:', error)
        })
    }
  }

  // Stop background music completely
  function stopBackgroundMusic() {
    if (backgroundMusic.value) {
      backgroundMusic.value.pause()
      backgroundMusic.value.currentTime = 0
      isMusicPlaying.value = false
    }
  }

  // Update music volume
  function setMusicVolume(volume) {
    if (backgroundMusic.value) {
      backgroundMusic.value.volume = Math.max(0, Math.min(1, volume))
    }
  }

  return {
    init,
    cleanup,
    playTone,
    playExplosion,
    playCapture,
    playLevelComplete,
    playLevelFailed,
    playClick,
    resetBellSequence,
    // Background music
    playBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    stopBackgroundMusic,
    setMusicVolume,
    isMusicPlaying,
    // For manual resume (e.g., on user interaction after background)
    resumeAudioContext,
  }
}
