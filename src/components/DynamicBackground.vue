<template>
  <div class="theme-scene">
    <!-- Tree Silhouette - appears in all scenes -->
    <div class="tree-silhouette">
      <img :src="treeImage" alt="Tree" />
    </div>

    <!-- Night Scene -->
    <div v-if="themeStore.period.key === 'night'" class="night-scene">
      <!-- Moon -->
      <div class="moon" style="color: #fffef0">
        <img :src="moonImage" alt="Moon" />
      </div>

      <!-- Stars -->
      <div
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="{
          left: star.x + '%',
          top: star.y + '%',
          animationDelay: star.delay + 's',
          animationDuration: star.duration + 's',
        }"
      ></div>
    </div>

    <!-- Dusk Scene -->
    <div v-if="themeStore.period.key === 'dusk'" class="dusk-scene">
      <!-- Fireflies -->
      <div
        v-for="firefly in fireflies"
        :key="firefly.id"
        class="firefly"
        :style="{
          left: firefly.x + '%',
          top: firefly.y + '%',
          animationDelay: firefly.delay + 's',
          animationDuration: firefly.duration + 's',
        }"
      ></div>

      <!-- First stars appearing -->
      <div
        v-for="star in earlyStars"
        :key="'early-' + star.id"
        class="early-star"
        :style="{
          left: star.x + '%',
          top: star.y + '%',
          animationDelay: star.delay + 's',
        }"
      ></div>
    </div>

    <!-- Dawn Scene -->
    <div v-if="themeStore.period.key === 'dawn'" class="dawn-scene">
      <!-- Rising Sun -->
      <div class="rising-sun">
        <div class="sun-glow"></div>
      </div>

      <!-- Sun Rays -->
      <div class="sun-rays">
        <div
          v-for="ray in 8"
          :key="'ray-' + ray"
          class="sun-ray"
          :style="{
            transform: `rotate(${ray * 45}deg)`,
            animationDelay: `${ray * 0.1}s`,
          }"
        ></div>
      </div>

      <!-- Dew Sparkles -->
      <div
        v-for="dew in dewdrops"
        :key="dew.id"
        class="dewdrop"
        :style="{
          left: dew.x + '%',
          top: dew.y + '%',
          animationDelay: dew.delay + 's',
          animationDuration: dew.duration + 's',
        }"
      ></div>

      <!-- Light Particles -->
      <div
        v-for="particle in lightParticles"
        :key="'particle-' + particle.id"
        class="light-particle"
        :style="{
          left: particle.x + '%',
          top: particle.y + '%',
          animationDelay: particle.delay + 's',
          animationDuration: particle.duration + 's',
        }"
      ></div>
    </div>

    <!-- Morning Scene -->
    <div v-if="themeStore.period.key === 'morning'" class="morning-scene">
      <!-- Clouds -->
      <div
        v-for="cloud in clouds"
        :key="cloud.id"
        class="cloud"
        :style="{
          left: cloud.x + '%',
          top: cloud.y + '%',
          animationDelay: cloud.delay + 's',
          animationDuration: cloud.duration + 's',
          transform: `scale(${cloud.scale})`,
        }"
      ></div>

      <!-- Birds -->
      <div
        v-for="bird in birds"
        :key="bird.id"
        class="bird-container"
        :style="{
          top: bird.y + '%',
          animationDelay: bird.delay + 's',
          animationDuration: bird.duration + 's',
        }"
      >
        <div
          class="bird"
          :style="{
            animationDuration: 0.9 + Math.random() * 0.4 + 's',
          }"
        ></div>
      </div>

      <!-- Butterflies -->
      <div
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        class="butterfly"
        :style="{
          left: butterfly.x + '%',
          top: butterfly.y + '%',
          animationDelay: butterfly.delay + 's',
          animationDuration: butterfly.duration + 's',
        }"
      >
        <div class="butterfly-wing butterfly-wing-left"></div>
        <div class="butterfly-wing butterfly-wing-right"></div>
      </div>
    </div>

    <!-- Midday Scene -->
    <div v-if="themeStore.period.key === 'midday'" class="midday-scene">
      <!-- Bright Sun -->
      <div class="bright-sun">
        <div class="sun-core"></div>
      </div>

      <!-- Clouds -->
      <div
        v-for="cloud in middayClouds"
        :key="'midday-cloud-' + cloud.id"
        class="midday-cloud"
        :style="{
          top: cloud.y + '%',
          animationDuration: cloud.duration + 's',
          transform: `scale(${cloud.scale})`,
        }"
      ></div>

      <!-- Dragonflies -->
      <div
        v-for="dragonfly in dragonflies"
        :key="dragonfly.id"
        class="dragonfly"
        :style="{
          left: dragonfly.x + '%',
          top: dragonfly.y + '%',
          animationDuration: dragonfly.duration + 's',
        }"
      >
        <div class="dragonfly-body"></div>
        <div class="dragonfly-wings"></div>
      </div>

      <!-- Butterflies -->
      <div
        v-for="butterfly in middayButterflies"
        :key="'midday-bf-' + butterfly.id"
        class="midday-butterfly"
        :style="{
          left: butterfly.x + '%',
          top: butterfly.y + '%',
          animationDuration: butterfly.duration + 's',
        }"
      >
        <div class="butterfly-wing butterfly-wing-left"></div>
        <div class="butterfly-wing butterfly-wing-right"></div>
      </div>
    </div>

    <!-- Evening Scene -->
    <div v-if="themeStore.period.key === 'evening'" class="evening-scene">
      <!-- Golden Clouds -->
      <div
        v-for="cloud in eveningClouds"
        :key="'evening-cloud-' + cloud.id"
        class="evening-cloud"
        :style="{
          top: cloud.y + '%',
          animationDuration: cloud.duration + 's',
          transform: `scale(${cloud.scale})`,
        }"
      ></div>

      <!-- Fireflies -->
      <div
        v-for="firefly in eveningFireflies"
        :key="'evening-firefly-' + firefly.id"
        class="evening-firefly"
        :style="{
          left: firefly.x + '%',
          top: firefly.y + '%',
          animationDelay: firefly.delay + 's',
          animationDuration: firefly.duration + 's',
        }"
      ></div>

      <!-- Golden Dandelion Seeds -->
      <div
        v-for="seed in goldenSeeds"
        :key="'golden-seed-' + seed.id"
        class="golden-seed"
        :style="{
          left: seed.x + '%',
          top: seed.y + '%',
          animationDelay: seed.delay + 's',
          animationDuration: seed.duration + 's',
        }"
      ></div>

      <!-- Silhouette Birds -->
      <div
        v-for="bird in eveningBirds"
        :key="'evening-bird-' + bird.id"
        class="silhouette-bird-container"
        :style="{
          top: bird.y + '%',
          animationDelay: bird.delay + 's',
          animationDuration: bird.duration + 's',
        }"
      >
        <div
          class="silhouette-bird"
          :style="{
            animationDuration: 0.8 + Math.random() * 0.3 + 's',
          }"
        ></div>
      </div>
    </div>

    <!-- Afternoon Scene -->
    <div v-if="themeStore.period.key === 'afternoon'" class="afternoon-scene">
      <!-- Soft Sun -->
      <div class="afternoon-sun">
        <div class="sun-core"></div>
      </div>

      <!-- Clouds -->
      <div
        v-for="cloud in afternoonClouds"
        :key="'afternoon-cloud-' + cloud.id"
        class="afternoon-cloud"
        :style="{
          top: cloud.y + '%',
          animationDuration: cloud.duration + 's',
          transform: `scale(${cloud.scale})`,
        }"
      ></div>

      <!-- Bees -->
      <div
        v-for="bee in bees"
        :key="bee.id"
        class="bee"
        :style="{
          left: bee.x + '%',
          top: bee.y + '%',
          animationDuration: bee.duration + 's',
        }"
      >
        <div class="bee-body">
          <div class="bee-stripes"></div>
        </div>
        <div class="bee-wings"></div>
      </div>

      <!-- Butterflies -->
      <div
        v-for="butterfly in afternoonButterflies"
        :key="'afternoon-bf-' + butterfly.id"
        class="afternoon-butterfly"
        :style="{
          left: butterfly.x + '%',
          top: butterfly.y + '%',
          animationDuration: butterfly.duration + 's',
        }"
      >
        <div class="butterfly-wing butterfly-wing-left"></div>
        <div class="butterfly-wing butterfly-wing-right"></div>
      </div>

      <!-- Floating Seeds -->
      <div
        v-for="seed in floatingSeeds"
        :key="seed.id"
        class="floating-seed"
        :style="{
          left: seed.x + '%',
          top: seed.y + '%',
          animationDelay: seed.delay + 's',
          animationDuration: seed.duration + 's',
        }"
      ></div>

      <!-- Dust Particles -->
      <div
        v-for="dust in dustParticles"
        :key="dust.id"
        class="dust-particle"
        :style="{
          left: dust.x + '%',
          top: dust.y + '%',
          animationDelay: dust.delay + 's',
          animationDuration: dust.duration + 's',
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThemeStore } from 'src/stores/theme'
import moonImage from 'src/assets/images/theme/night/moon.svg'
import treeImage from 'src/assets/images/theme/tree.svg'

