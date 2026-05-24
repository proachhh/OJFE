<template>
  <div class="immersion-container">
    <div v-if="loading" class="loading-state">
      <Spin size="large">
        <Icon type="ios-loading" size="48" class="spin-icon"></Icon>
        <div>{{ $t('m.Immersion_Loading') }}</div>
      </Spin>
    </div>

    <div v-else-if="!problemList.length" class="empty-state">
      <Icon type="ios-sad-outline" size="64" />
      <p>{{ $t('m.No_Recommendations_Immersion') }}</p>
      <Button type="primary" @click="goProblemList">去题目列表</Button>
      <Button @click="refetch" style="margin-left: 8px">重新加载</Button>
    </div>

    <div v-else class="flex-container">
      <div id="problem-main">
        <Panel padding="40" shadow>
          <div slot="title" class="panel-title-row">
            <span>{{ currentProblem.title }}</span>
            <span class="diff-tag" :class="diffClass">{{ diffLabel }}</span>
          </div>

          <div v-if="currentProblem.reason" class="reason-note">
            <span class="rn-dot"></span>
            <span>{{ currentProblem.reason }}</span>
          </div>

          <div class="meta-row">
            <Tag v-for="tag in currentProblem.tags" :key="tag" color="blue" size="small">{{ tag }}</Tag>
            <span class="meta-text">时限: {{ currentProblem.time_limit || 1000 }}ms</span>
            <span class="meta-text">内存: {{ currentProblem.memory_limit || 256 }}MB</span>
            <span class="meta-text">通过: {{ currentProblem.accepted_number || 0 }}</span>
          </div>

          <div id="problem-content" class="markdown-body" v-katex>
            <p class="title">{{ $t('m.Description') }}</p>
            <p class="content" v-html="currentProblem.description"></p>

            <p class="title">{{ $t('m.Input') }}</p>
            <p class="content" v-html="currentProblem.input_description"></p>

            <p class="title">{{ $t('m.Output') }}</p>
            <p class="content" v-html="currentProblem.output_description"></p>

            <div v-for="(sample, index) in currentProblem.samples" :key="index">
              <div class="sample">
                <div class="sample-input">
                  <p class="title">{{ $t('m.Sample_Input') }} {{ index + 1 }}</p>
                  <pre>{{ sample.input }}</pre>
                </div>
                <div class="sample-output">
                  <p class="title">{{ $t('m.Sample_Output') }} {{ index + 1 }}</p>
                  <pre>{{ sample.output }}</pre>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          <div class="code-section">
            <div class="code-header">
              <span class="code-label">语言:</span>
              <Select v-model="language" size="small" style="width: 120px">
                <Option value="C++">C++</Option>
                <Option value="C">C</Option>
                <Option value="Java">Java</Option>
                <Option value="Python">Python</Option>
              </Select>
              <span class="code-label" style="margin-left: 16px">主题:</span>
              <Select v-model="theme" size="small" style="width: 120px">
                <Option value="monokai">Monokai</Option>
                <Option value="solarized">Solarized</Option>
                <Option value="material">Material</Option>
              </Select>
            </div>
            <codemirror v-model="code" :options="editorOptions" class="code-editor" />
            <div class="submit-row">
              <div class="submit-status" v-if="submitStatus">
                <Tag :color="submitStatusColor">{{ submitStatus }}</Tag>
              </div>
              <Button type="warning" :loading="submitting" @click="submitCode" :disabled="!code.trim()">
                <Icon type="edit" /> 提交
              </Button>
            </div>
          </div>
        </Panel>

        <div class="nav-bottom">
          <Button @click="prevProblem" :disabled="currentIndex <= 0">
            <Icon type="ios-arrow-back" /> 上一题
          </Button>
          <div class="nav-center">
            <div class="dot-nav">
              <span
                v-for="(p, idx) in problemList"
                :key="p._id"
                class="dot"
                :class="{ active: idx === currentIndex }"
                @click="jumpTo(idx)"
                :title="p._id + '. ' + p.title"
              ></span>
            </div>
            <span class="progress-text">{{ currentIndex + 1 }} / {{ problemList.length }}</span>
          </div>
          <Button @click="nextProblem" :disabled="currentIndex >= problemList.length - 1">
            下一题 <Icon type="ios-arrow-forward" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import { codemirror } from 'vue-codemirror-lite'
import 'codemirror/theme/monokai.css'
import 'codemirror/theme/solarized.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/javascript/javascript.js'

const DEFAULT_CODE = {
  'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  'C': '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n',
  'Java': 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  'Python': '# Write your code here\n'
}

const MODE_MAP = {
  'C++': 'text/x-csrc',
  'C': 'text/x-csrc',
  'Java': 'text/x-java',
  'Python': 'text/x-python'
}

