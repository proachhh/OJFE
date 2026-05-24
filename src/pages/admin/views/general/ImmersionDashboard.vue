<template>
  <div class="immersion-dashboard" v-loading="loading">

    <div class="top-bar">
      <div class="brand">
        <img :src="require('@/assets/logo.png')" class="brand-logo" alt="logo" />
        <span class="brand-sub">数据看板</span>
      </div>
      <div class="top-bar-time">{{ currentTime }}</div>
    </div>

    <div class="dashboard-grid">
      <!-- 第一行：左侧统计卡片（竖向）+ 右侧判题服务器滚动列表 -->
      <div class="grid-row grid-row--top">
        <div class="stats-vert">
          <div class="stat-card" v-for="(card, idx) in statCards" :key="idx" :class="card.glowClass">
            <div class="stat-icon-wrap" :style="{ borderColor: card.borderColor }">
              <span class="stat-emoji">{{ card.iconHtml }}</span>
            </div>
            <div class="stat-info">
              <div class="stat-number" :style="{ color: card.textColor }">{{ animatedValues[idx] }}</div>
              <div class="stat-label-text">{{ card.label }}</div>
            </div>
          </div>
        </div>
        <div class="judge-panel">
          <div class="judge-header">
            <span class="stat-emoji" style="font-size:14px">🖥️</span>
            <span>判题服务器 {{ judgeServers.length }}</span>
          </div>
          <div class="judge-scroll-box" ref="judgeScrollBox">
            <div class="judge-scroll-track" ref="judgeScrollTrack">
              <div v-for="s in judgeServers" :key="s.hostname" class="js-card" :class="s.status === 'normal' ? 'js-ok' : 'js-bad'">
                <div class="js-card-head">
                  <span class="js-dot"></span>
                  <span class="js-hostname">{{ s.hostname }}</span>
                </div>
                <div class="js-card-body">
                  <div class="js-row"><span class="js-lbl">IP</span> {{ s.ip }}</div>
                  <div class="js-row"><span class="js-lbl">版本</span> {{ s.judger_version }}</div>
                  <div class="js-row"><span class="js-lbl">URL</span> <code>{{ s.service_url }}</code></div>
                  <div class="js-row"><span class="js-lbl">心跳</span> {{ s.last_heartbeat | localtime }}</div>
                  <div class="js-row"><span class="js-lbl">创建</span> {{ s.create_time | localtime }}</div>
                  <div class="js-row"><span class="js-lbl">任务</span> {{ s.task_number }} | CPU {{ s.cpu_core }}核 {{ s.cpu_usage }}% | MEM {{ s.memory_usage }}%</div>
                </div>
              </div>
              <div v-if="!judgeServers.length" class="no-data">暂无</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4个图表 -->
      <div class="grid-row grid-row--quad">
        <div class="panel panel-chart">
          <div class="panel-header"><span class="panel-dot c-cyan"></span>难度分布</div>
          <div id="im-difficulty-chart" class="chart-inner"></div>
        </div>
        <div class="panel panel-chart">
          <div class="panel-header"><span class="panel-dot c-pink"></span>提交结果</div>
          <div id="im-result-chart" class="chart-inner"></div>
        </div>
        <div class="panel panel-chart">
          <div class="panel-header"><span class="panel-dot c-purple"></span>语言分布</div>
          <div id="im-language-chart" class="chart-inner"></div>
        </div>
        <div class="panel panel-chart">
          <div class="panel-header"><span class="panel-dot c-green"></span>标签 Top 10</div>
          <div id="im-tag-chart" class="chart-inner"></div>
        </div>
      </div>

      <!-- 活跃统计 + 趋势图 -->
      <div class="grid-row grid-row--mid">
        <div class="panel panel-stat">
          <div class="panel-header"><span class="panel-dot c-cyan"></span>活跃统计</div>
          <div class="stat-inline-items">
            <div class="inline-stat" v-for="(s, idx) in activityStats" :key="idx">
              <div class="inline-stat-val">{{ s.value }}</div>
              <div class="inline-stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>
        <div class="panel panel-chart">
          <div class="panel-header"><span class="panel-dot c-orange"></span>每日趋势（7天）</div>
          <div id="im-daily-chart" class="chart-inner-daily"></div>
        </div>
      </div>

      <!-- 5个数据表，表头固定，内容自动滚动 -->
      <div class="grid-row grid-row--tables5">
        <div v-for="(tg, ti) in tableGroups" :key="ti" class="panel panel-table scroll-table-panel">
          <div class="panel-header">
            <span class="panel-dot" :class="'c-'+dotColors[ti]"></span>
            <span>{{ tg.title }}</span>
          </div>
          <div class="table-fixed-wrap">
            <el-table :data="tg.data" :key="'st-'+ti+'-'+tableKey" size="mini" class="dark-table"
              header-row-class-name="dark-th" row-class-name="dark-tr"
              :id="'table-'+ti">
              <el-table-column v-for="col in tg.columns" :key="col.prop || col.label" v-bind="col"></el-table-column>
            </el-table>
          </div>
          <div v-if="!tg.data.length" class="no-data">暂无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@admin/api'

