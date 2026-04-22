<template>
  <div class="global-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 收起/展开按钮 -->
    <div class="sidebar-toggle" @click="toggleSidebarLocal">
      <Icon :type="isCollapsed ? 'ios-arrow-forward' : 'ios-arrow-back'" size="16" />
    </div>

    <!-- 菜单内容 -->
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
        <span class="menu-text">代码编辑器</span>
      </div>
    </div>

    <!-- AI Chat 面板 -->
    <div v-if="showAIChat" class="side-panel ai-panel">
      <div class="panel-header">
        <h3>星火 AI 助手</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="openFullscreen('ai')" title="全屏">
            <Icon type="ios-expand" />
          </Button>
          <Button type="text" size="small" @click="closeAIChat">
            <Icon type="ios-close" />
          </Button>
        </div>
      </div>
      <div class="panel-content">
        <div class="message-container" ref="aiMessageList">
          <div v-if="aiMessages.length === 0" class="welcome-section">
            <div class="welcome-icon">
              <img src="/static/pictures/xh.png" alt="星火" />
            </div>
            <h3>你好！我是星火 AI 助手</h3>
            <p>我可以帮你解答编程问题、算法思路、代码调试等各种技术问题</p>
          </div>
          <template v-else>
            <div v-for="(msg, idx) in aiMessages" :key="idx" :class="['message-item', msg.role]">
              <div class="message-avatar">
                <Avatar v-if="msg.role === 'user'" icon="ios-person" style="background: #2d8cf0" />
                <div v-else class="ai-avatar">
                  <img src="/static/pictures/xh.png" alt="星火" />
                </div>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ msg.role === 'user' ? '我' : '星火 AI' }}</span>
                </div>
                <div class="message-body">
                  <div v-if="msg.role === 'loading'" class="loading-indicator">
                    <Spin size="small" />
                    <span>AI 正在思考...</span>
                  </div>
                  <div v-else class="message-text" v-html="formatMessage(msg.content)"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="input-area">
          <Input v-model="aiInputText" type="textarea" :rows="3" :placeholder="aiMessages.length === 0 ? '输入你的问题开始对话...' : '输入你的问题...'" />
          <Button type="primary" long @click="sendAIMessage" :loading="aiSending" :disabled="!aiInputText.trim()">
            <Icon type="ios-send" /> 发送
          </Button>
        </div>
      </div>
    </div>

    <!-- 代码编辑器面板 -->
    <div v-if="showCodeEditor" class="side-panel editor-panel">
      <div class="panel-header">
        <h3>代码编辑器</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="openFullscreen('editor')" title="全屏">
            <Icon type="ios-expand" />
          </Button>
          <Button type="text" size="small" @click="closeCodeEditor">
            <Icon type="ios-close" />
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
        <div class="editor-actions">
          <Button type="primary" @click="runCode" :loading="runningCode">
            <Icon type="ios-play" /> 运行代码
          </Button>
          <Button @click="clearCode">
            <Icon type="ios-trash" /> 清空
          </Button>
        </div>
        <div v-if="runResult" class="run-result">
          <h4>运行结果</h4>
          <pre :class="runResult.error ? 'error' : 'success'">{{ runResult.output }}</pre>
        </div>
      </div>
    </div>

    <!-- 全屏弹窗 -->
    <Modal v-model="showFullscreen" :fullscreen="true" :closable="false" :mask-closable="false" class="fullscreen-modal">
      <div class="fullscreen-container">
        <div class="fullscreen-header">
          <h3>{{ fullscreenType === 'ai' ? '星火 AI 助手' : '代码编辑器' }}</h3>
          <Button type="text" size="large" @click="closeFullscreen">
            <Icon type="ios-close" size="24" />
          </Button>
        </div>

        <!-- 全屏 AI Chat -->
        <div v-if="fullscreenType === 'ai'" class="fullscreen-ai-chat">
          <div class="message-container" ref="fsAiMessageList">
            <div v-if="aiMessages.length === 0" class="welcome-section">
              <div class="welcome-icon">
                <img src="/static/pictures/xh.png" alt="星火" />
              </div>
              <h3>你好！我是星火 AI 助手</h3>
              <p>我可以帮你解答编程问题、算法思路、代码调试等各种技术问题</p>
            </div>
            <template v-else>
              <div v-for="(msg, idx) in aiMessages" :key="'fs-'+idx" :class="['message-item', msg.role]">
                <div class="message-avatar">
                  <Avatar v-if="msg.role === 'user'" icon="ios-person" style="background: #2d8cf0; width: 40px; height: 40px;" />
                  <div v-else class="ai-avatar">
                    <img src="/static/pictures/xh.png" alt="星火" />
                  </div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender-name">{{ msg.role === 'user' ? '我' : '星火 AI' }}</span>
                  </div>
                  <div class="message-body">
                    <div v-if="msg.role === 'loading'" class="loading-indicator">
                      <Spin size="large" />
                      <span>AI 正在思考...</span>
                    </div>
                    <div v-else class="message-text" v-html="formatMessage(msg.content)"></div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="input-area">
            <Input v-model="aiInputText" type="textarea" :rows="3" placeholder="输入你的问题..." />
            <Button type="primary" long @click="sendAIMessage" :loading="aiSending" :disabled="!aiInputText.trim()">
              <Icon type="ios-send" /> 发送
            </Button>
          </div>
        </div>

        <!-- 全屏代码编辑器 -->
        <div v-if="fullscreenType === 'editor'" class="fullscreen-editor">
          <div class="editor-controls">
            <Select v-model="editorLanguage" style="width: 140px;">
              <Option value="C++">C++</Option>
              <Option value="C">C</Option>
              <Option value="Java">Java</Option>
              <Option value="Python">Python</Option>
            </Select>
            <Select v-model="editorTheme" style="width: 140px;">
              <Option value="monokai">Monokai</Option>
              <Option value="solarized">Solarized</Option>
              <Option value="material">Material</Option>
            </Select>
          </div>
          <codemirror v-model="editorCode" :options="editorOptions" ref="fsCodeEditor" class="code-editor-fullscreen" />
          <div class="editor-actions">
            <Button type="primary" size="large" @click="runCode" :loading="runningCode">
              <Icon type="ios-play" /> 运行代码
            </Button>
            <Button size="large" @click="clearCode">
              <Icon type="ios-trash" /> 清空
            </Button>
          </div>
          <div v-if="runResult" class="run-result">
            <h4>运行结果</h4>
            <pre :class="runResult.error ? 'error' : 'success'">{{ runResult.output }}</pre>
          </div>
        </div>
      </div>
    </Modal>
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

      editorCode: '// 在这里编写代码\n',
      editorLanguage: 'C++',
      editorTheme: 'monokai',
      runningCode: false,
      runResult: null,

      showFullscreen: false,
      fullscreenType: ''
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
  methods: {
    ...mapActions(['toggleSidebar']),

    toggleSidebarLocal () {
      this.isCollapsed = !this.isCollapsed
      if (this.isCollapsed) {
        this.showAIChat = false
        this.showCodeEditor = false
      }
    },

    openAIChat () {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      this.showAIChat = !this.showAIChat
      if (this.showAIChat) {
        this.showCodeEditor = false
      }
    },

    openCodeEditor () {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
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
    },

    openFullscreen (type) {
      this.fullscreenType = type
      this.showFullscreen = true
    },

    closeFullscreen () {
      this.showFullscreen = false
    },

    async sendAIMessage () {
      const text = this.aiInputText.trim()
      if (!text || this.aiSending) return

      this.aiMessages.push({ role: 'user', content: text })
      this.aiInputText = ''
      this.aiSending = true

      this.aiMessages.push({ role: 'loading', content: 'AI正在思考...' })
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
          this.aiMessages.push({ role: 'assistant', content: data.reply || data.message || '无回复' })
        } else {
          this.aiMessages.push({ role: 'assistant', content: '请求失败，请稍后重试' })
        }
      } catch (e) {
        this.aiMessages.splice(this.aiMessages.length - 1, 1)
        this.aiMessages.push({ role: 'assistant', content: '网络错误，请检查网络连接' })
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

    runCode () {
      this.runningCode = true
      this.runResult = null

      const langMap = {
        'C++': 'cpp',
        'C': 'c',
        'Java': 'java',
        'Python': 'python'
      }

      fetch('/api/compiler/run/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: this.editorCode,
          language: langMap[this.editorLanguage] || 'cpp'
        })
      })
      .then(res => res.json())
      .then(data => {
        this.runResult = {
          output: data.output || data.result || '无输出',
          error: data.error || data.status !== 'success'
        }
      })
      .catch(err => {
        this.runResult = {
          output: '运行失败: ' + err.message,
          error: true
        }
      })
      .finally(() => {
        this.runningCode = false
      })
    },

    clearCode () {
      this.editorCode = '// 在这里编写代码\n'
      this.runResult = null
    }
  }
}
</script>