export default {
  name: 'ImmersionPractice',
  components: { codemirror },
  data () {
    return {
      loading: true,
      problemList: [],
      currentIndex: 0,
      code: '',
      language: 'C++',
      theme: 'monokai',
      submitting: false,
      submitStatus: ''
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    currentProblem () {
      return this.problemList[this.currentIndex] || {}
    },
    diffLabel () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return '简单'
        if (d <= 2) return '普通'
        if (d <= 3) return '中等'
        if (d <= 4) return '较难'
        return '困难'
      }
      return String(d || '未知')
    },
    diffClass () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return 'easy'
        if (d <= 2) return 'easy'
        if (d <= 3) return 'mid'
        return 'hard'
      }
      if (d === 'Low') return 'easy'
      if (d === 'Mid') return 'mid'
      return 'hard'
    },
    tagColor () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return 'success'
        if (d <= 2) return 'success'
        if (d <= 3) return 'warning'
        return 'error'
      }
      if (d === 'Low') return 'success'
      if (d === 'Mid') return 'warning'
      return 'error'
    },
    submitStatusColor () {
      if (!this.submitStatus) return 'default'
      return this.submitStatus.includes('成功') ? 'success' : 'error'
    },
    editorOptions () {
      return {
        tabSize: 4,
        mode: MODE_MAP[this.language] || 'text/x-csrc',
        theme: this.theme,
        lineNumbers: true,
        line: true,
        lineWrapping: true,
        styleSelectedText: true,
        autofocus: false
      }
    }
  },
  watch: {
    language (val) {
      if (!this.code || this.code === DEFAULT_CODE[this._prevLang || '']) {
        this.code = DEFAULT_CODE[val] || ''
      }
      this._prevLang = val
    },
    currentIndex () {
      this.code = DEFAULT_CODE[this.language] || ''
      this.submitStatus = ''
    }
  },
  created () {
    this._prevLang = this.language
    this.code = DEFAULT_CODE[this.language] || ''
    if (!this.isAuthenticated) {
      this.$router.push({name: 'home'})
      return
    }
    this.loadProblems()
  },
  methods: {
    loadProblems () {
      this.loading = true
      return api.getImmersionRecommendations({ limit: 15, offset: 0 })
        .then(res => {
          const data = res.data || res || {}
          this.problemList = data.problems || data.recommendations || []
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },
    refetch () {
      this.currentIndex = 0
      this.loadProblems()
    },
    prevProblem () {
      if (this.currentIndex > 0) {
        this.currentIndex--
      }
    },
    nextProblem () {
      if (this.currentIndex < this.problemList.length - 1) {
        this.currentIndex++
      }
    },
    jumpTo (idx) {
      if (idx >= 0 && idx < this.problemList.length) {
        this.currentIndex = idx
      }
    },
    async submitCode () {
      if (!this.code.trim()) {
        this.$Message.error('代码不能为空')
        return
      }
      const problem = this.currentProblem
      if (!problem || !problem.id) {
        this.$Message.error('题目信息不完整')
        return
      }
      this.submitting = true
      this.submitStatus = ''
      try {
        const res = await api.submitCode({
          problem_id: problem.id,
          language: this.language,
          code: this.code
        })
        if (res.data && res.data.data && res.data.data.submission_id) {
          this.submitStatus = '提交成功！'
        } else {
          this.submitStatus = '提交成功'
        }
        this.$Message.success('代码提交成功')
      } catch (e) {
        const errMsg = (e.response && e.response.data && e.response.data.error) || '提交失败'
        this.submitStatus = '提交失败：' + errMsg
        this.$Message.error(errMsg)
      } finally {
        this.submitting = false
      }
    },
    goProblemList () {
      this.$router.push({name: 'problem-list'})
    }
  }
}
</script>

<style lang="less" scoped>
.immersion-container {
  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #808695;
    .spin-icon { animation: spin 1s linear infinite; margin-bottom: 16px; }
    p { margin: 16px 0; font-size: 17px; }
  }
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.flex-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 60px;
}

#problem-main {
  .panel-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 600;

    .diff-tag {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 4px;
      line-height: 22px;

      &.easy { background: #19be6b; color: #fff; }
      &.mid { background: #f90; color: #fff; }
      &.hard { background: #ed4014; color: #fff; }
    }
  }

  .reason-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #515a6e;
    font-size: 15px;
    line-height: 1.7;
    padding: 14px 18px;
    margin-bottom: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #2d8cf0;
    .rn-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2d8cf0;
      margin-top: 8px;
    }
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    .meta-text {
      color: #808695;
      font-size: 13px;
      margin-left: 8px;
    }
  }

  #problem-content {
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #17233d;
      margin: 24px 0 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8eaec;
    }
    .content {
      font-size: 16px;
      line-height: 1.9;
      color: #515a6e;
      /deep/ p { margin: 8px 0; }
    }
    .sample {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      .sample-input, .sample-output {
        flex: 1;
        pre {
          background: #f5f7fa;
          border: 1px solid #e8eaec;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.7;
          color: #333;
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
        }
      }
    }
  }

  .code-section {
    .code-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      .code-label { font-size: 14px; color: #515a6e; }
    }
    .code-editor {
      /deep/ .CodeMirror { height: 320px; border-radius: 6px; border: 1px solid #e8eaec; font-size: 15px; }
    }
    .submit-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
      .submit-status { font-size: 14px; }
    }
  }

  .nav-bottom {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding: 14px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .nav-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .dot-nav {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #e8eaec;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: #2d8cf0; opacity: 0.6; }
        &.active { background: #2d8cf0; transform: scale(1.3); }
      }
    }

    .progress-text {
      font-size: 15px;
      font-weight: 600;
      color: #17233d;
    }
  }
}
</style>
