<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  colors?: string[]
  fillOpacity?: number
  edgeSensitivity?: number
}>(), {
  glowColor: '40 80 80',
  backgroundColor: '#120F17',
  borderRadius: 28,
  glowRadius: 40,
  glowIntensity: 1,
  coneSpread: 25,
  colors: () => ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity: 0.5,
  edgeSensitivity: 30,
})

const cardRef = ref<HTMLElement>()
const edgeProximity = ref(0)
const cursorAngle = ref(0)

// --- HSL 解析 ---
function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 40, s: 80, l: 80 }
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) }
}

// --- glow CSS 变量 ---
const glowVars = computed(() => {
  const { h, s, l } = parseHSL(props.glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  const vars: Record<string, string> = {}
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * props.glowIntensity, 100)}%)`
  }
  return vars
})

// --- 渐变 CSS 变量 ---
const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven']
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

const gradientVars = computed(() => {
  const vars: Record<string, string> = {}
  for (let i = 0; i < 7; i++) {
    const c = props.colors[Math.min(COLOR_MAP[i], props.colors.length - 1)]
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`
  }
  vars['--gradient-base'] = `linear-gradient(${props.colors[0]} 0 100%)`
  return vars
})

// --- 鼠标跟踪 ---
function getCenter(el: HTMLElement): [number, number] {
  const { width, height } = el.getBoundingClientRect()
  return [width / 2, height / 2]
}

function getEdgeProximity(el: HTMLElement, x: number, y: number): number {
  const [cx, cy] = getCenter(el)
  const dx = x - cx
  const dy = y - cy
  let kx = Infinity, ky = Infinity
  if (dx !== 0) kx = cx / Math.abs(dx)
  if (dy !== 0) ky = cy / Math.abs(dy)
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
}

function getCursorAngle(el: HTMLElement, x: number, y: number): number {
  const [cx, cy] = getCenter(el)
  const dx = x - cx
  const dy = y - cy
  if (dx === 0 && dy === 0) return 0
  let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90
  if (degrees < 0) degrees += 360
  return degrees
}

function onPointerMove(e: PointerEvent) {
  const card = cardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  edgeProximity.value = getEdgeProximity(card, x, y)
  cursorAngle.value = getCursorAngle(card, x, y)
}

function onPointerLeave() {
  edgeProximity.value = 0
}
</script>

<template>
  <div
    ref="cardRef"
    class="border-glow-card"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    :style="{
      '--card-bg': backgroundColor,
      '--border-radius': `${borderRadius}px`,
      '--glow-padding': `${glowRadius}px`,
      '--cone-spread': coneSpread,
      '--edge-sensitivity': edgeSensitivity,
      '--fill-opacity': fillOpacity,
      '--edge-proximity': edgeProximity * 100,
      '--cursor-angle': `${cursorAngle}deg`,
      '--color-sensitivity': edgeSensitivity + 20,
      ...glowVars,
      ...gradientVars,
    }"
  >
    <span class="edge-light" />
    <div class="border-glow-inner">
      <slot />
    </div>
  </div>
</template>

