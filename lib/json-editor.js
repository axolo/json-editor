const template = document.createElement('template')

template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    }

    :host([theme="dark"]) .editor-wrapper,
    :host([theme="system"]) .editor-wrapper {
      --border-color: #475569;
      --border-color-focus: #667eea;
      --border-color-error: #ef4444;
      --bg-color: #1e293b;
      --bg-color-line-numbers: #0f172a;
      --text-color: #e2e8f0;
      --text-color-line-numbers: #64748b;
      --border-line-numbers: #334155;
      --error-bg: #1c1917;
      --error-border: #7c2d12;
      --error-text: #fca5a5;
      --focus-glow: rgba(102, 126, 234, 0.2);
      --error-glow: rgba(239, 68, 68, 0.2);
      --font-size: 13px;
      --line-height: 1.5;
    }

    :host(:not([theme="dark"]):not([theme="system"])) .editor-wrapper,
    :host([theme="light"]) .editor-wrapper {
      --border-color: #e5e7eb;
      --border-color-focus: #667eea;
      --border-color-error: #ef4444;
      --bg-color: #ffffff;
      --bg-color-line-numbers: #f8fafc;
      --text-color: #1e293b;
      --text-color-line-numbers: #94a3b8;
      --border-line-numbers: #e2e8f0;
      --error-bg: #fef2f2;
      --error-border: #fee2e2;
      --error-text: #dc2626;
      --focus-glow: rgba(102, 126, 234, 0.1);
      --error-glow: rgba(239, 68, 68, 0.1);
      --font-size: 14px;
      --line-height: 1.5;
    }

    .editor-wrapper {
      position: relative;
      border-radius: 0.5em;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background-color: var(--bg-color);
      transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    }

    .editor-wrapper:focus-within {
      border-color: var(--border-color-focus);
    }

    .editor-wrapper.error {
      border-color: var(--border-color-error);
    }

    .editor-container {
      display: flex;
      min-height: 10em;
      max-height: 25em;
      overflow: auto;
    }

    .line-numbers {
      background-color: var(--bg-color-line-numbers);
      color: var(--text-color-line-numbers);
      padding: 10px 8px;
      text-align: right;
      user-select: none;
      font-size: var(--font-size);
      line-height: var(--line-height);
      min-width: 2em;
      overflow-y: auto;
      border-right: 1px solid var(--border-line-numbers);
      flex-shrink: 0;
      transition: background-color 0.2s, color 0.2s;
    }

    .line-numbers span {
      display: block;
    }

    .line-numbers .error-line {
      background-color: var(--error-bg);
      color: var(--error-text);
      font-weight: bold;
      border-radius: 2px;
    }

    .code-area {
      flex: 1;
      position: relative;
    }

    .code-text {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 10px;
      box-sizing: border-box;
      font-size: var(--font-size);
      line-height: var(--line-height);
      resize: none;
      border: 0;
      outline: 0;
      background-color: transparent;
      color: var(--text-color);
      font-family: inherit;
      tab-size: 2;
      transition: color 0.2s;
    }

    .code-text:focus {
      border: 0;
      outline: 0;
      box-shadow: none;
    }

    .code-text::placeholder {
      color: var(--text-color-line-numbers);
    }

    .error-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: var(--error-bg);
      color: var(--error-text);
      font-size: 12px;
      border-top: 1px solid var(--error-border);
    }

    .error-hint svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
  </style>

  <div class="editor-wrapper">
    <div class="editor-container">
      <div class="line-numbers" id="line-numbers"></div>
      <div class="code-area">
        <textarea
          class="code-text"
          id="code-input"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
    <div class="error-hint" id="error-hint" style="display: none;">
      <span id="error-message"></span>
    </div>
  </div>
