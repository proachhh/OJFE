<template>
  <div>
    <!-- 浮动按钮 -->
    <div 
      v-show="!windowVisible"
      class="ai-float-button"
      @click="openWindow"
    >
      <Icon type="chatbubble-working" size="24" />
    </div>

    <!-- 浮动窗口 -->
    <div 
      v-show="windowVisible"
      class="ai-chat-window"
      :class="{ 'fullscreen': isFullscreen }"
      :style="windowStyle"
    >
      <!-- 窗口头部 -->
      <div class="window-header" @mousedown="startDrag">
        <div class="header-left">
          <img src="/static/pictures/xh.png" alt="星火" class="header-avatar" />
          <span class="header-title">星火 AI 助手</span>
        </div>
        <div class="header-actions">
          <Button 
            type="text" 
            size="small" 
            @click="toggleFullscreen"
            class="action-btn"
          >
            <Icon :type="isFullscreen ? 'ios-contract' : 'ios-expand'" />
          </Button>
          <Button 
            type="text" 
            size="small" 
            @click="closeWindow"
            class="action-btn"
          >
            <Icon type="ios-close" />
          </Button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="message-container" ref="messageList">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-icon">
            <img src="/static/pictures/xh.png" alt="星火" />
          </div>
          <h3>你好！我是星火 AI 助手</h3>
          <p>我可以帮你解答编程问题、算法思路、代码调试等各种技术问题</p>
          <div class="quick-questions">
            <div 
              v-for="(question, idx) in quickQuestions" 
              :key="idx"
              class="question-tag"
              @click.stop="sendQuickQuestion(question)"
            >
              {{ question }}
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <template v-else>
          <div 
            v-for="(msg, idx) in messages" 
            :key="idx" 
            :class="['message-item', msg.role]"
          >
            <div class="message-avatar">
              <Avatar 
                v-if="msg.role === 'user'"
                icon="ios-person"
                style="background: #2d8cf0"
              />
              <div v-else class="ai-avatar">
                <img src="/static/pictures/xh.png" alt="星火" />
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">
                  {{ msg.role === 'user' ? '我' : '星火 AI' }}
                </span>
                <span class="message-time" v-if="msg.time">{{ msg.time }}</span>
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

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-container">
          <Input 
            v-model="inputText" 
            type="textarea"
            :rows="3"
            :placeholder="placeholderText"
            @keyup.enter.ctrl="sendMessage"
            class="message-input"
          />
          <div class="input-actions">
            <Button 
              v-if="messages.length > 0" 
              type="text" 
              @click="clearMessages"
              class="clear-btn"
            >
              <Icon type="ios-trash" />
              清空
            </Button>
            <span v-else class="hint">Ctrl + Enter 发送</span>
            <Button 
              type="primary" 
              @click="sendMessage" 
              :loading="sending"
              :disabled="!inputText.trim()"
              class="send-btn"
            >
              <Icon type="ios-send" />
              发送
            </Button>
          </div>
        </div>
      </div>

      <!-- 调整大小手柄 -->
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-right"
        @mousedown="startResize('right', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-left"
        @mousedown="startResize('left', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-top"
        @mousedown="startResize('top', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-bottom"
        @mousedown="startResize('bottom', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-top-right"
        @mousedown="startResize('top-right', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-top-left"
        @mousedown="startResize('top-left', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-bottom-right"
        @mousedown="startResize('bottom-right', $event)"
      ></div>
      <div 
        v-if="!isFullscreen"
        class="resize-handle resize-handle-bottom-left"
        @mousedown="startResize('bottom-left', $event)"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIChatWindow',
  data() {
    return {
      windowVisible: false,
      isFullscreen: false,
      windowWidth: 400,
      windowHeight: 600,
      windowPosition: {
        x: null,
        y: null
      },
      isDragging: false,
      dragStart: {
        x: 0,
        y: 0
      },
      isResizing: false,
      resizeDirection: '',
      resizeStart: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        left: 0,
        top: 0
      },
      messages: [],
      inputText: '',
      sending: false,
      quickQuestions: [
        '如何优化这段代码的时间复杂度？',
        '解释一下动态规划的思想',
        '帮我分析一下这个算法的空间复杂度',
        '这道题目有什么解题思路？'
      ]
    };
  },
  computed: {
    placeholderText() {
      return this.messages.length === 0 
        ? '输入你的问题，或点击上方快捷问题开始对话...' 
        : '输入你的问题，Ctrl + Enter 发送...';
    },
    windowStyle() {
      if (this.isFullscreen) {
        return {
          width: '100%',
          height: '100%',
          left: '0',
          top: '0'
        };
      }
      return {
        width: this.windowWidth + 'px',
        height: this.windowHeight + 'px',
        right: this.windowPosition.x ? null : '20px',
        left: this.windowPosition.x ? this.windowPosition.x + 'px' : null,
        top: this.windowPosition.y ? this.windowPosition.y + 'px' : '100px'
      };
    }
  },
  methods: {
    openWindow() {
      this.windowVisible = true;
      if (!this.windowPosition.x) {
        this.windowPosition.x = window.innerWidth - this.windowWidth - 20;
        this.windowPosition.y = 100;
      }
    },
    closeWindow() {
      this.windowVisible = false;
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    startDrag(e) {
      if (this.isFullscreen) return;
      this.isDragging = true;
      this.dragStart.x = e.clientX - (this.windowPosition.x || 0);
      this.dragStart.y = e.clientY - (this.windowPosition.y || 0);
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      e.preventDefault();
    },
    onDrag(e) {
      if (!this.isDragging) return;
      this.windowPosition.x = e.clientX - this.dragStart.x;
      this.windowPosition.y = e.clientY - this.dragStart.y;
    },
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    },
    startResize(direction, e) {
      if (this.isFullscreen) return;
      this.isResizing = true;
      this.resizeDirection = direction;
      this.resizeStart = {
        x: e.clientX,
        y: e.clientY,
        width: this.windowWidth,
        height: this.windowHeight,
        left: this.windowPosition.x || 0,
        top: this.windowPosition.y || 0
      };
      document.addEventListener('mousemove', this.onResize);
      document.addEventListener('mouseup', this.stopResize);
      e.preventDefault();
    },
    onResize(e) {
      if (!this.isResizing) return;
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;
      const minWidth = 350;
      const minHeight = 400;
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 40;

      switch (this.resizeDirection) {
        case 'right':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width + deltaX, minWidth), maxWidth);
          break;
        case 'left':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width - deltaX, minWidth), maxWidth);
          this.windowPosition.x = this.resizeStart.left + deltaX;
          break;
        case 'bottom':
          this.windowHeight = Math.min(Math.max(this.resizeStart.height + deltaY, minHeight), maxHeight);
          break;
        case 'top':
          this.windowHeight = Math.min(Math.max(this.resizeStart.height - deltaY, minHeight), maxHeight);
          this.windowPosition.y = this.resizeStart.top + deltaY;
          break;
        case 'top-right':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width + deltaX, minWidth), maxWidth);
          this.windowHeight = Math.min(Math.max(this.resizeStart.height - deltaY, minHeight), maxHeight);
          this.windowPosition.y = this.resizeStart.top + deltaY;
          break;
        case 'top-left':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width - deltaX, minWidth), maxWidth);
          this.windowHeight = Math.min(Math.max(this.resizeStart.height - deltaY, minHeight), maxHeight);
          this.windowPosition.x = this.resizeStart.left + deltaX;
          this.windowPosition.y = this.resizeStart.top + deltaY;
          break;
        case 'bottom-right':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width + deltaX, minWidth), maxWidth);
          this.windowHeight = Math.min(Math.max(this.resizeStart.height + deltaY, minHeight), maxHeight);
          break;
        case 'bottom-left':
          this.windowWidth = Math.min(Math.max(this.resizeStart.width - deltaX, minWidth), maxWidth);
          this.windowHeight = Math.min(Math.max(this.resizeStart.height + deltaY, minHeight), maxHeight);
          this.windowPosition.x = this.resizeStart.left + deltaX;
          break;
      }
    },
    stopResize() {
      this.isResizing = false;
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
    },
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.sending) return;
      
      this.messages.push({ 
        role: 'user', 
        content: text,
        time: this.getCurrentTime()
      });
      this.inputText = '';
      this.sending = true;

      const loadingIndex = this.messages.length;
      this.messages.push({ 
        role: 'loading', 
        content: 'AI正在思考...',
        time: this.getCurrentTime()
      });
      this.scrollToBottom();

      try {
        const response = await fetch('/api/spark/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        
        this.messages.splice(loadingIndex, 1);

        if (data.answer) {
          this.messages.push({ 
            role: 'assistant', 
            content: data.answer,
            time: this.getCurrentTime()
          });
        } else {
          this.messages.push({ 
            role: 'assistant', 
            content: '抱歉，我暂时无法回答。请稍后再试。',
            time: this.getCurrentTime()
          });
        }
      } catch (error) {
        console.error('请求失败:', error);
        this.messages.splice(loadingIndex, 1);
        this.messages.push({ 
          role: 'assistant', 
          content: '网络错误，请稍后重试。',
          time: this.getCurrentTime()
        });
      } finally {
        this.sending = false;
        this.scrollToBottom();
      }
    },
    sendQuickQuestion(question) {
      this.inputText = question;
      this.$nextTick(() => {
        this.sendMessage();
      });
    },
    clearMessages() {
      this.$Modal.confirm({
        title: '确认清空',
        content: '确定要清空所有对话记录吗？',
        onOk: () => {
          this.messages = [];
        }
      });
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageList;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    getCurrentTime() {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    },
    formatMessage(content) {
      return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  }
};
</script>

