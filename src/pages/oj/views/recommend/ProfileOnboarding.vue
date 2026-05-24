<template>
  <div class="profile-onboarding-page">
    <div class="onboarding-container">
      <div v-if="!started && !complete" class="welcome-card">
        <div class="welcome-icon">
          <Icon type="ios-person" size="64" color="#2d8cf0" />
        </div>
        <h1>学习画像引导</h1>
        <p>{{ $t('m.Smart_Profile_Onboarding_Desc') }}</p>
        <div class="dimension-preview">
          <div v-for="dim in dimensions" :key="dim.key" class="dim-item">
            <Icon type="ios-checkmark-circle-outline" size="18" />
            <span>{{ dim.label }}</span>
          </div>
        </div>
        <Button type="primary" size="large" @click="startOnboarding" :loading="loading">
          开始引导
        </Button>
      </div>

      <div v-else-if="complete" class="complete-card">
        <div class="complete-icon">
          <Icon type="ios-checkmark-circle" size="64" color="#19be6b" />
        </div>
        <h1>学习画像</h1>
        <p v-if="completeMessage">{{ completeMessage }}</p>
        <div v-if="profile && (strengthTopics.length || weakTopics.length || profile.recommended_focus)" class="profile-summary">
          <div class="summary-item" v-if="strengthTopics.length">
            <span class="label">强项</span>
            <span class="profile-tag"
              style="background: #2d8cf0; color: #fff;"
              v-for="t in strengthTopics" :key="t">{{ t }}</span>
          </div>
          <div class="summary-item" v-if="weakTopics.length">
            <span class="label">弱项</span>
            <span class="profile-tag"
              style="background: #ed4014; color: #fff;"
              v-for="t in weakTopics" :key="t">{{ t }}</span>
          </div>
          <div class="summary-item" v-if="profile.coding_style">
            <span class="label">编码风格</span>
            <span>{{ profile.coding_style }}</span>
          </div>
          <div class="summary-item" v-if="profile.learning_pace">
            <span class="label">学习节奏</span>
            <span>{{ profile.learning_pace }}</span>
          </div>
          <div class="summary-item" v-if="profile.recommended_focus">
            <span class="label">建议方向</span>
            <span>{{ profile.recommended_focus }}</span>
          </div>
        </div>
        <div v-else class="empty-profile">
          <p>暂无画像数据，完成引导对话即可生成。</p>
        </div>
        <div class="complete-actions">
          <Button type="primary" @click="$router.push({name: 'ai-chat-fullscreen'})">
            {{ $t('m.Smart_Chat_Nav') }}
          </Button>
          <Button @click="$router.push({name: 'learning-path'})">
            规划学习路径
          </Button>
          <Button type="text" @click="resetAndStart" size="small">
            重新生成画像
          </Button>
        </div>
      </div>

      <div v-else class="question-card">
        <div class="progress-bar">
          <div class="progress-fill" :style="{width: (step / totalSteps * 100) + '%'}"></div>
        </div>
        <div class="step-indicator">
          第 {{ step }} / {{ totalSteps }} 步 — {{ currentDisplay }}
        </div>
        <div class="question-text">{{ currentQuestion }}</div>
        <div class="input-area">
          <Input
            v-model="answer"
            type="textarea"
            :rows="4"
            :placeholder="'请输入你的' + currentDisplay + '...'"
            @keyup.enter.ctrl="submitAnswer"
          />
          <div class="action-buttons">
            <Button type="text" @click="skipAnswer">跳过</Button>
            <Button type="primary" @click="submitAnswer" :loading="loading" :disabled="!answer.trim()">
              下一步
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileOnboarding',
  data () {
    return {
      loading: false,
      started: false,
      complete: false,
      step: 1,
      totalSteps: 6,
      currentQuestion: '',
      currentDisplay: '',
      answer: '',
      completeMessage: '',
      profile: null,
      dimensions: [
        { key: 'background', label: '专业背景' },
        { key: 'current_courses', label: '当前学习课程' },
        { key: 'weak_areas', label: '知识薄弱点' },
        { key: 'learning_goals', label: '学习目标' },
        { key: 'learning_style', label: '偏好学习方式' },
        { key: 'weekly_hours', label: '每周学习时长' }
      ]
    }
  },
  mounted () {
    this.checkStatus()
  },
  computed: {
    strengthTopics () {
      const v = this.profile && this.profile.strength_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    },
    weakTopics () {
      const v = this.profile && this.profile.weak_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    }
  },
  methods: {
    async checkStatus () {
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'status' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = '引导对话已完成！'
          this.profile = data.profile || {}
          return
        }
        if (data.answered_count > 0) {
          this.started = true
          this.step = data.answered_count + 1
          this.totalSteps = data.total || 6
          this.startOnboarding()
        }
      } catch (e) {
        // Not started yet - stay on welcome screen
      }
    },
    async startOnboarding () {
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'start' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || '引导对话已完成！'
          this.profile = data.profile || {}
        } else {
          this.complete = false
          this.started = true
          this.step = data.step || 1
          this.totalSteps = data.total_steps || 6
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        const errMsg = (e.response && e.response.data && e.response.data.error) || e.message || '未知错误'
        this.$Message.error('启动引导失败：' + errMsg)
      } finally {
        this.loading = false
      }
    },
    resetAndStart () {
      this.started = false
      this.complete = false
      this.profile = null
      this.completeMessage = ''
      this.answer = ''
      this.step = 1
      this.$nextTick(() => {
        this.startOnboarding()
      })
    },
    async submitAnswer () {
      if (!this.answer.trim()) return
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', {
          action: 'answer',
          answer: this.answer.trim()
        })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || this.$t('m.Smart_Profile_Done')
          this.profile = data.profile || {}
        } else {
          this.step = data.step || this.step + 1
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        this.$Message.error('提交失败，请重试')
      } finally {
        this.loading = false
      }
    },
    async skipAnswer () {
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'skip' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || '引导对话完成！'
          this.profile = data.profile || {}
        } else {
          this.step = data.step || this.step + 1
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        this.$Message.error('操作失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.profile-onboarding-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 60px 0 80px;
}

.onboarding-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
}

