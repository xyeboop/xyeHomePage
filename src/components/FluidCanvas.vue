<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FluidBackground } from '@/utils/fluidBackground'

const canvasRef = ref<HTMLCanvasElement>()
let fluid: FluidBackground | null = null

onMounted(() => {
  if (!canvasRef.value) return
  fluid = new FluidBackground(canvasRef.value)
  fluid.init()
})

onUnmounted(() => {
  fluid?.destroy()
})
</script>

<template>
  <canvas ref="canvasRef" class="fluid-canvas"></canvas>
</template>

<style scoped>
.fluid-canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -2;
}
</style>