<style lang="less" scoped>
// 浮动按钮
.ai-float-button {
  position: fixed;
  right: 20px;
  top: 10px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
  box-shadow: 0 4px 12px rgba(45, 140, 240, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 9999;
  color: white;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(45, 140, 240, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
}

// 聊天窗口
.ai-chat-window {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 10000;
  overflow: hidden;
  min-width: 350px;
  min-height: 400px;

  &.fullscreen {
    border-radius: 0;
  }
}

// 窗口头部
.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
  color: white;
  cursor: move;
  user-select: none;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 4px;

    .action-btn {
      color: white;
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

// 消息容器
.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: #f5f7fa;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c5c8ce;
    border-radius: 3px;
  }
}

// 欢迎区域
.welcome-section {
  text-align: center;
  padding: 20px 10px;

  .welcome-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(45, 140, 240, 0.3);
    overflow: hidden;

    img {
      width: 70%;
      height: 70%;
      object-fit: contain;
    }
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #17233d;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #808695;
    margin-bottom: 20px;
  }

  .quick-questions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;

    .question-tag {
      padding: 8px 16px;
      background: white;
      border: 1px solid #dcdee2;
      border-radius: 16px;
      font-size: 13px;
      color: #515a6e;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;

      &:hover {
        border-color: #2d8cf0;
        color: #2d8cf0;
        box-shadow: 0 2px 8px rgba(45, 140, 240, 0.15);
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }
}

// 消息项
.message-item {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;

      .message-body {
        background: #2d8cf0;
        color: white;
        border-radius: 12px 12px 4px 12px;
      }
    }
  }

  &.assistant {
    .message-body {
      background: white;
      border: 1px solid #e8eaec;
      border-radius: 12px 12px 12px 4px;
    }
  }

  &.loading {
    .message-body {
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 12px 12px 12px 4px;
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
    background: #19be6b;
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
      color: #17233d;
    }

    .message-time {
      font-size: 11px;
      color: #c5c8ce;
    }
  }

  .message-body {
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.6;
    color: #515a6e;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #fa8c16;
    }

    .message-text {
      /deep/ pre {
        background: rgba(0, 0, 0, 0.05);
        padding: 10px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 6px 0;

        code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #17233d;
        }
      }

      /deep/ code {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #e83e8c;
      }
    }
  }
}

