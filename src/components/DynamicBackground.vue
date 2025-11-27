<template>
  <div
    class="dynamic-background"
    :style="{ background: themeStore.colors.gradient }"
  >
  </div>
</template>

<script setup>
import { useThemeStore } from 'src/stores/theme'

const themeStore = useThemeStore()
</script>

<style lang="scss" scoped>
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: background 1s ease;
}
</style>
