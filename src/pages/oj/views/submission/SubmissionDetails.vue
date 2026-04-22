<template>
  <div class="submission-details-elegant">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-line"></span>
        {{ $t('m.Submission_Details') }}
        <span class="title-line"></span>
      </h1>
      <p class="page-subtitle">View Your Code & Results</p>
    </div>

    <div class="details-panel">
      <!-- 状态信息 -->
      <div class="status-section">
        <Alert :type="status.type" showIcon>
          <span class="status-title">{{$t('m.' + status.statusName.replace(/ /g, "_"))}}</span>
          <div slot="desc" class="status-content">
            <template v-if="isCE">
              <pre>{{submission.statistic_info.err_info}}</pre>
            </template>
            <template v-else>
              <span>{{$t('m.Time')}}: {{submission.statistic_info.time_cost | submissionTime}}</span>
              <span>{{$t('m.Memory')}}: {{submission.statistic_info.memory_cost | submissionMemory}}</span>
              <span>{{$t('m.Lang')}}: {{submission.language}}</span>
              <span>{{$t('m.Author')}}: {{submission.username}}</span>
            </template>
          </div>
        </Alert>
      </div>

      <!-- 测试点详情 -->
      <div v-if="submission.info && !isCE" class="test-cases-section">
        <div class="section-header">
          <Icon type="ios-list" />
          <span>{{ $t('m.Test_Cases') }}</span>
        </div>
        <Table stripe :loading="loading" :disabled-hover="true" :columns="columns" :data="submission.info.data"></Table>
      </div>

      <!-- 代码展示 -->
      <div class="code-section">
        <div class="section-header">
          <Icon type="ios-code" />
          <span>{{ $t('m.Your_Code') }}</span>
        </div>
        <Highlight :code="submission.code" :language="submission.language" :border-color="status.color"></Highlight>
      </div>

      <!-- 分享按钮 -->
      <div v-if="submission.can_unshare" class="share-section">
        <Button v-if="submission.shared"
                type="warning" size="large" @click="shareSubmission(false)">
          {{$t('m.UnShare')}}
        </Button>
        <Button v-else
                type="primary" size="large" @click="shareSubmission(true)">
          {{$t('m.Share')}}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
  import api from '@oj/api'
  import {JUDGE_STATUS} from '@/utils/constants'
  import utils from '@/utils/utils'
  import Highlight from '@/pages/oj/components/Highlight'

  export default {
    name: 'submissionDetails',
    components: {
      Highlight
    },
    data () {
      return {
        columns: [
          {
            title: this.$i18n.t('m.ID'),
            align: 'center',
            type: 'index'
          },
          {
            title: this.$i18n.t('m.Status'),
            align: 'center',
            render: (h, params) => {
              return h('Tag', {
                props: {
                  color: JUDGE_STATUS[params.row.result].color
                }
              }, this.$i18n.t('m.' + JUDGE_STATUS[params.row.result].name.replace(/ /g, '_')))
            }
          },
          {
            title: this.$i18n.t('m.Memory'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionMemoryFormat(params.row.memory))
            }
          },
          {
            title: this.$i18n.t('m.Time'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionTimeFormat(params.row.cpu_time))
            }
          }
        ],
        submission: {
          result: '0',
          code: '',
          info: {
            data: []
          },
          statistic_info: {
            time_cost: '',
            memory_cost: ''
          }
        },
        isConcat: false,
        loading: false
      }
    },
    mounted () {
      this.getSubmission()
    },
    methods: {
      getSubmission () {
        this.loading = true
        api.getSubmission(this.$route.params.id).then(res => {
          this.loading = false
          let data = res.data.data
          if (data.info && data.info.data && !this.isConcat) {
            // score exist means the submission is OI problem submission
            if (data.info.data[0].score !== undefined) {
              this.isConcat = true
              const scoreColumn = {
                title: this.$i18n.t('m.Score'),
                align: 'center',
                key: 'score'
              }
              this.columns.push(scoreColumn)
              this.loadingTable = false
            }
            if (this.isAdminRole) {
              this.isConcat = true
              const adminColumn = [
                {
                  title: this.$i18n.t('m.Real_Time'),
                  align: 'center',
                  render: (h, params) => {
                    return h('span', utils.submissionTimeFormat(params.row.real_time))
                  }
                },
                {
                  title: this.$i18n.t('m.Signal'),
                  align: 'center',
                  key: 'signal'
                }
              ]
              this.columns = this.columns.concat(adminColumn)
            }
          }
          this.submission = data
        }, () => {
          this.loading = false
        })
      },
      shareSubmission (shared) {
        let data = {id: this.submission.id, shared: shared}
        api.updateSubmission(data).then(res => {
          this.getSubmission()
          this.$success(this.$i18n.t('m.Succeeded'))
        }, () => {
        })
      }
    },
    computed: {
      status () {
        return {
          type: JUDGE_STATUS[this.submission.result].type,
          statusName: JUDGE_STATUS[this.submission.result].name,
          color: JUDGE_STATUS[this.submission.result].color
        }
      },
      isCE () {
        return this.submission.result === -2
      },
      isAdminRole () {
        return this.$store.getters.isAdminRole
      }
    }
  }
</script>

<style scoped lang="less">
.submission-details-elegant {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;

  .page-title {
    font-size: 2.2rem;
    font-weight: 600;
    color: #1e3a8a;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 12px;

    .title-line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #1e3a8a, #3b82f6, transparent);
      border-radius: 1px;
    }
  }

  .page-subtitle {
    font-size: 1rem;
    color: #64748b;
    letter-spacing: 0.1em;
    font-weight: 400;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主面板 */
.details-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 40px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }
}

/* 状态区域 */
.status-section {
  margin-bottom: 32px;

  .status-title {
    font-size: 1.3rem;
    font-weight: 600;
  }

  .status-content {
    margin-top: 12px;
    font-size: 14px;
    
    span {
      margin-right: 20px;
      display: inline-block;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-all;
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-top: 8px;
    }
  }
}

/* 测试用例区域 */
.test-cases-section {
  margin-bottom: 32px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;

    .ivu-icon {
      font-size: 20px;
    }
  }
}

/* 代码区域 */
.code-section {
  margin-bottom: 32px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;

    .ivu-icon {
      font-size: 20px;
    }
  }
}

/* 分享按钮区域 */
.share-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
</style>
