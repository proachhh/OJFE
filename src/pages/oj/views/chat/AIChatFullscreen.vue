<template>
  <div class="ai-chat-overlay" @click.self="goBack">
    <div class="ai-chat-fullscreen">
      <div class="chat-header">
        <div class="header-left">
          <Button type="text" @click="goBack" class="back-btn">
            <Icon type="ios-arrow-back" size="20" />
            <span>{{ $t('m.Back') }}</span>
          </Button>
          <img :src="aiAvatar" :alt="aiDisplayName" class="header-avatar" :key="aiAvatar" />
          <span class="header-title">{{ aiFullName }}</span>
        </div>
        <div class="header-right">
          <Select v-model="aiModel" size="small" class="model-select" @on-change="onModelChange">
            <Option value="agent">
              <img src="~@/assets/logo3.png" class="model-option-icon" />
              Agent
            </Option>
            <Option value="spark">
              <img src="/static/pictures/xh.png" class="model-option-icon" />
              Spark
            </Option>
            <Option value="deepseek">
              <img src="/static/pictures/ds.png" class="model-option-icon" />
              DeepSeek
            </Option>
          </Select>
        </div>
      </div>

      <div class="chat-body">
        <div class="message-container" ref="messageList">
          <div v-if="messages.length === 0" class="welcome-section">
            <div class="welcome-icon">
              <img :src="aiAvatar" :alt="aiDisplayName" :key="'welcome-' + aiAvatar" />
            </div>
            <h3>{{ aiWelcomeTitle }}</h3>
            <p>{{ aiWelcomeDesc }}</p>
            <div class="quick-commands">
              <Button v-for="cmd in quickCommands" :key="cmd.text" size="small" type="dashed" @click="sendQuickCommand(cmd)">
                <Icon :type="cmd.icon" size="14" />
                {{ cmd.text }}
              </Button>
            </div>
            <div class="quick-questions">
              <div v-for="(question, idx) in quickQuestions" :key="idx" class="question-tag" @click.stop="sendQuickQuestion(question)">
                {{ question }}
              </div>
            </div>
          </div>

          <template v-else>
            <MessageItem
              v-for="(msg, idx) in messages"
              :key="idx"
              :role="msg.role"
              :content="msg.content"
              :agent-name="msg.agentName"
              :thinking-steps="msg.thinkingSteps"
              :all-steps-done="msg.allStepsDone"
              :current-step-index="msg.currentStepIndex"
              :msg-time="msg.time"
              :ai-avatar="aiAvatar"
              :ai-name="aiDisplayName"
              :display-type="msg.displayType"
              :display-data="msg.displayData"
            />
          </template>
        </div>

        <div class="input-section">
          <div class="quick-commands-row" v-if="messages.length > 0">
            <Button v-for="cmd in quickCommands" :key="cmd.text" size="small" type="text" @click="sendQuickCommand(cmd)" class="qc-chip">
              <Icon :type="cmd.icon" size="13" /> {{ cmd.text }}
            </Button>
          </div>
          <div class="input-container">
            <Input
              v-model="inputText"
              type="textarea"
              :rows="3"
              :placeholder="placeholderText"
              @on-keydown="handleKeydown"
              class="message-input"
            />
            <div class="input-actions">
              <Button type="text" @click="clearMessages" class="clear-btn" v-if="messages.length > 0">
                {{ $t('m.Clear_Chat') }}
              </Button>
              <span class="hint">Ctrl + Enter {{ $t('m.Send') }}</span>
              <Button type="primary" @click="sendMessage" :loading="sending" :disabled="!inputText.trim()" class="send-btn">
                <Icon type="ios-send" /> {{ $t('m.Send') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MessageItem from './components/MessageItem.vue'
import { formatAgentResponse, extractAgentDisplay } from './utils.js'

export default {
  name: 'AIChatFullscreen',
  components: { MessageItem },
  data () {
    return {
      aiModel: 'agent',
      messages: [],
      inputText: '',
      sending: false,
      streamAborter: null,
      quickCommands: [
        { text: '规划学习路径', icon: 'ios-git-branch', message: '帮我规划学习路径' },
        { text: '分析最近错误', icon: 'ios-alert', message: '帮我分析最近为什么提交错了' },
        { text: '推荐题目', icon: 'ios-bulb', message: '给我推荐几道适合我的题目' },
        { text: '生成练习题', icon: 'ios-create', message: '给我出几道动态规划的练习题' },
        { text: '课程讲解', icon: 'ios-book', message: '帮我讲解一下BFS广度优先搜索' }
      ],
      quickQuestionsKeys: [
        'm.How_Learn_DP',
        'm.Explain_Time_Complexity',
        'm.Binary_Tree_Traversal',
        'm.How_Debug_Code'
      ]
    }
  },
  computed: {
    placeholderText () {
      return this.messages.length === 0
        ? this.$t('m.Enter_Your_Question_Start')
        : this.$t('m.Enter_Your_Question')
    },
    quickQuestions () {
      return this.quickQuestionsKeys.map(key => this.$t(key))
    },
    aiAvatar () {
      if (this.aiModel === 'agent') return require('@/assets/logo3.png')
      return this.aiModel === 'deepseek' ? '/static/pictures/ds.png' : '/static/pictures/xh.png'
    },
    aiDisplayName () {
      if (this.aiModel === 'agent') return 'OJ Agent'
      return this.aiModel === 'deepseek' ? 'DeepSeek' : this.$t('m.Spark_AI')
    },
    aiFullName () {
      if (this.aiModel === 'agent') return 'OJ 智能助手 (Agent)'
      return this.aiModel === 'deepseek' ? 'DeepSeek V4 PRO' : this.$t('m.Spark_AI_Assistant')
    },
    aiWelcomeTitle () {
      if (this.aiModel === 'agent') return '你好！我是 OJ 智能助手'
      return this.aiModel === 'deepseek' ? this.$t('m.Hello_I_Am_DeepSeek') : this.$t('m.Hello_I_Am_Spark_AI')
    },
    aiWelcomeDesc () {
      if (this.aiModel === 'agent') return '我可以帮你推荐题目、规划学习路径、生成练习题、提供解题提示、分析提交错误。尽管问我吧！'
      return this.aiModel === 'deepseek' ? this.$t('m.DeepSeek_Description') : this.$t('m.Spark_AI_Description')
    }
  },
  methods: {
    goBack () {
      this.$router.go(-1)
    },
    onModelChange () {
      this.messages = []
    },
    sendQuickQuestion (question) {
      this.inputText = question
      this.sendMessage()
    },
    sendQuickCommand (cmd) {
      this.inputText = cmd.message
      this.sendMessage()
    },
    handleKeydown (e) {
      if (e.ctrlKey && e.key === 'Enter') {
        this.sendMessage()
      }
    },
    clearMessages () {
      this.messages = []
    },
    async sendMessage () {
      const text = this.inputText.trim()
      if (!text || this.sending) return

      this.messages.push({ role: 'user', content: text, time: this.getCurrentTime() })
      this.inputText = ''
      this.sending = true

      const loadingIdx = this.messages.length
      this.messages.push({ role: 'loading', content: '' })
      this.scrollToBottom()

      try {
        if (this.aiModel === 'agent') {
          await this._sendAgentMessage(text, loadingIdx)
        } else {
          await this._sendLLMMessage(text, loadingIdx)
        }
      } catch (e) {
        this.messages.splice(loadingIdx, 1)
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
    async _sendAgentMessage (text, loadingIdx) {
      const apiUrl = '/api/agent/chat/stream/'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })

      if (!response.ok) {
        this.messages.splice(loadingIdx, 1)
        this.messages.push({ role: 'assistant', content: this.$t('m.Request_Failed'), time: this.getCurrentTime() })
        return
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        this.messages[loadingIdx].streaming = true
        await this._handleSSE(response, loadingIdx)
      } else {
        const result = await response.json()
        this.messages.splice(loadingIdx, 1)
        if (result.success && result.data) {
          const agentData = result.data
          const formatted = formatAgentResponse(agentData)
          const display = extractAgentDisplay(agentData)
          this.messages.push({
            role: 'assistant',
            content: formatted.content,
            agentName: agentData.agent || '',
            thinkingSteps: agentData.thinking_steps || [],
            allStepsDone: !!(agentData.thinking_steps && agentData.thinking_steps.length),
            displayType: display.displayType,
            displayData: display.displayData,
            time: this.getCurrentTime()
          })
        } else {
          this.messages.push({
            role: 'assistant',
            content: (result.data && result.data.error) || result.error || '抱歉，暂时无法回答。',
            time: this.getCurrentTime()
          })
        }
      }
    },
    async _handleSSE (response, loadingIdx) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let agentData = {}

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.event === 'step') {
                const steps = this.messages[loadingIdx].thinkingSteps || []
                steps.push(data.text)
                this.$set(this.messages[loadingIdx], 'thinkingSteps', steps)
                this.$set(this.messages[loadingIdx], 'currentStepIndex', steps.length)
              } else if (data.event === 'done') {
                this.messages[loadingIdx].allStepsDone = true
              } else if (data.event === 'result') {
                agentData = data.data || data
                const formatted = formatAgentResponse(agentData)
                const display = extractAgentDisplay(agentData)
                this.messages.splice(loadingIdx, 1)
                this.messages.push({
                  role: 'assistant',
                  content: formatted.content,
                  agentName: agentData.agent || '',
                  thinkingSteps: agentData.thinking_steps || [],
                  allStepsDone: true,
                  displayType: display.displayType,
                  displayData: display.displayData,
                  time: this.getCurrentTime()
                })
              } else if (data.event === 'chunk') {
                if (this.messages[loadingIdx].role === 'loading') {
                  const steps = this.messages[loadingIdx].thinkingSteps || []
                  this.messages[loadingIdx] = {
                    role: 'assistant',
                    content: data.text,
                    agentName: '',
                    thinkingSteps: steps,
                    allStepsDone: false,
                    streaming: true,
                    streamDone: false,
                    time: this.getCurrentTime()
                  }
                } else {
                  this.messages[loadingIdx].content += data.text
                }
              }
              this.scrollToBottom()
            }
          }
        }
      } finally {
        if (this.messages[loadingIdx]) {
          this.messages[loadingIdx].streamDone = true
          this.messages[loadingIdx].streaming = false
        }
        reader.releaseLock()
      }
    },
    async _sendLLMMessage (text, loadingIdx) {
      const apiUrl = '/api/spark/chat/'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model: this.aiModel })
      })
      this.messages.splice(loadingIdx, 1)
      if (response.ok) {
        const data = await response.json()
        this.messages.push({
          role: 'assistant',
          content: data.answer || data.reply || data.message || this.$t('m.No_Reply'),
          time: this.getCurrentTime()
        })
      } else {
        this.messages.push({ role: 'assistant', content: this.$t('m.Request_Failed'), time: this.getCurrentTime() })
      }
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const list = this.$refs.messageList
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
    },
    getCurrentTime () {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }
  },
  created () {
    if (this.$route.query.model) {
      this.aiModel = this.$route.query.model
    }
  }
}
</script>

