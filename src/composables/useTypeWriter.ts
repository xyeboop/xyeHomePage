/**
 * 打字机效果的 composable
 * 用法：await typeText(el, 'Hello World', 50)
 */
export function useTypeWriter() {
  /**
   * 逐字打印文本到目标元素
   * @returns Promise，打字完成时 resolve
   */
  function typeText(
    el: HTMLElement | null,
    text: string,
    speed: number = 50
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!el) return resolve()
      el.textContent = ''
      let i = 0
      const timer = setInterval(() => {
        if (i < text.length) {
          el.textContent += text[i]
          i++
          // 空格处稍作停顿，模拟自然打字节奏
          if (text[i - 1] === ' ') {
            clearInterval(timer)
            setTimeout(() => {
              const next = setInterval(() => {
                if (i < text.length) {
                  el.textContent += text[i]
                  i++
                } else {
                  clearInterval(next)
                  resolve()
                }
              }, speed)
            }, speed * 2)
          }
        } else {
          clearInterval(timer)
          resolve()
        }
      }, speed)
    })
  }

  /** 简单的延迟 Promise */
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  return { typeText, sleep }
}