const themeStore = useThemeStore()

// Generate stars for night scene
const stars = ref([])

function generateStars() {
  const starCount = 20
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    newStars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 50,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    })
  }

  stars.value = newStars
}

// Generate fireflies for dusk scene
const fireflies = ref([])

function generateFireflies() {
  const fireflyCount = 12
  const newFireflies = []

  for (let i = 0; i < fireflyCount; i++) {
    newFireflies.push({
      id: i,
      x: 10 + Math.random() * 80,
      y: 30 + Math.random() * 50,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3,
    })
  }

  fireflies.value = newFireflies
}

// Generate early stars for dusk scene
const earlyStars = ref([])

function generateEarlyStars() {
  const starCount = 5
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    newStars.push({
      id: i,
      x: 20 + Math.random() * 60,
      y: Math.random() * 30,
      delay: Math.random() * 5,
    })
  }

  earlyStars.value = newStars
}

// Generate dewdrops for dawn scene
const dewdrops = ref([])

function generateDewdrops() {
  const dewCount = 15
  const newDewdrops = []

  for (let i = 0; i < dewCount; i++) {
    newDewdrops.push({
      id: i,
      x: Math.random() * 100,
      y: 40 + Math.random() * 50,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 2,
    })
  }

  dewdrops.value = newDewdrops
}

