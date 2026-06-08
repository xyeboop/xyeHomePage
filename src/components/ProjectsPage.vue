<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BorderGlow from './BorderGlow.vue'
import config from '@/config.json'

defineEmits<{
  back: []
}>()

interface MetricItem {
  value: string
  label: string
}

interface ProjectItem {
  order: string
  company: string
  role: string
  description: string
  metrics: MetricItem[]
  logo?: string
  logoWidth?: number
  logoHeight?: number
  logoTop?: number
  logoRight?: number
}

const projectsData = config.projects
const sections = projectsData.sections as {
  id: string
  title: string
  subtitle: string
  items: ProjectItem[]
}[]

const wrapRef = ref<HTMLElement>()
const backBtn = ref<HTMLElement>()
const cardRefs = ref<HTMLElement[]>([])
const flippedCards = ref<Set<number>>(new Set())

const isPhone = /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(navigator.userAgent)

function toggleCard(globalIdx: number) {
  if (flippedCards.value.has(globalIdx)) {
    flippedCards.value.delete(globalIdx)
  } else {
    flippedCards.value.add(globalIdx)
  }
  flippedCards.value = new Set(flippedCards.value)
}

function flipCard(globalIdx: number) {
  flippedCards.value.add(globalIdx)
  flippedCards.value = new Set(flippedCards.value)
}

function unflipCard(globalIdx: number) {
  if (isPhone) return
  flippedCards.value.delete(globalIdx)
  flippedCards.value = new Set(flippedCards.value)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function setCardRef(el: any, index: number) {
  if (el) cardRefs.value[index] = el as HTMLElement
}

onMounted(async () => {
  await sleep(300)
  wrapRef.value?.classList.add('in')

  const cards = cardRefs.value.filter(Boolean)
  for (let i = 0; i < cards.length; i++) {
    await sleep(120)
    const card = cards[i]
    if (card) {
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
    }
  }

  await sleep(200)
  if (backBtn.value) {
    backBtn.value.style.opacity = '1'
    backBtn.value.style.pointerEvents = 'auto'
  }
})
</script>

<template>
  <div class="content-projects">
    <div class="content-inner">
      <div ref="wrapRef" class="projects-wrap fade">
        <div
          v-for="section in sections"
          :key="section.id"
          class="section-block"
        >
          <div class="section-header">
            <span class="section-bar"></span>
            <div>
              <h2 class="section-title">{{ section.title }}</h2>
              <p class="section-subtitle">{{ section.subtitle }}</p>
            </div>
          </div>

          <div class="card-row">
            <div
              v-for="(item, idx) in section.items"
              :key="idx"
              :ref="(el: any) => setCardRef(
                el,
                (sections.indexOf(section) * section.items.length) + idx
              )"
              class="flip-container"
              :class="{ flipped: flippedCards.has((sections.indexOf(section) * section.items.length) + idx) }"
              @click="toggleCard((sections.indexOf(section) * section.items.length) + idx)"
              @mouseenter="flipCard((sections.indexOf(section) * section.items.length) + idx)"
              @mouseleave="unflipCard((sections.indexOf(section) * section.items.length) + idx)"
            >
              <div class="flip-inner">
                <!-- 正面 -->
                <div class="flip-face flip-front">
                  <BorderGlow
                    background-color="#0d1117"
                    :border-radius="12"
                    :glow-radius="20"
                    :edge-sensitivity="34"
                    glow-color="185 80 50"
                    :glow-intensity="1"
                    :cone-spread="25"
                    :colors="['#00f0ff', '#0080ff', '#9b30ff']"
                    :fill-opacity="0.4"
                  >
                    <div class="exp-card">
                      <div class="card-body">
                        <img
                          v-if="item.logo"
                          :src="item.logo"
                          :alt="item.company"
                          class="card-logo"
                          :style="{
                            width: (item.logoWidth || 36) + 'px',
                            height: (item.logoHeight || 36) + 'px',
                            top: (item.logoTop ?? 20) + 'px',
                            right: (item.logoRight ?? 22) + 'px',
                          }"
                        />
                        <p class="card-order">{{ item.order }} {{ item.company }}</p>
                        <p class="card-role">{{ item.role }}</p>
                        <p class="card-desc">{{ item.description }}</p>
                        <svg class="card-divider" viewBox="0 0 381 2" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                          <line y1="1" x2="47%" y2="1" :stroke="`url(#l-${section.id}-${idx})`" stroke-opacity="0.6" />
                          <line x1="100%" y1="1" x2="53%" y2="1" :stroke="`url(#r-${section.id}-${idx})`" stroke-opacity="0.6" />
                          <defs>
                            <linearGradient :id="`l-${section.id}-${idx}`" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0" stop-color="white" stop-opacity="0" />
                              <stop offset="1" stop-color="white" />
                            </linearGradient>
                            <linearGradient :id="`r-${section.id}-${idx}`" x1="1" y1="0" x2="0" y2="0">
                              <stop offset="0" stop-color="white" stop-opacity="0" />
                              <stop offset="1" stop-color="white" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div class="card-metrics">
                          <template v-for="(m, mi) in item.metrics" :key="mi">
                            <div v-if="mi > 0" class="metric-sep"></div>
                            <div class="metric-col">
                              <span class="metric-value">{{ m.value }}</span>
                              <span class="metric-label">{{ m.label }}</span>
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                  </BorderGlow>
                </div>

                <!-- 背面 -->
                <div class="flip-face flip-back">
                  <BorderGlow
                    background-color="#0d1117"
                    :border-radius="12"
                    :glow-radius="20"
                    :edge-sensitivity="34"
                    glow-color="185 80 50"
                    :glow-intensity="1"
                    :cone-spread="25"
                    :colors="['#00f0ff', '#0080ff', '#9b30ff']"
                    :fill-opacity="0.4"
                  >
                    <div class="exp-card">
                      <div class="card-body back-body">
                        <p class="back-text">待添加</p>
                      </div>
                    </div>
                  </BorderGlow>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a
          ref="backBtn"
          class="page-back"
          style="opacity:0;pointer-events:none"
          @click="$emit('back')"
        >
          {{ projectsData.back }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-projects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 200;
  background: #060606;
  overflow-y: auto;
}