export default {
  name: 'immersion-dashboard',
  data () {
    return {
      loading: false,
      tableKey: 0,
      currentTime: '',
      timeTimer: null,
      animatedValues: [0, 0, 0, 0],
      animTimers: [],
      scrollTimers: [],
      overview: {},
      problemStats: {},
      difficultyDistribution: [],
      problemCompletion: {},
      topSubmitters: {},
      userRanking: [],
      submissionStats: {},
      mostCompleted: [],
      leastCompleted: [],
      topSubmittersAllTime: [],
      topSubmittersWeek: [],
      judgeServers: [],
      dotColors: ['cyan', 'pink', 'purple', 'orange', 'green']
    }
  },
  computed: {
    statCards () {
      return [
        { iconHtml: '👥', value: this.overview.total_users || 0, label: '用户', iconColor: '#00f0ff', textColor: '#fff', borderColor: 'rgba(0,240,255,0.4)', glowClass: 'glow-cyan' },
        { iconHtml: '📄', value: this.overview.total_problems || 0, label: '题目', iconColor: '#ff2d95', textColor: '#fff', borderColor: 'rgba(255,45,149,0.4)', glowClass: 'glow-pink' },
        { iconHtml: '🚀', value: this.overview.total_submissions || 0, label: '提交', iconColor: '#b829f0', textColor: '#fff', borderColor: 'rgba(184,41,240,0.4)', glowClass: 'glow-purple' },
        { iconHtml: '🏆', value: this.overview.total_contests || 0, label: '比赛', iconColor: '#00ff88', textColor: '#fff', borderColor: 'rgba(0,255,136,0.4)', glowClass: 'glow-green' }
      ]
    },
    activityStats () {
      return [
        { value: this.overview.today_submissions || 0, label: '今日提交' },
        { value: this.overview.week_submissions || 0, label: '本周提交' },
        { value: this.overview.month_submissions || 0, label: '本月提交' },
        { value: this.overview.today_active_users || 0, label: '今日活跃' },
        { value: this.overview.week_active_users || 0, label: '本周活跃' },
        { value: this.overview.active_contests || 0, label: '进行中比赛' },
        { value: this.overview.upcoming_contests || 0, label: '未开始比赛' }
      ]
    },
    tableGroups () {
      return [
        {
          title: '完成率最高 Top 10',
          data: this.mostCompleted,
          columns: [
            { prop: '_id', label: 'ID', width: '50' },
            { prop: 'title', label: '题目', showOverflowTooltip: true, minWidth: '100' },
            { label: '难度', width: '40', render: (h, { row }) => h('span', { style: { color: this.diffColor(row.difficulty) } }, this.diffChar(row.difficulty)) },
            { label: '通过率', width: '60', render: (h, { row }) => h('span', (row.pass_rate || 0).toFixed(1) + '%') }
          ]
        },
        {
          title: '完成率最低 Top 10',
          data: this.leastCompleted,
          columns: [
            { prop: '_id', label: 'ID', width: '50' },
            { prop: 'title', label: '题目', showOverflowTooltip: true, minWidth: '100' },
            { label: '难度', width: '40', render: (h, { row }) => h('span', { style: { color: this.diffColor(row.difficulty) } }, this.diffChar(row.difficulty)) },
            { label: '通过率', width: '60', render: (h, { row }) => h('span', (row.pass_rate || 0).toFixed(1) + '%') }
          ]
        },
        {
          title: '用户排名 Top 20',
          data: this.userRanking,
          columns: [
            { prop: 'rank', label: '#', width: '35' },
            { prop: 'username', label: '用户', minWidth: '80' },
            { prop: 'accepted_count', label: '通过', width: '48' },
            { prop: 'submission_count', label: '提交', width: '48' },
            { label: 'AC率', width: '55', render: (h, { row }) => h('span', this.fmRate(row.ac_rate)) },
            { prop: 'total_score', label: '分', width: '40' }
          ]
        },
        {
          title: '历史提交最多',
          data: this.topSubmittersAllTime,
          columns: [
            { prop: 'username', label: '用户', minWidth: '80' },
            { prop: 'submission_count', label: '提交', width: '55' },
            { prop: 'accepted_count', label: '通过', width: '55' },
            { prop: 'total_score', label: '分', width: '40' }
          ]
        },
        {
          title: '本周提交最多',
          data: this.topSubmittersWeek,
          columns: [
            { prop: 'username', label: '用户', minWidth: '80' },
            { prop: 'submission_count', label: '提交', width: '60' },
            { prop: 'accepted_count', label: '通过', width: '60' }
          ]
        }
      ]
    }
  },
  mounted () {
    this.updateTime()
    this.timeTimer = setInterval(this.updateTime, 1000)
    this.fetchData()
  },
  beforeDestroy () {
    clearInterval(this.timeTimer)
    this.scrollTimers.forEach(t => {
      if (typeof t === 'object' && t.cancel) t.cancel()
      else clearInterval(t)
    })
    this.animTimers.forEach(t => clearInterval(t))
    this.disposeAllCharts()
  },
  methods: {
    diffChar (d) {
      const m = { Low: '简', Mid: '中', High: '难' }
      return m[d] || d || '-'
    },
    diffColor (d) {
      const m = { Low: '#00ff88', Mid: '#ffaa00', High: '#ff2d95' }
      return m[d] || '#fff'
    },
    fmRate (r) {
      if (typeof r === 'number') return r.toFixed(1) + '%'
      return (r || 0) + '%'
    },
    translateSubmissionResult (status) {
      const keyMap = {
        'Pending': 'Submission_Result_Pending',
        'Judging': 'Submission_Result_Judging',
        'Accepted': 'Submission_Result_Accepted',
        'Wrong Answer': 'Submission_Result_Wrong_Answer',
        'CPU Time Limit Exceeded': 'Submission_Result_CPU_Time_Limit_Exceeded',
        'Real Time Limit Exceeded': 'Submission_Result_Real_Time_Limit_Exceeded',
        'Memory Limit Exceeded': 'Submission_Result_Memory_Limit_Exceeded',
        'Runtime Error': 'Submission_Result_Runtime_Error',
        'Compile Error': 'Submission_Result_Compile_Error',
        'System Error': 'Submission_Result_System_Error',
        'Partially Accepted': 'Submission_Result_Partially_Accepted',
      }
      const key = keyMap[status]
      return key ? this.$t('m.' + key) : status
    },
    startScroll () {
      this.scrollTimers.forEach(t => {
        if (typeof t === 'object' && t.cancel) t.cancel()
        else clearInterval(t)
      })
      this.scrollTimers = []
      const tryStart = () => {
        this._startJudgeScroll()
        this._startTableScrolls()
      }
      this.$nextTick(() => {
        setTimeout(tryStart, 500)
        setTimeout(tryStart, 1200)
      })
    },
    _startJudgeScroll () {
      const box = this.$refs.judgeScrollBox
      const track = this.$refs.judgeScrollTrack
      if (!box || !track) return
      let offset = 0
      let rafId = null
      const speed = 0.5
      const step = () => {
        if (!track.isConnected) { cancelAnimationFrame(rafId); return }
        const maxScroll = track.scrollWidth - box.clientWidth
        if (maxScroll <= 4) { rafId = requestAnimationFrame(step); return }
        offset += speed
        if (offset >= maxScroll) offset = 0
        box.scrollLeft = offset
        rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
      this.scrollTimers.push({ cancel: () => cancelAnimationFrame(rafId) })
    },
    _startTableScrolls () {
      const ids = ['table-0', 'table-1', 'table-2', 'table-3', 'table-4']
      ids.forEach(id => {
        const table = document.getElementById(id)
        if (!table) return
        const tbody = table.querySelector('.el-table__body-wrapper')
        if (!tbody) return
        const timer = setInterval(() => {
          if (!tbody.isConnected) { clearInterval(timer); return }
          const maxScroll = tbody.scrollHeight - tbody.clientHeight
          if (maxScroll <= 2) return
          if (tbody.scrollTop >= maxScroll) {
            tbody.scrollTop = 0
          } else {
            tbody.scrollTop += 1
          }
        }, 80)
        this.scrollTimers.push(timer)
      })
    },
    updateTime () {
      this.currentTime = new Date().toLocaleString('zh-CN', { hour12: false })
    },
    animateNumbers () {
      this.animTimers.forEach(t => clearInterval(t))
      this.animTimers = []
      const targets = [
        this.overview.total_users || 0,
        this.overview.total_problems || 0,
        this.overview.total_submissions || 0,
        this.overview.total_contests || 0
      ]
      this.animatedValues = [0, 0, 0, 0]
      targets.forEach((target, idx) => {
        const step = Math.max(1, Math.floor(target / 40))
        const timer = setInterval(() => {
          if (this.animatedValues[idx] < target) {
            this.animatedValues[idx] = Math.min(this.animatedValues[idx] + step, target)
          } else {
            clearInterval(timer)
          }
        }, 25)
        this.animTimers.push(timer)
      })
    },
    fetchData () {
      this.loading = true
      Promise.all([
        api.getDataDashboard(),
        api.getJudgeServer()
      ]).then(([dashRes, jRes]) => {
        const data = dashRes.data.data || dashRes.data
        this.overview = data.overview || {}
        this.problemStats = data.problem_stats || {}
        this.difficultyDistribution = data.difficulty_distribution || []
        this.problemCompletion = data.problem_completion || {}
        this.topSubmitters = data.top_submitters || {}
        this.userRanking = data.user_ranking || []
        this.submissionStats = data.submission_stats || {}
        this.mostCompleted = (this.problemCompletion.most_completed || []).slice(0, 10).map(item => ({ ...item }))
        this.leastCompleted = (this.problemCompletion.least_completed || []).slice(0, 10).map(item => ({ ...item }))
        this.topSubmittersAllTime = (this.topSubmitters.all_time || []).slice(0, 10).map(item => ({ ...item }))
        this.topSubmittersWeek = (this.topSubmitters.this_week || []).slice(0, 10).map(item => ({ ...item }))
        this.userRanking = (data.user_ranking || []).slice(0, 20).map(item => ({ ...item }))

        // judge server list
        const jData = jRes.data.data || {}
        this.judgeServers = jData.servers || []

        this.loading = false
        this.tableKey = Date.now()
        this.$forceUpdate()
        this.animateNumbers()
        this.startScroll()
        this.$nextTick(() => {
          setTimeout(() => { this.drawAllCharts() }, 200)
        })
      }).catch((err) => {
        console.error('Immersion Dashboard fetch error:', err)
        this.loading = false
      })
    },
    drawAllCharts () {
      this.drawDifficultyChart()
      this.drawResultChart()
      this.drawLanguageChart()
      this.drawTagChart()
      this.drawDailyChart()
    },
    drawDifficultyChart () {
      const chartDom = document.getElementById('im-difficulty-chart')
      if (!chartDom) return
      this.disposeChart(chartDom)
      const chart = echarts.init(chartDom, null, { devicePixelRatio: 2 })
      const labelMap = { Low: '简单', Mid: '中等', High: '困难' }
      const colorMap = { Low: '#00ff88', Mid: '#ffaa00', High: '#ff2d95' }
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}题' },
        series: [{
          type: 'pie', radius: ['42%', '72%'], avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#101525', borderWidth: 3 },
          label: { show: true, color: '#b0b8d0', fontSize: 13, position: 'outside', formatter: '{b}\n{c}题' },
          labelLine: { lineStyle: { color: '#4a5070' }, length: 12, length2: 10 },
          data: this.difficultyDistribution.map(item => ({ name: labelMap[item.name] || item.name, value: item.count, itemStyle: { color: colorMap[item.name] || '#5b9bd5' } }))
        }]
      })
    },
    drawResultChart () {
      const chartDom = document.getElementById('im-result-chart')
      if (!chartDom) return
      this.disposeChart(chartDom)
      const chart = echarts.init(chartDom, null, { devicePixelRatio: 2 })
      const resultDistribution = this.submissionStats.result_distribution || []
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie', radius: ['42%', '72%'], avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#101525', borderWidth: 3 },
          label: { show: true, color: '#b0b8d0', fontSize: 13, position: 'outside', formatter: '{b}\n{c}' },
          labelLine: { lineStyle: { color: '#4a5070' }, length: 12, length2: 10 },
          data: resultDistribution.map(item => ({ name: this.translateSubmissionResult(item.status), value: item.count }))
        }]
      })
    },
    drawLanguageChart () {
      const chartDom = document.getElementById('im-language-chart')
      if (!chartDom) return
      this.disposeChart(chartDom)
      const chart = echarts.init(chartDom, null, { devicePixelRatio: 2 })
      const languageDistribution = this.submissionStats.language_distribution || []
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie', radius: ['42%', '72%'], avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#101525', borderWidth: 3 },
          label: { show: true, color: '#b0b8d0', fontSize: 13, position: 'outside', formatter: '{b}\n{c}' },
          labelLine: { lineStyle: { color: '#4a5070' }, length: 12, length2: 10 },
          data: languageDistribution.map(item => ({ name: item.language, value: item.count }))
        }]
      })
    },
    drawTagChart () {
      const chartDom = document.getElementById('im-tag-chart')
      if (!chartDom) return
      this.disposeChart(chartDom)
      const chart = echarts.init(chartDom, null, { devicePixelRatio: 2 })
      const tagsDistribution = this.problemStats.tags_distribution || []
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,240,255,0.05)' } } },
        grid: { left: '6%', right: '6%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', axisLine: { lineStyle: { color: '#4a5070' } }, axisTick: { show: false }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, axisLabel: { color: '#78809a', fontSize: 11 } },
        yAxis: { type: 'category', data: tagsDistribution.map(item => item.name).reverse(), axisLine: { lineStyle: { color: '#4a5070' } }, axisTick: { show: false }, axisLabel: { color: '#a0a8c0', interval: 0, fontSize: 12 } },
        series: [{
          type: 'bar', data: tagsDistribution.map(item => item.count).reverse(),
          itemStyle: { borderRadius: [0, 4, 4, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(91,155,213,0.3)' }, { offset: 0.5, color: '#5b9bd5' }, { offset: 1, color: '#50b878' }]) },
          barWidth: '60%'
        }]
      })
    },
    drawDailyChart () {
      const chartDom = document.getElementById('im-daily-chart')
      if (!chartDom) return
      this.disposeChart(chartDom)
      const chart = echarts.init(chartDom, null, { devicePixelRatio: 2 })
      const dailySubmissions = this.submissionStats.daily_submissions || []
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['提交', '通过'], left: 'center', textStyle: { color: '#a0a8c0', fontSize: 13 } },
        grid: { left: '55px', right: '30px', bottom: '35px', top: '50px', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dailySubmissions.map(item => item.date), axisLine: { lineStyle: { color: '#4a5070' } }, axisLabel: { color: '#78809a', fontSize: 12, interval: 0 }, axisTick: { show: false } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#4a5070' } }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, axisLabel: { color: '#78809a', fontSize: 12 } },
        series: [
          { name: '提交', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: dailySubmissions.map(item => item.total), lineStyle: { color: '#5b9bd5', width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(91,155,213,0.15)' }, { offset: 1, color: 'rgba(91,155,213,0)' }]) }, itemStyle: { color: '#5b9bd5', borderColor: '#101525', borderWidth: 2 } },
          { name: '通过', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: dailySubmissions.map(item => item.accepted), lineStyle: { color: '#50b878', width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(80,184,120,0.15)' }, { offset: 1, color: 'rgba(80,184,120,0)' }]) }, itemStyle: { color: '#50b878', borderColor: '#101525', borderWidth: 2 } }
        ]
      })
      setTimeout(() => chart.resize(), 200)
    },
    disposeChart (dom) {
      const existing = echarts.getInstanceByDom(dom)
      if (existing) existing.dispose()
    },
    disposeAllCharts () {
      const ids = ['im-difficulty-chart', 'im-result-chart', 'im-language-chart', 'im-tag-chart', 'im-daily-chart']
      ids.forEach(id => { const dom = document.getElementById(id); if (dom) this.disposeChart(dom) })
    }
  }
}
</script>