<style>
/* ====== BorderGlow 全局样式 ====== */
.border-glow-card {
  --edge-proximity: 0;
  --cursor-angle: 45deg;
  --edge-sensitivity: 30;
  --color-sensitivity: 50;
  --border-radius: 28px;
  --glow-padding: 40px;
  --cone-spread: 25;

  position: relative;
  border-radius: var(--border-radius);
  isolation: isolate;
  transform: translate3d(0, 0, 0.01px);
  display: grid;
  border: 1px solid rgb(255 255 255 / 15%);
  background: var(--card-bg, #120F17);
  overflow: visible;
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 1px 2px,
    rgba(0, 0, 0, 0.1) 0px 2px 4px,
    rgba(0, 0, 0, 0.1) 0px 4px 8px,
    rgba(0, 0, 0, 0.1) 0px 8px 16px,
    rgba(0, 0, 0, 0.1) 0px 16px 32px,
    rgba(0, 0, 0, 0.1) 0px 32px 64px;
}

/* --- 三个伪元素层，默认隐藏 --- */
.border-glow-card::before,
.border-glow-card::after,
.border-glow-card > .edge-light {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity 0.25s ease-out;
  z-index: -1;
}

.border-glow-card:not(:hover)::before,
.border-glow-card:not(:hover)::after,
.border-glow-card:not(:hover) > .edge-light {
  opacity: 0;
  transition: opacity 0.75s ease-in-out;
}

/* === ::before — 彩色渐变边框 === */
.border-glow-card::before {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--card-bg, #120F17) 0 100%) padding-box,
    linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box,
    var(--gradient-one, radial-gradient(at 80% 55%, #c084fc 0px, transparent 50%)) border-box,
    var(--gradient-two, radial-gradient(at 69% 34%, #f472b6 0px, transparent 50%)) border-box,
    var(--gradient-three, radial-gradient(at 8% 6%, #38bdf8 0px, transparent 50%)) border-box,
    var(--gradient-four, radial-gradient(at 41% 38%, #c084fc 0px, transparent 50%)) border-box,
    var(--gradient-five, radial-gradient(at 86% 85%, #f472b6 0px, transparent 50%)) border-box,
    var(--gradient-six, radial-gradient(at 82% 18%, #38bdf8 0px, transparent 50%)) border-box,
    var(--gradient-seven, radial-gradient(at 51% 4%, #f472b6 0px, transparent 50%)) border-box,
    var(--gradient-base, linear-gradient(#c084fc 0 100%)) border-box;

  opacity: calc((var(--edge-proximity) - var(--color-sensitivity)) / (100 - var(--color-sensitivity)));

  mask-image:
    conic-gradient(
      from var(--cursor-angle) at center,
      black calc(var(--cone-spread) * 1%),
      transparent calc((var(--cone-spread) + 15) * 1%),
      transparent calc((100 - var(--cone-spread) - 15) * 1%),
      black calc((100 - var(--cone-spread)) * 1%)
    );
}

/* === ::after — 彩色渐变填充 === */
.border-glow-card::after {
  border: 1px solid transparent;
  background:
    var(--gradient-one, radial-gradient(at 80% 55%, #c084fc 0px, transparent 50%)) padding-box,
    var(--gradient-two, radial-gradient(at 69% 34%, #f472b6 0px, transparent 50%)) padding-box,
    var(--gradient-three, radial-gradient(at 8% 6%, #38bdf8 0px, transparent 50%)) padding-box,
    var(--gradient-four, radial-gradient(at 41% 38%, #c084fc 0px, transparent 50%)) padding-box,
    var(--gradient-five, radial-gradient(at 86% 85%, #f472b6 0px, transparent 50%)) padding-box,
    var(--gradient-six, radial-gradient(at 82% 18%, #38bdf8 0px, transparent 50%)) padding-box,
    var(--gradient-seven, radial-gradient(at 51% 4%, #f472b6 0px, transparent 50%)) padding-box,
    var(--gradient-base, linear-gradient(#c084fc 0 100%)) padding-box;

  mask-image:
    linear-gradient(to bottom, black, black),
    radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
    radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
    conic-gradient(from var(--cursor-angle) at center, transparent 5%, black 15%, black 85%, transparent 95%);

  mask-composite: subtract, add, add, add, add, add;
  -webkit-mask-composite: source-out, source-over, source-over, source-over, source-over, source-over;
  opacity: calc(var(--fill-opacity, 0.5) * (var(--edge-proximity) - var(--color-sensitivity)) / (100 - var(--color-sensitivity)));
  mix-blend-mode: soft-light;
}

/* === edge-light — 外层光芒 === */
.border-glow-card > .edge-light {
  inset: calc(var(--glow-padding) * -1);
  pointer-events: none;
  z-index: 1;

  mask-image:
    conic-gradient(
      from var(--cursor-angle) at center,
      black 2.5%, transparent 10%, transparent 90%, black 97.5%
    );

  opacity: calc((var(--edge-proximity) - var(--edge-sensitivity)) / (100 - var(--edge-sensitivity)));
  mix-blend-mode: plus-lighter;
}

.border-glow-card > .edge-light::before {
  content: "";
  position: absolute;
  inset: var(--glow-padding);
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px var(--glow-color, hsl(40deg 80% 80% / 100%)),
    inset 0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
    inset 0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
    inset 0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
    inset 0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
    inset 0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
    inset 0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%)),
    0 0 1px 0 var(--glow-color-60, hsl(40deg 80% 80% / 60%)),
    0 0 3px 0 var(--glow-color-50, hsl(40deg 80% 80% / 50%)),
    0 0 6px 0 var(--glow-color-40, hsl(40deg 80% 80% / 40%)),
    0 0 15px 0 var(--glow-color-30, hsl(40deg 80% 80% / 30%)),
    0 0 25px 2px var(--glow-color-20, hsl(40deg 80% 80% / 20%)),
    0 0 50px 2px var(--glow-color-10, hsl(40deg 80% 80% / 10%));
}

/* ====== inner content ====== */
.border-glow-inner {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
  z-index: 1;
}
</style>
