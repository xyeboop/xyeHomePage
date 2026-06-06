<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GridAnimation } from '@/utils/gridAnimation'

const isPhone = /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(navigator.userAgent)

const canvasRef = ref<HTMLCanvasElement>()
let animation: GridAnimation | null = null

onMounted(() => {
  if (!canvasRef.value) return
  animation = new GridAnimation(canvasRef.value, {
    direction: 'diagonal',
    speed: isPhone ? 0.03 : 0.05,
    borderColor: isPhone ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    squareSize: isPhone ? 50 : 40,
    hoverFillColor: 'rgba(255, 255, 255, 0.8)',
    hoverShadowColor: 'rgba(255, 255, 255, 0.8)',
    transitionDuration: isPhone ? 150 : 200,
    trailDuration: isPhone ? 2000 : 1500,
    specialBlockColor: 'rgba(100, 255, 152, 0.8)',
    specialHoverColor: 'rgba(29, 202, 29, 0.8)',
    snakeHeadColor: 'rgba(255, 255, 255, 0.95)',
    snakeTailColor: 'rgba(218, 231, 255, 0.25)',
    snakeColorDecay: 0.85,
    touchSensitivity: isPhone ? 1.2 : 1.0,
    vibrationEnabled: isPhone,
  })
  animation.init()
})

onUnmounted(() => {
  animation?.destroy()
})
</script>

<template>
  <canvas ref="canvasRef" class="grid-canvas"></canvas>
</template>

<style scoped>
.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
