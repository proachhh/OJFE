<template>
  <div class="flex-container" :class="{ 'full-width-layout': layoutMode === 'horizontal' }">
    <div id="problem-main">
      <!-- 布局切换 -->
      <div class="layout-toggle-row">
        <RadioGroup v-model="layoutMode" type="button" size="small">
          <Radio label="vertical">
            <span style="font-size: 12px">上下</span>
          </Radio>
          <Radio label="horizontal">
            <span style="font-size: 12px">左右</span>
          </Radio>
        </RadioGroup>
      </div>

      <!-- 题目描述 + 代码编辑器容器 -->
      <div class="problem-layout-wrapper" :class="layoutMode">
        <div class="layout-left" :style="layoutLeftStyle">
          <Panel :padding="40" shadow>
            <div slot="title" class="problem-title-header">
              <span class="problem-title-id">{{problem._id}}</span>
              <span class="problem-title-text">{{problem.title}}</span>
            </div>
            <div id="problem-content" class="markdown-body" v-katex>
              <p class="title">{{$t('m.Description')}}</p>
              <p class="content" v-html=problem.description></p>
              <p class="title">{{$t('m.Input')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.FromFile')}}: {{ problem.io_mode.input }})</span></p>
              <p class="content" v-html=problem.input_description></p>
              <p class="title">{{$t('m.Output')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.ToFile')}}: {{ problem.io_mode.output }})</span></p>
              <p class="content" v-html=problem.output_description></p>

              <div v-for="(sample, index) of problem.samples" :key="index">
                <div class="sample">
                  <div class="sample-input">
                    <p class="title">{{$t('m.Sample_Input')}} {{index + 1}}
                      <a class="copy"
                         v-clipboard:copy="sample.input"
                         v-clipboard:success="onCopy"
                         v-clipboard:error="onCopyError">
                        <Icon type="clipboard"></Icon>
                      </a>
                    </p>
                    <pre>{{sample.input}}</pre>
                  </div>
                  <div class="sample-output">
                    <p class="title">{{$t('m.Sample_Output')}} {{index + 1}}</p>
                    <pre>{{sample.output}}</pre>
                  </div>
                </div>
              </div>

              <div v-if="problem.hint">
                <p class="title">{{$t('m.Hint')}}</p>
                <Card dis-hover>
                  <div class="content" v-html=problem.hint></div>
                </Card>
              </div>

              <div v-if="problem.source">
                <p class="title">{{$t('m.Source')}}</p>
                <p class="content">{{problem.source}}</p>
              </div>

              <div v-if="layoutMode === 'horizontal'" class="problem-info-inline">
                <Divider />
                <div class="info-inline-grid">
                  <span class="info-inline-item"><b>ID</b> {{problem._id}}</span>
                  <span class="info-inline-item"><b>{{$t('m.Time_Limit')}}</b> {{problem.time_limit}}MS</span>
                  <span class="info-inline-item"><b>{{$t('m.Memory_Limit')}}</b> {{problem.memory_limit}}MB</span>
                  <span class="info-inline-item"><b>{{$t('m.IOMode')}}</b> {{problem.io_mode.io_mode}}</span>
                  <span class="info-inline-item"><b>{{$t('m.Created')}}</b> {{problem.created_by.username}}</span>
                  <span v-if="problem.difficulty" class="info-inline-item"><b>{{$t('m.Level')}}</b> {{$t('m.' + problem.difficulty)}}</span>
                  <span v-if="problem.total_score" class="info-inline-item"><b>{{$t('m.Score')}}</b> {{problem.total_score}}</span>
                  <span class="info-inline-item"><b>{{$t('m.Tags')}}</b>
                    <Tag v-for="tag in problem.tags" :key="tag" size="small">{{$t('m.tag.' + tag, tag)}}</Tag>
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div v-if="layoutMode === 'horizontal'" class="resize-handle" @mousedown="startResize"></div>
        <div v-show="isResizing" class="resize-overlay" @mouseup="stopResize" @mousemove="handleResize"></div>

        <div class="layout-right" :style="layoutRightStyle">
          <!-- 智能解题提示 -->
          <AICard
            title="智能解题提示"
            icon="ios-bulb"
            iconColor="#ff9900"
            btnText="获取提示"
            btnType="warning"
            :fetchFn="fetchHint"
          />

          <Card :padding="20" id="submit-code" dis-hover>
        <CodeMirror :value.sync="code"
                    :languages="problem.languages"
                    :language="language"
                    :theme="theme"
                    @resetCode="onResetToTemplate"
                    @changeTheme="onChangeTheme"
                    @changeLang="onChangeLang"></CodeMirror>
        <Row type="flex" justify="space-between">
          <Col :span="10">
            <div class="status" v-if="statusVisible">
              <template v-if="!this.contestID || (this.contestID && OIContestRealTimePermission)">
                <span>{{$t('m.Status')}}</span>
                <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/'+submissionId)">
                  {{$t('m.' + submissionStatus.text.replace(/ /g, "_"))}}
                </Tag>
              </template>
              <template v-else-if="this.contestID && !OIContestRealTimePermission">
                <Alert type="success" show-icon>{{$t('m.Submitted_successfully')}}</Alert>
              </template>
            </div>
            <div v-else-if="problem.my_status === 0">
              <Alert type="success" show-icon>{{$t('m.You_have_solved_the_problem')}}</Alert>
            </div>
            <div v-else-if="this.contestID && !OIContestRealTimePermission && submissionExists">
              <Alert type="success" show-icon>{{$t('m.You_have_submitted_a_solution')}}</Alert>
            </div>
            <div v-if="contestEnded">
              <Alert type="warning" show-icon>{{$t('m.Contest_has_ended')}}</Alert>
            </div>
          </Col>

          <Col :span="12">
            <template v-if="captchaRequired">
              <div class="captcha-container">
                <Tooltip v-if="captchaRequired" content="Click to refresh" placement="top">
                  <img :src="captchaSrc" @click="getCaptchaSrc"/>
                </Tooltip>
                <Input v-model="captchaCode" class="captcha-code"/>
              </div>
            </template>
            <Button type="warning" icon="edit" :loading="submitting" @click="submitCode"
                    :disabled="problemSubmitDisabled || submitted"
                    class="fl-right">
              <span v-if="submitting">{{$t('m.Submitting')}}</span>
              <span v-else>{{$t('m.Submit')}}</span>
            </Button>
          </Col>
        </Row>
      </Card>
        </div>
      </div>
    </div>

    <div id="right-column" v-show="layoutMode === 'vertical'">
      <VerticalMenu @on-click="handleRoute">
        <template v-if="this.contestID">
          <VerticalMenu-item :route="{name: 'contest-problem-list', params: {contestID: contestID}}">
            <Icon type="ios-photos"></Icon>
            {{$t('m.Problems')}}
          </VerticalMenu-item>

          <VerticalMenu-item :route="{name: 'contest-announcement-list', params: {contestID: contestID}}">
            <Icon type="chatbubble-working"></Icon>
            {{$t('m.Announcements')}}
          </VerticalMenu-item>
        </template>

        <VerticalMenu-item v-if="!this.contestID || OIContestRealTimePermission" :route="submissionRoute">
          <Icon type="navicon-round"></Icon>
           {{$t('m.Submissions')}}
        </VerticalMenu-item>

        <template v-if="this.contestID">
          <VerticalMenu-item v-if="!this.contestID || OIContestRealTimePermission"
                             :route="{name: 'contest-rank', params: {contestID: contestID}}">
            <Icon type="stats-bars"></Icon>
            {{$t('m.Rankings')}}
          </VerticalMenu-item>
          <VerticalMenu-item :route="{name: 'contest-details', params: {contestID: contestID}}">
            <Icon type="home"></Icon>
            {{$t('m.View_Contest')}}
          </VerticalMenu-item>
        </template>
      </VerticalMenu>

      <Card id="info">
        <div slot="title" class="header">
          <Icon type="information-circled"></Icon>
          <span class="card-title">{{$t('m.Information')}}</span>
        </div>
        <ul>
          <li><p>ID</p>
            <p>{{problem._id}}</p></li>
          <li>
            <p>{{$t('m.Time_Limit')}}</p>
            <p>{{problem.time_limit}}MS</p></li>
          <li>
            <p>{{$t('m.Memory_Limit')}}</p>
            <p>{{problem.memory_limit}}MB</p></li>
          <li>
            <p>{{$t('m.IOMode')}}</p>
            <p>{{problem.io_mode.io_mode}}</p>
          </li>
          <li>
            <p>{{$t('m.Created')}}</p>
            <p>{{problem.created_by.username}}</p></li>
          <li v-if="problem.difficulty">
            <p>{{$t('m.Level')}}</p>
            <p>{{$t('m.' + problem.difficulty)}}</p></li>
          <li v-if="problem.total_score">
            <p>{{$t('m.Score')}}</p>
            <p>{{problem.total_score}}</p>
          </li>
          <li>
            <p>{{$t('m.Tags')}}</p>
            <p>
              <Poptip trigger="hover" placement="left-end">
                <a>{{$t('m.Show')}}</a>
                <div slot="content">
                  <Tag v-for="tag in problem.tags" :key="tag">{{$t('m.tag.' + tag, tag)}}</Tag>
                </div>
              </Poptip>
            </p>
          </li>
        </ul>
      </Card>

      <Card id="pieChart" ref="pieChart" :padding="0">
        <div slot="title">
          <Icon type="ios-analytics"></Icon>
          <span class="card-title">{{$t('m.Statistic')}}</span>
          <Button type="ghost" size="small" id="detail" @click="graphVisible = !graphVisible">Details</Button>
        </div>
        <div class="echarts" ref="pieChartDom"></div>
      </Card>
    </div>

    <Modal v-model="graphVisible">
      <div id="pieChart-detail" ref="pieChartDetail"></div>
      <div slot="footer">
        <Button type="ghost" @click="graphVisible=false">{{$t('m.Close')}}</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex'
  import {types} from '../../../../store'
  import CodeMirror from '@oj/components/CodeMirror.vue'
  import AICard from '@oj/components/AICard.vue'
  import storage from '@/utils/storage'
  import {FormMixin} from '@oj/components/mixins'
  import {JUDGE_STATUS, CONTEST_STATUS, buildProblemCodeKey} from '@/utils/constants'
  import api from '@oj/api'
  import {pie, largePie} from './chartData'
  import * as echarts from 'echarts'

  // 只显示这些状态的图形占用
  const filtedStatus = ['-1', '-2', '0', '1', '2', '3', '4', '8']

  export default {
    name: 'Problem',
    components: {
      CodeMirror,
      AICard
    },
    mixins: [FormMixin],
    data () {
      return {
        statusVisible: false,
        captchaRequired: false,
        graphVisible: false,
        submissionExists: false,
        layoutMode: 'vertical',
        leftWidth: 50,
        isResizing: false,
        captchaCode: '',
        captchaSrc: '',
        contestID: '',
        problemID: '',
        submitting: false,
        code: '',
        language: 'C++',
        theme: 'solarized',
        submissionId: '',
        submitted: false,
        result: {
          result: 9
        },
        problem: {
          title: '',
          description: '',
          hint: '',
          my_status: '',
          template: {},
          languages: [],
          created_by: {
            username: ''
          },
          tags: [],
          io_mode: {'io_mode': 'Standard IO'}
        },
        pie: pie,
        largePie: largePie,
        pieChart: null,
        largePieChart: null,
      }
    },
    beforeRouteEnter (to, from, next) {
      let problemCode = storage.get(buildProblemCodeKey(to.params.problemID, to.params.contestID))
      if (problemCode) {
        next(vm => {
          vm.language = problemCode.language
          vm.code = problemCode.code
          vm.theme = problemCode.theme
        })
      } else {
        next()
      }
    },
    mounted () {
      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: false})
      this.init()
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      fetchHint () {
        return api.getProblemHint({
          problem_id: this.problemID,
          message: `题目《${this.problem.title || ''}》(ID: ${this.problemID}) 怎么做？请给我解题提示。`
        })
      },
      init () {
        this.$Loading.start()
        this.contestID = this.$route.params.contestID
        this.problemID = this.$route.params.problemID
        let func = this.$route.name === 'problem-details' ? 'getProblem' : 'getContestProblem'
        api[func](this.problemID, this.contestID).then(res => {
          this.$Loading.finish()
          let problem = res.data.data
          this.changeDomTitle({title: problem.title})
          api.submissionExists(problem.id).then(res => {
            this.submissionExists = res.data.data
          })
          problem.languages = problem.languages.sort()
          this.problem = problem
          this.changePie(problem)

          // 在beforeRouteEnter中修改了, 说明本地有code，无需加载template
          if (this.code !== '') {
            return
          }
          // try to load problem template
          this.language = this.problem.languages[0]
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          }
        }, () => {
          this.$Loading.error()
        })
      },
      changePie (problemData) {
        if (!problemData.statistic_info) {
          problemData.statistic_info = {}
        }
        for (let k in problemData.statistic_info) {
          if (filtedStatus.indexOf(k) === -1) {
            delete problemData.statistic_info[k]
          }
        }
        let acNum = problemData.accepted_number || 0
        let subNum = problemData.submission_number || 0
        let data = [
          {name: 'WA', value: Math.max(0, subNum - acNum)},
          {name: 'AC', value: acNum}
        ]
        this.pie.series[0].data = data

        let data2 = JSON.parse(JSON.stringify(data))
        data2[1].selected = true
        this.largePie.series[1].data = data2

        let legend = Object.keys(problemData.statistic_info).map(ele => JUDGE_STATUS[ele].short)
        if (legend.length === 0) {
          legend.push('AC', 'WA')
        }
        this.largePie.legend.data = legend

        let acCount = problemData.statistic_info['0'] || 0
        delete problemData.statistic_info['0']

        let largePieData = []
        Object.keys(problemData.statistic_info).forEach(ele => {
          largePieData.push({name: JUDGE_STATUS[ele].short, value: problemData.statistic_info[ele]})
        })
        largePieData.push({name: 'AC', value: acCount})
        this.largePie.series[0].data = largePieData

        this.$nextTick(() => {
          this.initPieChart()
        })
      },
      initPieChart () {
        const dom = this.$refs.pieChartDom
        if (!dom) return
        if (this.pieChart) {
          this.pieChart.dispose()
        }
        this.pieChart = echarts.init(dom)
        this.pieChart.setOption(this.pie)
      },
      initLargePieChart () {
        const dom = this.$refs.pieChartDetail
        if (!dom) return
        if (this.largePieChart) {
          this.largePieChart.dispose()
        }
        this.largePieChart = echarts.init(dom)
        this.largePieChart.setOption(this.largePie)
      },
      disposeCharts () {
        if (this.pieChart) {
          this.pieChart.dispose()
          this.pieChart = null
        }
        if (this.largePieChart) {
          this.largePieChart.dispose()
          this.largePieChart = null
        }
      },
      handleRoute (route) {
        this.$router.push(route)
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
          content: this.$i18n.t('m.Are_you_sure_you_want_to_reset_your_code'),
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
      checkSubmissionStatus () {
        // 使用setTimeout避免一些问题
        if (this.refreshStatus) {
          // 如果之前的提交状态检查还没有停止,则停止,否则将会失去timeout的引用造成无限请求
          clearTimeout(this.refreshStatus)
        }
        const checkStatus = () => {
          let id = this.submissionId
          api.getSubmission(id).then(res => {
            this.result = res.data.data
            if (Object.keys(res.data.data.statistic_info).length !== 0) {
              this.submitting = false
              this.submitted = false
              clearTimeout(this.refreshStatus)
              this.init()
            } else {
              this.refreshStatus = setTimeout(checkStatus, 2000)
            }
          }, res => {
            this.submitting = false
            clearTimeout(this.refreshStatus)
          })
        }
        this.refreshStatus = setTimeout(checkStatus, 2000)
      },
      submitCode () {
        if (this.code.trim() === '') {
          this.$error(this.$i18n.t('m.Code_can_not_be_empty'))
          return
        }
        this.submissionId = ''
        this.result = {result: 9}
        this.submitting = true
        let data = {
          problem_id: this.problem.id,
          language: this.language,
          code: this.code,
          contest_id: this.contestID
        }
        if (this.captchaRequired) {
          data.captcha = this.captchaCode
        }
        const submitFunc = (data, detailsVisible) => {
          this.statusVisible = true
          api.submitCode(data).then(res => {
            this.submissionId = res.data.data && res.data.data.submission_id
            // 定时检查状态
            this.submitting = false
            this.submissionExists = true
            if (!detailsVisible) {
              this.$Modal.success({
                title: this.$i18n.t('m.Success'),
                content: this.$i18n.t('m.Submit_code_successfully')
              })
              return
            }
            this.submitted = true
            this.checkSubmissionStatus()
          }, res => {
            this.getCaptchaSrc()
            if (res.data.data.startsWith('Captcha is required')) {
              this.captchaRequired = true
            }
            this.submitting = false
            this.statusVisible = false
          })
        }

        if (this.contestRuleType === 'OI' && !this.OIContestRealTimePermission) {
          if (this.submissionExists) {
            this.$Modal.confirm({
              title: '',
              content: '<h3>' + this.$i18n.t('m.You_have_submission_in_this_problem_sure_to_cover_it') + '<h3>',
              onOk: () => {
                // 暂时解决对话框与后面提示对话框冲突的问题(否则一闪而过）
                setTimeout(() => {
                  submitFunc(data, false)
                }, 1000)
              },
              onCancel: () => {
                this.submitting = false
              }
            })
          } else {
            submitFunc(data, false)
          }
        } else {
          submitFunc(data, true)
        }
      },
      onCopy (event) {
        this.$success('Code copied')
      },
      onCopyError (e) {
        this.$error('Failed to copy code')
      },
      startResize (e) {
        this.isResizing = true
        window.addEventListener('mousemove', this.handleResize)
        window.addEventListener('mouseup', this.stopResize)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        e.preventDefault()
      },
      handleResize (e) {
        if (!this.isResizing) return
        const main = this.$el.querySelector('#problem-main')
        if (!main) return
        const rect = main.getBoundingClientRect()
        const w = ((e.clientX - rect.left) / rect.width) * 100
        this.leftWidth = Math.min(Math.max(w, 30), 70)
      },
      stopResize () {
        this.isResizing = false
        window.removeEventListener('mousemove', this.handleResize)
        window.removeEventListener('mouseup', this.stopResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    },
    computed: {
      ...mapGetters(['problemSubmitDisabled', 'contestRuleType', 'OIContestRealTimePermission', 'contestStatus']),
      contest () {
        return this.$store.state.contest.contest
      },
      contestEnded () {
        return this.contestStatus === CONTEST_STATUS.ENDED
      },
      submissionStatus () {
        return {
          text: JUDGE_STATUS[this.result.result]['name'],
          color: JUDGE_STATUS[this.result.result]['color']
        }
      },
      submissionRoute () {
        if (this.contestID) {
          return {name: 'contest-submission-list', query: {problemID: this.problemID}}
        } else {
          return {name: 'submission-list', query: {problemID: this.problemID}}
        }
      },
      layoutRightStyle () {
        if (this.layoutMode !== 'horizontal') return {}
        return { width: (100 - this.leftWidth) + '%' }
      },
      layoutLeftStyle () {
        if (this.layoutMode !== 'horizontal') return {}
        return { width: this.leftWidth + '%' }
      }
    },
    beforeRouteLeave (to, from, next) {
      // 防止切换组件后仍然不断请求
      clearInterval(this.refreshStatus)

      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: true})
      storage.set(buildProblemCodeKey(this.problem._id, from.params.contestID), {
        code: this.code,
        language: this.language,
        theme: this.theme
      })
      next()
    },
    beforeDestroy () {
      window.removeEventListener('mousemove', this.handleResize)
      window.removeEventListener('mouseup', this.stopResize)
      this.disposeCharts()
    },
    watch: {
      '$route' () {
        this.init()
      },
      graphVisible (val) {
        if (val) {
          this.$nextTick(() => {
            this.initLargePieChart()
          })
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .card-title {
    margin-left: 8px;
  }

  .flex-container {
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 20px;
    background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
    min-height: calc(100vh - 60px);

    &.full-width-layout {
      max-width: none;
      padding: 16px 16px 0 16px;
      background: #f5f7fa;
      min-height: calc(100vh - 80px);
      height: calc(100vh - 80px);
      overflow: hidden;

      #problem-main {
        margin-right: 0;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;

        .layout-toggle-row {
          flex-shrink: 0;
        }

        .problem-layout-wrapper {
          flex: 1;
          min-height: 0;
        }

        .problem-layout-wrapper.horizontal {
          display: flex;
          gap: 0;
          align-items: stretch;
        }
      }
    }

    #problem-main {
      flex: auto;
      margin-right: 24px;

      .layout-toggle-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }

      .problem-layout-wrapper {
         &.horizontal {
           display: flex;
           gap: 0;
         }

         &.vertical {
           .layout-left {
             width: 100%;
           }
           .layout-right {
             width: 100%;
           }
         }
       }

      .resize-handle {
        width: 4px;
        background: #e2e8f0;
        cursor: col-resize;
        flex-shrink: 0;
        z-index: 10;
        transition: background 0.2s;

        &:hover {
          background: #1e3a8a;
        }
      }

      .resize-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        cursor: col-resize;
      }

      .problem-panel {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 24px;
      }

      .code-panel {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        padding: 24px;
      }
    }

    #right-column {
      flex: none;
      width: 320px;

      .chart-card,
      #pieChart,
      #info {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 20px;

        ::v-deep .ivu-card-body {
          padding: 0;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e3a8a;
          padding: 16px 20px;
          border-bottom: 2px solid #f1f5f9;

          .ivu-icon {
            font-size: 20px;
          }
        }

        ul {
          list-style-type: none;
          padding: 16px 20px;
          margin: 0;

          li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #f1f5f9;

            &:last-child {
              border-bottom: none;
            }

            p {
              margin: 0;
              font-size: 13px;

              &:first-child {
                color: #64748b;
                font-weight: 500;
              }

              &:last-child {
                color: #1e3a8a;
                font-weight: 600;
                text-align: right;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }

      .chart-card,
      #pieChart,
      #info {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 20px;

        ::v-deep .ivu-card-body {
          padding: 16px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e3a8a;
          padding: 16px 20px;
          border-bottom: 2px solid #f1f5f9;
          position: relative;

          .ivu-icon {
            font-size: 20px;
          }

          #detail {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
          }
        }

        .echarts {
          height: 250px;
          min-height: 250px;
          width: 100%;
          padding: 0;
          overflow: hidden;
        }
      }
    }
  }

  .problem-title-header {
    display: flex;
    align-items: baseline;
    gap: 10px;

    .problem-title-id {
      font-size: 1.5rem;
      font-weight: 700;
      font-family: inherit;
      color: #1e3a8a;
    }

    .problem-title-text {
      font-size: 1.5rem;
      font-weight: 700;
      font-family: inherit;
      color: #111827;
    }
  }

  #problem-content {
    padding: 24px;

    .title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 40px 0 16px 0;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;

      &:first-child {
        margin-top: 0;
      }

      .copy {
        padding-left: 8px;
        color: #3b82f6;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #1e3a8a;
        }
      }
    }

    p.content {
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 24px;
      font-size: 15px;
      line-height: 1.85;
      color: #334155;
    }

    .sample {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      margin-bottom: 28px;
      width: 100%;
      max-width: 800px;

      &-input, &-output {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .title {
          font-size: 1rem;
          margin-bottom: 10px;
          margin-top: 0;
          color: #1e3a8a;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      pre {
        margin: 0;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        max-height: 180px;
        overflow: auto;
        white-space: pre;
        color: #334155;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        &::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          
          &:hover {
            background: #94a3b8;
          }
        }
      }
    }
  }

  #pieChart-detail {
    margin-top: 20px;
    width: 100%;
    height: 480px;
  }

  .problem-info-inline {
    margin-top: 8px;

    .info-inline-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;

      .info-inline-item {
        font-size: 13px;
        color: #475569;
        padding: 2px 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;

        b {
          color: #1e3a8a;
          font-weight: 600;
        }
      }
    }
  }
