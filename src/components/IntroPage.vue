<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTypeWriter } from '@/composables/useTypeWriter'
import NeuralCanvas from './NeuralCanvas.vue'
import FluidCanvas from './FluidCanvas.vue'
import BorderGlow from './BorderGlow.vue'
import config from '@/config.json'

const emit = defineEmits<{
  enter: []
}>()

const { typeText, sleep } = useTypeWriter()

// --- 模板引用 ---
const wrapRef = ref<HTMLElement>()
const userTextRef = ref<HTMLElement>()
const thinkingEl = ref<HTMLElement>()
const titleElRef = ref<HTMLElement>()
const subtitleElRef = ref<HTMLElement>()
const enterBtn = ref<HTMLElement>()

// SVG 路径（正向/反向变形用）
const ORIGINAL_PATH =
  'M -44,-50 C -52.71,28.52 15.86,8.186 184,14.69 383.3,22.39 462.5,12.58 638,14 835.5,15.6 987,6.4 1194,13.86 1661,30.68 1652,-36.74 1582,-140.1 1512,-243.5 15.88,-589.5 -44,-50 Z'
const TARGET_PATH =
  'M -44,-50 C -137.1,117.4 67.86,445.5 236,452 435.3,459.7 500.5,242.6 676,244 873.5,245.6 957,522.4 1154,594 1593,753.7 1793,226.3 1582,-126 1371,-478.3 219.8,-524.2 -44,-50 Z'

/**
 * 退出动画：CSS class 驱动，复刻原版 switchPage()
 * 1. intro 页面上滑 200vh（CSS transition）
 * 2. SVG 波浪弹性拉伸（CSS keyframe）
 * 3. SVG 路径变形（CSS keyframe，仅 Chromium 有效，FF/Safari 降级跳过）
 * 全部并行 1100ms
 */
async function animateOut(): Promise<void> {
  const introEl = document.querySelector('.content-intro') as HTMLElement | null
  const shapeEl = document.querySelector('.shape') as SVGElement | null
  const pathEl = shapeEl?.querySelector('path') as SVGPathElement | null

  if (!introEl || !shapeEl || !pathEl) return

  // 先清理可能残存的 Web Animation fill
  ;[introEl, shapeEl, pathEl].forEach((el) =>
    el.getAnimations().forEach((a) => a.cancel()),
  )

  // 触发 CSS 动画
  introEl.classList.add('animate-out')
  shapeEl.classList.add('animate-morph')

  await new Promise((resolve) => setTimeout(resolve, 1100))
}

/**
 * 返回动画：反向帷幔效果
 * 从 translateY(-200vh) 滑回 0，SVG 形状同步回弹
 */
async function animateIn(): Promise<void> {
  const introEl = document.querySelector('.content-intro') as HTMLElement | null
  const shapeEl = document.querySelector('.shape') as SVGElement | null
  const pathEl = shapeEl?.querySelector('path') as SVGPathElement | null

  if (!introEl || !shapeEl || !pathEl) return

  // 清理残存动画
  ;[introEl, shapeEl, pathEl].forEach((el) =>
    el.getAnimations().forEach((a) => a.cancel()),
  )

  shapeEl.style.transformOrigin = '50% 0%'

  // 反向滑入：从 -200vh 回到 0
  const slideAnim = introEl.animate(
    [
      { transform: 'translateY(-200vh)' },
      { transform: 'translateY(0)' },
    ],
    {
      duration: 1100,
      easing: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
      fill: 'forwards',
    },
  )

  // SVG 形状反向回弹
  const shapeAnim = shapeEl.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: 'scaleY(1)' },
    ],
    {
      duration: 1100,
      easing: 'cubic-bezier(0, 0.55, 0.45, 1)',
      fill: 'forwards',
    },
  )

  // 路径反向变形
  let pathAnim: Animation | null = null
  try {
    pathAnim = pathEl.animate(
      { d: [TARGET_PATH, ORIGINAL_PATH] },
      {
        duration: 1100,
        easing: 'cubic-bezier(0, 0.55, 0.45, 1)',
        fill: 'forwards',
      },
    )
  } catch {
    /* d 动画不支持则静默跳过 */
  }

  const promises: Promise<any>[] = [slideAnim.finished, shapeAnim.finished]
  if (pathAnim) promises.push(pathAnim.finished)
  await Promise.all(promises)

  // 收尾：移除 CSS 动画 class，取消 WAAPI fill
  introEl.classList.remove('animate-out')
  shapeEl.classList.remove('animate-morph')
  slideAnim.cancel()
  shapeAnim.cancel()
  pathAnim?.cancel()
  introEl.style.transform = ''
  shapeEl.style.transform = ''

  hasEntered = false
}

