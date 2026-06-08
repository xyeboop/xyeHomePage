/**
 * WebGL Fluid Simulation
 * 来源：旧项目 src/js/background.js (MIT License, Copyright (c) 2017 Pavel Dobryakov)
 *
 * 改造为 TS class，消除全局变量，每个实例独立管理 WebGL 状态。
 */

// ============================================================
// WebGL 辅助：Program 和 Material
// ============================================================

class Program {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  uniforms: Record<string, WebGLUniformLocation | null> = {}
  program: WebGLProgram

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    this.gl = gl
    this.program = gl.createProgram()!
    gl.attachShader(this.program, vertexShader)
    gl.attachShader(this.program, fragmentShader)
    gl.linkProgram(this.program)
    const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(this.program, i)!.name
      this.uniforms[name] = gl.getUniformLocation(this.program, name)
    }
  }

  bind() {
    this.gl.useProgram(this.program)
  }
}

class Material {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  vertexShader: WebGLShader
  fragmentShaderSource: string
  programs: Record<number, { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }> = {}
  activeProgram: WebGLProgram | null = null
  uniforms: Record<string, WebGLUniformLocation | null> = {}

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShaderSource: string
  ) {
    this.gl = gl
    this.vertexShader = vertexShader
    this.fragmentShaderSource = fragmentShaderSource
  }

  setKeywords(keywords: string[]) {
    const gl = this.gl
    let hash = 0
    for (const kw of keywords) hash += FluidBackground.hashCode(kw)

    let entry = this.programs[hash]
    if (!entry) {
      const kwStr = keywords.map(k => `#define ${k}\n`).join('')
      const fs = gl.createShader(gl.FRAGMENT_SHADER)!
      gl.shaderSource(fs, kwStr + this.fragmentShaderSource)
      gl.compileShader(fs)
      const prog = gl.createProgram()!
      gl.attachShader(prog, this.vertexShader)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      const uniforms: Record<string, WebGLUniformLocation | null> = {}
      const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS)
      for (let i = 0; i < count; i++) {
        const name = gl.getActiveUniform(prog, i)!.name
        uniforms[name] = gl.getUniformLocation(prog, name)
      }
      entry = { program: prog, uniforms }
      this.programs[hash] = entry
    }

    this.activeProgram = entry.program
    this.uniforms = entry.uniforms
  }

  bind() {
    if (this.activeProgram) this.gl.useProgram(this.activeProgram)
  }
}

// ============================================================
// 类型定义
// ============================================================

interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach(id: number): number
}

interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap(): void
}

interface Pointer {
  id: number
  texcoordX: number
  texcoordY: number
  prevTexcoordX: number
  prevTexcoordY: number
  deltaX: number
  deltaY: number
  down: boolean
  moved: boolean
  color: { r: number; g: number; b: number }
}

// ============================================================
// FluidBackground 主类
// ============================================================

export class FluidBackground {
  canvas: HTMLCanvasElement
  gl!: WebGLRenderingContext | WebGL2RenderingContext
  ext!: {
    formatRGBA: { internalFormat: number; format: number }
    formatRG: { internalFormat: number; format: number }
    formatR: { internalFormat: number; format: number }
    halfFloatTexType: number
    supportLinearFiltering: boolean
  }
  isWebGL2 = false

  // Framebuffers
  dye!: DoubleFBO
  velocity!: DoubleFBO
  divergence!: FBO
  curl!: FBO
  pressure!: DoubleFBO
  bloom!: FBO
  bloomFramebuffers: FBO[] = []
  sunrays!: FBO
  sunraysTemp!: FBO
  ditheringTexture!: FBO

  // Programs
  blurProgram!: Program
  copyProgram!: Program
  clearProgram!: Program
  splatProgram!: Program
  advectionProgram!: Program
  curlProgram!: Program
  vorticityProgram!: Program
  divergenceProgram!: Program
  pressureProgram!: Program
  gradientSubtractProgram!: Program
  bloomPrefilterProgram!: Program
  bloomBlurProgram!: Program
  bloomFinalProgram!: Program
  sunraysMaskProgram!: Program
  sunraysProgram!: Program
  displayMaterial!: Material

  pointers: Pointer[] = [this.createPointer()]
  splatStack: number[] = []
  animationID: number | null = null
  lastUpdateTime = 0
  colorUpdateTimer = 0

