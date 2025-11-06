<template>
  <transition name="fade">
    <div v-if="isLoading" class="loading-screen" :style="{ background: themeStore.colors.gradient }">
      <div class="loading-content">
        <!-- ZENith Logo with Animation -->
        <div class="logo-container">
          <h1 class="app-title">
            <span class="zen-text">ZEN</span><span class="ith-text">ith</span>
          </h1>
          <div class="tagline">Find Your Balance</div>
        </div>

        <!-- Animated Zen Circle (Enso) -->
        <div class="zen-circle-container">
          <svg class="zen-circle" viewBox="0 0 100 100" width="120" height="120">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="280"
              stroke-dashoffset="280"
              class="circle-path"
            />
          </svg>
        </div>

        <!-- Loading Text -->
        <div class="loading-text">
          {{ loadingMessage }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThemeStore } from 'src/stores/theme'

const themeStore = useThemeStore()
const isLoading = ref(true)
const loadingMessage = ref('Preparing your sanctuary...')

const loadingMessages = [
  'Preparing your sanctuary...',
  'Finding inner peace...',
  'Balancing the elements...',
  'Aligning the stars...',
]

let messageIndex = 0
let messageInterval = null

onMounted(() => {
  // Cycle through loading messages
  messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % loadingMessages.length
    loadingMessage.value = loadingMessages[messageIndex]
  }, 2000)
})

// Function to hide loading screen (will be called from parent)
function hide() {
  isLoading.value = false
  if (messageInterval) {
    clearInterval(messageInterval)
  }
}

// Expose hide method to parent
defineExpose({ hide })
</script>

<style lang="scss" scoped>
// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 2s ease;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.logo-container {
  text-align: center;
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-title {
  font-size: 64px;
  font-weight: 300;
  margin: 0;
  letter-spacing: 4px;
  color: white;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

.zen-text {
  font-weight: 700;
  letter-spacing: 8px;
}

.ith-text {
  font-weight: 200;
  letter-spacing: 2px;
}

.tagline {
  font-size: 16px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.zen-circle-container {
  position: relative;
  animation: fadeIn 1s ease-out 0.5s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.zen-circle {
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
}

.circle-path {
  animation: drawCircle 2s ease-in-out infinite;
}

@keyframes drawCircle {
  0% {
    stroke-dashoffset: 280;
    opacity: 0.5;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -280;
    opacity: 0.5;
  }
}

.loading-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
  animation: pulse 2s ease-in-out infinite;
  text-align: center;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

// Mobile responsiveness
@media (max-width: 600px) {
  .app-title {
    font-size: 48px;
  }

  .tagline {
    font-size: 14px;
  }
}
</style>