<style lang="less" scoped>
@bg-primary: #101525;
@bg-panel: rgba(20, 25, 45, 0.92);
@border-color: rgba(100, 120, 160, 0.18);
@text-primary: #e5eaf5;
@text-secondary: #8892b0;

.immersion-dashboard {
  position: relative;
  min-height: 100vh;
  background: @bg-primary;
  color: @text-primary;
  padding: 14px 18px;
  overflow-x: hidden;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

.top-bar {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 0 10px; margin-bottom: 8px;
  border-bottom: 1px solid @border-color;

  .brand {
    display: flex; align-items: center; gap: 10px;
    .brand-logo { height: 42px; width: auto; object-fit: contain; }
    .brand-sub { font-size: 14px; color: @text-secondary; letter-spacing: 2px; }
  }

  .top-bar-time { font-size: 14px; color: @text-secondary; }
}

.dashboard-grid {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; gap: 12px;
}

.grid-row { display: grid; gap: 12px; }

.grid-row--top {
  grid-template-columns: 220px 1fr;
}

.stats-vert {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card {
  position: relative;
  background: @bg-panel;
  border: 1px solid @border-color;
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s ease;

  &:hover { background: rgba(30, 35, 60, 0.95); }

  .stat-icon-wrap {
    width: 34px; height: 34px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid @border-color; flex-shrink: 0; background: rgba(0, 0, 0, 0.25);
    .stat-emoji { font-size: 17px; line-height: 1; }
  }

  .stat-info {
    display: flex; align-items: baseline; gap: 7px;
    .stat-number { font-size: 24px; font-weight: 700; line-height: 1; color: #fff; }
    .stat-label-text { font-size: 14px; color: #c8d0e8; font-weight: 500; }
  }
}

.judge-panel {
  background: @bg-panel;
  border: 1px solid @border-color;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .judge-header {
    display: flex; align-items: center; gap: 6px;
    font-size: 15px; font-weight: 600; color: #c8d0e8;
    margin-bottom: 8px; padding-bottom: 8px;
    border-bottom: 1px solid @border-color;
    flex-shrink: 0;
  }

  .judge-scroll-box {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    min-height: 110px;

    &::-webkit-scrollbar { height: 0; }
  }

  .judge-scroll-track {
    display: flex;
    gap: 10px;
    white-space: nowrap;

    .js-card {
      flex-shrink: 0;
      width: 280px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid @border-color;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      font-family: 'Consolas', 'JetBrains Mono', monospace;

      &.js-ok { border-color: rgba(0, 200, 120, 0.3); }
      &.js-bad {
        border-color: rgba(220, 60, 90, 0.3);
        .js-card-head .js-dot { background: #dc3c5a; }
      }

      .js-card-head {
        display: flex; align-items: center; gap: 6px;
        margin-bottom: 6px; padding-bottom: 5px;
        border-bottom: 1px solid rgba(255,255,255,0.06);

        .js-dot {
           width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
           background: #00c878;
         }

         .js-hostname {
           color: #d0d8f0; font-weight: 600; font-size: 13px;
           overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
         }
       }

      .js-card-body {
        display: flex; flex-direction: column; gap: 3px;

        .js-row {
          color: #a0aec0; font-size: 11px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;

          .js-lbl { color: #66708a; margin-right: 4px; flex-shrink: 0; }
          code { color: #a0b0d0; background: rgba(255,255,255,0.06); padding: 0 3px; border-radius: 2px; }
        }
      }
    }
  }
}

.grid-row--quad {
  grid-template-columns: repeat(4, 1fr);
}

.grid-row--mid {
  grid-template-columns: 1fr 1.2fr;
}

.grid-row--tables5 {
  grid-template-columns: repeat(5, 1fr);
}

.scroll-table-panel {
  min-width: 0;
}

.panel {
  background: @bg-panel;
  border: 1px solid @border-color;
  border-radius: 8px;
  padding: 14px 16px;
  transition: background 0.2s ease;
  &:hover { background: rgba(25, 30, 55, 0.95); }
}

.panel-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 600;
  margin-bottom: 8px; color: #e0e6ff;

  .panel-dot { width: 8px; height: 8px; border-radius: 50%; }
  .c-cyan { background: #5b9bd5; }
  .c-pink { background: #e06090; }
  .c-purple { background: #a070d0; }
  .c-green { background: #50b878; }
  .c-orange { background: #e0a040; }
}

.panel-chart .chart-inner { height: 220px; width: 100%; }
.panel-chart .chart-inner-daily { height: 200px; width: 100%; }

.panel-stat {
  .stat-inline-items { display: flex; flex-wrap: wrap; gap: 8px; }
  .inline-stat {
    flex: 1; min-width: 90px; text-align: center; padding: 12px 8px;
    background: rgba(255,255,255,0.03); border: 1px solid @border-color; border-radius: 6px;
    transition: background 0.2s ease;
    &:hover { background: rgba(255,255,255,0.05); }
    .inline-stat-val { font-size: 24px; font-weight: 700; color: #5b9bd5; }
    .inline-stat-lbl { font-size: 13px; color: #c8d0e8; margin-top: 3px; }
  }
}

.table-fixed-wrap {
  /deep/ .el-table__header-wrapper {
    flex-shrink: 0;
  }
  /deep/ .el-table__body-wrapper {
    height: 220px !important;
    overflow-y: auto !important;
    &::-webkit-scrollbar { width: 0; }
  }
}

.panel-table {
  .dark-table {
    background: transparent;
    color: #c0caf5;
    font-size: 13px;
  }

  /deep/ .dark-table .el-table__header-wrapper th,
  /deep/ .dark-table .dark-th {
    background: rgba(255,255,255,0.05) !important;
    color: #a0b0d0 !important;
    border-bottom: 1px solid @border-color !important;
    font-weight: 600;
    font-size: 13px;
    padding: 6px 4px;
  }

  /deep/ .dark-table .el-table__body-wrapper td,
  /deep/ .dark-table .dark-tr {
    background: transparent !important;
    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
    color: #d0d8f0 !important;
    padding: 6px 4px;
    font-size: 13px;
  }

  /deep/ .dark-table tr:hover > td {
    background: rgba(255,255,255,0.04) !important;
  }
}

.no-data {
  text-align: center; padding: 18px 0; color: @text-secondary; font-size: 13px;
}

/deep/ .el-loading-mask { background: rgba(16, 21, 37, 0.85); }
</style>
