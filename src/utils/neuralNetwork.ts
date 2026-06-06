/**
 * NeuralNetwork — Canvas 神经网络粒子可视化
 * 来源：旧项目 src/js/neural-network.js
 */
export class NeuralNetwork {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  options: Required<NeuralOptions>
  nodes: NeuralNode[] = []
  packets: NeuralPacket[] = []
  edges: NeuralEdge[] = []
  animationFrame: number | null = null
  lastTimestamp = 0
  time = 0
  running = false
  width = 0
  height = 0
  centerX = 0
  centerY = 0

  constructor(canvas: HTMLCanvasElement, options: NeuralOptions = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.options = {
      nodeCount: options.nodeCount || 60,
      connectionDistance: options.connectionDistance || 180,
      nodeRadius: options.nodeRadius || 3.5,
      nodeGlowRadius: options.nodeGlowRadius || 15,
      packetCount: options.packetCount || 40,
      packetSpeed: options.packetSpeed || 0.6,
      packetRadius: options.packetRadius || 1.8,
      driftSpeed: options.driftSpeed || 0.15,
      driftAmplitude: options.driftAmplitude || 30,
      fps: options.fps || 60,
      colors: options.colors || [
        { r: 0, g: 240, b: 255 },
        { r: 0, g: 128, b: 255 },
        { r: 123, g: 47, b: 255 },
        { r: 100, g: 200, b: 255 },
      ],
      backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0)',
    }
  }

  // 鼠标位置（CSS 像素），用于节点排斥
  mouseX = -1000
  mouseY = -1000

  init() {
    this.resize()
    this.createNodes()
    this.createPackets()
    this.running = true
    this.animate()
    window.addEventListener('resize', this._handleResize)
    // 用 document 层面监听，因为 canvas 上 pointer-events: none 会阻挡事件
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseleave', this._onMouseLeave)
  }

  _handleResize = () => this.resize()

  _onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.mouseX = e.clientX - rect.left
    this.mouseY = e.clientY - rect.top
  }

  _onMouseLeave = () => {
    this.mouseX = -1000
    this.mouseY = -1000
  }

  resize() {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = this.canvas.offsetWidth
    const displayHeight = this.canvas.offsetHeight
    this.canvas.width = Math.floor(displayWidth * dpr)
    this.canvas.height = Math.floor(displayHeight * dpr)
    this.canvas.style.width = displayWidth + 'px'
    this.canvas.style.height = displayHeight + 'px'
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(dpr, dpr)
    this.width = displayWidth
    this.height = displayHeight
    this.centerX = displayWidth / 2
    this.centerY = displayHeight / 2
  }

  private createNodes() {
    this.nodes = []
    for (let i = 0; i < this.options.nodeCount; i++) {
      this.nodes.push({
        id: i,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: 0.5 + Math.random() * 1.5,
        speedY: 0.5 + Math.random() * 1.5,
        color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
        radius: this.options.nodeRadius * (0.6 + Math.random() * 0.8),
        glowRadius: this.options.nodeGlowRadius * (0.5 + Math.random()),
      })
    }
  }

  private createPackets() {
    this.packets = []
    for (let i = 0; i < this.options.packetCount; i++) {
      this.packets.push(this._spawnPacket())
    }
  }

  private _spawnPacket(): NeuralPacket {
    if (this.edges.length === 0) {
      return {
        from: { x: Math.random() * this.width, y: Math.random() * this.height },
        to: { x: Math.random() * this.width, y: Math.random() * this.height },
        t: Math.random(),
        speed: this.options.packetSpeed * (0.5 + Math.random()),
        color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
      }
    }
    const edge = this.edges[Math.floor(Math.random() * this.edges.length)]
    return {
      fromNode: edge.from,
      toNode: edge.to,
      t: Math.random(),
      speed: this.options.packetSpeed * (0.5 + Math.random()),
      color: edge.color,
    }
  }

  private _updateNodes() {
    const t = this.time
    const amp = this.options.driftAmplitude
    const speed = this.options.driftSpeed
    // 鼠标排斥半径和力度
    const repelRadius = 150
    const repelForce = 2.5

    for (const node of this.nodes) {
      const dx = Math.sin(t * speed * node.speedX + node.phaseX) * amp * 0.02
      const dy = Math.cos(t * speed * node.speedY + node.phaseY) * amp * 0.02

      // 鼠标排斥：距离越近推力越大
      const mx = node.x - this.mouseX
      const my = node.y - this.mouseY
      const dist = Math.sqrt(mx * mx + my * my)
      if (dist < repelRadius && dist > 0.1) {
        const strength = (1 - dist / repelRadius) * repelForce
        node.x += (mx / dist) * strength
        node.y += (my / dist) * strength
      }

      node.x += dx
      node.y += dy
      const margin = 50
      if (node.x < -margin) node.x = this.width + margin
      if (node.x > this.width + margin) node.x = -margin
      if (node.y < -margin) node.y = this.height + margin
      if (node.y > this.height + margin) node.y = -margin
      node.x = Math.max(-margin, Math.min(this.width + margin, node.x))
      node.y = Math.max(-margin, Math.min(this.height + margin, node.y))
    }
  }

  private _computeEdges() {
    this.edges = []
    const maxDist = this.options.connectionDistance
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i]
        const b = this.nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < maxDist) {
          this.edges.push({ from: a, to: b, distance: dist, maxDistance: maxDist, color: a.color })
        }
      }
    }
  }

  private _updatePackets() {
    for (let i = 0; i < this.packets.length; i++) {
      const p = this.packets[i]
      p.t += p.speed * 0.003
      if (p.t >= 1.0) {
        this.packets[i] = this._spawnPacket()
        this.packets[i].t = 0
      }
    }
  }

  private _getPacketPosition(packet: NeuralPacket) {
    let fx: number, fy: number, tx: number, ty: number
    if (packet.fromNode && packet.toNode) {
      fx = packet.fromNode.x; fy = packet.fromNode.y
      tx = packet.toNode.x; ty = packet.toNode.y
    } else {
      fx = packet.from!.x; fy = packet.from!.y
      tx = packet.to!.x; ty = packet.to!.y
    }
    return { x: fx + (tx - fx) * packet.t, y: fy + (ty - fy) * packet.t }
  }

  private _drawNodes() {
    const ctx = this.ctx
    for (const node of this.nodes) {
      const { r, g, b } = node.color
      const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.glowRadius)
      glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.7)`)
      glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.2)`)
      glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.glowRadius, 0, Math.PI * 2)
      ctx.fillStyle = glowGradient
      ctx.fill()
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.95)`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
    }
  }

  private _drawEdges() {
    const ctx = this.ctx
    const pulseIntensity = 0.5 + 0.5 * Math.sin(this.time * 0.5)
    for (const edge of this.edges) {
      const { r, g, b } = edge.color
      const alpha = (1 - edge.distance / edge.maxDistance) * 0.55 * pulseIntensity
      ctx.beginPath()
      ctx.moveTo(edge.from.x, edge.from.y)
      ctx.lineTo(edge.to.x, edge.to.y)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  }

  private _drawPackets() {
    const ctx = this.ctx
    for (const packet of this.packets) {
      const pos = this._getPacketPosition(packet)
      const { r, g, b } = packet.color
      const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, this.options.packetRadius * 5)
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`)
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, this.options.packetRadius * 5, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, this.options.packetRadius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      ctx.fill()
    }
  }

  private _drawVignette() {
    const ctx = this.ctx
    const gradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY,
      Math.max(this.width, this.height) * 0.55
    )
    gradient.addColorStop(0, 'rgba(6, 6, 6, 0)')
    gradient.addColorStop(1, 'rgba(6, 6, 6, 0.15)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)
  }

  private _draw(timestamp: number) {
    if (!this.running) return
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05)
    this.lastTimestamp = timestamp
    this.time += dt
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this._updateNodes()
    this._computeEdges()
    this._updatePackets()
    this._drawEdges()
    this._drawNodes()
    this._drawPackets()
    this._drawVignette()
  }

  animate() {
    if (!this.running) return
    this.animationFrame = requestAnimationFrame((ts) => {
      this._draw(ts)
      this.animate()
    })
  }

  destroy() {
    this.running = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    window.removeEventListener('resize', this._handleResize)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseleave', this._onMouseLeave)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

export interface NeuralOptions {
  nodeCount?: number
  connectionDistance?: number
  nodeRadius?: number
  nodeGlowRadius?: number
  packetCount?: number
  packetSpeed?: number
  packetRadius?: number
  driftSpeed?: number
  driftAmplitude?: number
  fps?: number
  colors?: { r: number; g: number; b: number }[]
  backgroundColor?: string
}

interface NeuralNode {
  id: number
  x: number
  y: number
  phaseX: number
  phaseY: number
  speedX: number
  speedY: number
  color: { r: number; g: number; b: number }
  radius: number
  glowRadius: number
}

interface NeuralEdge {
  from: NeuralNode
  to: NeuralNode
  distance: number
  maxDistance: number
  color: { r: number; g: number; b: number }
}

interface NeuralPacket {
  fromNode?: NeuralNode
  toNode?: NeuralNode
  from?: { x: number; y: number }
  to?: { x: number; y: number }
  t: number
  speed: number
  color: { r: number; g: number; b: number }
}