.welcome-card, .complete-card, .question-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.welcome-card {
  text-align: center;

  .welcome-icon {
    margin-bottom: 20px;
  }

  h1 {
    font-size: 28px;
    color: #17233d;
    margin: 0 0 12px;
  }

  p {
    color: #515a6e;
    font-size: 15px;
    line-height: 1.7;
    margin-bottom: 24px;
  }

  .dimension-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    justify-content: center;
    margin-bottom: 28px;

    .dim-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #515a6e;
      font-size: 14px;
      padding: 6px 12px;
      background: #f5f7fa;
      border-radius: 8px;
    }
  }
}

.complete-card {
  text-align: center;

  .complete-icon {
    margin-bottom: 20px;
  }

  h1 {
    font-size: 28px;
    color: #2d8cf0;
    margin: 0 0 12px;
  }

  p {
    color: #515a6e;
    font-size: 15px;
    margin-bottom: 24px;
  }

  .profile-summary {
    text-align: left;
    background: #f5f7fa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    h3 {
      margin: 0 0 16px;
      color: #17233d;
      font-size: 16px;
    }

    .summary-item {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 14px;
      line-height: 1.6;

      .label {
        display: inline-block;
        font-weight: 600;
        color: #17233d;
        min-width: 70px;
        flex-shrink: 0;
        font-size: 14px;
      }

      .profile-tag {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 4px;
        line-height: 20px;
      }
    }
  }

  .empty-profile {
    color: #808695;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .complete-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.question-card {
  .progress-bar {
    height: 6px;
    background: #e8eaec;
    border-radius: 3px;
    margin-bottom: 24px;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2d8cf0, #19be6b);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
  }

  .step-indicator {
    color: #808695;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .question-text {
    font-size: 20px;
    font-weight: 600;
    color: #17233d;
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .input-area {
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
  }
}
</style>
