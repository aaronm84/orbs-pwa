<template>
  <q-page class="dynamic-bg">
    <div class="page-content">
      <!-- App Title -->
      <div class="text-center q-mb-xl">
        <h1 class="text-h2 text-white text-weight-light q-mb-sm">ZENith</h1>
        <p class="text-white text-subtitle1 text-weight-light">
          Relaxing games for mindful moments
        </p>
      </div>

      <!-- Game Cards -->
      <div class="game-grid">
        <q-card
          v-for="game in games"
          :key="game.id"
          class="game-card card-hover cursor-pointer"
          @click="navigateToGame(game.id)"
        >
          <q-card-section>
            <div class="text-h5 text-weight-medium q-mb-sm">
              {{ game.name }}
            </div>
            <div class="text-caption text-grey-7">
              {{ game.description }}
            </div>
          </q-card-section>

          <q-card-section v-if="game.progress !== undefined">
            <q-linear-progress
              :value="game.progress / 100"
              :color="progressColor"
              size="8px"
              rounded
            />
            <div class="text-caption text-grey-6 q-mt-xs">Level {{ game.currentLevel }}</div>
          </q-card-section>

          <q-badge v-if="!game.available" floating color="grey" label="Coming Soon" />
        </q-card>
      </div>

      <!-- Footer Actions -->
      <div class="footer-actions">
        <q-btn
          flat
          color="white"
          label="Statistics"
          icon="bar_chart"
          @click="navigateTo('stats')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from 'src/stores/progress'
import { useThemeStore } from 'src/stores/theme'
import { useHaptics } from 'src/composables/useHaptics'

const router = useRouter()
const progressStore = useProgressStore()
const themeStore = useThemeStore()
const haptics = useHaptics()

const games = ref([
  {
    id: 'chain-reaction',
    name: 'Chain Reaction',
    description: 'Create mesmerizing chain reactions',
    available: true,
    progress: 0,
    currentLevel: 1,
  },
  {
    id: 'solitaire',
    name: 'Solitaire',
    description: 'Classic card game, reimagined',
    available: true,
  },
  {
    id: 'flow-connect',
    name: 'Flow Connect',
    description: 'Connect the dots without crossing',
    available: false,
  },
  {
    id: 'ripple',
    name: 'Ripple',
    description: 'Create waves to reach lotus flowers',
    available: false,
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'Learn the stars while you play',
    available: false,
  },
])

const progressColor = computed(() => themeStore.colors.accent)

onMounted(async () => {
  await progressStore.loadFromStorage()
  updateGameProgress()
})

function updateGameProgress() {
  const chainReactionGame = games.value.find((g) => g.id === 'chain-reaction')
  if (chainReactionGame) {
    chainReactionGame.currentLevel = progressStore.chainReaction.currentLevel
    chainReactionGame.progress = progressStore.chainReactionProgress
  }
}

function navigateToGame(gameId) {
  const game = games.value.find((g) => g.id === gameId)
  if (!game?.available) {
    haptics.warning()
    return
  }

  haptics.medium()
  router.push({ name: gameId })
}

function navigateTo(routeName) {
  haptics.light()
  router.push({ name: routeName })
}
</script>

<style lang="scss" scoped>
.dynamic-bg {
  background: v-bind('themeStore.colors.gradient');
  min-height: 100vh;
  transition: background 2s ease;
}

.page-content {
  width: 100%;
  max-width: 600px;
  padding: 24px;
  margin: 0 auto;
}

.time-badge {
  display: inline-block;
  padding: 8px 16px;
  background: v-bind('themeStore.colors.cardBg');
  color: v-bind('themeStore.colors.text');
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 2s ease;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.game-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: v-bind('themeStore.colors.cardBg');
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  // Make all text white
  :deep(*) {
    color: white !important;
  }
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
</style>
