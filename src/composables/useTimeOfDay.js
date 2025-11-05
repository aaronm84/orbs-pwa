import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useTimeOfDay() {
  const currentHour = ref(new Date().getHours())
  const currentMinute = ref(new Date().getMinutes())
  let intervalId = null

  // Time periods with color schemes
  const timeSchemes = {
    night: {
      name: 'Night',
      hours: [0, 1, 2, 3, 4],
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#4a5568',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        text: '#e2e8f0',
        cardBg: 'rgba(255, 255, 255, 0.05)',
      },
    },
    dawn: {
      name: 'Dawn',
      hours: [5, 6],
      colors: {
        primary: '#ff6b9d',
        secondary: '#ffa07a',
        accent: '#ffd700',
        gradient: 'linear-gradient(135deg, #4a148c 0%, #ff6b9d 50%, #ffa07a 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.1)',
      },
    },
    morning: {
      name: 'Morning',
      hours: [7, 8, 9],
      colors: {
        primary: '#4fc3f7',
        secondary: '#81c784',
        accent: '#ffeb3b',
        gradient: 'linear-gradient(135deg, #42a5f5 0%, #66bb6a 50%, #fff176 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.15)',
      },
    },
    midday: {
      name: 'Midday',
      hours: [10, 11, 12, 13, 14],
      colors: {
        primary: '#2196f3',
        secondary: '#64b5f6',
        accent: '#ffd54f',
        gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.2)',
      },
    },
    afternoon: {
      name: 'Afternoon',
      hours: [15, 16],
      colors: {
        primary: '#ff9800',
        secondary: '#ffb74d',
        accent: '#ffd54f',
        gradient: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.15)',
      },
    },
    evening: {
      name: 'Evening',
      hours: [17, 18],
      colors: {
        primary: '#ff5722',
        secondary: '#d84315',
        accent: '#ff6f00',
        gradient: 'linear-gradient(135deg, #bf360c 0%, #ff5722 50%, #ff6f00 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.1)',
      },
    },
    dusk: {
      name: 'Dusk',
      hours: [19, 20],
      colors: {
        primary: '#7e57c2',
        secondary: '#5e35b1',
        accent: '#9575cd',
        gradient: 'linear-gradient(135deg, #4a148c 0%, #7e57c2 50%, #9575cd 100%)',
        text: '#ffffff',
        cardBg: 'rgba(255, 255, 255, 0.08)',
      },
    },
    lateNight: {
      name: 'Late Night',
      hours: [21, 22, 23],
      colors: {
        primary: '#283593',
        secondary: '#1a237e',
        accent: '#5c6bc0',
        gradient: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        text: '#e2e8f0',
        cardBg: 'rgba(255, 255, 255, 0.06)',
      },
    },
  }

  // Get current time period
  const currentPeriod = computed(() => {
    const hour = currentHour.value

    for (const [key, scheme] of Object.entries(timeSchemes)) {
      if (scheme.hours.includes(hour)) {
        return { key, ...scheme }
      }
    }

    return { key: 'night', ...timeSchemes.night }
  })

  // Current colors
  const colors = computed(() => currentPeriod.value.colors)

  // Update time
  function updateTime() {
    const now = new Date()
    currentHour.value = now.getHours()
    currentMinute.value = now.getMinutes()
  }

  // Start interval to check time every minute
  onMounted(() => {
    updateTime()
    // Update every minute
    intervalId = setInterval(updateTime, 60000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    currentHour,
    currentMinute,
    currentPeriod,
    colors,
    updateTime,
  }
}
