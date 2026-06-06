<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NeuralNetwork } from '@/utils/neuralNetwork'

const isPhone = /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(navigator.userAgent)

const canvasRef = ref<HTMLCanvasElement>()
let network: NeuralNetwork | null = null

onMounted(() => {
  if (!canvasRef.value) return
  network = new NeuralNetwork(canvasRef.value, {
    nodeCount: isPhone ? 15 : 25,
    connectionDistance: isPhone ? 80 : 100,
    packetCount: isPhone ? 8 : 15,
    packetSpeed: 0.6,
    driftSpeed: 0.12,
  })
  network.init()
})

onUnmounted(() => {
  network?.destroy()
})
</script>

<template>
  <canvas ref="canvasRef" class="neural-canvas"></canvas>
</template>

<style scoped>
.neural-canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