/** 回到首页时重置位置和形状 */
function resetPosition() {
  const introEl = document.querySelector('.content-intro') as HTMLElement | null
  const shapeEl = document.querySelector('.shape') as SVGElement | null
  const pathEl = shapeEl?.querySelector('path') as SVGPathElement | null

  // 取消所有 Web Animation fill（关键：fill 优先级高于 inline style）
  ;[introEl, shapeEl, pathEl].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()))

  // 移除动画 class（先禁用 transition 防止回弹动画）
  if (introEl) {
    introEl.style.transition = 'none'
    introEl.classList.remove('animate-out')
    void introEl.offsetHeight // 强制回流，确保 transition:none 生效
    introEl.style.transition = ''
  }
  if (shapeEl) {
    shapeEl.classList.remove('animate-morph')
  }

  // 重置进入锁，允许再次翻页
  hasEntered = false
}

defineExpose({ animateOut, animateIn, resetPosition })

// --- 状态 ---
const titleVisible = ref(false)
const subtitleVisible = ref(false)
const enterVisible = ref(false)
const cursorDone = ref(false)
const introData = config.intro

// --- 移动端检测 ---
const isPhone = /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(
  navigator.userAgent
)

// --- 触摸方向判断 ---
const DIRECTIONS = { UP: 'UP', DOWN: 'DOWN', UNDIRECTED: 'UNDIRECTED' } as const

function getMoveDirection(
  startx: number, starty: number,
  endx: number, endy: number
): string {
  const angx = endx - startx
  const angy = endy - starty
  if (Math.abs(angx) < 2 && Math.abs(angy) < 2) return DIRECTIONS.UNDIRECTED

  const angle = (Math.atan2(angy, angx) * 180) / Math.PI
  if (angle >= -135 && angle <= -45) return DIRECTIONS.UP
  if (angle > 45 && angle < 135) return DIRECTIONS.DOWN
  if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) return 'LEFT'
  if (angle >= -45 && angle <= 45) return 'RIGHT'
  return DIRECTIONS.UNDIRECTED
}

// --- 进入主页面（防重复触发） ---
let hasEntered = false
function enter() {
  if (hasEntered) return
  hasEntered = true
  emit('enter')
}

// --- 滚动事件 ---
function onWheel(e: WheelEvent) {
  const deltaY = e.deltaY || (e as any).wheelDelta * -1 || (e as any).detail
  if (deltaY > 0) enter()
}

// --- 移动端触摸 ---
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].pageX
  touchStartY = e.touches[0].pageY
}

function onTouchEnd(e: TouchEvent) {
  const endX = e.changedTouches[0].pageX
  const endY = e.changedTouches[0].pageY
  const direction = getMoveDirection(touchStartX, touchStartY, endX, endY)
  if (direction === DIRECTIONS.UP) enter()
}

// --- 箭头 hover 即进入 ---
function onArrowHover() {
  enter()
}

