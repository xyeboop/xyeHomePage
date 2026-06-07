<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import config from '@/config.json'

defineEmits<{
  back: []
}>()

interface TerminalLine {
  text: string
  type: 'system' | 'command' | 'output'
}

const aboutData = config.about
const terminalData = aboutData.terminal

const wrapRef = ref<HTMLElement>()
const backBtn = ref<HTMLElement>()
const terminalBodyRef = ref<HTMLElement>()
const hiddenInput = ref<HTMLInputElement>()

const displayLines = ref<TerminalLine[]>([])
const currentInput = ref('')
const typingDone = ref(false)
const interactive = ref(false)

const introLines = terminalData.introLines
const commands = terminalData.commands as Record<string, string>
const CMD_KEYS = Object.keys(commands)

/** 需要高亮的命令名列表（all 单独处理） */
const HIGHLIGHT_CMDS = [...CMD_KEYS, 'all']

/** 将文本中的命令名包裹为高亮 span（仅用于 system 行） */
function highlightCommands(text: string): string {
  let result = text
  // 按长度降序排列，避免 'about' 在 'current_status' 之前部分匹配
  const sorted = [...HIGHLIGHT_CMDS].sort((a, b) => b.length - a.length)
  for (const cmd of sorted) {
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // 只替换每行第一个匹配（命令名），不替换解释中的重复词
    const regex = new RegExp(`\\b(${escaped})\\b`)
    result = result.replace(regex, `<span class="cmd-name">$1</span>`)
  }
  // 单独处理引号中的 'all' — 强调推荐，用黄色
  result = result.replace(/'<span class="cmd-name">all<\/span>'/g, '<span class="cmd-name cmd-all">\'all\'</span>')
  return result
}

let lineIdx = 0
let charIdx = 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 逐字打出介绍文字 */
function typeNextChar() {
  if (lineIdx >= introLines.length) {
    typingDone.value = true
    interactive.value = true
    if (backBtn.value) {
      backBtn.value.style.opacity = '1'
      backBtn.value.style.pointerEvents = 'auto'
    }
    nextTick(() => {
      hiddenInput.value?.focus()
      scrollBottom()
    })
    return
  }

  const line = introLines[lineIdx] ?? ''

  if (charIdx === 0) {
    displayLines.value.push({ text: '', type: 'system' })
  }

  if (line.length > 0 && charIdx < line.length) {
    displayLines.value[displayLines.value.length - 1]!.text =
      line.substring(0, charIdx + 1)
    charIdx++
    const delay = 10 + Math.random() * 35
    setTimeout(typeNextChar, delay)
  } else {
    lineIdx++
    charIdx = 0
    const delay = line === '' ? 120 : 40 + Math.random() * 80
    setTimeout(typeNextChar, delay)
  }

  scrollBottom()
}

/** 处理用户输入的命令 */
function processCommand(cmd: string) {
  const trimmed = cmd.trim()
  if (!trimmed) return

  // 显示命令行
  displayLines.value.push({ text: `$ ${trimmed}`, type: 'command' })

  if (trimmed === 'all') {
    // 依次显示所有命令结果
    for (const key of CMD_KEYS) {
      displayLines.value.push({ text: `── ${key} ──`, type: 'system' })
      const output = commands[key] ?? ''
      for (const line of output.split('\n')) {
        displayLines.value.push({ text: line, type: 'output' })
      }
      displayLines.value.push({ text: '', type: 'output' })
    }
  } else if (CMD_KEYS.includes(trimmed)) {
    const output = commands[trimmed] ?? ''
    for (const line of output.split('\n')) {
      displayLines.value.push({ text: line, type: 'output' })
    }
  } else {
    displayLines.value.push({ text: terminalData.unknownCmd, type: 'system' })
  }

  displayLines.value.push({ text: '', type: 'system' })
  currentInput.value = ''
  nextTick(() => scrollBottom())
}

/** 终端区域滚动到底部 */
function scrollBottom() {
  if (terminalBodyRef.value) {
    terminalBodyRef.value.scrollTop = terminalBodyRef.value.scrollHeight
  }
}

/** 点击终端时聚焦隐藏输入框 */
function focusTerminal() {
  if (interactive.value) {
    hiddenInput.value?.focus()
  }
}

onMounted(async () => {
  await sleep(300)
  wrapRef.value?.classList.add('in')
  await sleep(500)
  typeNextChar()
})
</script>

