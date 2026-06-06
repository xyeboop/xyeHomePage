/**
 * GridAnimation — Canvas 贪吃蛇网格动画
 * 来源：旧项目 src/js/main.js 中的 GridAnimation 类
 */
export class GridAnimation {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  options: Required<GridOptions>
  gridOffset: { x: number; y: number }
  hoveredSquare: { x: number; y: number } | null
  animationFrame: number | null
  currentOpacity: number
  targetOpacity: number
  lastTimestamp: number
  trailSquares: Map<string, TrailSquare>
  specialBlock: { x: number; y: number; color: string; initialOffset: { x: number; y: number } } | null
  specialBlockTimer: ReturnType<typeof setTimeout> | null
  isSpecialBlockHovered: boolean
  snakeBody: { x: number; y: number }[]
  shouldGrow: boolean
  handleTouchStart?: (e: TouchEvent) => void
  handleTouchMoveEvent?: (e: TouchEvent) => void
  handleTouchEndEvent?: (e: TouchEvent) => void
  handleTouchCancel?: (e: TouchEvent) => void

  constructor(canvas: HTMLCanvasElement, options: GridOptions = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.options = {
      direction: options.direction || 'right',
      speed: options.speed || 1,
      borderColor: options.borderColor || 'rgba(255, 255, 255, 0.05)',
      squareSize: options.squareSize || 40,
      hoverFillColor: options.hoverFillColor || 'rgba(255, 255, 255, 0.6)',
      hoverShadowColor: options.hoverShadowColor || 'rgba(255, 255, 255, 0.3)',
      transitionDuration: options.transitionDuration || 200,
      trailDuration: options.trailDuration || 1000,
      specialBlockColor: options.specialBlockColor || 'rgba(255, 100, 100, 0.8)',
      specialHoverColor: options.specialHoverColor || 'rgba(100, 255, 100, 0.8)',
      snakeHeadColor: options.snakeHeadColor || 'rgba(255, 255, 255, 0.9)',
      snakeTailColor: options.snakeTailColor || 'rgba(100, 100, 255, 0.3)',
      snakeColorDecay: options.snakeColorDecay || 0.7,
      touchSensitivity: options.touchSensitivity || 1.0,
      vibrationEnabled: options.vibrationEnabled ?? false,
    }
    this.gridOffset = { x: 0, y: 0 }
    this.hoveredSquare = null
    this.animationFrame = null
    this.currentOpacity = 0
    this.targetOpacity = 0
    this.lastTimestamp = 0
    this.trailSquares = new Map()
    this.specialBlock = null
    this.specialBlockTimer = null
    this.isSpecialBlockHovered = false
    this.snakeBody = []
    this.shouldGrow = false
  }

  private get isPhone() {
    return /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(navigator.userAgent)
  }

  private get hiddenProperty() {
    return 'hidden' in document
      ? 'hidden'
      : 'webkitHidden' in document
        ? 'webkitHidden'
        : 'mozHidden' in document
          ? 'mozHidden'
          : null
  }

  private get visibilityChangeEvent() {
    return this.hiddenProperty?.replace(/hidden/i, 'visibilitychange') || 'visibilitychange'
  }

  init() {
    this.resizeCanvas()
    this.setupEventListeners()
    if (this.isPhone) this.optimizeForMobile()
    this.animate()
    if (this.isPhone) {
      setTimeout(() => this.createSpecialBlock(), 500)
    } else {
      this.createSpecialBlock()
    }
    document.addEventListener(this.visibilityChangeEvent, this.handleVisibilityChange.bind(this))
  }