// --- 生命周期 ---
onMounted(async () => {
  // 1. 淡入 wrap
  await sleep(300)
  wrapRef.value?.classList.add('in')

  // 2. 打字：User Prompt
  await typeText(userTextRef.value, introData.aiPrompt, 45)
  cursorDone.value = true
  await sleep(600)

  // 3. 隐藏思考点，清空 DOM 后再显示标题，避免闪现
  thinkingEl.value?.classList.add('hidden')
  // v-show 只切换 display，元素一直在 DOM 里，可以提前清空
  if (titleElRef.value) titleElRef.value.textContent = ''
  titleVisible.value = true
  // 立刻开始打字，不给浏览器渲染间隙（和原项目 start(0) 效果一样）
  await typeText(titleElRef.value, introData.title, 80)

  // 4. 同理：先清再显，立刻打
  if (subtitleElRef.value) subtitleElRef.value.textContent = ''
  subtitleVisible.value = true
  await typeText(subtitleElRef.value, introData.subtitle, 35)

  // 6. 显示 Enter 按钮
  enterVisible.value = true

  // 7. 绑定交互事件
  document.body.addEventListener('wheel', onWheel, { passive: true })
  document.body.addEventListener('mousewheel', onWheel, { passive: true })
  document.body.addEventListener('DOMMouseScroll', onWheel, { passive: true })

  if (isPhone) {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  document.body.removeEventListener('wheel', onWheel)
  document.body.removeEventListener('mousewheel', onWheel)
  document.body.removeEventListener('DOMMouseScroll', onWheel)

  if (isPhone) {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchend', onTouchEnd)
  }
})
</script>

<template>
  <div class="content-intro">
    <div class="content-inner">
      <!-- WebGL 流体背景 -->
      <FluidCanvas v-if="introData.background" />
      <!-- 神经网络 Canvas -->
      <NeuralCanvas v-if="introData.background" />

      <!-- AI 对话区 -->
      <div ref="wrapRef" class="wrap fade">
        <div class="ai-chat-container">
          <!-- User 消息 -->
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
            <div class="chat-message-inner user-message">
              <span class="prompt-label">&gt; User:</span>
              <span
                ref="userTextRef"
                class="typing-text"
                :class="{ done: cursorDone }"
              >&nbsp;</span>
            </div>
          </BorderGlow>

          <!-- AI 消息 -->
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
            <div class="chat-message-inner ai-message">
              <span class="prompt-label">&gt; AI:</span>
              <div class="ai-response">
                <!-- 思考动画 -->
                <div ref="thinkingEl" class="ai-thinking">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>

                <!-- 标题（名字） -->
                <h2
                  v-show="titleVisible"
                  ref="titleElRef"
                  class="content-title"
                >&nbsp;</h2>

                <!-- 副标题 -->
                <h3
                  v-show="subtitleVisible"
                  ref="subtitleElRef"
                  class="content-subtitle"
                >&nbsp;</h3>
              </div>
            </div>
          </BorderGlow>
        </div>

        <!-- Enter 按钮 -->
        <a
          v-show="enterVisible"
          ref="enterBtn"
          class="enter"
          @click="enter"
        >{{ introData.enter }}</a>

        <!-- 向下箭头指示 -->
        <div class="arrow arrow-1" @click="enter" @mouseenter="onArrowHover"></div>
        <div class="arrow arrow-2" @click="enter" @mouseenter="onArrowHover"></div>
      </div>
    </div>

    <!-- SVG 形状过渡 -->
    <div class="shape-wrap">
      <svg
        class="shape"
        width="100%"
        height="100vh"
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
      >
        <path
          d="M -44,-50 C -52.71,28.52 15.86,8.186 184,14.69 383.3,22.39 462.5,12.58 638,14 835.5,15.6 987,6.4 1194,13.86 1661,30.68 1652,-36.74 1582,-140.1 1512,-243.5 15.88,-589.5 -44,-50 Z"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* ====== 页面容器 ====== */
.content-intro {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 200vh;
  z-index: 100;
  overflow: hidden;
}

.content-intro .content-inner {
  background: transparent;
  user-select: none;
}

/* ====== 神经网络 Canvas ====== */
.neural-canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ====== wrap 浮层（z-index 高，盖在 Canvas 上） ====== */
.wrap {
  position: relative;
  z-index: 2;
}

/* ====== 标题样式 ====== */
.content-title {
  font-family: "Helvetica Neue", "Microsoft Yahei", -apple-system, sans-serif;
  font-size: 3.5rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  line-height: 1.2;
  margin: 0.3em 0 0.2em 0;
  color: transparent;
  background: linear-gradient(
    135deg,
    #00f0ff 0%,
    #e0f0ff 35%,
    #9b30ff 65%,
    #00f0ff 100%
  );
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  text-shadow:
    0 0 0 #fff,
    0 0 10px rgba(0, 240, 255, 0.8),
    0 0 30px rgba(0, 128, 255, 0.5),
    0 0 60px rgba(155, 48, 255, 0.35);
  animation: ai-glow 3s ease-in-out infinite alternate,
             title-shift 6s ease-in-out infinite;
}

@media screen and (max-width: 768px) {
  .content-title {
    font-size: 2.2rem;
    letter-spacing: 0.06em;
  }
}
@media screen and (max-width: 50em) {
  .content-title {
    font-size: 1.6rem;
  }
}

/* ====== 副标题 ====== */
.content-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-family: "Helvetica Neue", "Microsoft Yahei", -apple-system, sans-serif;
  font-size: 1rem;
  font-weight: 200;
  margin-bottom: 2em;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  line-height: 1.6;
}

