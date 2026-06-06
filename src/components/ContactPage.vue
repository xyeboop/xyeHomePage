<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useTypeWriter } from '@/composables/useTypeWriter'
import BorderGlow from './BorderGlow.vue'
import config from '@/config.json'

defineEmits<{
  back: []
}>()

const { typeText, sleep } = useTypeWriter()
const contactData = config.contact

const wrapRef = ref<HTMLElement>()
const userTextRef = ref<HTMLElement>()
const thinkingEl = ref<HTMLElement>()
const detailsEl = ref<HTMLElement>()
const backBtn = ref<HTMLElement>()
const cursorDone = ref(false)
const showDetails = ref(false)
const contactItems = ref<HTMLElement[]>([])

onMounted(async () => {
  // 1. 淡入
  await sleep(300)
  wrapRef.value?.classList.add('in')

  // 2. 打字
  await typeText(userTextRef.value, contactData.aiPrompt, 40)
  cursorDone.value = true
  await sleep(500)

  // 3. 隐藏思考点，显示联系信息
  thinkingEl.value?.classList.add('hidden')
  showDetails.value = true
  await nextTick()

  // 4. 逐条动画展示
  animateItems().then(() => {
    if (backBtn.value) {
      backBtn.value.style.opacity = '1'
      backBtn.value.style.pointerEvents = 'auto'
    }
  })
})

function animateItems(): Promise<void> {
  return new Promise(resolve => {
    const items = contactItems.value
    if (!items.length) return resolve()
    items.forEach((item, i) => {
      item.style.opacity = '0'
      item.style.transform = 'translateX(-20px)'
      item.style.transition = 'all 0.4s ease'
      setTimeout(() => {
        item.style.opacity = '1'
        item.style.transform = 'translateX(0)'
        if (i === items.length - 1) setTimeout(resolve, 400)
      }, 200 + i * 150)
    })
  })
}

function setItemRef(el: any, index: number) {
  if (el) contactItems.value[index] = el as HTMLElement
}
</script>

<template>
  <div class="content-contact">
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

              <div v-show="showDetails" ref="detailsEl" class="contact-details">
                <div
                  v-for="(item, idx) in [
                    { icon: '📱', label: 'Tel:', value: contactData.tel },
                    { icon: '📧', label: 'Email:', value: contactData.email },
                    { icon: '💬', label: 'WeChat:', value: contactData.wechat },
                  ]"
                  :key="item.label"
                  :ref="(el: any) => setItemRef(el, idx)"
                  class="contact-item"
                >
                  <span class="contact-icon">{{ item.icon }}</span>
                  <span class="contact-label">{{ item.label }}</span>
                  <span class="contact-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </BorderGlow>
        </div>

        <a ref="backBtn" class="page-back" style="opacity:0;pointer-events:none" @click="$emit('back')">
          {{ contactData.back }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-contact {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 200;
  background: #060606;
}

.contact-details {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.4rem 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0, 240, 255, 0.08);
  transition: all 0.3s ease;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:hover {
  border-bottom-color: rgba(0, 240, 255, 0.3);
}

.contact-icon {
  font-size: 1.2rem;
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}

.contact-label {
  font-family: "Helvetica Neue", "Microsoft Yahei", -apple-system, sans-serif;
  font-size: 0.8rem;
  color: var(--ai-cyan);
  text-shadow: 0 0 6px rgba(0, 240, 255, 0.3);
  min-width: 4.5rem;
  flex-shrink: 0;
}

.contact-value {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.3px;
  word-break: break-all;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
}

@media screen and (max-width: 50em) {
  .contact-item { gap: 0.4rem; padding: 0.4rem 0; }
  .contact-icon  { font-size: 1rem; width: 1.5rem; }
  .contact-label { font-size: 0.65rem; min-width: 3.5rem; }
  .contact-value { font-size: 0.8rem; }
}
</style>