<template>
  <div class="content-about">
    <div ref="wrapRef" class="about-wrap fade">
      <div class="about-layout">
        <!-- ====== 左侧：像素角色区域 ====== -->
        <div class="photo-area">
          <div class="pixel-char-wrap">
            <img
              :src="aboutData.photoImage"
              :alt="aboutData.photoAlt"
              class="pixel-char"
            />
            <div class="char-shadow"></div>
          </div>
        </div>

        <!-- ====== 右侧：终端窗口 ====== -->
        <div class="terminal-area">
          <div class="terminal-window" @click="focusTerminal">
            <!-- 终端标题栏 -->
            <div class="terminal-header">
              <span class="terminal-dot dot-red"></span>
              <span class="terminal-dot dot-yellow"></span>
              <span class="terminal-dot dot-green"></span>
              <span class="terminal-title">{{ terminalData.title }}</span>
            </div>

            <!-- 终端内容区 -->
            <div ref="terminalBodyRef" class="terminal-body">
              <!-- 已输出的行 -->
              <div
                v-for="(line, i) in displayLines"
                :key="i"
                class="terminal-line"
                :class="{
                  'cmd-line': line.type === 'command',
                  'sys-line': line.type === 'system',
                  'out-line': line.type === 'output',
                }"
              ><template v-if="line.type === 'system'"><span v-html="highlightCommands(line.text)"></span></template><template v-else>{{ line.text }}</template></div>

              <!-- 交互 prompt 行 -->
              <div v-if="interactive" class="terminal-line prompt-line">
                <span class="prompt-sign">{{ terminalData.user }} $ </span>
                <span class="input-text">{{ currentInput }}</span>
                <span class="cursor-blink">▊</span>
              </div>

              <!-- 隐藏的 input 捕获键盘输入 -->
              <input
                ref="hiddenInput"
                v-model="currentInput"
                class="hidden-input"
                type="text"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                @keydown.enter.prevent="processCommand(currentInput)"
                @blur="interactive ? nextTick(() => hiddenInput?.focus()) : null"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <a
        ref="backBtn"
        class="page-back"
        style="opacity:0;pointer-events:none"
        @click="$emit('back')"
      >
        {{ aboutData.back }}
      </a>
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
  overflow-y: auto;
}

.about-wrap {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ====== 左右两栏布局 ====== */
.about-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  width: 90%;
  max-width: 1000px;
  padding: 2rem 0;
}

/* ====== 左侧：像素角色区域 ====== */
.photo-area {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pixel-char-wrap {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.pixel-char {
  display: block;
  width: 260px;
  height: auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* 地面阴影 — 绝对定位，不影响居中 */
.char-shadow {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 14px;
  background: radial-gradient(ellipse, rgba(0, 240, 255, 0.18) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

/* ====== 右侧：终端窗口 ====== */
.terminal-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terminal-window {
  width: 100%;
  max-width: 560px;
  border-radius: 10px;
  overflow: hidden;
  background: #0d1117;
  border: 1px solid rgba(0, 240, 255, 0.15);
  box-shadow:
    0 0 40px rgba(0, 240, 255, 0.06),
    0 20px 60px rgba(0, 0, 0, 0.5);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: text;
}

.terminal-window:hover {
  border-color: rgba(0, 240, 255, 0.25);
  box-shadow:
    0 0 50px rgba(0, 240, 255, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.5);
}

/* 终端标题栏 */
.terminal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.7rem 1rem;
  background: rgba(22, 27, 34, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  user-select: none;
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-red {
  background: #ff5f56;
}
.dot-yellow {
  background: #ffbd2e;
}
.dot-green {
  background: #27c93f;
}

.terminal-title {
  margin-left: 0.8rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
    'Microsoft Yahei', sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

/* 终端内容区 */
.terminal-body {
  padding: 1.2rem 1.4rem;
  min-height: 320px;
  max-height: 420px;
  overflow-y: auto;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.7;
  position: relative;
}

/* 自定义滚动条 */
.terminal-body::-webkit-scrollbar {
  width: 5px;
}
.terminal-body::-webkit-scrollbar-track {
  background: transparent;
}
.terminal-body::-webkit-scrollbar-thumb {
  background: rgba(0, 240, 255, 0.15);
  border-radius: 3px;
}

.terminal-line {
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 1.7em;
}

/* 命令行样式 — 用户输入的命令 */
.cmd-line {
  color: rgba(255, 255, 255, 0.9);
}

/* 系统消息 — 包含 prompt 符号 */
.sys-line {
  color: rgba(255, 255, 255, 0.55);
}

/* 命令名高亮 — 终端绿色（可执行文件规范色） */
:deep(.cmd-name) {
  color: #13A10E;
  font-weight: 600;
}

/* all 命令额外强调 — 暖金色 */
:deep(.cmd-all) {
  color: #C19C00;
  font-weight: 700;
}

/* 命令输出 */
.out-line {
  color: rgba(255, 255, 255, 0.78);
}

/* 交互 prompt 行 */
.prompt-line {
  display: flex;
  align-items: center;
}

.prompt-sign {
  color: var(--ai-cyan);
  text-shadow: 0 0 6px rgba(0, 240, 255, 0.3);
  flex-shrink: 0;
}

.input-text {
  color: rgba(255, 255, 255, 0.9);
}

/* 隐藏的真实 input */
.hidden-input {
  position: absolute;
  left: -9999px;
  opacity: 0;
  width: 1px;
  height: 1px;
}

/* 闪烁光标 */
.cursor-blink {
  color: var(--ai-cyan);
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ====== 响应式 ====== */
@media screen and (max-width: 768px) {
  .about-layout {
    flex-direction: column;
    gap: 2rem;
    width: 92%;
    padding: 1.5rem 0;
  }

  .pixel-char {
    width: 200px;
  }

  .char-shadow {
    width: 110px;
    height: 11px;
  }

  .terminal-window {
    max-width: 100%;
  }

  .terminal-body {
    min-height: 260px;
    max-height: 360px;
    padding: 1rem 1.1rem;
    font-size: 0.7rem;
  }
}

@media screen and (max-width: 50em) {
  .about-layout {
    gap: 1.5rem;
  }

  .pixel-char {
    width: 150px;
  }

  .char-shadow {
    width: 85px;
    height: 9px;
  }

  .terminal-body {
    font-size: 0.65rem;
    min-height: 220px;
    max-height: 300px;
  }

  .terminal-header {
    padding: 0.5rem 0.8rem;
  }

  .terminal-dot {
    width: 10px;
    height: 10px;
  }
}
</style>