@media screen and (max-width: 768px) {
  .content-subtitle {
    font-size: 0.9rem;
  }
}
@media screen and (max-width: 50em) {
  .content-subtitle {
    font-size: 0.75rem;
  }
}

/* ====== Enter 按钮 ====== */
.enter {
  color: var(--color-enter);
  font-size: 0.8rem;
  letter-spacing: 3px;
  white-space: pre;
  pointer-events: auto;
  transition: all 0.4s;
  z-index: 999;
  position: relative;
  cursor: pointer;
  margin-top: 0.5rem;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.8), transparent);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-ai 2s linear infinite;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.enter:hover,
.enter:focus {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 1), transparent);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ====== 向下箭头 ====== */
.arrow {
  position: absolute;
  left: 49.5%;
  top: 95%;
  transform-origin: 50% 50%;
  transform: translate3d(-50%, 0%, 0);
}

.arrow-1 {
  animation: arrow-movement 2s ease-in-out infinite;
}

.arrow-2 {
  animation: arrow-movement 2s 1s ease-in-out infinite;
}

.arrow:before,
.arrow:after {
  background: #fff;
  content: "";
  display: block;
  height: 3px;
  position: absolute;
  top: 0;
  left: 0;
  width: 13px;
  box-shadow: 1px 1px 20px 0px rgba(0, 240, 255, 0.6);
}

.arrow:before {
  transform: rotate(45deg) translateX(-10%);
  transform-origin: top left;
}

.arrow:after {
  transform: rotate(-45deg) translateX(10%);
  transform-origin: top right;
}

/* ====== SVG 形状 ====== */
.shape-wrap {
  position: relative;
  z-index: 0;
  margin: -5px 0 0 0;
  will-change: scroll-position;
  background: transparent;
}

.shape {
  height: 100vh;
  width: 100%;
  display: block;
  background: transparent;
}

.shape path {
  fill: #151515;
}
</style>

<!-- 翻页帷幔动画（非 scoped，JS 动态添加 class 需要全局样式匹配） -->
<style>
/* ====== Intro → Main 翻页动画 ====== */

/* 1. 页面上滑 */
.content-intro.animate-out {
  transform: translateY(-200vh);
  transition: transform 1.1s cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

/* 2. SVG 波浪弹性拉伸 */
.shape {
  transform-origin: 50% 0%;
}

.shape.animate-morph {
  animation: shape-stretch 1.1s ease-in-out forwards;
}

@keyframes shape-stretch {
  0%   { transform: scaleY(1); }
  20%  { transform: scaleY(0.8); }
  50%  { transform: scaleY(1.8); }
  100% { transform: scaleY(1); }
}

/* 3. SVG 路径变形（Chromium 有效，不支持则静默跳过） */
.shape.animate-morph path {
  animation: path-morph 1.1s cubic-bezier(0, 0.55, 0.45, 1) forwards;
}

@keyframes path-morph {
  from {
    d: path("M -44,-50 C -52.71,28.52 15.86,8.186 184,14.69 383.3,22.39 462.5,12.58 638,14 835.5,15.6 987,6.4 1194,13.86 1661,30.68 1652,-36.74 1582,-140.1 1512,-243.5 15.88,-589.5 -44,-50 Z");
  }
  to {
    d: path("M -44,-50 C -137.1,117.4 67.86,445.5 236,452 435.3,459.7 500.5,242.6 676,244 873.5,245.6 957,522.4 1154,594 1593,753.7 1793,226.3 1582,-126 1371,-478.3 219.8,-524.2 -44,-50 Z");
  }
}
</style>