  config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 10, g: 10, b: 26 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.8,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  // ---- 初始化入口 ----

  init() {
    this.getWebGLContext()
    // 必须先用 CSS 尺寸更新 canvas 内部分辨率，否则帧缓冲附件尺寸为 0
    this.resizeCanvas()
    this.initShaders()
    this.initFramebuffers()
    this.ditheringTexture = this.createTextureAsync('/background.png')

    // 原项目绑定在 document 上，保证鼠标交互不受 canvas 层级影响
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('touchstart', this.onTouchStart, { passive: false })
    document.addEventListener('touchmove', this.onTouchMove, { passive: false })
    document.addEventListener('touchend', this.onTouchEnd)

    this.multipleSplats(~~(Math.random() * 20) + 5)
    this.update()
  }

  // ---- WebGL 初始化 ----

  private getWebGLContext() {
    const params = {
      alpha: true, depth: false, stencil: false,
      antialias: false, preserveDrawingBuffer: false,
    }
    let gl = this.canvas.getContext('webgl2', params) as WebGL2RenderingContext | null
    const isWebGL2 = !!gl
    if (!isWebGL2) {
      gl = (this.canvas.getContext('webgl', params) ||
        this.canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext
    }
    this.gl = gl!
    this.isWebGL2 = isWebGL2

    let halfFloat: any, supportLinearFiltering: any
    if (isWebGL2) {
      gl!.getExtension('EXT_color_buffer_float')
      supportLinearFiltering = gl!.getExtension('OES_texture_float_linear')
    } else {
      halfFloat = gl!.getExtension('OES_texture_half_float')
      supportLinearFiltering = gl!.getExtension('OES_texture_half_float_linear')
    }
    gl!.clearColor(0.0, 0.0, 0.0, 1.0)
    const texType = isWebGL2 ? (gl! as any).HALF_FLOAT : halfFloat.HALF_FLOAT_OES

    // 端口原项目的 getSupportedFormat，检测硬件支持并自动降级
    const getSupportedFormat = (
      internalFormat: number, format: number, type: number
    ): { internalFormat: number; format: number } => {
      if (!this._supportRenderTextureFormat(internalFormat, format, type)) {
        if (isWebGL2) {
          switch (internalFormat) {
            case (gl! as any).R16F:
              return getSupportedFormat((gl! as any).RG16F, (gl! as any).RG, type)
            case (gl! as any).RG16F:
              return getSupportedFormat((gl! as any).RGBA16F, gl!.RGBA, type)
            default:
              break
          }
        }
        // 最终降级：RGBA8
        return { internalFormat: gl!.RGBA, format: gl!.RGBA }
      }
      return { internalFormat, format }
    }

    let formatRGBA: { internalFormat: number; format: number }
    let formatRG: { internalFormat: number; format: number }
    let formatR: { internalFormat: number; format: number }

    if (isWebGL2) {
      formatRGBA = getSupportedFormat((gl! as any).RGBA16F, gl!.RGBA, texType)
      formatRG = getSupportedFormat((gl! as any).RG16F, (gl! as any).RG, texType)
      formatR = getSupportedFormat((gl! as any).R16F, (gl! as any).RED, texType)
    } else {
      formatRGBA = getSupportedFormat(gl!.RGBA, gl!.RGBA, texType)
      formatRG = getSupportedFormat(gl!.RGBA, gl!.RGBA, texType)
      formatR = getSupportedFormat(gl!.RGBA, gl!.RGBA, texType)
    }

    this.ext = {
      formatRGBA, formatRG, formatR,
      halfFloatTexType: texType,
      supportLinearFiltering: !!supportLinearFiltering,
    }

    if (this.isMobile()) this.config.DYE_RESOLUTION = 512
    if (!this.ext.supportLinearFiltering) {
      this.config.DYE_RESOLUTION = 512
      this.config.SHADING = false
      this.config.BLOOM = false
      this.config.SUNRAYS = false
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const s = gl.createShader(type)!
    gl.shaderSource(s, source)
    gl.compileShader(s)
    return s
  }

  private initShaders() {
    const gl = this.gl

    const baseVertSrc = `precision highp float;
      attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform vec2 texelSize;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }`

    const blurVertSrc = `precision highp float;
      attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR;
      uniform vec2 texelSize;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - texelSize * 1.33333333; vR = vUv + texelSize * 1.33333333;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }`

    const bv = this.compileShader(gl.VERTEX_SHADER, baseVertSrc)
    const blurV = this.compileShader(gl.VERTEX_SHADER, blurVertSrc)

    this.blurProgram = new Program(gl, blurV,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; uniform sampler2D uTexture;
        void main() { vec4 s=texture2D(uTexture,vUv)*0.29411764;
        s+=texture2D(uTexture,vL)*0.35294117; s+=texture2D(uTexture,vR)*0.35294117; gl_FragColor=s; }`))

    this.copyProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture;
        void main() { gl_FragColor=texture2D(uTexture,vUv); }`))

    this.clearProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
        void main() { gl_FragColor=value*texture2D(uTexture,vUv); }`))

    this.splatProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
        uniform vec3 color; uniform vec2 point; uniform float radius;
        void main() { vec2 p=vUv-point.xy; p.x*=aspectRatio;
        vec3 s=exp(-dot(p,p)/radius)*color; vec3 b=texture2D(uTarget,vUv).xyz;
        gl_FragColor=vec4(b+s,1.0); }`))

