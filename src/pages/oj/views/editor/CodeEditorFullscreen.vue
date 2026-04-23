<template>
  <div class="code-editor-fullscreen">
    <div class="editor-header">
      <div class="header-left">
        <Button type="text" @click="goBack" class="back-btn">
          <Icon type="ios-arrow-back" size="20" />
          <span>{{ $t('m.Back') }}</span>
        </Button>
        <Icon type="ios-code" size="20" />
        <span class="header-title">{{ $t('m.Code_Editor') }}</span>
      </div>
      <div class="header-right">
        <span class="header-info">{{ $t('m.Free_Code_Editor_Desc') }}</span>
      </div>
    </div>

    <div class="editor-body">
      <CodeMirror 
        :value.sync="code"
        :languages="languages"
        :language="language"
        :theme="theme"
        @changeLang="onChangeLang"
        @changeTheme="onChangeTheme"
        @resetCode="onResetCode"
      />

      <div class="editor-actions">
        <Button 
          type="primary" 
          @click="submitCode" 
          :loading="submitting"
          size="large"
          icon="edit"
        >
          {{ $t('m.Run_Code') }}
        </Button>
        <Button @click="clearCode" size="large" icon="ios-trash">
          {{ $t('m.Clear') }}
        </Button>
        <Button @click="copyCode" size="large" icon="ios-copy">
          {{ $t('m.Copy') }}
        </Button>
      </div>

      <div v-if="submissionResult" class="result-container">
        <div class="result-header">
          <h4>{{ $t('m.Run_Result') }}</h4>
          <span :class="['status-badge', getStatusInfo(submissionResult).class]">
            {{ getStatusInfo(submissionResult).text }}
          </span>
        </div>
        <div class="result-details">
          <div class="result-row" v-if="submissionResult.statistic_info">
            <div class="result-item">
              <span class="label">{{ $t('m.Run_Time') }}:</span>
              <span class="value">{{ submissionResult.statistic_info.time_cost || 'N/A' }} ms</span>
            </div>
            <div class="result-item">
              <span class="label">{{ $t('m.Memory_Usage') }}:</span>
              <span class="value">{{ submissionResult.statistic_info.memory_cost || 'N/A' }} KB</span>
            </div>
          </div>
          <div class="result-row output-row" v-if="submissionResult.statistic_info && submissionResult.statistic_info.output">
            <div class="output-label">{{ $t('m.Program_Output') }}:</div>
            <pre class="program-output">{{ submissionResult.statistic_info.output }}</pre>
          </div>
          <div class="result-row" v-if="submissionResult.statistic_info && submissionResult.result === -2">
            <div class="output-label">{{ $t('m.Compile_Error') }}:</div>
            <pre class="error-output">{{ submissionResult.statistic_info.err_info || $t('m.Compile_Error') }}</pre>
          </div>
          <div class="result-row" v-if="submissionResult.info && submissionResult.info.data">
            <div class="output-label">{{ $t('m.Detailed_Result') }}:</div>
            <div class="test-case-results">
              <div v-for="(tc, idx) in submissionResult.info.data" :key="idx" class="test-case">
                <span class="tc-label">{{ $t('m.Test_Point') }} {{ tc.test_case }}:</span>
                <span :class="['tc-status', tc.result === 0 ? 'success' : 'error']">
                  {{ tc.result === 0 ? $t('m.Passed') : $t('m.Failed') }}
                </span>
                <span class="tc-info">CPU: {{ tc.cpu_time }}ms | {{ $t('m.Memory') }}: {{ tc.memory }}KB</span>
                <pre v-if="tc.output" class="tc-output">{{ tc.output }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CodeMirror from '@oj/components/CodeMirror.vue'
import axios from 'axios'

const defaultCode = {
  'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  'C': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  'Java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  'Python3': 'print("Hello, World!")',
  'JavaScript': 'console.log("Hello, World!");',
  'Go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
}

export default {
  name: 'CodeEditorFullscreen',
  components: {
    CodeMirror
  },
  data() {
    return {
      code: defaultCode['C++'],
      language: 'C++',
      theme: 'solarized',
      submitting: false,
      submissionResult: null,
      languages: ['C', 'C++', 'Java', 'Python3', 'JavaScript', 'Go'],
      statusMap: {
        0: { text: '运行成功', class: 'success' },
        '-2': { text: '编译错误', class: 'error' },
        1: { text: 'CPU超时', class: 'error' },
        2: { text: '实时超时', class: 'error' },
        3: { text: '内存超限', class: 'error' },
        4: { text: '运行错误', class: 'error' },
        5: { text: '系统错误', class: 'error' },
        6: { text: '等待中', class: 'pending' },
        7: { text: '判题中', class: 'pending' }
      }
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    onChangeLang(lang) {
      this.language = lang
    },
    onChangeTheme(theme) {
      this.theme = theme
    },
    onResetCode() {
      this.code = defaultCode[this.language] || defaultCode['C++']
    },
    clearCode() {
      this.code = ''
      this.submissionResult = null
    },
    copyCode() {
      var self = this
      navigator.clipboard.writeText(this.code).then(function() {
        self.$Message.success(self.$t('m.Code_Copied'))
      }).catch(function() {
        self.$Message.error(self.$t('m.Copy_Failed'))
      })
    },
    submitCode() {
      if (this.code.trim() === '') {
        this.$Message.error(this.$t('m.Code_Cannot_Be_Empty'))
        return
      }

      this.submitting = true
      this.submissionResult = null

      var self = this
      axios.post('/code_run/', {
        code: this.code,
        language: this.language
      }).then(function(res) {
        self.$Message.success(self.$t('m.Code_Submit_Success'))
        var codeRunId = res.data.data.code_run_id
        if (codeRunId) {
          self.pollSubmissionStatus(codeRunId)
        }
      }).catch(function(err) {
        var errorMsg = (err.response && err.response.data && err.response.data.error) || err.message || self.$t('m.Submit_Failed')
        self.$Message.error(errorMsg)
        self.submissionResult = {
          error: errorMsg,
          result: 5
        }
      }).finally(function() {
        self.submitting = false
      })
    },
    pollSubmissionStatus(codeRunId) {
      var self = this
      var poll = function() {
        axios.get('/code_run/', {
          params: { id: codeRunId }
        }).then(function(res) {
          var data = res.data.data
          var result = data.result
          
          if (result === 6 || result === 7) {
            self.submissionResult = data
            setTimeout(poll, 1000)
          } else {
            self.submissionResult = data
            var statusInfo = self.statusMap[result]
            if (statusInfo && statusInfo.class === 'success') {
              self.$Message.success(statusInfo.text)
            }
          }
        }).catch(function() {
          setTimeout(poll, 1000)
        })
      }
      poll()
    },
    getStatusInfo(result) {
      var resultCode = result.result
      var status = this.statusMap[resultCode] || { text: '未知状态', class: 'pending' }
      var statusTextMap = {
        0: this.$t('m.Run_Success'),
        '-2': this.$t('m.Compile_Error'),
        1: this.$t('m.CPU_Timeout'),
        2: this.$t('m.Realtime_Timeout'),
        3: this.$t('m.Memory_Exceeded'),
        4: this.$t('m.Runtime_Error'),
        5: this.$t('m.System_Error'),
        6: this.$t('m.Waiting'),
        7: this.$t('m.Judging')
      }
      return {
        text: statusTextMap[resultCode] || status.text,
        class: status.class
      }
    }
  }
}
</script>

<style lang="less" scoped>
.code-editor-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1e1e2e;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

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

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    .header-info {
      font-size: 13px;
      opacity: 0.9;
    }
  }
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow-y: auto;
}