<style lang="less" scoped>
.global-sidebar {
  position: fixed;
  left: 16px;
  top: 50%;
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
  position: absolute;
  left: 180px;
  top: 50%;
  transform: translateY(-50%);
  width: 420px;
  max-height: 80vh;
  background: rgba(30, 30, 50, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  overflow: hidden;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

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

      button {
        color: rgba(255, 255, 255, 0.8);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

// AI Chat 面板
.ai-panel .message-container {
  flex: 1;
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

// 全屏弹窗样式
.fullscreen-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }

  button {
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  }
}

.fullscreen-ai-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .message-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    .welcome-section {
      text-align: center;
      padding: 60px 20px;

      .welcome-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
        overflow: hidden;

        img {
          width: 70%;
          height: 70%;
          object-fit: contain;
        }
      }

      h3 {
        font-size: 28px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 12px;
      }

      p {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        max-width: 500px;
        margin: 0 auto;
      }
    }

    .message-item {
      display: flex;
      gap: 14px;
      margin-bottom: 20px;
      animation: fadeIn 0.3s ease;

      &.user {
        flex-direction: row-reverse;

        .message-content {
          align-items: flex-end;

          .message-body {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 20px 20px 6px 20px;
          }
        }
      }

      &.assistant {
        .message-body {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px 20px 20px 6px;
        }
      }

      &.loading {
        .message-body {
          background: rgba(255, 247, 230, 0.1);
          border: 1px solid rgba(255, 213, 145, 0.2);
          border-radius: 20px 20px 20px 6px;
        }
      }
    }

    .message-avatar {
      flex-shrink: 0;

      .ai-avatar {
        width: 40px;
        height: 40px;
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
      max-width: 70%;

      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .sender-name {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }
      }

      .message-body {
        padding: 14px 18px;
        font-size: 15px;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.9);

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
        }

        .message-text {
          /deep/ pre {
            background: rgba(0, 0, 0, 0.3);
            padding: 14px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 8px 0;

            code {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
            }
          }

          /deep/ code {
            background: rgba(0, 0, 0, 0.3);
            padding: 3px 8px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
          }
        }
      }
    }
  }

  .input-area {
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    /deep/ .ivu-input {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
      color: rgba(255, 255, 255, 0.9) !important;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4) !important;
      }
    }

    .ivu-btn {
      margin-top: 10px;
    }
  }
}

.fullscreen-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow-y: auto;

  .editor-controls {
    display: flex;
    gap: 14px;
    margin-bottom: 16px;
  }

  .code-editor-fullscreen {
    /deep/ .CodeMirror {
      min-height: 500px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 15px;
    }
  }

  .editor-actions {
    display: flex;
    gap: 14px;
    margin-top: 16px;
  }

  .run-result {
    margin-top: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 10px;
    }

    pre {
      padding: 14px;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;

      &.success {
        background: rgba(25, 190, 107, 0.12);
        color: #19be6b;
        border: 1px solid rgba(25, 190, 107, 0.25);
      }

      &.error {
        background: rgba(237, 64, 20, 0.12);
        color: #ff6b6b;
        border: 1px solid rgba(237, 64, 20, 0.25);
      }
    }
  }
}
</style>
