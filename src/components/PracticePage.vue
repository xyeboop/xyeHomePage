<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useTypeWriter } from '@/composables/useTypeWriter'
import BorderGlow from './BorderGlow.vue'
import config from '@/config.json'

defineEmits<{
  back: []
}>()

const { typeText, sleep } = useTypeWriter()
const practiceData = config.practice

const wrapRef = ref<HTMLElement>()
const userTextRef = ref<HTMLElement>()
const thinkingEl = ref<HTMLElement>()
const detailsEl = ref<HTMLElement>()
const titleEl = ref<HTMLElement>()
const descEl = ref<HTMLElement>()
const videoEl = ref<HTMLElement>()
const backBtn = ref<HTMLElement>()
const placeholderEl = ref<HTMLElement>()
const playIconEl = ref<HTMLElement>()
const placeholderTextEl = ref<HTMLElement>()
const videoRef = ref<HTMLVideoElement>()
const cursorDone = ref(false)
const showDetails = ref(false)

onMounted(async () => {
  await sleep(300)
  wrapRef.value?.classList.add('in')

  await typeText(userTextRef.value, practiceData.aiPrompt, 40)
  cursorDone.value = true
  await sleep(500)

  thinkingEl.value?.classList.add('hidden')
  showDetails.value = true
  await nextTick()

  const elements = [
    titleEl.value,
    descEl.value,
    videoEl.value,
  ].filter(Boolean) as HTMLElement[]

  elements.forEach((el, i) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    el.style.transition = 'all 0.5s ease'
    setTimeout(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      if (i === elements.length - 1) {
        if (backBtn.value) {
          backBtn.value.style.opacity = '1'
          backBtn.value.style.pointerEvents = 'auto'
        }
        setupVideoPlayback()
      }
    }, 100 + i * 250)
  })
})

function setupVideoPlayback() {
  const video = videoRef.value
  const placeholder = placeholderEl.value
  const playIcon = playIconEl.value
  const placeholderText = placeholderTextEl.value
  if (!video || !placeholder) return

  // 预加载视频
  video.load()

  placeholder.style.cursor = 'pointer'
  const clickHandler = () => {
    video.play().then(() => {
      placeholder.style.opacity = '0'
      placeholder.style.pointerEvents = 'none'
    }).catch(() => {
      if (placeholderText) placeholderText.textContent = '视频文件尚未上传'
    })
  }
  placeholder.addEventListener('click', clickHandler)

  video.addEventListener('play', () => {
    placeholder.style.opacity = '0'
    placeholder.style.pointerEvents = 'none'
  })
  video.addEventListener('ended', () => {
    placeholder.style.opacity = '1'
    placeholder.style.pointerEvents = 'auto'
    if (playIcon) playIcon.textContent = '⟳'
    if (placeholderText) placeholderText.textContent = '重新播放'
  })
  video.addEventListener('error', () => {
    placeholder.style.opacity = '1'
    placeholder.style.pointerEvents = 'auto'
    if (playIcon) playIcon.textContent = '▶'
    if (placeholderText) placeholderText.textContent = '视频文件尚未上传'
  })
}
</script>

<template>
  <div class="content-practice">
    <div ref="wrapRef" class="practice-wrap fade">
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

            <div v-show="showDetails" ref="detailsEl" class="practice-details" style="display:none">
              <h2 ref="titleEl" class="practice-title">{{ practiceData.aiTitle }}</h2>
              <p ref="descEl" class="practice-desc">{{ practiceData.aiDesc }}</p>
              <div ref="videoEl" class="video-wrapper">
                <video
                  ref="videoRef"
                  class="video-player"
                  preload="none"
                  controls
                  playsinline
                  :poster="practiceData.videoPoster"
                >
                  <source :src="practiceData.videoPlaceholder" type="video/mp4" />
                </video>
                <div ref="placeholderEl" class="video-placeholder">
                  <span ref="playIconEl" class="play-icon">▶</span>
                  <span ref="placeholderTextEl" class="placeholder-text">点击播放产品动画</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BorderGlow>
      </div>

      <a ref="backBtn" class="page-back" style="opacity:0;pointer-events:none" @click="$emit('back')">
        {{ practiceData.back }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.content-practice {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 200;
  background: #060606;
  overflow-y: auto;
}

.practice-wrap {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.practice-details {
  text-align: left;
}

.practice-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Microsoft Yahei', sans-serif;
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--ai-cyan);
  text-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
  margin: 0.5em 0 0.6em 0;
  line-height: 1.4;
}

.practice-desc {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Microsoft Yahei', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  margin: 0 0 1.2em 0;
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.15);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.08);
  aspect-ratio: 16 / 9;
  transition: all 0.3s ease;
}

.video-wrapper:hover {
  border-color: rgba(0, 240, 255, 0.3);
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.15);
}

.video-player {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #000;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(6, 6, 6, 0.6);
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.play-icon {
  font-size: 3rem;
  color: rgba(0, 240, 255, 0.7);
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  animation: play-pulse 2s ease-in-out infinite;
}

.video-wrapper:hover .play-icon {
  color: rgba(0, 240, 255, 1);
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
}

.placeholder-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

@media screen and (max-width: 768px) {
  .practice-title { font-size: 1.1rem; }
}

@media screen and (max-width: 50em) {
  .practice-title { font-size: 0.9rem; }
  .practice-desc  { font-size: 0.75rem; }
  .video-wrapper  { max-width: 100%; border-radius: 8px; }
}
</style>
