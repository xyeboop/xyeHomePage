<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTypeWriter } from '@/composables/useTypeWriter'
import BorderGlow from './BorderGlow.vue'
import config from '@/config.json'

defineEmits<{
  back: []
}>()

const { typeText, sleep } = useTypeWriter()
const aboutData = config.about

const wrapRef = ref<HTMLElement>()
const userTextRef = ref<HTMLElement>()
const thinkingEl = ref<HTMLElement>()
const detailsEl = ref<HTMLElement>()
const backBtn = ref<HTMLElement>()
const cursorDone = ref(false)
const showDetails = ref(false)

onMounted(async () => {
  await sleep(300)
  wrapRef.value?.classList.add('in')

  await typeText(userTextRef.value, aboutData.aiPrompt, 40)
  cursorDone.value = true
  await sleep(500)

  thinkingEl.value?.classList.add('hidden')
  showDetails.value = true

  if (detailsEl.value) {
    detailsEl.value.style.opacity = '0'
    detailsEl.value.style.transform = 'translateY(10px)'
    detailsEl.value.style.transition = 'all 0.5s ease'
    setTimeout(() => {
      if (detailsEl.value) {
        detailsEl.value.style.opacity = '1'
        detailsEl.value.style.transform = 'translateY(0)'
      }
      if (backBtn.value) {
        backBtn.value.style.opacity = '1'
        backBtn.value.style.pointerEvents = 'auto'
      }
    }, 100)
  }
})
</script>

<template>
  <div class="content-about">
    <div class="content-inner">
      <div ref="wrapRef" class="wrap fade">
        <div class="ai-chat-container">
          <BorderGlow background-color="#0d1117" :border-radius="12" :glow-radius="20" :edge-sensitivity="34" glow-color="185 80 50" :glow-intensity="1" :cone-spread="25" :colors="['#00f0ff', '#0080ff', '#9b30ff']" :fill-opacity="0.4">
            <div class="chat-message-inner user-message">
              <span class="prompt-label">&gt; User:</span>
              <span ref="userTextRef" class="typing-text" :class="{ done: cursorDone }">&nbsp;</span>
            </div>
          </BorderGlow>

          <BorderGlow background-color="#0d1117" :border-radius="12" :glow-radius="20" :edge-sensitivity="34" glow-color="185 80 50" :glow-intensity="1" :cone-spread="25" :colors="['#00f0ff', '#0080ff', '#9b30ff']" :fill-opacity="0.4">
            <div class="chat-message-inner ai-message">
            <span class="prompt-label">&gt; AI:</span>
            <div class="ai-response">
              <div ref="thinkingEl" class="ai-thinking">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>

              <div v-show="showDetails" ref="detailsEl" class="placeholder-content">
                <span class="placeholder-icon">🤖</span>
                <p class="placeholder-text">{{ aboutData.placeholder }}</p>
              </div>
            </div>
          </div>
        </BorderGlow>
        </div>

        <a ref="backBtn" class="page-back" style="opacity:0;pointer-events:none" @click="$emit('back')">← Back</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-about {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 200;
  background: #060606;
}
</style>