.editor-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.result-container {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.success {
        background: rgba(25, 190, 107, 0.2);
        color: #19be6b;
        border: 1px solid rgba(25, 190, 107, 0.3);
      }

      &.error {
        background: rgba(237, 64, 20, 0.2);
        color: #ff6b6b;
        border: 1px solid rgba(237, 64, 20, 0.3);
      }

      &.pending {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
        border: 1px solid rgba(255, 193, 7, 0.3);
      }
    }
  }

  .result-details {
    .result-row {
      display: flex;
      gap: 20px;
      margin-bottom: 10px;

      &.output-row {
        flex-direction: column;
        gap: 8px;
      }
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }

      .value {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
      }
    }

    .output-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .program-output {
      padding: 14px;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 400px;
      overflow-y: auto;
      background: rgba(25, 190, 107, 0.1);
      color: #19be6b;
      border: 1px solid rgba(25, 190, 107, 0.2);
    }

    .error-output {
      padding: 14px;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
      background: rgba(237, 64, 20, 0.1);
      color: #ff6b6b;
      border: 1px solid rgba(237, 64, 20, 0.2);
    }

    .test-case-results {
      width: 100%;

      .test-case {
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;

        .tc-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin-right: 8px;
        }

        .tc-status {
          font-size: 13px;
          font-weight: 600;
          margin-right: 8px;

          &.success {
            color: #19be6b;
          }

          &.error {
            color: #ff6b6b;
          }
        }

        .tc-info {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .tc-output {
          margin-top: 8px;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
}
</style>