// Generate light particles for dawn scene
const lightParticles = ref([])

function generateLightParticles() {
  const particleCount = 10
  const newParticles = []

  for (let i = 0; i < particleCount; i++) {
    newParticles.push({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 3,
    })
  }

  lightParticles.value = newParticles
}

// Generate clouds for morning scene
const clouds = ref([])
let cloudIdCounter = 0

function addCloud() {
  const duration = 30 + Math.random() * 20
  const newCloud = {
    id: cloudIdCounter++,
    y: Math.random() * 40,
    duration: duration,
    scale: 0.5 + Math.random() * 0.5,
  }

  clouds.value.push(newCloud)

  setTimeout(() => {
    clouds.value = clouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startCloudGeneration() {
  addCloud()

  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addCloud()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate birds for morning scene
const birds = ref([])
let birdIdCounter = 0

function addBird() {
  const duration = 18 + Math.random() * 4
  const newBird = {
    id: birdIdCounter++,
    y: 5 + Math.random() * 35,
    delay: Math.random() * 0.5,
    duration: duration,
  }

  birds.value.push(newBird)

  setTimeout(
    () => {
      birds.value = birds.value.filter((b) => b.id !== newBird.id)
    },
    (duration + newBird.delay) * 1000,
  )
}

function startBirdGeneration() {
  addBird()
  setTimeout(() => addBird(), 3000)

  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addBird()
      }
    },
    7000 + Math.random() * 3000,
  )
}

// Generate butterflies for morning scene
const butterflies = ref([])
let butterflyIdCounter = 0

function addButterfly() {
  const duration = 12 + Math.random() * 6
  const newButterfly = {
    id: butterflyIdCounter++,
    x: -5 + Math.random() * 30,
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  butterflies.value.push(newButterfly)

  setTimeout(() => {
    butterflies.value = butterflies.value.filter((bf) => bf.id !== newButterfly.id)
  }, duration * 1000)
}

function startButterflyGeneration() {
  addButterfly()
  setTimeout(() => addButterfly(), 2000)

  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addButterfly()
      }
    },
    5000 + Math.random() * 3000,
  )
}

// Generate midday clouds
const middayClouds = ref([])
let middayCloudIdCounter = 0

function addMiddayCloud() {
  const duration = 35 + Math.random() * 15
  const newCloud = {
    id: middayCloudIdCounter++,
    y: Math.random() * 30,
    duration: duration,
    scale: 0.6 + Math.random() * 0.4,
  }

  middayClouds.value.push(newCloud)

  setTimeout(() => {
    middayClouds.value = middayClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startMiddayCloudGeneration() {
  addMiddayCloud()

  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addMiddayCloud()
      }
    },
    10000 + Math.random() * 5000,
  )
}

