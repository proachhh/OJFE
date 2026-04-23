<template>
  <div class="ai-chat-fullscreen">
    <div class="chat-header">
      <div class="header-left">
        <Button type="text" @click="goBack" class="back-btn">
          <Icon type="ios-arrow-back" size="20" />
          <span>{{ $t('m.Back') }}</span>
        </Button>
        <img src="/static/pictures/xh.png" :alt="$t('m.Spark_AI')" class="header-avatar" />
        <span class="header-title">{{ $t('m.Spark_AI_Assistant') }}</span>
      </div>
    </div>

    <div class="chat-body">
      <div class="message-container" ref="messageList">
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-icon">
            <img src="/static/pictures/xh.png" :alt="$t('m.Spark_AI')" />
          </div>
          <h3>{{ $t('m.Hello_I_Am_Spark_AI') }}</h3>
          <p>{{ $t('m.Spark_AI_Description') }}</p>
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
                <img src="/static/pictures/xh.png" :alt="$t('m.Spark_AI')" />
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">
                  {{ msg.role === 'user' ? $t('m.Me') : $t('m.Spark_AI') }}
                </span>
                <span class="message-time" v-if="msg.time">{{ msg.time }}</span>
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

      <div class="input-section">
        <div class="input-container">
          <Input 
            v-model="inputText" 
            type="textarea"
            :rows="3"
            :placeholder="messages.length === 0 ? $t('m.Enter_Your_Question_Start') : $t('m.Enter_Your_Question')"
            @on-keydown="handleKeydown"
            class="message-input"
          />
          <div class="input-actions">
            <Button 
              type="text" 
              @click="clearMessages"
              class="clear-btn"
              v-if="messages.length > 0"
            >
              {{ $t('m.Clear_Chat') }}
            </Button>
            <span class="hint">Ctrl + Enter {{ $t('m.Send') }}</span>
            <Button 
              type="primary" 
              @click="sendMessage"
              :loading="sending"
              :disabled="!inputText.trim()"
              class="send-btn"
            >
              <Icon type="ios-send" /> {{ $t('m.Send') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIChatFullscreen',
  data() {
    return {
      messages: [],
      inputText: '',
      sending: false,
      quickQuestionsKeys: [
        'm.How_Learn_DP',
        'm.Explain_Time_Complexity',
        'm.Binary_Tree_Traversal',
        'm.How_Debug_Code'
      ]
    }
  },
  computed: {
    quickQuestions() {
      return this.quickQuestionsKeys.map(key => this.$t(key))
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    sendQuickQuestion(question) {
      this.inputText = question
      this.sendMessage()
    },
    handleKeydown(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        this.sendMessage()
      }
    },
    clearMessages() {
      this.messages = []
    },
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.sending) return

      this.messages.push({ 
        role: 'user', 
        content: text,
        time: this.getCurrentTime()
      })
      this.inputText = ''
      this.sending = true

      this.messages.push({ role: 'loading', content: this.$t('m.AI_Thinking_Text') })
      this.scrollToBottom()

      try {
        const response = await fetch('/api/spark/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        })

        this.messages.splice(this.messages.length - 1, 1)

        if (response.ok) {
          const data = await response.json()
          this.messages.push({ 
            role: 'assistant', 
            content: data.reply || data.message || this.$t('m.No_Reply'),
            time: this.getCurrentTime()
          })
        } else {
          this.messages.push({ 
            role: 'assistant', 
            content: this.$t('m.Request_Failed'),
            time: this.getCurrentTime()
          })
        }
      } catch (e) {
        this.messages.splice(this.messages.length - 1, 1)
        this.messages.push({ 
          role: 'assistant', 
          content: this.$t('m.Network_Error_Text'),
          time: this.getCurrentTime()
        })
      } finally {
        this.sending = false
        this.scrollToBottom()
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const list = this.$refs.messageList
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
    },
    getCurrentTime() {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    },
    formatMessage(content) {
      return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    }
  }
}
</script>

<style lang="less" scoped>
.ai-chat-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .back-btn {
      color: white;
      padding: 0 8px;
      font-size: 14px;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      span {
        margin-left: 4px;
      }
    }

    .header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  background: #f5f7fa;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c5c8ce;
    border-radius: 4px;
  }
}

.welcome-section {
  text-align: center;
  padding: 40px 20px;

  .welcome-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto 20px;
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
    font-size: 28px;
    font-weight: 700;
    color: #17233d;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #808695;
    max-width: 500px;
    margin: 0 auto 30px;
  }

  .quick-questions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    max-width: 600px;
    margin: 0 auto;

    .question-tag {
      padding: 8px 16px;
      background: white;
      border: 1px solid #dcdee2;
      border-radius: 20px;
      font-size: 14px;
      color: #515a6e;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #2d8cf0;
        color: white;
        border-color: #2d8cf0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(45, 140, 240, 0.3);
      }
    }
  }
}

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
        background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
        color: white;
        border-radius: 18px 18px 4px 18px;
      }
    }
  }

  &.assistant {
    .message-body {
      background: white;
      border: 1px solid #e8eaec;
      border-radius: 18px 18px 18px 4px;
    }
  }

  &.loading {
    .message-body {
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 18px 18px 18px 4px;
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
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
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
      color: #808695;
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
    color: #17233d;

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #808695;
    }

    .message-text {
      /deep/ pre {
        background: #f6f8fa;
        padding: 12px;
        border-radius: 8px;
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

.input-section {
  background: white;
  border-top: 1px solid #e8eaec;
  padding: 16px 24px;
  flex-shrink: 0;

  .input-container {
    max-width: 900px;
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
      margin-top: 10px;

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
        padding: 0 24px;
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
</style>