    this.advectionProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
        uniform vec2 texelSize; uniform float dt; uniform float dissipation;
        void main() { vec2 c=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;
        vec4 r=texture2D(uSource,c); gl_FragColor=r/(1.0+dissipation*dt); }`))

    this.curlProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv,vL,vR,vT,vB; uniform sampler2D uVelocity;
        void main() { float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,
        T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;
        gl_FragColor=vec4(0.5*(R-L-T+B),0.0,0.0,1.0); }`))

    this.vorticityProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision highp float; precision highp sampler2D;
        varying vec2 vUv,vL,vR,vT,vB; uniform sampler2D uVelocity,uCurl; uniform float curl,dt;
        void main() { float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,
        T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;
        vec2 f=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+0.0001; f*=curl*C; f.y*=-1.0;
        gl_FragColor=vec4(texture2D(uVelocity,vUv).xy+f*dt,0.0,1.0); }`))

    this.divergenceProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv,vL,vR,vT,vB; uniform sampler2D uVelocity;
        void main() { float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,
        T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;
        vec2 C=texture2D(uVelocity,vUv).xy;
        if(vL.x<0.0)L=-C.x; if(vR.x>1.0)R=-C.x; if(vT.y>1.0)T=-C.y; if(vB.y<0.0)B=-C.y;
        gl_FragColor=vec4(0.5*(R-L+T-B),0.0,0.0,1.0); }`))

    this.pressureProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv,vL,vR,vT,vB; uniform sampler2D uPressure,uDivergence;
        void main() { gl_FragColor=vec4((texture2D(uPressure,vL).x+texture2D(uPressure,vR).x+
        texture2D(uPressure,vT).x+texture2D(uPressure,vB).x-texture2D(uDivergence,vUv).x)*0.25,0.0,0.0,1.0); }`))

    this.gradientSubtractProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv,vL,vR,vT,vB; uniform sampler2D uPressure,uVelocity;
        void main() { vec2 v=texture2D(uVelocity,vUv).xy;
        v-=vec2(texture2D(uPressure,vR).x-texture2D(uPressure,vL).x,
        texture2D(uPressure,vT).x-texture2D(uPressure,vB).x);
        gl_FragColor=vec4(v,0.0,1.0); }`))

    this.bloomPrefilterProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying vec2 vUv; uniform sampler2D uTexture; uniform vec3 curve; uniform float threshold;
        void main() { vec3 c=texture2D(uTexture,vUv).rgb; float br=max(c.r,max(c.g,c.b));
        float rq=clamp(br-curve.x,0.0,curve.y); rq=curve.z*rq*rq;
        c*=max(rq,br-threshold)/max(br,0.0001); gl_FragColor=vec4(c,0.0); }`))

    this.bloomBlurProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying vec2 vL,vR,vT,vB; uniform sampler2D uTexture;
        void main() { vec4 s=vec4(0.0); s+=texture2D(uTexture,vL); s+=texture2D(uTexture,vR);
        s+=texture2D(uTexture,vT); s+=texture2D(uTexture,vB); gl_FragColor=s*0.25; }`))

    this.bloomFinalProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D;
        varying vec2 vL,vR,vT,vB; uniform sampler2D uTexture; uniform float intensity;
        void main() { vec4 s=vec4(0.0); s+=texture2D(uTexture,vL); s+=texture2D(uTexture,vR);
        s+=texture2D(uTexture,vT); s+=texture2D(uTexture,vB); gl_FragColor=s*0.25*intensity; }`))

    this.sunraysMaskProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uTexture;
        void main() { vec4 c=texture2D(uTexture,vUv);
        c.a=1.0-min(max(max(c.r,max(c.g,c.b))*20.0,0.0),0.8); gl_FragColor=c; }`))

    this.sunraysProgram = new Program(gl, bv,
      this.compileShader(gl.FRAGMENT_SHADER, `precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uTexture; uniform float weight;
        #define ITER 16
        void main() { vec2 c=vUv,d=vUv-0.5; d*=1.0/float(ITER)*0.3;
        float decay=1.0,col=texture2D(uTexture,vUv).a;
        for(int i=0;i<ITER;i++){c-=d;col+=texture2D(uTexture,c).a*decay*weight;decay*=0.95;}
        gl_FragColor=vec4(col*0.7,0.0,0.0,1.0); }`))

    const displaySrc = `precision highp float; precision highp sampler2D;
      varying vec2 vUv,vL,vR,vT,vB;
      uniform sampler2D uTexture;
      #ifdef BLOOM
      uniform sampler2D uBloom,uDithering; uniform vec2 ditherScale;
      #endif
      #ifdef SUNRAYS
      uniform sampler2D uSunrays;
      #endif
      uniform vec2 texelSize;
      vec3 lg(vec3 c){c=max(c,vec3(0.0));return max(1.055*pow(c,vec3(0.416666667))-0.055,vec3(0.0));}
      void main() {
        vec3 c=texture2D(uTexture,vUv).rgb;
        #ifdef SHADING
        vec3 lc=texture2D(uTexture,vL).rgb,rc=texture2D(uTexture,vR).rgb,
        tc=texture2D(uTexture,vT).rgb,bc=texture2D(uTexture,vB).rgb;
        c*=clamp(dot(normalize(vec3(length(rc)-length(lc),length(tc)-length(bc),length(texelSize))),vec3(0.0,0.0,1.0))+0.7,0.7,1.0);
        #endif
        #ifdef SUNRAYS
        c*=texture2D(uSunrays,vUv).r;
        #endif
        #ifdef BLOOM
        vec3 bloom=texture2D(uBloom,vUv).rgb;
        #ifdef SUNRAYS
        bloom*=texture2D(uSunrays,vUv).r;
        #endif
        float n=texture2D(uDithering,vUv*ditherScale).r;
        c+=lg(bloom+(n*2.0-1.0)/255.0);
        #endif
        gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));
      }`

    this.displayMaterial = new Material(gl, bv, displaySrc)

    // Bloom/sunrays config adjustments
    if (!this.ext.supportLinearFiltering) {
      this.config.SHADING = false
      this.config.BLOOM = false
      this.config.SUNRAYS = false
    }

    this.displayMaterial.setKeywords(
      ['SHADING', 'BLOOM', 'SUNRAYS'].filter(k =>
        this.config[k as 'SHADING' | 'BLOOM' | 'SUNRAYS']
      )
    )
  }

  // ---- Framebuffers ----

  /** 检测指定格式组合是否可以作为帧缓冲附件使用 */
  private _supportRenderTextureFormat(
    internalFormat: number, format: number, type: number
  ): boolean {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    gl.deleteTexture(tex)
    gl.deleteFramebuffer(fbo)
    return status === gl.FRAMEBUFFER_COMPLETE
  }

  private getResolution(res: number) {
    const gl = this.gl
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight
    if (ar < 1) ar = 1 / ar
    const min = Math.round(res)
    const max = Math.round(res * ar)
    return gl.drawingBufferWidth > gl.drawingBufferHeight
      ? { width: max, height: min }
      : { width: min, height: max }
  }

  private createFBO(w: number, h: number, internalFormat: number, format: number,
    type: number, param: number): FBO {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0)
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.viewport(0, 0, w, h)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return {
      texture: tex, fbo, width: w, height: h,
      texelSizeX: 1 / w, texelSizeY: 1 / h,
      attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id },
    }
  }

  private createDoubleFBO(w: number, h: number, intFmt: number, fmt: number,
    type: number, param: number): DoubleFBO {
    let fbo1 = this.createFBO(w, h, intFmt, fmt, type, param)
    let fbo2 = this.createFBO(w, h, intFmt, fmt, type, param)
    return {
      width: w, height: h,
      texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
      get read() { return fbo1 },
      set read(v) { fbo1 = v },
      get write() { return fbo2 },
      set write(v) { fbo2 = v },
      swap() { [fbo1, fbo2] = [fbo2, fbo1] },
    }
  }

  private initFramebuffers() {
    const e = this.ext
    const simRes = this.getResolution(this.config.SIM_RESOLUTION)
    const dyeRes = this.getResolution(this.config.DYE_RESOLUTION)
    const t = e.halfFloatTexType
    const filt = e.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST

    this.dye = this.createDoubleFBO(dyeRes.width, dyeRes.height, e.formatRGBA.internalFormat, e.formatRGBA.format, t, filt)
    this.velocity = this.createDoubleFBO(simRes.width, simRes.height, e.formatRG.internalFormat, e.formatRG.format, t, filt)
    this.divergence = this.createFBO(simRes.width, simRes.height, e.formatR.internalFormat, e.formatR.format, t, this.gl.NEAREST)
    this.curl = this.createFBO(simRes.width, simRes.height, e.formatR.internalFormat, e.formatR.format, t, this.gl.NEAREST)
    this.pressure = this.createDoubleFBO(simRes.width, simRes.height, e.formatR.internalFormat, e.formatR.format, t, this.gl.NEAREST)

    // Bloom
    const bloomRes = this.getResolution(this.config.BLOOM_RESOLUTION)
    this.bloom = this.createFBO(bloomRes.width, bloomRes.height, e.formatRGBA.internalFormat, e.formatRGBA.format, t, filt)
    this.bloomFramebuffers = []
    for (let i = 0; i < this.config.BLOOM_ITERATIONS; i++) {
      const w = bloomRes.width >> (i + 1), h = bloomRes.height >> (i + 1)
      if (w < 2 || h < 2) break
      this.bloomFramebuffers.push(this.createFBO(w, h, e.formatRGBA.internalFormat, e.formatRGBA.format, t, filt))
    }

    // Sunrays
    const sr = this.getResolution(this.config.SUNRAYS_RESOLUTION)
    this.sunrays = this.createFBO(sr.width, sr.height, e.formatR.internalFormat, e.formatR.format, t, filt)
    this.sunraysTemp = this.createFBO(sr.width, sr.height, e.formatR.internalFormat, e.formatR.format, t, filt)
  }

  private createTextureAsync(url: string): FBO {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]))
    const obj: FBO = {
      texture: tex, fbo: null as any, width: 1, height: 1,
      texelSizeX: 1, texelSizeY: 1,
      attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id },
    }
    const img = new Image()
    img.onload = () => {
      obj.width = img.width; obj.height = img.height
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    }
    img.src = url
    return obj
  }

  // ---- Blit (顶点缓冲) ----

  private blit(target: WebGLFramebuffer | null) {
    const gl = this.gl
    if (!(this as any)._blitBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(0)
      ;(this as any)._blitBuf = true
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, target)
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
  }

  // ---- Simulation step ----

  private step(dt: number) {
    const gl = this.gl
    gl.disable(gl.BLEND)

    // Curl
    gl.viewport(0, 0, this.velocity.width, this.velocity.height)
    this.curlProgram.bind()
    gl.uniform2f(this.curlProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.velocity.read.attach(0))
    this.blit(this.curl.fbo)

    // Vorticity
    this.vorticityProgram.bind()
    gl.uniform2f(this.vorticityProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.velocity.read.attach(0))
    gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1))
    gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.CURL)
    gl.uniform1f(this.vorticityProgram.uniforms.dt, dt)
    this.blit(this.velocity.write.fbo); this.velocity.swap()

    // Divergence
    this.divergenceProgram.bind()
    gl.uniform2f(this.divergenceProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.velocity.read.attach(0))
    this.blit(this.divergence.fbo)

    // Pressure
    this.clearProgram.bind()
    gl.uniform1i(this.clearProgram.uniforms.uTexture, this.pressure.read.attach(0))
    gl.uniform1f(this.clearProgram.uniforms.value, this.config.PRESSURE)
    this.blit(this.pressure.write.fbo); this.pressure.swap()

    this.pressureProgram.bind()
    gl.uniform2f(this.pressureProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.divergence.attach(0))
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.pressure.read.attach(1))
      this.blit(this.pressure.write.fbo); this.pressure.swap()
    }

    // Gradient subtract
    this.gradientSubtractProgram.bind()
    gl.uniform2f(this.gradientSubtractProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    gl.uniform1i(this.gradientSubtractProgram.uniforms.uPressure, this.pressure.read.attach(0))
    gl.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity, this.velocity.read.attach(1))
    this.blit(this.velocity.write.fbo); this.velocity.swap()

    // Velocity advection
    this.advectionProgram.bind()
    gl.uniform2f(this.advectionProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY)
    const vid = this.velocity.read.attach(0)
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, vid)
    gl.uniform1i(this.advectionProgram.uniforms.uSource, vid)
    gl.uniform1f(this.advectionProgram.uniforms.dt, dt)
    gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.VELOCITY_DISSIPATION)
    this.blit(this.velocity.write.fbo); this.velocity.swap()

    // Dye advection
    gl.viewport(0, 0, this.dye.width, this.dye.height)
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read.attach(0))
    gl.uniform1i(this.advectionProgram.uniforms.uSource, this.dye.read.attach(1))
    gl.uniform1f(this.advectionProgram.uniforms.dissipation, this.config.DENSITY_DISSIPATION)
    this.blit(this.dye.write.fbo); this.dye.swap()
  }

  // ---- Render ----

  private render() {
    const gl = this.gl

    // Bloom
    if (this.config.BLOOM && this.bloomFramebuffers.length >= 2) {
      const knee = this.config.BLOOM_THRESHOLD * this.config.BLOOM_SOFT_KNEE + 0.0001
      this.bloomPrefilterProgram.bind()
      gl.uniform3f(this.bloomPrefilterProgram.uniforms.curve, this.config.BLOOM_THRESHOLD - knee, knee * 2, 0.25 / knee)
      gl.uniform1f(this.bloomPrefilterProgram.uniforms.threshold, this.config.BLOOM_THRESHOLD)
      gl.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture, this.dye.read.attach(0))
      gl.viewport(0, 0, this.bloom.width, this.bloom.height)
      this.blit(this.bloom.fbo)

      let last: FBO = this.bloom
      this.bloomBlurProgram.bind()
      for (const dest of this.bloomFramebuffers) {
        gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
        gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0))
        gl.viewport(0, 0, dest.width, dest.height)
        this.blit(dest.fbo)
        last = dest
      }

      gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.BLEND)
      for (let i = this.bloomFramebuffers.length - 2; i >= 0; i--) {
        const base = this.bloomFramebuffers[i]
        gl.uniform2f(this.bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
        gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, last.attach(0))
        gl.viewport(0, 0, base.width, base.height)
        this.blit(base.fbo)
        last = base
      }
      gl.disable(gl.BLEND)

      this.bloomFinalProgram.bind()
      gl.uniform2f(this.bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY)
      gl.uniform1i(this.bloomFinalProgram.uniforms.uTexture, last.attach(0))
      gl.uniform1f(this.bloomFinalProgram.uniforms.intensity, this.config.BLOOM_INTENSITY)
      gl.viewport(0, 0, this.bloom.width, this.bloom.height)
      this.blit(this.bloom.fbo)
    }

    // Sunrays
    if (this.config.SUNRAYS) {
      this.sunraysMaskProgram.bind()
      gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, this.dye.read.attach(0))
      gl.viewport(0, 0, this.sunrays.width, this.sunrays.height)
      this.blit(this.sunrays.fbo)

      this.sunraysProgram.bind()
      gl.uniform1f(this.sunraysProgram.uniforms.weight, this.config.SUNRAYS_WEIGHT)
      gl.uniform1i(this.sunraysProgram.uniforms.uTexture, this.sunrays.attach(0))
      gl.viewport(0, 0, this.sunraysTemp.width, this.sunraysTemp.height)
      this.blit(this.sunraysTemp.fbo)

      this.blurProgram.bind()
      gl.uniform2f(this.blurProgram.uniforms.texelSize, this.sunraysTemp.texelSizeX, 0.0)
      gl.uniform1i(this.blurProgram.uniforms.uTexture, this.sunraysTemp.attach(0))
      this.blit(this.sunrays.fbo)
      gl.uniform2f(this.blurProgram.uniforms.texelSize, 0.0, this.sunraysTemp.texelSizeY)
      gl.uniform1i(this.blurProgram.uniforms.uTexture, this.sunrays.attach(0))
      this.blit(this.sunraysTemp.fbo)
    }

    // Final display
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND)
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight
    gl.viewport(0, 0, w, h)

    this.displayMaterial.bind()
    if (this.config.SHADING)
      gl.uniform2f(this.displayMaterial.uniforms.texelSize, 1 / w, 1 / h)
    gl.uniform1i(this.displayMaterial.uniforms.uTexture, this.dye.read.attach(0))
    if (this.config.BLOOM) {
      gl.uniform1i(this.displayMaterial.uniforms.uBloom, this.bloom.attach(1))
      gl.uniform1i(this.displayMaterial.uniforms.uDithering, this.ditheringTexture.attach(2))
      gl.uniform2f(this.displayMaterial.uniforms.ditherScale, w / this.ditheringTexture.width, h / this.ditheringTexture.height)
    }
    if (this.config.SUNRAYS)
      gl.uniform1i(this.displayMaterial.uniforms.uSunrays, this.sunraysTemp.attach(3))
    this.blit(null)
  }

  // ---- Animation loop ----

  private update = () => {
    const dt = Math.min((Date.now() - this.lastUpdateTime) / 1000, 0.016666)
    this.lastUpdateTime = Date.now()

    if (this.resizeCanvas()) this.initFramebuffers()

    if (this.config.COLORFUL) {
      this.colorUpdateTimer += dt * this.config.COLOR_UPDATE_SPEED
      if (this.colorUpdateTimer >= 1) {
        this.colorUpdateTimer %= 1
        this.pointers.forEach(p => { p.color = this.generateColor() })
      }
    }

    if (this.splatStack.length > 0) this.multipleSplats(this.splatStack.pop()!)
    this.pointers.forEach(p => { if (p.moved) { p.moved = false; this.splatPointer(p) } })

    if (!this.config.PAUSED) this.step(dt)
    this.render()
    this.animationID = requestAnimationFrame(this.update)
  }

  // ---- Splat helpers ----

  private splat(x: number, y: number, dx: number, dy: number,
    color: { r: number; g: number; b: number }) {
    const gl = this.gl
    const ar = this.canvas.width / this.canvas.height
    const corrR = this.config.SPLAT_RADIUS / 100 * (ar > 1 ? ar : 1)

    this.splatProgram.bind()
    gl.viewport(0, 0, this.velocity.width, this.velocity.height)
    gl.uniform1i(this.splatProgram.uniforms.uTarget, this.velocity.read.attach(0))
    gl.uniform1f(this.splatProgram.uniforms.aspectRatio, ar)
    gl.uniform2f(this.splatProgram.uniforms.point, x, y)
    gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0)
    gl.uniform1f(this.splatProgram.uniforms.radius, corrR)
    this.blit(this.velocity.write.fbo); this.velocity.swap()

    gl.viewport(0, 0, this.dye.width, this.dye.height)
    gl.uniform1i(this.splatProgram.uniforms.uTarget, this.dye.read.attach(0))
    gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b)
    this.blit(this.dye.write.fbo); this.dye.swap()
  }

  private multipleSplats(amount: number) {
    for (let i = 0; i < amount; i++) {
      const c = this.generateColor()
      c.r *= 10; c.g *= 10; c.b *= 10
      this.splat(Math.random(), Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), c)
    }
  }

  private splatPointer(p: Pointer) {
    this.splat(p.texcoordX, p.texcoordY,
      p.deltaX * this.config.SPLAT_FORCE,
      p.deltaY * this.config.SPLAT_FORCE,
      p.color)
  }

  // ---- Helpers ----

  private resizeCanvas() {
    const dpr = window.devicePixelRatio || 1
    const w = Math.floor(this.canvas.clientWidth * dpr)
    const h = Math.floor(this.canvas.clientHeight * dpr)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h
      return true
    }
    return false
  }

  private generateColor() {
    const c = FluidBackground.HSVtoRGB(Math.random(), 1.0, 1.0)
    c.r *= 0.15; c.g *= 0.15; c.b *= 0.15
    return c
  }

  static HSVtoRGB(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0
    const i = Math.floor(h * 6), f = h * 6 - i,
      p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break
      case 1: r = q; g = v; b = p; break
      case 2: r = p; g = v; b = t; break
      case 3: r = p; g = q; b = v; break
      case 4: r = t; g = p; b = v; break
      case 5: r = v; g = p; b = q; break
    }
    return { r, g, b }
  }

  static hashCode(s: string) {
    let hash = 0
    for (let i = 0; i < s.length; i++) { hash = (hash << 5) - hash + s.charCodeAt(i); hash |= 0 }
    return hash
  }

  private isMobile() { return /Mobi|Android/i.test(navigator.userAgent) }

  private createPointer(): Pointer {
    return { id: -1, texcoordX: 0, texcoordY: 0, prevTexcoordX: 0, prevTexcoordY: 0,
      deltaX: 0, deltaY: 0, down: false, moved: false, color: { r: 30, g: 0, b: 300 } }
  }

  // ---- DOM Events ----

  private onMouseDown = (e: MouseEvent) => {
    const dpr = window.devicePixelRatio || 1
    const px = dpr * e.pageX, py = dpr * e.pageY
    const p = this.pointers[0]
    p.id = -1; p.down = true; p.moved = false
    p.texcoordX = px / this.canvas.width; p.texcoordY = 1 - py / this.canvas.height
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY
    p.deltaX = 0; p.deltaY = 0; p.color = this.generateColor()
  }

  private onMouseMove = (e: MouseEvent) => {
    const p = this.pointers[0]
    if (!p.down) return
    const dpr = window.devicePixelRatio || 1
    const px = dpr * e.pageX, py = dpr * e.pageY
    p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY
    p.texcoordX = px / this.canvas.width; p.texcoordY = 1 - py / this.canvas.height
    p.deltaX = p.texcoordX - p.prevTexcoordX
    p.deltaY = p.texcoordY - p.prevTexcoordY
    p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0
  }

  private onMouseUp = () => { this.pointers[0].down = false }

  private isCanvasHidden(): boolean {
    if (!this.canvas) return true
    // Check if any ancestor has display:none (v-show on parent component)
    if (this.canvas.offsetParent === null && getComputedStyle(this.canvas).display === 'none') return true
    // Also check visible dimensions — zero-size means hidden
    const rect = this.canvas.getBoundingClientRect()
    return rect.width === 0 && rect.height === 0
  }

  private onTouchStart = (e: TouchEvent) => {
    // Skip entirely if fluid canvas is not visible on screen
    if (this.isCanvasHidden()) return
    const target = e.target as HTMLElement | null
    // Skip touches on any element outside the intro page
    if (target && !target.closest('.content-intro')) return
    e.preventDefault()
    const dpr = window.devicePixelRatio || 1
    const touches = e.targetTouches
    while (touches.length >= this.pointers.length) this.pointers.push(this.createPointer())
    for (let i = 0; i < touches.length; i++) {
      const px = dpr * touches[i].pageX, py = dpr * touches[i].pageY
      const p = this.pointers[i + 1]
      p.id = touches[i].identifier; p.down = true; p.moved = false
      p.texcoordX = px / this.canvas.width; p.texcoordY = 1 - py / this.canvas.height
      p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY
      p.deltaX = 0; p.deltaY = 0; p.color = this.generateColor()
    }
  }

  private onTouchMove = (e: TouchEvent) => {
    // Skip entirely if fluid canvas is not visible on screen
    if (this.isCanvasHidden()) return
    const target = e.target as HTMLElement | null
    if (target && !target.closest('.content-intro')) return
    e.preventDefault()
    const dpr = window.devicePixelRatio || 1
    const touches = e.targetTouches
    for (let i = 0; i < touches.length; i++) {
      const p = this.pointers[i + 1]; if (!p.down) continue
      const px = dpr * touches[i].pageX, py = dpr * touches[i].pageY
      p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY
      p.texcoordX = px / this.canvas.width; p.texcoordY = 1 - py / this.canvas.height
      p.deltaX = p.texcoordX - p.prevTexcoordX
      p.deltaY = p.texcoordY - p.prevTexcoordY
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0
    }
  }

  private onTouchEnd = (e: TouchEvent) => {
    const touches = e.changedTouches
    for (let i = 0; i < touches.length; i++) {
      const p = this.pointers.find(p => p.id === touches[i].identifier)
      if (p) p.down = false
    }
  }

  // ---- Cleanup ----

  destroy() {
    if (this.animationID) cancelAnimationFrame(this.animationID)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('touchstart', this.onTouchStart)
    document.removeEventListener('touchmove', this.onTouchMove)
    document.removeEventListener('touchend', this.onTouchEnd)
  }
}