// Generate dragonflies for midday scene
const dragonflies = ref([])
let dragonflyIdCounter = 0

function addDragonfly() {
  const duration = 3 + Math.random() * 2
  const newDragonfly = {
    id: dragonflyIdCounter++,
    x: Math.random() * 100,
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  dragonflies.value.push(newDragonfly)

  setTimeout(() => {
    dragonflies.value = dragonflies.value.filter((d) => d.id !== newDragonfly.id)
  }, duration * 1000)
}

function startDragonflyGeneration() {
  addDragonfly()

  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addDragonfly()
      }
    },
    4000 + Math.random() * 3000,
  )
}

// Generate butterflies for midday scene
const middayButterflies = ref([])
let middayButterflyIdCounter = 0

function addMiddayButterfly() {
  const duration = 12 + Math.random() * 6
  const newButterfly = {
    id: middayButterflyIdCounter++,
    x: -5 + Math.random() * 30,
    y: 25 + Math.random() * 50,
    duration: duration,
  }

  middayButterflies.value.push(newButterfly)

  setTimeout(() => {
    middayButterflies.value = middayButterflies.value.filter((bf) => bf.id !== newButterfly.id)
  }, duration * 1000)
}

function startMiddayButterflyGeneration() {
  addMiddayButterfly()

  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addMiddayButterfly()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate afternoon clouds
const afternoonClouds = ref([])
let afternoonCloudIdCounter = 0

function addAfternoonCloud() {
  const duration = 40 + Math.random() * 20
  const newCloud = {
    id: afternoonCloudIdCounter++,
    y: Math.random() * 35,
    duration: duration,
    scale: 0.7 + Math.random() * 0.5,
  }

  afternoonClouds.value.push(newCloud)

  setTimeout(() => {
    afternoonClouds.value = afternoonClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startAfternoonCloudGeneration() {
  addAfternoonCloud()
  setTimeout(() => addAfternoonCloud(), 5000)

  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addAfternoonCloud()
      }
    },
    12000 + Math.random() * 6000,
  )
}

// Generate bees for afternoon scene
const bees = ref([])
let beeIdCounter = 0

function addBee() {
  const duration = 4 + Math.random() * 3
  const newBee = {
    id: beeIdCounter++,
    x: Math.random() * 100,
    y: 15 + Math.random() * 65,
    duration: duration,
  }

  bees.value.push(newBee)

  setTimeout(() => {
    bees.value = bees.value.filter((b) => b.id !== newBee.id)
  }, duration * 1000)
}

function startBeeGeneration() {
  addBee()

  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addBee()
      }
    },
    5000 + Math.random() * 3000,
  )
}

// Generate butterflies for afternoon scene
const afternoonButterflies = ref([])
let afternoonButterflyIdCounter = 0

function addAfternoonButterfly() {
  const duration = 14 + Math.random() * 6
  const newButterfly = {
    id: afternoonButterflyIdCounter++,
    x: -5 + Math.random() * 30,
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  afternoonButterflies.value.push(newButterfly)

  setTimeout(() => {
    afternoonButterflies.value = afternoonButterflies.value.filter(
      (bf) => bf.id !== newButterfly.id,
    )
  }, duration * 1000)
}

function startAfternoonButterflyGeneration() {
  addAfternoonButterfly()

  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addAfternoonButterfly()
      }
    },
    10000 + Math.random() * 4000,
  )
}

// Generate floating seeds for afternoon scene
const floatingSeeds = ref([])
let seedIdCounter = 0

function addFloatingSeed() {
  const duration = 8 + Math.random() * 4
  const newSeed = {
    id: seedIdCounter++,
    x: Math.random() * 100,
    y: -5,
    delay: Math.random() * 2,
    duration: duration,
  }

  floatingSeeds.value.push(newSeed)

  setTimeout(
    () => {
      floatingSeeds.value = floatingSeeds.value.filter((s) => s.id !== newSeed.id)
    },
    (duration + newSeed.delay) * 1000,
  )
}

function startFloatingSeedGeneration() {
  addFloatingSeed()
  setTimeout(() => addFloatingSeed(), 3000)

  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addFloatingSeed()
      }
    },
    6000 + Math.random() * 4000,
  )
}

// Generate dust particles for afternoon scene
const dustParticles = ref([])
let dustIdCounter = 0