`

const error = text => {
  try {
    JSON.parse(text)
  } catch (err) {
    err.name = 'JsonError'
    return err
  }
}

const getErrorLine = (err, text) => {
  if (!err || !err.message) return null
  const match = err.message.match(/at position (\d+)/)
  if (match) {
    const pos = parseInt(match[1], 10)
    const lines = text.substring(0, pos).split('\n')
    return lines.length
  }
  return null
}

class JsonEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this.codeInput = this.shadowRoot.getElementById('code-input')
    this.lineNumbers = this.shadowRoot.getElementById('line-numbers')
    this.errorHint = this.shadowRoot.getElementById('error-hint')
    this.errorMessage = this.shadowRoot.getElementById('error-message')
    this.editorWrapper = this.shadowRoot.querySelector('.editor-wrapper')

    this._value = ''
    this._displayValue = ''
    this.formatTimeout = null

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.codeInput.addEventListener('input', this.handleInput.bind(this))
    this.codeInput.addEventListener('scroll', this.handleScroll.bind(this))
    this.codeInput.addEventListener('keydown', this.handleKeydown.bind(this))
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cursorPos = this.codeInput.selectionStart
      const textBefore = this.codeInput.value.substring(0, cursorPos)
      const textAfter = this.codeInput.value.substring(cursorPos)

      const lastNewline = textBefore.lastIndexOf('\n')
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
      const currentLine = textBefore.substring(lineStart)
      const indent = currentLine.match(/^\s*/)[0]

      const newText = textBefore + '\n' + indent + textAfter
      this.codeInput.value = newText
      const newCursorPos = cursorPos + 1 + indent.length
      this.codeInput.setSelectionRange(newCursorPos, newCursorPos)
      this._displayValue = newText
      this.updateLineNumbers()
      this.validateAndUpdate()
      this.dispatchChangeEvent()
    }
  }

  handleInput() {
    const inputValue = this.codeInput.value

    if (this.formatTimeout) {
      clearTimeout(this.formatTimeout)
    }

    this.formatTimeout = setTimeout(() => {
      this.autoFormat(inputValue)
    }, 300)

    this._displayValue = inputValue
    this.updateLineNumbers()
    this.validateAndUpdate()
    this.dispatchChangeEvent()
  }

  autoFormat(inputValue) {
    if (!inputValue.trim()) {
      return
    }

    try {
      const parsed = JSON.parse(inputValue)
      const formatted = JSON.stringify(parsed, null, 2)

      if (formatted !== this.codeInput.value) {
        const cursorPos = this.codeInput.selectionStart
        const linesBefore = this.codeInput.value.split('\n')
        const linesAfter = formatted.split('\n')

        const currentLineIndex = linesBefore.findIndex((_, i) => {
          const lineEnd = linesBefore.slice(0, i + 1).reduce((acc, line) => acc + line.length + 1, 0)
          return cursorPos < lineEnd
        })

        const currentLineContent = linesBefore[currentLineIndex] || ''
        const cursorOffsetInLine = cursorPos - linesBefore.slice(0, currentLineIndex).reduce((acc, line) => acc + line.length + 1, 0)

        this._displayValue = formatted
        this.codeInput.value = formatted

        const targetLine = linesAfter[currentLineIndex] || linesAfter[linesAfter.length - 1]
        const newLineIndex = Math.min(currentLineIndex, linesAfter.length - 1)

        let newCursorPos = 0
        for (let i = 0; i < newLineIndex; i++) {
          newCursorPos += linesAfter[i].length + 1
        }

        const charAtCursor = currentLineContent[cursorOffsetInLine]
        if (charAtCursor && !/\s/.test(charAtCursor)) {
          const targetLineContent = linesAfter[newLineIndex]
          let targetOffset = cursorOffsetInLine
          if (targetLineContent) {
            const trimmedBefore = currentLineContent.substring(0, cursorOffsetInLine).trimEnd()
            const trimmedLen = trimmedBefore.length
            const targetTrimmedStart = targetLineContent.indexOf(trimmedBefore)
            if (targetTrimmedStart !== -1) {
              targetOffset = targetTrimmedStart + trimmedLen
            } else {
              targetOffset = Math.min(cursorOffsetInLine + (targetLineContent.length - currentLineContent.length), targetLineContent.length)
            }
          }
          newCursorPos += Math.min(targetOffset, targetLine.length)
        } else {
          newCursorPos += Math.min(cursorOffsetInLine + (targetLine.length - currentLineContent.length), targetLine.length)
        }

        newCursorPos = Math.min(newCursorPos, formatted.length)
        this.codeInput.setSelectionRange(newCursorPos, newCursorPos)
        this.updateLineNumbers()
      }
    } catch {
      // Invalid JSON, keep original input
    }
  }

  handleScroll() {
    this.lineNumbers.scrollTop = this.codeInput.scrollTop
  }

  updateLineNumbers(errorLine) {
    const lines = this.codeInput.value.split('\n')
    this.lineNumbers.innerHTML = lines.map((_, i) => {
      const n = i + 1
      const cls = n === errorLine ? ' class="error-line"' : ''
      return `<span${cls}>${n}</span>`
    }).join('')
  }

  validateAndUpdate() {
    if (!this._displayValue.trim()) {
      this.editorWrapper.classList.remove('error')
      this.hideError()
      this.updateLineNumbers()
      return
    }

    const err = error(this._displayValue)

    if (err) {
      const errorLine = getErrorLine(err, this._displayValue)
      this.editorWrapper.classList.add('error')
      this.showError(err.message)
      this.dispatchErrorEvent(err.message)
      this.updateLineNumbers(errorLine)
      return
    }

    this.editorWrapper.classList.remove('error')
    this.hideError()
    this.updateLineNumbers()
  }

  dispatchErrorEvent(error) {
    const event = new CustomEvent('error', {
      detail: error,
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(event)
    if (this._onErrorHandler) {
      this._onErrorHandler({ detail: error })
    }
  }

  showError(message) {
    if (this.verbose) {
      this.errorMessage.textContent = message
      this.errorHint.style.display = 'flex'
    }
  }

  hideError() {
    this.errorHint.style.display = 'none'
    this.errorMessage.textContent = ''
  }

  dispatchChangeEvent() {
    const event = new CustomEvent('change', {
      detail: this.value,
      bubbles: true,
      composed: true
    })
    this.dispatchEvent(event)
    if (this._onChangeHandler) {
      this._onChangeHandler({ detail: this.value })
    }
  }

  get value() {
    if (!this._displayValue.trim()) {
      return ''
    }
    try {
      const parsed = JSON.parse(this._displayValue)
      return JSON.stringify(parsed)
    } catch {
      return this._displayValue
    }
  }

  set value(newValue) {
    this._displayValue = newValue || ''
    if (this._displayValue.trim()) {
      try {
        const parsed = JSON.parse(this._displayValue)
        this.codeInput.value = JSON.stringify(parsed, null, 2)
      } catch {
        this.codeInput.value = this._displayValue
      }
    } else {
      this.codeInput.value = ''
    }
    this.updateLineNumbers()
    this.validateAndUpdate()
  }

  get parsedValue() {
    try {
      return JSON.parse(this._displayValue)
    } catch {
      return null
    }
  }

  static get observedAttributes() {
    return ['value', 'theme', 'placeholder', 'verbose', 'onchange', 'onerror']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      this.value = newValue
    } else if (name === 'theme') {
      this.updateTheme(newValue)
    } else if (name === 'placeholder') {
      this.updatePlaceholder(newValue)
    } else if (name === 'verbose') {
      this.validateAndUpdate()
    } else if (name === 'onchange' && newValue) {
      this._onChangeHandler = new Function('event', newValue)
    } else if (name === 'onerror' && newValue) {
      this._onErrorHandler = new Function('event', newValue)
    }
  }

  connectedCallback() {
    if (!this.hasAttribute('value')) {
      this.value = ''
    }
    this.updateLineNumbers()

    const theme = this.getAttribute('theme') || 'system'
    this.updateTheme(theme)

    const placeholder = this.getAttribute('placeholder') || 'Enter JSON...'
    this.updatePlaceholder(placeholder)
  }

  get theme() {
    return this.getAttribute('theme') || 'system'
  }

  get placeholder() {
    return this.getAttribute('placeholder') || 'Enter JSON...'
  }

  set placeholder(newValue) {
    this.setAttribute('placeholder', newValue)
  }

  updatePlaceholder(placeholder) {
    if (this.codeInput) {
      this.codeInput.placeholder = placeholder || 'Enter JSON ...'
    }
  }

  set theme(newValue) {
    this.setAttribute('theme', newValue)
  }

  get verbose() {
    return this.hasAttribute('verbose')
  }

  set verbose(newValue) {
    if (newValue) {
      this.setAttribute('verbose', '')
    } else {
      this.removeAttribute('verbose')
    }
  }

  updateTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const targetTheme = prefersDark ? 'dark' : 'light'
      if (this.getAttribute('theme') !== targetTheme) {
        this.setAttribute('theme', targetTheme)
      }

      if (!this._themeMediaListener) {
        this._themeMediaListener = (e) => {
          if (this.getAttribute('theme') === 'dark' || this.getAttribute('theme') === 'light') {
            return
          }
          this.setAttribute('theme', e.matches ? 'dark' : 'light')
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this._themeMediaListener)
      }
    } else {
      if (this.getAttribute('theme') !== theme) {
        this.setAttribute('theme', theme)
      }
    }
  }
}

customElements.define('json-editor', JsonEditor)

export default JsonEditor