// 输入区域
.input-section {
  background: white;
  border-top: 1px solid #e8eaec;
  padding: 12px;
  flex-shrink: 0;

  .input-container {
    .message-input {
      /deep/ textarea {
        border-radius: 8px;
        resize: none;
        font-size: 14px;

        &:focus {
          border-color: #2d8cf0;
          box-shadow: 0 0 0 2px rgba(45, 140, 240, 0.1);
        }
      }
    }

    .input-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;

      .clear-btn {
        color: #808695;
        padding: 0;
        font-size: 13px;
        
        &:hover {
          color: #ed4014;
        }
      }

      .hint {
        font-size: 12px;
        color: #c5c8ce;
      }

      .send-btn {
        padding: 0 20px;
        height: 36px;
        border-radius: 18px;
        font-size: 14px;

        i {
          margin-right: 4px;
        }
      }
    }
  }
}

// 调整大小手柄
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 1;

  &-right {
    right: 0;
    top: 0;
    width: 5px;
    height: 100%;
    cursor: ew-resize;
  }

  &-left {
    left: 0;
    top: 0;
    width: 5px;
    height: 100%;
    cursor: ew-resize;
  }

  &-top {
    top: 0;
    left: 0;
    height: 5px;
    width: 100%;
    cursor: ns-resize;
  }

  &-bottom {
    bottom: 0;
    left: 0;
    height: 5px;
    width: 100%;
    cursor: ns-resize;
  }

  &-top-right {
    top: 0;
    right: 0;
    width: 10px;
    height: 10px;
    cursor: nesw-resize;
  }

  &-top-left {
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
  }

  &-bottom-right {
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
  }

  &-bottom-left {
    bottom: 0;
    left: 0;
    width: 10px;
    height: 10px;
    cursor: nesw-resize;
  }
}
</style>