function addDustParticle() {
  const duration = 10 + Math.random() * 5
  const newDust = {
    id: dustIdCounter++,
    x: Math.random() * 100,
    y: 60 + Math.random() * 40,
    delay: Math.random() * 3,
    duration: duration,
  }

  dustParticles.value.push(newDust)

  setTimeout(
    () => {
      dustParticles.value = dustParticles.value.filter((d) => d.id !== newDust.id)
    },
    (duration + newDust.delay) * 1000,
  )
}

function startDustParticleGeneration() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => addDustParticle(), i * 2000)
  }

  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addDustParticle()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate evening clouds
const eveningClouds = ref([])
let eveningCloudIdCounter = 0

function addEveningCloud() {
  const duration = 45 + Math.random() * 25
  const newCloud = {
    id: eveningCloudIdCounter++,
    y: 10 + Math.random() * 30,
    duration: duration,
    scale: 0.8 + Math.random() * 0.6,
  }

  eveningClouds.value.push(newCloud)

  setTimeout(() => {
    eveningClouds.value = eveningClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startEveningCloudGeneration() {
  addEveningCloud()
  setTimeout(() => addEveningCloud(), 8000)

  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningCloud()
      }
    },
    15000 + Math.random() * 7000,
  )
}

// Generate fireflies for evening scene
const eveningFireflies = ref([])
let eveningFireflyIdCounter = 0

function addEveningFirefly() {
  const duration = 3 + Math.random() * 3
  const newFirefly = {
    id: eveningFireflyIdCounter++,
    x: 10 + Math.random() * 80,
    y: 40 + Math.random() * 50,
    delay: Math.random() * 2,
    duration: duration,
  }

  eveningFireflies.value.push(newFirefly)

  setTimeout(
    () => {
      eveningFireflies.value = eveningFireflies.value.filter((f) => f.id !== newFirefly.id)
    },
    (duration + newFirefly.delay) * 1000,
  )
}

function startEveningFireflyGeneration() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => addEveningFirefly(), i * 1000)
  }

  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningFirefly()
      }
    },
    2000 + Math.random() * 2000,
  )
}

// Generate golden seeds for evening scene
const goldenSeeds = ref([])
let goldenSeedIdCounter = 0

function addGoldenSeed() {
  const duration = 10 + Math.random() * 5
  const newSeed = {
    id: goldenSeedIdCounter++,
    x: Math.random() * 100,
    y: -5,
    delay: Math.random() * 3,
    duration: duration,
  }

  goldenSeeds.value.push(newSeed)

  setTimeout(
    () => {
      goldenSeeds.value = goldenSeeds.value.filter((s) => s.id !== newSeed.id)
    },
    (duration + newSeed.delay) * 1000,
  )
}

function startGoldenSeedGeneration() {
  addGoldenSeed()
  setTimeout(() => addGoldenSeed(), 4000)

  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addGoldenSeed()
      }
    },
    7000 + Math.random() * 5000,
  )
}

// Generate silhouette birds for evening scene
const eveningBirds = ref([])
let eveningBirdIdCounter = 0

function addEveningBird() {
  const duration = 20 + Math.random() * 5
  const newBird = {
    id: eveningBirdIdCounter++,
    y: 8 + Math.random() * 25,
    delay: Math.random() * 0.5,
    duration: duration,
  }

  eveningBirds.value.push(newBird)

  setTimeout(
    () => {
      eveningBirds.value = eveningBirds.value.filter((b) => b.id !== newBird.id)
    },
    (duration + newBird.delay) * 1000,
  )
}

function startEveningBirdGeneration() {
  addEveningBird()
  setTimeout(() => addEveningBird(), 5000)

  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningBird()
      }
    },
    10000 + Math.random() * 5000,
  )
}

onMounted(() => {
  generateStars()
  generateFireflies()
  generateEarlyStars()
  generateDewdrops()
  generateLightParticles()
  startCloudGeneration()
  startBirdGeneration()
  startButterflyGeneration()
  startMiddayCloudGeneration()
  startDragonflyGeneration()
  startMiddayButterflyGeneration()
  startAfternoonCloudGeneration()
  startBeeGeneration()
  startAfternoonButterflyGeneration()
  startFloatingSeedGeneration()
  startDustParticleGeneration()
  startEveningCloudGeneration()
  startEveningFireflyGeneration()
  startGoldenSeedGeneration()
  startEveningBirdGeneration()
})
</script>

<style lang="scss" scoped src="./DynamicBackground.scss"></style>
