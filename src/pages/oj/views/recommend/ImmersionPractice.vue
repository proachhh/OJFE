<template>
  <div class="immersion-container">
    <div v-if="loading" class="loading-state">
      <Spin size="large">
        <Icon type="ios-loading" size="48" class="spin-icon"></Icon>
        <div>正在为你挑选题目...</div>
      </Spin>
    </div>

    <div v-else-if="!problemList.length" class="empty-state">
      <Icon type="ios-sad-outline" size="64" />
      <p>暂无推荐题目，请先做一些题目吧</p>
      <Button type="primary" @click="goProblemList">去题目列表</Button>
    </div>

    <div v-else class="practice-area">
      <div class="progress-indicator">
        <span class="current-pos">{{ currentIndex + 1 }} / {{ problemList.length }}</span>
        <Progress :percent="progressPercent" :stroke-width="6" :show-text="false" />
      </div>

      <div class="problem-detail">
        <div class="problem-header">
          <h2 class="problem-title">
            <span class="display-id">{{ currentProblem._id }}. </span>
            {{ currentProblem.title }}
          </h2>
          <div class="problem-meta">
            <Tag v-for="tag in currentProblem.tags" :key="tag" color="blue">{{ tag }}</Tag>
            <Tag :color="difficultyColor">{{ currentProblem.difficulty }}</Tag>
            <span class="meta-divider">|</span>
            <span class="meta-text">{{ currentProblem.time_limit }}ms / {{ currentProblem.memory_limit }}MB</span>
            <span class="meta-divider">|</span>
            <span class="meta-text">通过 {{ currentProblem.accepted_number }}</span>
          </div>

          <div class="reason-badge">
            <Icon type="ios-bulb-outline" size="16" />
            {{ currentProblem.reason }}
          </div>
        </div>

        <Divider />

        <div class="problem-body">
          <div class="section">
            <h3>问题描述</h3>
            <div class="markdown-content" v-katex v-html="descriptionHTML"></div>
          </div>

          <div class="section">
            <h3>输入描述</h3>
            <div class="markdown-content" v-katex v-html="inputDescHTML"></div>
          </div>

          <div class="section">
            <h3>输出描述</h3>
            <div class="markdown-content" v-katex v-html="outputDescHTML"></div>
          </div>

          <div class="section" v-if="currentProblem.samples && currentProblem.samples.length">
            <h3>样例</h3>
            <div v-for="(sample, idx) in currentProblem.samples" :key="idx" class="sample-block">
              <div class="sample-item">
                <div class="sample-label">输入 #{{ idx + 1 }}</div>
                <pre>{{ sample.input }}</pre>
              </div>
              <div class="sample-item">
                <div class="sample-label">输出 #{{ idx + 1 }}</div>
                <pre>{{ sample.output }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="nav-footer">
        <div class="nav-buttons">
          <Button type="primary" ghost size="large" @click="gotoDetail" style="margin-right: 16px">
            <Icon type="ios-code-working" />
            开始编程
          </Button>

          <Button size="large" @click="handleSkip" :disabled="currentIndex >= problemList.length - 1">
            下一题
            <Icon type="ios-arrow-forward" />
          </Button>
        </div>

        <div class="nav-dots">
          <span
            v-for="(p, idx) in problemList"
            :key="p._id"
            class="dot"
            :class="{
              active: idx === currentIndex,
              'in-progress': progressMap[idx] === 'in_progress',
              done: progressMap[idx] === 'done'
            }"
            @click="jumpTo(idx)"
            :title="p._id + '. ' + p.title"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'

