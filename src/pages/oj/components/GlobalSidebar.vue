<template>
  <div class="global-sidebar-container">
    <!-- 侧边栏主体 -->
    <div class="global-sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-toggle" @click="toggleSidebarLocal">
        <Icon :type="isCollapsed ? 'ios-arrow-forward' : 'ios-arrow-back'" size="16" />
      </div>
      <div class="sidebar-content">
        <div class="menu-item" @click="openAIChat">
          <div class="menu-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <Icon type="chatbubble-working" size="18" color="#fff" />
          </div>
          <span class="menu-text">AI Chat</span>
        </div>
        <div class="menu-item" @click="openCodeEditor">
          <div class="menu-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
            <Icon type="ios-code" size="18" color="#fff" />
          </div>
          <span class="menu-text">{{ $t('m.Code_Editor') }}</span>
        </div>
      </div>
    </div>

    <!-- AI Chat 面板 -->
    <div
      v-if="showAIChat"
      class="side-panel ai-panel"
      :style="`
        left: ${aiPanelPos.x}px !important;
        top: ${aiPanelPos.y}px !important;
        width: ${aiPanelSize.w}px !important;
        height: ${aiPanelSize.h}px !important;
      `"
    >
      <div class="panel-header" @mousedown="startDrag($event, 'ai')">
        <h3>{{ $t('m.Spark_AI_Assistant') }}</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="openFullscreen('ai')" :title="$t('m.Fullscreen')">
            <Icon type="ios-expand" size="16" color="#fff" />
          </Button>
          <Button type="text" size="small" @click="closeAIChat">
            <Icon type="ios-close" size="16" color="#fff" />
          </Button>
        </div>
      </div>
      <div class="panel-content">
        <div class="message-container" ref="aiMessageList">
          <div v-if="aiMessages.length === 0" class="welcome-section">
            <div class="welcome-icon">
              <img src="/static/pictures/xh.png" :alt="$t('m.Spark_AI')" />
            </div>
            <h3>{{ $t('m.Hello_I_Am_Spark_AI') }}</h3>
            <p>{{ $t('m.Spark_AI_Description') }}</p>
          </div>
          <template v-else>
            <div v-for="(msg, idx) in aiMessages" :key="idx" :class="['message-item', msg.role]">
              <div class="message-avatar">
                <Avatar v-if="msg.role === 'user'" icon="ios-person" style="background: #2d8cf0" />
                <div v-else class="ai-avatar">
                  <img src="/static/pictures/xh.png" :alt="$t('m.Spark_AI')" />
                </div>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ msg.role === 'user' ? $t('m.Me') : $t('m.Spark_AI') }}</span>
                </div>
                <div class="message-body">
                  <div v-if="msg.role === 'loading'" class="loading-indicator">
                    <Spin size="small" />
                    <span>{{ $t('m.AI_Thinking') }}</span>
                  </div>
                  <div v-else class="message-text" v-html="formatMessage(msg.content)"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="input-area">
          <Input v-model="aiInputText" type="textarea" :rows="3" :placeholder="aiMessages.length === 0 ? $t('m.Enter_Your_Question_Start') : $t('m.Enter_Your_Question')" />
          <Button type="primary" long @click="sendAIMessage" :loading="aiSending" :disabled="!aiInputText.trim()">
            <Icon type="ios-send" /> {{ $t('m.Send') }}
          </Button>
        </div>
      </div>
      <div class="resize-handle resize-right" @mousedown="startResize($event, 'ai', 'right')"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize($event, 'ai', 'bottom')"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize($event, 'ai', 'corner')"></div>
    </div>

    <!-- 代码编辑器面板 -->
    <div
      v-if="showCodeEditor"
      class="side-panel editor-panel"
      :style="`
        left: ${editorPanelPos.x}px !important;
        top: ${editorPanelPos.y}px !important;
        width: ${editorPanelSize.w}px !important;
        height: ${editorPanelSize.h}px !important;
      `"
    >
      <div class="panel-header" @mousedown="startDrag($event, 'editor')">
        <h3>{{ $t('m.Code_Editor') }}</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="openFullscreen('editor')" :title="$t('m.Fullscreen')">
            <Icon type="ios-expand" size="16" color="#fff" />
          </Button>
          <Button type="text" size="small" @click="closeCodeEditor">
            <Icon type="ios-close" size="16" color="#fff" />
          </Button>
        </div>
      </div>
      <div class="panel-content">
        <div class="editor-controls">
          <Select v-model="editorLanguage" style="width: 120px;">
            <Option value="C++">C++</Option>
            <Option value="C">C</Option>
            <Option value="Java">Java</Option>
            <Option value="Python">Python</Option>
          </Select>
          <Select v-model="editorTheme" style="width: 120px;">
            <Option value="monokai">Monokai</Option>
            <Option value="solarized">Solarized</Option>
            <Option value="material">Material</Option>
          </Select>
        </div>
        <codemirror v-model="editorCode" :options="editorOptions" ref="codeEditor" class="code-editor" />
        <div class="editor-input-area">
          <label>Input (stdin)</label>
          <Input v-model="editorInput" type="textarea" :rows="2" placeholder="输入你的测试数据..." />
        </div>
        <div class="editor-actions">
          <Button type="primary" @click="runCode" :loading="runningCode">
            <Icon type="ios-play" /> {{ $t('m.Run_Code') }}
          </Button>
          <Button @click="clearCode">
            <Icon type="ios-trash" /> {{ $t('m.Clear') }}
          </Button>
        </div>
        <div v-if="runResult" class="run-result">
          <h4>{{ $t('m.Run_Result') }}</h4>
          <pre :class="runResult.error ? 'error' : 'success'">{{ runResult.output }}</pre>
        </div>
      </div>
      <div class="resize-handle resize-right" @mousedown="startResize($event, 'editor', 'right')"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize($event, 'editor', 'bottom')"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize($event, 'editor', 'corner')"></div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { codemirror } from 'vue-codemirror-lite'

import 'codemirror/theme/monokai.css'
import 'codemirror/theme/solarized.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/javascript/javascript.js'

export default {
  name: 'GlobalSidebar',
  components: {
    codemirror
  },
  data () {
    return {
      showAIChat: false,
      showCodeEditor: false,

      aiMessages: [],
      aiInputText: '',
      aiSending: false,
      aiPanelPos: { x: 180, y: 80 },
      aiPanelSize: { w: 380, h: 520 },

      editorCode: this.$t('m.Write_Code_Here'),
      editorLanguage: 'C++',
      editorTheme: 'monokai',
      runningCode: false,
      runResult: null,
      editorPanelPos: { x: 180, y: 80 },
      editorPanelSize: { w: 380, h: 520 },

      dragging: null,
      dragStart: { x: 0, y: 0, panelX: 0, panelY: 0 },
      resizing: null,
      resizeStart: { x: 0, y: 0, w: 0, h: 0 },

      pollingTimer: null,
      pollingTimeout: null,

      editorInput: '',   // 新增：用户输入
    }
  },
  computed: {
    ...mapState(['sidebarCollapsed']),
    isCollapsed: {
      get () {
        return this.sidebarCollapsed
      },
      set (val) {
        this.toggleSidebar({ collapsed: val })
      }
    },
    editorOptions () {
      const modeMap = {
        'C++': 'text/x-csrc',
        'C': 'text/x-csrc',
        'Java': 'text/x-java',
        'Python': 'text/x-python'
      }
      return {
        tabSize: 4,
        mode: modeMap[this.editorLanguage] || 'text/x-csrc',
        theme: this.editorTheme,
        lineNumbers: true,
        line: true,
        lineWrapping: true,
        styleSelectedText: true
      }
    }
  },
  beforeDestroy () {
    this.clearPollingTimer()
  },
  methods: {
    ...mapActions(['toggleSidebar']),

    clearPollingTimer () {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
      if (this.pollingTimeout) {
        clearTimeout(this.pollingTimeout)
        this.pollingTimeout = null
      }
    },

    toggleSidebarLocal () {
      this.isCollapsed = !this.isCollapsed
      if (this.isCollapsed) {
        this.showAIChat = false
        this.showCodeEditor = false
      }
    },

    openAIChat() {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      this.aiPanelPos = { x: 180, y: 80 }
      this.aiPanelSize = { w: 380, h: 520 }
      this.showAIChat = !this.showAIChat
      if (this.showAIChat) {
        this.showCodeEditor = false
      }
    },

    openCodeEditor() {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      this.editorPanelPos = { x: 180, y: 80 }
      this.editorPanelSize = { w: 380, h: 520 }
      this.showCodeEditor = !this.showCodeEditor
      if (this.showCodeEditor) {
        this.showAIChat = false
      }
    },

    closeAIChat () {
      this.showAIChat = false
    },

    closeCodeEditor () {
      this.showCodeEditor = false
      this.clearPollingTimer()
      this.runningCode = false
    },

    clearCode () {
      this.editorCode = this.$t('m.Write_Code_Here')
      this.editorInput = ''
      this.runResult = null
      this.clearPollingTimer()
      this.runningCode = false
    },

    openFullscreen (type) {
      if (type === 'ai') {
        this.closeAIChat()
        this.$router.push({ name: 'ai-chat-fullscreen' })
      } else if (type === 'editor') {
        this.closeCodeEditor()
        this.$router.push({ name: 'code-editor-fullscreen' })
      }
    },

    async sendAIMessage () {
      const text = this.aiInputText.trim()
      if (!text || this.aiSending) return

      this.aiMessages.push({ role: 'user', content: text })
      this.aiInputText = ''
      this.aiSending = true

      this.aiMessages.push({ role: 'loading', content: this.$t('m.AI_Thinking_Text') })
      this.scrollToBottom()

      try {
        const response = await fetch('/api/spark/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        })

        this.aiMessages.splice(this.aiMessages.length - 1, 1)

        if (response.ok) {
          const data = await response.json()
          this.aiMessages.push({ role: 'assistant', content: data.answer || data.reply || data.message || this.$t('m.No_Reply') })
        } else {
          this.aiMessages.push({ role: 'assistant', content: this.$t('m.Request_Failed') })
        }
      } catch (e) {
        this.aiMessages.splice(this.aiMessages.length - 1, 1)
        this.aiMessages.push({ role: 'assistant', content: this.$t('m.Network_Error_Text') })
      } finally {
        this.aiSending = false
        this.scrollToBottom()
      }
    },

    scrollToBottom () {
      this.$nextTick(() => {
        const list = this.$refs.aiMessageList || this.$refs.fsAiMessageList
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
    },

    formatMessage (content) {
      return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    },

    startDrag (e, panel) {
      if (e.target.closest('.panel-actions')) return
      e.preventDefault()
      const pos = panel === 'ai' ? this.aiPanelPos : this.editorPanelPos
      this.dragging = panel
      this.dragStart = { x: e.clientX, y: e.clientY, panelX: pos.x, panelY: pos.y }
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    onDrag (e) {
      if (!this.dragging) return
      const dx = e.clientX - this.dragStart.x
      const dy = e.clientY - this.dragStart.y
      const pos = this.dragging === 'ai' ? this.aiPanelPos : this.editorPanelPos
      pos.x = Math.max(0, this.dragStart.panelX + dx)
      pos.y = Math.max(0, this.dragStart.panelY + dy)
    },

    stopDrag () {
      this.dragging = null
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },

    startResize (e, panel, direction) {
      e.preventDefault()
      e.stopPropagation()
      const size = panel === 'ai' ? this.aiPanelSize : this.editorPanelSize
      const pos = panel === 'ai' ? this.aiPanelPos : this.editorPanelPos
      this.resizing = { panel, direction }
      this.resizeStart = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, left: pos.x, top: pos.y }
      document.addEventListener('mousemove', this.onResize)
      document.addEventListener('mouseup', this.stopResize)
    },

    onResize (e) {
      if (!this.resizing) return
      const { panel, direction } = this.resizing
      const size = panel === 'ai' ? this.aiPanelSize : this.editorPanelSize
      const pos = panel === 'ai' ? this.aiPanelPos : this.editorPanelPos
      const dx = e.clientX - this.resizeStart.x
      const dy = e.clientY - this.resizeStart.y
      const minWidth = 300
      const minHeight = 300

      if (direction === 'right' || direction === 'corner') {
        size.w = Math.max(minWidth, this.resizeStart.w + dx)
      }
      if (direction === 'bottom' || direction === 'corner') {
        size.h = Math.max(minHeight, this.resizeStart.h + dy)
      }
    },

    stopResize () {
      this.resizing = null
      document.removeEventListener('mousemove', this.onResize)
      document.removeEventListener('mouseup', this.stopResize)
    },

    runCode () {
      if (this.runningCode) return
      this.runningCode = true
      this.runResult = null

      const langMap = {
        'C++': 'C++',
        'C': 'C',
        'Java': 'Java',
        'Python': 'Python3',   // 必须与后端 SysOptions.languages 中的名称一致
        'JavaScript': 'JavaScript',
        'Go': 'Go'
      }
      const language = langMap[this.editorLanguage] || 'C++'
      const code = this.editorCode
      const input = this.editorInput

      fetch('/api/code_run/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        body: JSON.stringify({ language, code, input })  // input 字段即使后端暂不用，可保留
      })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(data => {
        if (data.error) {
          this.runResult = { output: data.error, error: true }
          this.runningCode = false
          return
        }
        const codeRunId = data.data.code_run_id
        this.pollResult(codeRunId)
      })
      .catch(err => {
        this.runResult = {
          output: err.message || this.$t('m.Run_Failed'),
          error: true
        }
        this.runningCode = false
      })
    },

pollResult (codeRunId) {
  this.clearPollingTimer()

  let retryCount = 0
  const maxRetries = 3

  this.pollingTimer = setInterval(() => {
    fetch(`/api/code_run/?id=${codeRunId}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(res => {
        retryCount = 0
        const data = res.data
        if (data.result === 6 || data.result === 7) {
          return
        }

        this.clearPollingTimer()
        this.runningCode = false

        const statisticInfo = data.statistic_info || {}

        if (data.result === 0) {
          const output = statisticInfo.output || 'No output'
          this.runResult = { output, error: false }
        } else if (data.result === -2) {
          const errInfo = statisticInfo.err_info || 'Compile Error'
          this.runResult = { output: errInfo, error: true }
        } else {
          const errInfo = statisticInfo.err_info || ('Error code: ' + data.result)
          this.runResult = { output: errInfo, error: true }
        }
      })
      .catch(() => {
        retryCount++
        if (retryCount >= maxRetries) {
          this.clearPollingTimer()
          this.runningCode = false
          this.runResult = { output: this.$t('m.Network_Error_Text'), error: true }
        }
      })
  }, 500)

  this.pollingTimeout = setTimeout(() => {
    if (this.pollingTimer) {
      this.clearPollingTimer()
      this.runningCode = false
      this.runResult = { output: this.$t('m.Timeout'), error: true }
    }
  }, 20000)
},

    pollResult (codeRunId) {
      this.clearPollingTimer()

      let retryCount = 0
      const maxRetries = 3

      this.pollingTimer = setInterval(() => {
        fetch(`/api/code_run/?id=${codeRunId}`)
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok')
            return res.json()
          })
          .then(res => {
            retryCount = 0
            const data = res.data
            if (data.result === 6 || data.result === 7) {
              return
            }

            this.clearPollingTimer()
            this.runningCode = false

            const statisticInfo = data.statistic_info || {}

            if (data.result === 0) {
              const output = statisticInfo.output || 'No output'
              this.runResult = { output, error: false }
            } else if (data.result === -2) {
              const errInfo = statisticInfo.err_info || 'Compile Error'
              this.runResult = { output: errInfo, error: true }
            } else {
              const errInfo = statisticInfo.err_info || ('Error code: ' + data.result)
              this.runResult = { output: errInfo, error: true }
            }
          })
          .catch(() => {
            retryCount++
            if (retryCount >= maxRetries) {
              this.clearPollingTimer()
              this.runningCode = false
              this.runResult = { output: this.$t('m.Network_Error_Text'), error: true }
            }
          })
      }, 500)

      this.pollingTimeout = setTimeout(() => {
        if (this.pollingTimer) {
          this.clearPollingTimer()
          this.runningCode = false
          this.runResult = { output: this.$t('m.Timeout'), error: true }
        }
      }, 20000)
    },

    getCsrfToken () {
      const name = 'csrftoken'
      let cookieValue = null
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim()
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
            break
          }
        }
      }
      return cookieValue || ''
    }
  }
}
</script>