<style lang="less" scoped>
.ai-chat-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
  z-index: 9998; display: flex; align-items: flex-start; justify-content: center;
}

.ai-chat-fullscreen {
  position: relative; width: 90%; max-width: 800px;
  height: calc(100vh - 140px); max-height: 700px; margin-top: 80px;
  background: #f5f7fa; display: flex; flex-direction: column;
  border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25); overflow: hidden;
}

.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
  color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .header-left { display: flex; align-items: center; gap: 12px;
    .back-btn { color: white; padding: 0 8px; font-size: 14px;
      &:hover { background: rgba(255, 255, 255, 0.2); }
      span { margin-left: 4px; }
    }
    .header-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: contain; background: #fff; padding: 2px; }
    .header-title { font-size: 18px; font-weight: 600; }
  }

  .header-right {
    .model-select { width: 150px;
      /deep/ .ivu-select-selection { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: #fff; }
      /deep/ .ivu-select-arrow { color: rgba(255, 255, 255, 0.8); }
    }
  }
}

.chat-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.message-container {
  flex: 1; overflow-y: auto; overflow-x: hidden; padding: 24px; background: #f5f7fa;
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: #c5c8ce; border-radius: 4px; }
}

.welcome-section {
  text-align: center; padding: 40px 20px;
  .welcome-icon img { width: 64px; height: 64px; border-radius: 50%; background: #fff; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 16px; }
  h3 { font-size: 22px; color: #17233d; margin: 0 0 8px; }
  p { font-size: 14px; color: #808695; margin: 0 0 24px; }
  .quick-commands { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 20px; }
  .quick-questions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    .question-tag { padding: 8px 16px; background: #e8f4ff; border-radius: 20px; color: #2d8cf0; font-size: 13px; cursor: pointer; transition: all 0.2s;
      &:hover { background: #2d8cf0; color: #fff; }
    }
  }
}

.quick-commands-row { display: flex; gap: 6px; padding: 6px 16px; flex-wrap: wrap;
  .qc-chip { font-size: 12px; }
}

.input-section { padding: 12px 16px; background: #fff; border-top: 1px solid #e8eaec; }
.input-container .message-input {
  /deep/ textarea { resize: none; border-radius: 8px; }
}
.input-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 8px;
  .hint { font-size: 12px; color: #c5c8ce; }
  .clear-btn { font-size: 12px; }
}

.model-option-icon { width: 18px; height: 18px; margin-right: 6px; vertical-align: middle; border-radius: 3px; }

// message-item overrides for this page
.msg-item { margin-bottom: 20px; }
</style>