export default {
  name: 'ImmersionPractice',
  data () {
    return {
      loading: true,
      problemList: [],
      currentIndex: 0,
      progressMap: {}
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    currentProblem () {
      return this.problemList[this.currentIndex] || {}
    },
    progressPercent () {
      if (!this.problemList.length) return 0
      return Math.round(((this.currentIndex + 1) / this.problemList.length) * 100)
    },
    descriptionHTML () {
      return this.renderMarkdown(this.currentProblem.description || '')
    },
    inputDescHTML () {
      return this.renderMarkdown(this.currentProblem.input_description || '')
    },
    outputDescHTML () {
      return this.renderMarkdown(this.currentProblem.output_description || '')
    },
    difficultyColor () {
      const d = this.currentProblem.difficulty
      if (d === 'Low') return 'green'
      if (d === 'Mid') return 'orange'
      return 'red'
    }
  },
  created () {
    if (!this.isAuthenticated) {
      this.$router.push({name: 'home'})
      return
    }
    this.fetchRecommendations()
  },
  methods: {
    fetchRecommendations () {
      this.loading = true
      api.getImmersionRecommendations().then(res => {
        this.problemList = res.data.data.problems || []
        this.currentIndex = res.data.data.current_index || 0
        this.progressMap = {}
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    jumpTo (idx) {
      if (idx >= 0 && idx < this.problemList.length) {
        this.currentIndex = idx
        window.scrollTo({top: 0, behavior: 'smooth'})
      }
    },
    gotoDetail () {
      const problem = this.currentProblem
      if (problem && problem._id) {
        this.$router.push({name: 'problem-details', params: {problemID: problem._id}})
      }
    },
    handleSkip () {
      if (this.currentIndex < this.problemList.length - 1) {
        this.currentIndex++
        window.scrollTo({top: 0, behavior: 'smooth'})
      }
    },
    goProblemList () {
      this.$router.push({name: 'problem-list'})
    },
    renderMarkdown (text) {
      if (!text) return ''
      if (typeof this.$markdownRender === 'function') {
        return this.$markdownRender(text)
      }
      return text
    }
  },
  watch: {
    currentIndex (newVal, oldVal) {
      if (oldVal !== undefined && oldVal !== newVal) {
        this.progressMap = {
          ...this.progressMap,
          [oldVal]: 'in_progress'
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.immersion-container {
  min-height: 100vh;
  background: #0a0e27;
  padding: 100px 0 120px 0;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #8892b0;

  .spin-icon {
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    margin: 16px 0;
    font-size: 15px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.practice-area {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  .current-pos {
    color: #ccd6f6;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    min-width: 80px;
  }
}

.problem-detail {
  background: #112240;
  border: 1px solid #233554;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
}

.problem-header {
  .problem-title {
    color: #e6f1ff;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 12px;

    .display-id {
      color: #64ffda;
    }
  }

  .problem-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;

    .meta-divider {
      color: #495670;
    }
    .meta-text {
      color: #8892b0;
      font-size: 13px;
    }
  }

  .reason-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(100, 255, 218, 0.1);
    border: 1px solid rgba(100, 255, 218, 0.3);
    border-radius: 20px;
    padding: 6px 16px;
    color: #64ffda;
    font-size: 13px;
  }
}

.problem-body {
  .section {
    margin-bottom: 24px;

    h3 {
      color: #ccd6f6;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 3px solid #64ffda;
    }
  }

  .markdown-content {
    color: #8892b0;
    line-height: 1.8;
    font-size: 14px;
  }

  .sample-block {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;

    .sample-item {
      flex: 1;
      background: #0a192f;
      border: 1px solid #233554;
      border-radius: 8px;
      overflow: hidden;

      .sample-label {
        background: #1d2d50;
        color: #ccd6f6;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
      }

      pre {
        color: #a8b2d1;
        padding: 14px;
        margin: 0;
        font-size: 13px;
        font-family: 'Fira Code', 'Menlo', monospace;
        white-space: pre-wrap;
      }
    }
  }
}

.nav-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #0a192f;
  border-top: 1px solid #233554;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 100;

  .nav-buttons {
    display: flex;
    align-items: center;
  }

  .nav-dots {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 800px;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #233554;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #64ffda;
      }

      &.active {
        background: #64ffda;
        box-shadow: 0 0 8px rgba(100, 255, 218, 0.5);
      }

      &.in-progress {
        background: #ffd700;
      }

      &.done {
        background: #4caf50;
      }
    }
  }
}

/deep/ .ivu-divider {
  background: #233554;
  margin: 20px 0;
}

/deep/ .ivu-progress-bg {
  background: linear-gradient(90deg, #64ffda, #4fc3f7);
}
</style>
