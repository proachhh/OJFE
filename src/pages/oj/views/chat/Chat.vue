<template>
  <div class="chat-container">
    <h2>星火大模型助手</h2>
    <div class="message-list" ref="messageList">
      <div v-for="(msg, idx) in messages" :key="idx" :class="msg.role">
        <strong>{{ msg.role === 'user' ? '我' : 'AI' }}：</strong>
        {{ msg.content }}
      </div>
    </div>
    <div class="input-area">
      <input v-model="inputText" @keyup.enter="sendMessage" placeholder="输入你的问题" />
      <button @click="sendMessage" :disabled="sending">发送</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      inputText: '',
      sending: false
    };
  },
  methods: {
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.sending) return;
      this.messages.push({ role: 'user', content: text });
      this.inputText = '';
      this.sending = true;
      this.scrollToBottom();
      try {
        const response = await fetch('/api/spark/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        if (data.answer) {
          this.messages.push({ role: 'assistant', content: data.answer });
        } else {
          this.messages.push({ role: 'assistant', content: '抱歉，我暂时无法回答。' });
        }
      } catch (error) {
        console.error('请求失败:', error);
        this.messages.push({ role: 'assistant', content: '网络错误，请稍后重试。' });
      } finally {
        this.sending = false;
        this.scrollToBottom();
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messageList;
        if (container) container.scrollTop = container.scrollHeight;
      });
    }
  }
};
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 20px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}
.message-list {
  height: 500px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
}
.user, .assistant {
  margin: 8px 0;
  padding: 8px;
  border-radius: 8px;
}
.user {
  background: #e3f2fd;
  text-align: right;
}
.assistant {
  background: #f1f8e9;
}
.input-area {
  display: flex;
  gap: 8px;
}
.input-area input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.input-area button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>