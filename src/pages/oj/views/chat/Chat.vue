<template>
  <div class="chat-page">
    <!-- 消息列表 -->
    <div class="message-container" ref="messageList">
      <div class="content-wrapper">
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
            清空对话
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
  </div>
</template>

<script>
export default {
  name: 'Chat',
  data() {
    return {
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
    }
  },
  methods: {
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.sending) return;
      
      // 添加用户消息
      this.messages.push({ 
        role: 'user', 
        content: text,
        time: this.getCurrentTime()
      });
      this.inputText = '';
      this.sending = true;

      // 添加加载状态
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
        
        // 移除加载状态
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
      console.log('点击快捷问题:', question);
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
      // 简单的格式化：将代码块标记为 pre/code
      return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }
  }
};
</script>

<style lang="less" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: #f5f7fa;
  overflow: hidden;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
}

// 消息容器
.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c5c8ce;
    border-radius: 3px;
  }

  // 内容包装器，限制最大宽度
  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
  }
}

// 欢迎区域
.welcome-section {
  text-align: center;
  padding: 40px 20px;

  .welcome-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(45, 140, 240, 0.3);
    overflow: hidden;

    img {
      width: 70%;
      height: 70%;
      object-fit: contain;
    }
  }

  h3 {
    font-size: 24px;
    font-weight: 600;
    color: #17233d;
    margin-bottom: 12px;
  }

  p {
    font-size: 15px;
    color: #808695;
    margin-bottom: 32px;
  }

  .quick-questions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
    position: relative;
    z-index: 10;

    .question-tag {
      padding: 10px 20px;
      background: white;
      border: 1px solid #dcdee2;
      border-radius: 20px;
      font-size: 14px;
      color: #515a6e;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      position: relative;

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
  gap: 12px;
  margin-bottom: 20px;
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
    width: 32px;
    height: 32px;
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
  max-width: 70%;

  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .sender-name {
      font-size: 13px;
      font-weight: 600;
      color: #17233d;
    }

    .message-time {
      font-size: 12px;
      color: #c5c8ce;
    }
  }

  .message-body {
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #515a6e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fa8c16;
    }

    .message-text {
      /deep/ pre {
        background: rgba(0, 0, 0, 0.05);
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;

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
  padding: 16px 24px;
  flex-shrink: 0;

  .input-container {
    max-width: 1200px;
    margin: 0 auto;

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
      margin-top: 12px;

      .clear-btn {
        color: #808695;
        padding: 0;
        
        &:hover {
          color: #ed4014;
        }
      }

      .hint {
        font-size: 12px;
        color: #c5c8ce;
      }

      .send-btn {
        padding: 0 24px;
        height: 40px;
        border-radius: 20px;
        font-size: 14px;

        i {
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
