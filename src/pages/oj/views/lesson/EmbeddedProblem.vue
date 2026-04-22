<template>
  <div class="embedded-problem">
    <div class="problem-content-wrapper">
      <!-- 题目描述区 -->
      <div class="problem-description-section">
        <div class="problem-header">
          <h1>{{ problem.title }}</h1>
          <Tag :color="getDifficultyColor(problem.difficulty)">{{ problem.difficulty }}</Tag>
        </div>
        <div class="markdown-body" v-katex>
          <p class="title">Description</p>
          <p class="content" v-html="problem.description"></p>

          <p class="title">Input <span v-if="problem.io_mode.io_mode=='File IO'">(FromFile: {{ problem.io_mode.input }})</span></p>
          <p class="content" v-html="problem.input_description"></p>

          <p class="title">Output <span v-if="problem.io_mode.io_mode=='File IO'">(ToFile: {{ problem.io_mode.output }})</span></p>
          <p class="content" v-html="problem.output_description"></p>

          <div v-for="(sample, index) of problem.samples" :key="index">
            <div class="sample-container">
              <div class="sample-input">
                <p class="title">Sample Input {{ index + 1 }}
                  <a class="copy" v-clipboard:copy="sample.input" v-clipboard:success="onCopy" v-clipboard:error="onCopyError">
                    <Icon type="clipboard"></Icon>
                  </a>
                </p>
                <pre>{{ sample.input }}</pre>
              </div>
              <div class="sample-output">
                <p class="title">Sample Output {{ index + 1 }}</p>
                <pre>{{ sample.output }}</pre>
              </div>
            </div>
          </div>

          <div v-if="problem.hint">
            <p class="title">Hint</p>
            <div class="hint-content" v-html="problem.hint"></div>
          </div>

          <div v-if="problem.source">
            <p class="title">Source</p>
            <p class="content">{{ problem.source }}</p>
          </div>

          <div class="problem-info-bar">
            <span class="info-item">Time Limit: {{ problem.time_limit }}MS</span>
            <span class="info-item">Memory Limit: {{ problem.memory_limit }}MB</span>
          </div>
        </div>
      </div>

      <!-- 代码编辑区 -->
      <div class="code-editor-section">
        <CodeMirror 
          :value.sync="code"
          :languages="problem.languages"
          :language="language"
          :theme="theme"
          @resetCode="onResetToTemplate"
          @changeTheme="onChangeTheme"
          @changeLang="onChangeLang"
        ></CodeMirror>
        
        <div class="submit-bar">
          <div class="status" v-if="statusVisible">
            <span>Status</span>
            <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/'+submissionId)">
              {{ submissionStatus.text.replace(/ /g, "_") }}
            </Tag>
          </div>
          <div v-else-if="problem.my_status === 0">
            <Alert type="success" show-icon>You have solved the problem</Alert>
          </div>
          
          <Button 
            type="warning" 
            icon="edit" 
            :loading="submitting" 
            @click="submitCode"
            :disabled="submitting"
            class="submit-btn"
          >
            <span v-if="submitting">Submitting</span>
            <span v-else>Submit</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import CodeMirror from '@oj/components/CodeMirror.vue'
import storage from '@/utils/storage'
import { JUDGE_STATUS, buildProblemCodeKey } from '@/utils/constants'