.projects-wrap {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.section-block {
  width: 90%;
  max-width: 1060px;
  margin-bottom: 2.5rem;
}

.section-block:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.section-bar {
  display: block;
  width: 3px;
  height: 32px;
  background: var(--ai-cyan);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
  flex-shrink: 0;
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.section-subtitle {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0.15rem 0 0 0;
}

/* ====== 卡片行 ====== */
.card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
}

.card-row :deep(.border-glow-card) {
  border: 1px solid rgba(0, 240, 255, 0.2);
}
.card-row :deep(.border-glow-card:not(:hover)::before) {
  opacity: 0.35;
}

/* ====== 翻转容器 ====== */
.flip-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  perspective: 800px;
  cursor: pointer;

  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.flip-container:hover {
  transform: translateY(-2px) !important;
}

.flip-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.flip-container.flipped .flip-inner {
  transform: rotateY(180deg);
}

.flip-face {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-face :deep(.border-glow-card) {
  width: 100%;
  height: 100%;
}

.flip-face :deep(.border-glow-inner) {
  overflow: hidden;
}

.flip-back {
  transform: rotateY(180deg);
}

/* ====== 卡片内容 ====== */
.exp-card {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
}

.back-body {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.card-body {
  padding: 12px 27px 21px 27px;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ====== Logo ====== */
.card-logo {
  position: absolute;
  object-fit: contain;
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.exp-card:hover .card-logo {
  opacity: 1;
}

/* ====== 编号 + 公司名 ====== */
.card-order {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 17px;
  font-weight: 400;
  color: var(--ai-cyan);
  margin: 0 0 0.45rem 0;
  padding-right: 80px;
}

/* ====== 角色 ====== */
.card-role {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 18px;
  font-weight: 400;
  color: #fff;
  line-height: 1.5;
  margin: 0 0 0.2rem 0;
}

/* ====== 描述 ====== */
.card-desc {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #fff;
  line-height: 1.5;
  margin: 0 0 0.6rem 0;
}

/* ====== 分隔线 ====== */
.card-divider {
  width: 100%;
  height: 4px;
  margin-top: auto;
  margin-bottom: 0.3rem;
  opacity: 0.6;
}

/* ====== 指标区 ====== */
.card-metrics {
  display: flex;
  align-items: flex-end;
}

.metric-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex: 1;
}

/* 两指标间的竖线 */
.metric-sep {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.2);
  margin: 2px 0;
  flex-shrink: 0;
}

.metric-value {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 20px;
  font-weight: 400;
  color: #1ec095;
  line-height: 1.5;
}

.metric-label {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #5695a2;
  line-height: 1;
}

/* ====== 响应式 ====== */
@media screen and (max-width: 900px) {
  .card-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 600px) {
  .card-row {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 768px) {
  .section-block {
    width: 92%;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1rem;
  }

  .card-body {
    padding: 10px 22px 18px 22px;
  }

  .card-order {
    font-size: 15px;
    padding-right: 60px;
  }

  .card-role {
    font-size: 16px;
  }

  .card-desc {
    font-size: 12px;
  }

  .metric-value {
    font-size: 17px;
  }

  .metric-label {
    font-size: 10px;
  }
}

@media screen and (max-width: 50em) {
  .projects-wrap {
    padding: 1.5rem 0;
  }

  .section-block {
    width: 92%;
    margin-bottom: 1.5rem;
  }

  .section-header {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .section-bar {
    height: 24px;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .section-subtitle {
    font-size: 0.65rem;
  }

  .card-body {
    padding: 8px 18px 14px 18px;
  }

  .card-order {
    font-size: 13px;
    padding-right: 50px;
  }

  .card-role {
    font-size: 14px;
  }

  .card-desc {
    font-size: 10px;
  }

  .metric-value {
    font-size: 14px;
  }

  .metric-label {
    font-size: 9px;
  }

  .page-back {
    font-size: 0.65rem;
  }
}
</style>