</style>

<style lang="less">
  .full-width-layout {
    #problem-main {
      .problem-layout-wrapper.horizontal {
        .layout-left {
          min-width: 0;
          overflow-y: auto !important;
          overflow-x: hidden;
        }

        .layout-left > .ivu-card {
          height: auto !important;
          min-height: 100% !important;
          margin-bottom: 0;
          border-radius: 16px;
          overflow: hidden !important;
        }

        .layout-right {
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .layout-right .ai-response-card {
          flex-shrink: 0;
        }

        .layout-right #submit-code {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .layout-right #submit-code > .ivu-card-body {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .layout-right #submit-code > .ivu-card-body > div:first-child {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 0 !important;
        }

        .layout-right #submit-code > .ivu-card-body > div:first-child .CodeMirror {
          flex: 1;
          min-height: 300px;
          height: auto !important;
        }

        .layout-right #submit-code > .ivu-card-body > div:first-child .CodeMirror-scroll {
          min-height: 300px !important;
          max-height: none !important;
        }
      }
    }
  }

  #submit-code .ivu-card,
  #pieChart .ivu-card,
  #info .ivu-card {
    border-radius: 20px !important;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }

  .full-width-layout .ai-response-card.ivu-card {
    border-radius: 20px !important;
    overflow: hidden;
  }

  #submit-code .ivu-card-body,
  #pieChart .ivu-card-body,
  #info .ivu-card-body {
    border-radius: 20px !important;
  }

  .fl-right {
    float: right;
  }
</style>