<style lang="less" scoped>
.global-sidebar {
  position: fixed;
  left: 16px;
  top: 70%;
  transform: translateY(-50%);
  width: 160px;
  background: rgba(30, 30, 50, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 999;
  transition: all 0.3s ease;
  overflow: visible;
  padding: 12px 8px;

  &.collapsed {
    width: 52px;
    padding: 12px 6px;

    .sidebar-content {
      opacity: 0;
      pointer-events: none;
    }

    .side-panel {
      display: none;
    }
  }
}

.sidebar-toggle {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: rgba(30, 30, 50, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.9);

  &:hover {
    background: rgba(30, 30, 50, 0.9);
    transform: translateY(-50%) scale(1.1);
  }
}

.sidebar-content {
  opacity: 1;
  transition: opacity 0.2s ease;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .menu-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .menu-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    white-space: nowrap;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

// 侧边面板
.side-panel {
  position: fixed !important;
  max-height: none !important;
  min-height: 0 !important;
  background: rgba(30, 30, 50, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex !important;
  flex-direction: column !important;
  z-index: 10000;
  animation: slideIn 0.3s ease;
  pointer-events: auto;
  user-select: none;
  box-sizing: border-box;
  overflow: visible !important;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px 20px 0 0;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    overflow: visible;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      position: relative;
      z-index: 10;

      button {
        color: rgba(255, 255, 255, 0.9) !important;
        width: 28px;
        height: 28px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;

        i {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.25) !important;

          i {
            color: white !important;
          }
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    box-sizing: border-box;
    border-radius: 0 0 20px 20px;
  }
}

// 拖拽调整大小手柄
.resize-handle {
  position: absolute;
  z-index: 1001;

  &.resize-right {
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
  }

  &.resize-bottom {
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: ns-resize;
  }

  &.resize-corner {
    bottom: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// AI Chat 面板
.ai-panel .message-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .welcome-section {
    text-align: center;
    padding: 20px 10px;

    .welcome-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
      overflow: hidden;

      img {
        width: 70%;
        height: 70%;
        object-fit: contain;
      }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 6px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 16px;
    }
  }

  .message-item {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    animation: fadeIn 0.3s ease;

    &.user {
      flex-direction: row-reverse;

      .message-content {
        align-items: flex-end;

        .message-body {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 16px 16px 4px 16px;
        }
      }
    }

    &.assistant {
      .message-body {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px 16px 16px 4px;
      }
    }

    &.loading {
      .message-body {
        background: rgba(255, 247, 230, 0.2);
        border: 1px solid rgba(255, 213, 145, 0.3);
        border-radius: 16px 16px 16px 4px;
      }
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-avatar {
    flex-shrink: 0;

    .ai-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 70%;
        height: 70%;
        object-fit: contain;
      }
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 75%;

    .message-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .sender-name {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .message-body {
      padding: 10px 14px;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.8);
      }

      .message-text {
        /deep/ pre {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 6px 0;

          code {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.9);
          }
        }

        /deep/ code {
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }
}

.input-area {
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  /deep/ .ivu-input {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.9) !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  }

  .ivu-btn {
    margin-top: 8px;
  }
}

// 代码编辑器面板
.editor-panel {
  .panel-content {
    padding: 14px;
    overflow-y: auto;
  }

  .editor-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .code-editor {
    /deep/ .CodeMirror {
      min-height: 280px;
      max-height: 450px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
  }

  .editor-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
  }

  .run-result {
    margin-top: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    h4 {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 8px;
    }

    pre {
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 180px;
      overflow-y: auto;

      &.success {
        background: rgba(25, 190, 107, 0.15);
        color: #19be6b;
        border: 1px solid rgba(25, 190, 107, 0.3);
      }

      &.error {
        background: rgba(237, 64, 20, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(237, 64, 20, 0.3);
      }
    }
  }
}

.editor-input-area {
  margin-top: 12px;
  label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 4px;
    display: block;
  }
  /deep/ .ivu-input {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    &::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  }
}
</style>