export default {
  name: 'EmbeddedProblem',
  components: {
    CodeMirror
  },
  props: {
    problemId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      problem: {
        title: '',
        description: '',
        hint: '',
        my_status: '',
        template: {},
        languages: [],
        created_by: { username: '' },
        tags: [],
        io_mode: { io_mode: 'Standard IO' },
        time_limit: 0,
        memory_limit: 0,
        difficulty: '',
        samples: []
      },
      code: '',
      language: 'C++',
      theme: 'solarized',
      submitting: false,
      statusVisible: false,
      submissionId: '',
      captchaRequired: false,
      captchaCode: '',
      captchaSrc: '',
      result: { result: 9 }
    }
  },
  computed: {
    submissionStatus () {
      const resultValue = this.result && this.result.result
      return {
        text: JUDGE_STATUS[resultValue] ? JUDGE_STATUS[resultValue].name : 'Unknown',
        color: JUDGE_STATUS[resultValue] ? JUDGE_STATUS[resultValue].color : 'default'
      }
    }
  },
  watch: {
    problemId: {
      handler () {
        this.loadProblem()
      },
      immediate: true
    }
  },
  mounted () {
    this.loadProblem()
  },
  methods: {
    loadProblem () {
      if (!this.problemId) return
      api.getProblem(this.problemId).then(res => {
        this.problem = res.data.data
        this.problem.languages = this.problem.languages.sort()
        
        let problemCode = storage.get(buildProblemCodeKey(this.problem._id, null))
        if (problemCode) {
          this.language = problemCode.language
          this.code = problemCode.code
          this.theme = problemCode.theme
        } else {
          this.language = this.problem.languages[0]
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          }
        }
      })
    },
    getDifficultyColor (difficulty) {
      const colors = {
        'Low': 'green',
        'Mid': 'blue',
        'High': 'red'
      }
      return colors[difficulty] || 'default'
    },
    onChangeLang (newLang) {
      if (this.problem.template[newLang]) {
        if (this.code.trim() === '') {
          this.code = this.problem.template[newLang]
        }
      }
      this.language = newLang
    },
    onChangeTheme (newTheme) {
      this.theme = newTheme
    },
    onResetToTemplate () {
      this.$Modal.confirm({
        content: 'Are you sure you want to reset your code?',
        onOk: () => {
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          } else {
            this.code = ''
          }
        }
      })
    },
    submitCode () {
      if (this.code.trim() === '') {
        this.$error('Code can not be empty')
        return
      }
      this.submitting = true
      let data = {
        problem_id: this.problem.id,
        language: this.language,
        code: this.code
      }
      if (this.captchaRequired) {
        data.captcha = this.captchaCode
      }
      
      api.submitCode(data).then(res => {
        this.submissionId = res.data.data && res.data.data.submission_id
        this.statusVisible = true
        this.submitting = false
        this.checkSubmissionStatus()
      }, res => {
        this.getCaptchaSrc()
        if (res.data.data && res.data.data.startsWith('Captcha is required')) {
          this.captchaRequired = true
        }
        this.submitting = false
        this.statusVisible = false
      })
    },
    checkSubmissionStatus () {
      const checkStatus = () => {
        api.getSubmission(this.submissionId).then(res => {
          this.result = res.data.data
          if (Object.keys(res.data.data.statistic_info || {}).length !== 0) {
            this.submitting = false
            clearTimeout(this.refreshStatus)
          } else {
            this.refreshStatus = setTimeout(checkStatus, 2000)
          }
        }, () => {
          this.submitting = false
          clearTimeout(this.refreshStatus)
        })
      }
      this.refreshStatus = setTimeout(checkStatus, 2000)
    },
    getCaptchaSrc () {
      // Implement captcha logic if needed
    },
    handleRoute (route) {
      this.$router.push(route)
    },
    onCopy (event) {
      this.$success('Code copied')
    },
    onCopyError (e) {
      this.$error('Failed to copy code')
    }
  }
}
</script>

<style lang="less" scoped>
.embedded-problem {
  height: 100%;
  overflow: hidden;
}

.problem-content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.problem-description-section {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;

  .problem-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    h1 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0;
    }
  }

  .title {
    font-size: 16px;
    font-weight: 500;
    margin: 20px 0 8px 0;
    color: #3091f2;

    .copy {
      padding-left: 8px;
    }
  }

  .content {
    margin-left: 20px;
    margin-right: 20px;
    font-size: 14px;
    line-height: 1.6;
  }

  .sample-container {
    display: flex;
    gap: 16px;
    margin: 12px 0;

    .sample-input, .sample-output {
      flex: 1;

      pre {
        background: #f1f5f9;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 13px;
      }
    }
  }

  .hint-content {
    margin-left: 20px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
  }

  .problem-info-bar {
    display: flex;
    gap: 20px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;

    .info-item {
      font-size: 0.85rem;
      color: #64748b;
    }
  }
}

.code-editor-section {
  padding: 16px;
  background: #f8fafc;

  .submit-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .status {
      span {
        margin-right: 8px;
      }
    }

    .submit-btn {
      min-width: 120px;
    }
  }
}
</style>