  private optimizeForMobile() {
    const ctx = this.canvas.getContext('2d')!
    const startTime = performance.now()
    for (let i = 0; i < 1000; i++) ctx.fillRect(0, 0, 1, 1)
    const endTime = performance.now()
    const score = endTime - startTime
    if (score > 10) {
      this.options.squareSize = Math.max(this.options.squareSize * 1.5, 60)
      this.options.speed *= 0.7
      this.options.trailDuration *= 0.5
    } else if (score > 5) {
      this.options.squareSize = Math.max(this.options.squareSize * 1.2, 50)
      this.options.speed *= 0.8
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = this.canvas.offsetWidth
    const displayHeight = this.canvas.offsetHeight
    this.canvas.width = Math.floor(displayWidth * dpr)
    this.canvas.height = Math.floor(displayHeight * dpr)
    this.canvas.style.width = `${displayWidth}px`
    this.canvas.style.height = `${displayHeight}px`
    this.ctx.scale(dpr, dpr)
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas())
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave())
    if (this.isPhone) this.setupTouchEvents()
  }

  private setupTouchEvents() {
    let touchStartPos: { x: number; y: number; time: number } | null = null
    let isTouching = false
    let lastTouchTime = 0

    this.handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastTouchTime < 16) return
      lastTouchTime = now

      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        touchStartPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top, time: now }
        isTouching = true

        this.handleTouchMove(touchStartPos.x, touchStartPos.y)
        if (!this.hoveredSquare) {
          this.targetOpacity = 0.8 * this.options.touchSensitivity
        }
        if (this.options.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(10)
        }
      }
    }

    this.handleTouchMoveEvent = (e: TouchEvent) => {
      e.preventDefault()
      if (isTouching && e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        this.handleTouchMove(touch.clientX - rect.left, touch.clientY - rect.top)
      }
    }

    this.handleTouchEndEvent = (e: TouchEvent) => {
      e.preventDefault()
      isTouching = false
      touchStartPos = null
      this.handleTouchEnd()
    }

    this.handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault()
      isTouching = false
      touchStartPos = null
    }

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMoveEvent, { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEndEvent, { passive: false })
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel, { passive: false })
  }

  private handleTouchMove(x: number, y: number) {
    const startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
    const startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
    const hoverX = Math.floor((x + this.gridOffset.x - startX) / this.options.squareSize)
    const hoverY = Math.floor((y + this.gridOffset.y - startY) / this.options.squareSize)

    if (this.hoveredSquare?.x !== hoverX || this.hoveredSquare?.y !== hoverY) {
      if (this.hoveredSquare) {
        this.snakeBody.unshift({ x: this.hoveredSquare.x, y: this.hoveredSquare.y })
        if (!this.shouldGrow && this.snakeBody.length > 0) this.snakeBody.pop()
        this.shouldGrow = false
      }
      this.hoveredSquare = { x: hoverX, y: hoverY }
      this.targetOpacity = 0.8 * this.options.touchSensitivity

      if (this.specialBlock && hoverX === this.specialBlock.x && hoverY === this.specialBlock.y) {
        this.shouldGrow = true
        this.createSpecialBlock()
        if (this.options.vibrationEnabled && navigator.vibrate) navigator.vibrate(100)
      }
    }
  }

  private handleTouchEnd() {
    if (this.hoveredSquare) {
      this.snakeBody.unshift({ x: this.hoveredSquare.x, y: this.hoveredSquare.y })
      if (!this.shouldGrow && this.snakeBody.length > 0) this.snakeBody.pop()
      this.shouldGrow = false

      const startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
      const startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
      const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`
      this.trailSquares.set(key, {
        x: this.hoveredSquare.x * this.options.squareSize + startX,
        y: this.hoveredSquare.y * this.options.squareSize + startY,
        opacity: 0.8,
      })
    }
    if (this.hoveredSquare) this.targetOpacity = 0.4
  }

  handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
    const startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
    const hoverX = Math.floor((mouseX + this.gridOffset.x - startX) / this.options.squareSize)
    const hoverY = Math.floor((mouseY + this.gridOffset.y - startY) / this.options.squareSize)

    if (this.hoveredSquare?.x !== hoverX || this.hoveredSquare?.y !== hoverY) {
      if (this.hoveredSquare) {
        this.snakeBody.unshift({ x: this.hoveredSquare.x, y: this.hoveredSquare.y })
        if (!this.shouldGrow && this.snakeBody.length > 0) this.snakeBody.pop()
        this.shouldGrow = false
      }
      this.hoveredSquare = { x: hoverX, y: hoverY }
      this.targetOpacity = 0.6

      if (this.specialBlock && hoverX === this.specialBlock.x && hoverY === this.specialBlock.y) {
        this.shouldGrow = true
        this.createSpecialBlock()
      }
    }
  }

  handleMouseLeave() {
    if (this.hoveredSquare) {
      const startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
      const startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
      const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`
      this.trailSquares.set(key, {
        x: this.hoveredSquare.x * this.options.squareSize + startX,
        y: this.hoveredSquare.y * this.options.squareSize + startY,
        opacity: 0.6,
      })
    }
    this.hoveredSquare = null
    this.targetOpacity = 0
  }

  createSpecialBlock() {
    if (this.specialBlockTimer) clearTimeout(this.specialBlockTimer)
    const dpr = window.devicePixelRatio || 1
    const numSquaresX = Math.ceil(this.canvas.width / dpr / this.options.squareSize)
    const numSquaresY = Math.ceil(this.canvas.height / dpr / this.options.squareSize)

    let newX: number, newY: number
    do {
      newX = 1 + Math.floor(Math.random() * (numSquaresX - 2))
      newY = 1 + Math.floor(Math.random() * (numSquaresY - 2))
    } while (this.snakeBody.some(s => s.x === newX && s.y === newY))

    this.specialBlock = { x: newX, y: newY, color: this.options.specialBlockColor, initialOffset: { ...this.gridOffset } }
  }

  private drawGrid() {
    const dpr = window.devicePixelRatio || 1
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
    const startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
    this.ctx.lineWidth = this.isPhone ? 1.0 : 0.5
    if (this.isPhone) this.ctx.translate(0.5, 0.5)

    // Draw snake body
    this.snakeBody.forEach((segment, index) => {
      const squareX = Math.round(segment.x * this.options.squareSize + startX - (this.gridOffset.x % this.options.squareSize))
      const squareY = Math.round(segment.y * this.options.squareSize + startY - (this.gridOffset.y % this.options.squareSize))
      this.ctx.shadowColor = this.options.hoverShadowColor
      this.ctx.shadowBlur = 15
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0

      if (index === 0) {
        this.ctx.fillStyle = this.options.snakeHeadColor
      } else {
        const factor = Math.pow(this.options.snakeColorDecay, index)
        const headM = this.options.snakeHeadColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/)
        const tailM = this.options.snakeTailColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/)
        if (headM && tailM) {
          const hr = +headM[1], hg = +headM[2], hb = +headM[3], ha = headM[4] ? +headM[4] : 1
          const tr = +tailM[1], tg = +tailM[2], tb = +tailM[3], ta = tailM[4] ? +tailM[4] : 1
          const r = Math.round(hr + (tr - hr) * (1 - factor))
          const g = Math.round(hg + (tg - hg) * (1 - factor))
          const b = Math.round(hb + (tb - hb) * (1 - factor))
          const a = ha + (ta - ha) * (1 - factor)
          this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        } else {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, factor)})`
        }
      }
      this.ctx.fillRect(squareX, squareY, this.options.squareSize, this.options.squareSize)
      this.ctx.shadowColor = 'transparent'
      this.ctx.shadowBlur = 0
    })

    // Draw grid cells
    for (let x = startX; x < this.canvas.width + this.options.squareSize; x += this.options.squareSize) {
      for (let y = startY; y < this.canvas.height + this.options.squareSize; y += this.options.squareSize) {
        const squareX = Math.round(x - (this.gridOffset.x % this.options.squareSize))
        const squareY = Math.round(y - (this.gridOffset.y % this.options.squareSize))
        const gridX = Math.floor((x - startX) / this.options.squareSize)
        const gridY = Math.floor((y - startY) / this.options.squareSize)

        // Food
        if (this.specialBlock && gridX === this.specialBlock.x && gridY === this.specialBlock.y) {
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
          this.ctx.shadowBlur = 20
          this.ctx.fillStyle = this.specialBlock.color
          this.ctx.fillRect(squareX, squareY, this.options.squareSize, this.options.squareSize)
          this.ctx.shadowColor = 'transparent'
          this.ctx.shadowBlur = 0
        }

        // Hovered square
        if (this.hoveredSquare && gridX === this.hoveredSquare.x && gridY === this.hoveredSquare.y) {
          this.ctx.shadowColor = this.options.hoverShadowColor
          this.ctx.shadowBlur = 15
          this.ctx.fillStyle = this.options.hoverFillColor.replace('0.6', this.currentOpacity.toString())
          this.ctx.fillRect(squareX, squareY, this.options.squareSize, this.options.squareSize)
          this.ctx.shadowColor = 'transparent'
          this.ctx.shadowBlur = 0
        }

        this.ctx.strokeStyle = this.options.borderColor
        this.ctx.strokeRect(squareX, squareY, this.options.squareSize, this.options.squareSize)
      }
    }

    if (this.isPhone) this.ctx.translate(-0.5, -0.5)

    // Vignette
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / dpr / 2, this.canvas.height / dpr / 2, 0,
      this.canvas.width / dpr / 2, this.canvas.height / dpr / 2,
      Math.sqrt(Math.pow(this.canvas.width / dpr, 2) + Math.pow(this.canvas.height / dpr, 2)) / 2
    )
    gradient.addColorStop(0, 'rgba(6, 6, 6, 0)')
    gradient.addColorStop(1, '#060606')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr)
  }

  private updateAnimation(timestamp: number) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp
    const deltaTime = timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    if (this.currentOpacity !== this.targetOpacity) {
      const progress = Math.min(deltaTime / this.options.transitionDuration, 1)
      this.currentOpacity += (this.targetOpacity - this.currentOpacity) * progress
    }

    for (const [key, square] of this.trailSquares) {
      square.opacity -= deltaTime / this.options.trailDuration
      if (square.opacity <= 0) this.trailSquares.delete(key)
    }

    const dpr = window.devicePixelRatio || 1
    const effectiveSpeed = Math.max(this.isPhone ? this.options.speed * 0.8 : this.options.speed, 0)
    const moveAmount = this.isPhone ? Math.round(effectiveSpeed * 100) / 100 : effectiveSpeed

    switch (this.options.direction) {
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - moveAmount + this.options.squareSize) % this.options.squareSize
        break
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + moveAmount + this.options.squareSize) % this.options.squareSize
        break
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + moveAmount + this.options.squareSize) % this.options.squareSize
        break
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - moveAmount + this.options.squareSize) % this.options.squareSize
        break
      case 'diagonal':
        this.gridOffset.x = (this.gridOffset.x - moveAmount + this.options.squareSize) % this.options.squareSize
        this.gridOffset.y = (this.gridOffset.y - moveAmount + this.options.squareSize) % this.options.squareSize
        break
    }

    // Check food off-screen
    if (this.specialBlock) {
      const sx = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize
      const sy = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize
      const foodX = Math.round(this.specialBlock.x * this.options.squareSize + sx - (this.gridOffset.x % this.options.squareSize))
      const foodY = Math.round(this.specialBlock.y * this.options.squareSize + sy - (this.gridOffset.y % this.options.squareSize))
      if (foodX < -this.options.squareSize || foodX > this.canvas.width / dpr ||
          foodY < -this.options.squareSize || foodY > this.canvas.height / dpr) {
        this.createSpecialBlock()
      }
    }

    this.drawGrid()
    this.animationFrame = requestAnimationFrame((ts) => this.updateAnimation(ts))
  }

  animate() {
    this.animationFrame = requestAnimationFrame((ts) => this.updateAnimation(ts))
  }

  private handleVisibilityChange() {
    if (document[this.hiddenProperty as keyof Document] as boolean) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    } else {
      if (!this.animationFrame) {
        this.lastTimestamp = 0
        this.animate()
      }
    }
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame)
    window.removeEventListener('resize', () => this.resizeCanvas())
    this.canvas.removeEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.removeEventListener('mouseleave', () => this.handleMouseLeave())
    if (this.isPhone && this.handleTouchStart) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart)
      this.canvas.removeEventListener('touchmove', this.handleTouchMoveEvent!)
      this.canvas.removeEventListener('touchend', this.handleTouchEndEvent!)
      this.canvas.removeEventListener('touchcancel', this.handleTouchCancel!)
    }
    document.removeEventListener(this.visibilityChangeEvent, this.handleVisibilityChange.bind(this))
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

export interface GridOptions {
  direction?: string
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  hoverShadowColor?: string
  transitionDuration?: number
  trailDuration?: number
  specialBlockColor?: string
  specialHoverColor?: string
  snakeHeadColor?: string
  snakeTailColor?: string
  snakeColorDecay?: number
  touchSensitivity?: number
  vibrationEnabled?: boolean
}

interface TrailSquare {
  x: number
  y: number
  opacity: number
}
