<template>
  <div class="immersion-dashboard" v-loading="loading">
    <div class="scan-lines"></div>
    <div class="particles-bg"></div>

    <div class="top-bar">
      <div class="brand">
        <span class="brand-icon">◈</span>
        <span class="brand-text">NEBULA</span>
        <span class="brand-sub">DASHBOARD</span>
      </div>
      <div class="live-indicator">
        <span class="live-dot"></span>
        LIVE
      </div>
      <div class="top-bar-time">{{ currentTime }}</div>
    </div>

    <div class="dashboard-grid">
      <div class="grid-cell stat-row">
        <div class="stat-card" v-for="(card, idx) in statCards" :key="idx" :class="card.glowClass">
          <div class="stat-icon-wrap" :style="{ borderColor: card.borderColor }">
            <Icon :type="card.icon" size="28" :color="card.iconColor" />
          </div>
          <div class="stat-info">
            <div class="stat-number" :style="{ color: card.textColor }">
              <span ref="counters" :data-target="card.value">{{ animatedValues[idx] }}</span>
            </div>
            <div class="stat-label-text">{{ card.label }}</div>
          </div>
          <div class="stat-glow" :style="{ background: card.glowBg }"></div>
        </div>
      </div>

      <div class="grid-cell chart-cell chart-cell--half">
        <div class="panel panel-chart">
          <div class="panel-header">
            <span class="panel-dot" style="background:#00f0ff;"></span>
            <span>难度分布</span>
          </div>
          <div id="im-difficulty-chart" class="chart-inner"></div>
        </div>
      </div>
      <div class="grid-cell chart-cell chart-cell--half">
        <div class="panel panel-chart">
          <div class="panel-header">
            <span class="panel-dot" style="background:#ff2d95;"></span>
            <span>提交结果分布</span>
          </div>
          <div id="im-result-chart" class="chart-inner"></div>
        </div>
      </div>

      <div class="grid-cell chart-cell chart-cell--half">
        <div class="panel panel-chart">
          <div class="panel-header">
            <span class="panel-dot" style="background:#b829f0;"></span>
            <span>语言分布</span>
          </div>
          <div id="im-language-chart" class="chart-inner"></div>
        </div>
      </div>
      <div class="grid-cell chart-cell chart-cell--half">
        <div class="panel panel-chart">
          <div class="panel-header">
            <span class="panel-dot" style="background:#00ff88;"></span>
            <span>标签分布 Top 10</span>
          </div>
          <div id="im-tag-chart" class="chart-inner"></div>
        </div>
      </div>

      <div class="grid-cell chart-cell chart-cell--full">
        <div class="panel panel-chart">
          <div class="panel-header">
            <span class="panel-dot" style="background:#ffaa00;"></span>
            <span>每日提交趋势（最近7天）</span>
          </div>
          <div id="im-daily-chart" class="chart-inner-wide"></div>
        </div>
      </div>

      <div class="grid-cell stat-inline">
        <div class="panel panel-stat">
          <div class="panel-header">
            <span class="panel-dot" style="background:#00f0ff;"></span>
            <span>活跃统计</span>
          </div>
          <div class="stat-inline-items">
            <div class="inline-stat" v-for="(s, idx) in activityStats" :key="idx">
              <div class="inline-stat-val">{{ s.value }}</div>
              <div class="inline-stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-cell table-row">
        <div class="grid-cell table-cell table-cell--half">
          <div class="panel panel-table">
            <div class="panel-header">
              <span class="panel-dot" style="background:#00ff88;"></span>
              <span>完成率最高 Top 10</span>
            </div>
            <div class="mini-table-wrap">
              <Table :data="mostCompleted" :columns="problemColumns" :key="'i1-'+tableKey" size="small" disabled-hover></Table>
            </div>
            <div v-if="!mostCompleted.length" class="no-data">暂无数据</div>
          </div>
        </div>
        <div class="grid-cell table-cell table-cell--half">
          <div class="panel panel-table">
            <div class="panel-header">
              <span class="panel-dot" style="background:#ff2d95;"></span>
              <span>完成率最低 Top 10</span>
            </div>
            <div class="mini-table-wrap">
              <Table :data="leastCompleted" :columns="problemColumns" :key="'i2-'+tableKey" size="small" disabled-hover></Table>
            </div>
            <div v-if="!leastCompleted.length" class="no-data">暂无数据</div>
          </div>
        </div>
      </div>

      <div class="grid-cell table-row">
        <div class="grid-cell table-cell table-cell--half">
          <div class="panel panel-table">
            <div class="panel-header">
              <span class="panel-dot" style="background:#b829f0;"></span>
              <span>用户排名 Top 20</span>
            </div>
            <div class="mini-table-wrap">
              <Table :data="userRanking" :columns="userColumns" :key="'i3-'+tableKey" size="small" disabled-hover></Table>
            </div>
            <div v-if="!userRanking.length" class="no-data">暂无数据</div>
          </div>
        </div>
        <div class="grid-cell table-cell table-cell--half">
          <div class="panel panel-table">
            <div class="panel-header">
              <span class="panel-dot" style="background:#ffaa00;"></span>
              <span>历史提交最多用户</span>
            </div>
            <div class="mini-table-wrap">
              <Table :data="topSubmittersAllTime" :columns="submitterColumns" :key="'i4-'+tableKey" size="small" disabled-hover></Table>
            </div>
            <div v-if="!topSubmittersAllTime.length" class="no-data">暂无数据</div>
          </div>
        </div>
      </div>

      <div class="grid-cell table-row">
        <div class="grid-cell table-cell table-cell--half">
          <div class="panel panel-table">
            <div class="panel-header">
              <span class="panel-dot" style="background:#00f0ff;"></span>
              <span>本周提交最多用户</span>
            </div>
            <div class="mini-table-wrap">
              <Table :data="topSubmittersWeek" :columns="submitterWeekColumns" :key="'i5-'+tableKey" size="small" disabled-hover></Table>
            </div>
            <div v-if="!topSubmittersWeek.length" class="no-data">暂无数据</div>
          </div>
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
      problemColumns: [
        { title: 'ID', key: '_id', width: 60 },
        { title: '题目标题', key: 'title', ellipsis: true, minWidth: 120 },
        {
          title: '难度', key: 'difficulty', width: 60,
          render: (h, params) => {
            const labelMap = { Low: '简', Mid: '中', High: '难' }
            const colorMap = { Low: '#00ff88', Mid: '#ffaa00', High: '#ff2d95' }
            return h('span', { style: { color: colorMap[params.row.difficulty] || '#fff', fontWeight: 600 } }, labelMap[params.row.difficulty] || params.row.difficulty)
          }
        },
        {
          title: '通过率', key: 'pass_rate', width: 70,
          render: (h, params) => {
            const rate = params.row.pass_rate || 0
            return h('span', rate.toFixed(1) + '%')
          }
        }
      ],
      userColumns: [
        { title: '#', key: 'rank', width: 40 },
        { title: '用户', key: 'username', minWidth: 80 },
        { title: '通过', key: 'accepted_count', width: 50 },
        { title: '提交', key: 'submission_count', width: 50 },
        {
          title: 'AC率', key: 'ac_rate', width: 60,
          render: (h, params) => {
            const rate = params.row.ac_rate || 0
            return h('span', (typeof rate === 'number' ? rate.toFixed(1) : rate) + '%')
          }
        },
        { title: 'OI分', key: 'total_score', width: 60 }
      ],
      submitterColumns: [
        { title: '用户', key: 'username', minWidth: 80 },
        { title: '提交', key: 'submission_count', width: 60 },
        { title: '通过', key: 'accepted_count', width: 60 },
        { title: 'OI分', key: 'total_score', width: 60 }
      ],
      submitterWeekColumns: [
        { title: '用户', key: 'username', minWidth: 80 },
        { title: '本周提交', key: 'submission_count', width: 70 },
        { title: '本周通过', key: 'accepted_count', width: 70 }
      ]
    }
  },
  computed: {
    statCards () {
      return [
        { icon: 'ios-people', value: this.overview.total_users || 0, label: '总用户数', iconColor: '#00f0ff', textColor: '#00f0ff', borderColor: 'rgba(0,240,255,0.4)', glowBg: 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.15), transparent)', glowClass: 'glow-cyan' },
        { icon: 'ios-document', value: this.overview.total_problems || 0, label: '总题目数', iconColor: '#ff2d95', textColor: '#ff2d95', borderColor: 'rgba(255,45,149,0.4)', glowBg: 'radial-gradient(circle at 50% 50%, rgba(255,45,149,0.15), transparent)', glowClass: 'glow-pink' },
        { icon: 'ios-send', value: this.overview.total_submissions || 0, label: '总提交数', iconColor: '#b829f0', textColor: '#b829f0', borderColor: 'rgba(184,41,240,0.4)', glowBg: 'radial-gradient(circle at 50% 50%, rgba(184,41,240,0.15), transparent)', glowClass: 'glow-purple' },
        { icon: 'ios-trophy', value: this.overview.total_contests || 0, label: '总比赛数', iconColor: '#00ff88', textColor: '#00ff88', borderColor: 'rgba(0,255,136,0.4)', glowBg: 'radial-gradient(circle at 50% 50%, rgba(0,255,136,0.15), transparent)', glowClass: 'glow-green' }
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
    }
  },
  mounted () {
    this.updateTime()
    this.timeTimer = setInterval(this.updateTime, 1000)
    this.fetchData()
  },
  beforeDestroy () {
    clearInterval(this.timeTimer)
    this.animTimers.forEach(t => clearInterval(t))
    this.disposeAllCharts()
  },
  methods: {
    updateTime () {
      const now = new Date()
      this.currentTime = now.toLocaleString('zh-CN', { hour12: false })
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
        const step = Math.max(1, Math.floor(target / 60))
        const timer = setInterval(() => {
          if (this.animatedValues[idx] < target) {
            this.animatedValues[idx] = Math.min(this.animatedValues[idx] + step, target)
          } else {
            clearInterval(timer)
          }
        }, 20)
        this.animTimers.push(timer)
      })
    },
    fetchData () {
      this.loading = true
      api.getDataDashboard().then(res => {
        const data = res.data.data || res.data
        this.overview = data.overview || {}
        this.problemStats = data.problem_stats || {}
        this.difficultyDistribution = data.difficulty_distribution || []
        this.problemCompletion = data.problem_completion || {}
        this.topSubmitters = data.top_submitters || {}
        this.userRanking = data.user_ranking || []
        this.submissionStats = data.submission_stats || {}
        this.mostCompleted = (this.problemCompletion.most_completed || []).map(item => ({ ...item }))
        this.leastCompleted = (this.problemCompletion.least_completed || []).map(item => ({ ...item }))
        this.topSubmittersAllTime = (this.topSubmitters.all_time || []).map(item => ({ ...item }))
        this.topSubmittersWeek = (this.topSubmitters.this_week || []).map(item => ({ ...item }))
        this.userRanking = (data.user_ranking || []).map(item => ({ ...item }))
        this.loading = false
        this.tableKey = Date.now()
        this.$forceUpdate()
        this.animateNumbers()
        this.$nextTick(() => {
          setTimeout(() => {
            this.drawAllCharts()
          }, 150)
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
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0a0e1a',
            borderWidth: 3,
            shadowBlur: 15,
            shadowColor: 'rgba(0,240,255,0.3)'
          },
          label: { show: true, color: '#8892b0', formatter: '{b}\n{c}题' },
          labelLine: { lineStyle: { color: '#3a3f5c' } },
          data: this.difficultyDistribution.map(item => ({
            name: labelMap[item.name] || item.name,
            value: item.count,
            itemStyle: { color: colorMap[item.name] || '#00f0ff' }
          }))
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
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0a0e1a',
            borderWidth: 3,
            shadowBlur: 15,
            shadowColor: 'rgba(255,45,149,0.3)'
          },
          label: { show: true, color: '#8892b0', formatter: '{b}\n{c}次' },
          labelLine: { lineStyle: { color: '#3a3f5c' } },
          data: resultDistribution.map(item => ({
            name: item.status,
            value: item.count
          }))
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
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0a0e1a',
            borderWidth: 3,
            shadowBlur: 15,
            shadowColor: 'rgba(184,41,240,0.3)'
          },
          label: { show: true, color: '#8892b0', formatter: '{b}\n{c}次' },
          labelLine: { lineStyle: { color: '#3a3f5c' } },
          data: languageDistribution.map(item => ({
            name: item.language,
            value: item.count
          }))
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
        grid: { left: '5%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#3a3f5c' } },
          axisTick: { lineStyle: { color: '#3a3f5c' } },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
          axisLabel: { color: '#66708a' }
        },
        yAxis: {
          type: 'category',
          data: tagsDistribution.map(item => item.name).reverse(),
          axisLine: { lineStyle: { color: '#3a3f5c' } },
          axisTick: { show: false },
          axisLabel: { color: '#8892b0', interval: 0, fontSize: 11 }
        },
        series: [{
          type: 'bar',
          data: tagsDistribution.map(item => item.count).reverse(),
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: 'rgba(0,240,255,0.2)' },
              { offset: 0.5, color: '#00f0ff' },
              { offset: 1, color: '#00ff88' }
            ])
          },
          barWidth: '65%',
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,240,255,0.5)'
            }
          }
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
        legend: {
          data: ['总提交', '通过'],
          left: 'center',
          textStyle: { color: '#8892b0' }
        },
        grid: { left: '60px', right: '40px', bottom: '40px', top: '60px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dailySubmissions.map(item => item.date),
          axisLine: { lineStyle: { color: '#3a3f5c' } },
          axisLabel: { color: '#66708a', interval: 0 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#3a3f5c' } },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
          axisLabel: { color: '#66708a' }
        },
        series: [
          {
            name: '总提交',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            data: dailySubmissions.map(item => item.total),
            lineStyle: { color: '#00f0ff', width: 2.5, shadowBlur: 10, shadowColor: 'rgba(0,240,255,0.5)' },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,240,255,0.3)' }, { offset: 1, color: 'rgba(0,240,255,0)' }]) },
            itemStyle: { color: '#00f0ff', borderColor: '#0a0e1a', borderWidth: 2 }
          },
          {
            name: '通过',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            data: dailySubmissions.map(item => item.accepted),
            lineStyle: { color: '#00ff88', width: 2.5, shadowBlur: 10, shadowColor: 'rgba(0,255,136,0.5)' },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,255,136,0.3)' }, { offset: 1, color: 'rgba(0,255,136,0)' }]) },
            itemStyle: { color: '#00ff88', borderColor: '#0a0e1a', borderWidth: 2 }
          }
        ]
      })
    },
    disposeChart (dom) {
      const existing = echarts.getInstanceByDom(dom)
      if (existing) existing.dispose()
    },
    disposeAllCharts () {
      const ids = ['im-difficulty-chart', 'im-result-chart', 'im-language-chart', 'im-tag-chart', 'im-daily-chart']
      ids.forEach(id => {
        const dom = document.getElementById(id)
        if (dom) this.disposeChart(dom)
      })
    }
  }
}
</script>

<style lang="less" scoped>
@bg-primary: #0a0e1a;
@bg-panel: rgba(14, 18, 40, 0.85);
@border-glow: rgba(0, 240, 255, 0.15);
@text-primary: #e0e6ff;
@text-secondary: #66708a;

.immersion-dashboard {
  position: relative;
  min-height: 100vh;
  background: @bg-primary;
  color: @text-primary;
  padding: 16px;
  overflow-x: hidden;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.scan-lines {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 200;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 240, 255, 0.015) 2px,
    rgba(0, 240, 255, 0.015) 4px
  );
  animation: scanMove 8s linear infinite;
}

@keyframes scanMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

.particles-bg {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse at 10% 20%, rgba(0,240,255,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 10%, rgba(184,41,240,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(255,45,149,0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 70%, rgba(0,255,136,0.03) 0%, transparent 50%);
}

.top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid @border-glow;

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .brand-icon {
      font-size: 24px;
      color: #00f0ff;
      text-shadow: 0 0 20px rgba(0,240,255,0.6);
      animation: iconPulse 2s ease-in-out infinite;
    }

    @keyframes iconPulse {
      0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(0,240,255,0.6); }
      50% { opacity: 0.7; text-shadow: 0 0 30px rgba(0,240,255,0.9); }
    }

    .brand-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 6px;
      background: linear-gradient(90deg, #00f0ff, #b829f0, #ff2d95);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-sub {
      font-size: 12px;
      color: @text-secondary;
      letter-spacing: 4px;
      margin-top: 2px;
    }
  }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    letter-spacing: 3px;
    color: #00ff88;

    .live-dot {
      width: 8px;
      height: 8px;
      background: #00ff88;
      border-radius: 50%;
      box-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88;
      animation: liveBlink 1.5s ease-in-out infinite;
    }

    @keyframes liveBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  }

  .top-bar-time {
    font-size: 13px;
    color: @text-secondary;
    letter-spacing: 1px;
  }
}

.dashboard-grid {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grid-cell {
  width: 100%;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  position: relative;
  background: @bg-panel;
  border: 1px solid @border-glow;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.1), inset 0 0 30px rgba(0, 240, 255, 0.03);
    transform: translateY(-2px);
  }

  .stat-glow {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    opacity: 0.6;
  }

  .stat-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.3);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .stat-number {
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 1px;
      text-shadow: 0 0 20px currentColor;
    }

    .stat-label-text {
      font-size: 13px;
      color: @text-secondary;
      letter-spacing: 1px;
    }
  }
}

.glow-cyan:hover { border-color: rgba(0,240,255,0.5); box-shadow: 0 0 40px rgba(0,240,255,0.12), inset 0 0 30px rgba(0,240,255,0.03); }
.glow-pink:hover { border-color: rgba(255,45,149,0.5); box-shadow: 0 0 40px rgba(255,45,149,0.12), inset 0 0 30px rgba(255,45,149,0.03); }
.glow-purple:hover { border-color: rgba(184,41,240,0.5); box-shadow: 0 0 40px rgba(184,41,240,0.12), inset 0 0 30px rgba(184,41,240,0.03); }
.glow-green:hover { border-color: rgba(0,255,136,0.5); box-shadow: 0 0 40px rgba(0,255,136,0.12), inset 0 0 30px rgba(0,255,136,0.03); }

.chart-row, .table-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.chart-cell--full {
  grid-column: 1 / -1;
}

.panel {
  background: @bg-panel;
  border: 1px solid @border-glow;
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 240, 255, 0.25);
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.06);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 10px;
  color: @text-primary;

  .panel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
  }
}

.panel-chart {
  .chart-inner {
    height: 280px;
    width: 100%;
  }

  .chart-inner-wide {
    height: 320px;
    width: 100%;
  }
}

.panel-stat {
  .stat-inline-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .inline-stat {
    flex: 1;
    min-width: 100px;
    text-align: center;
    padding: 10px 8px;
    background: rgba(0, 240, 255, 0.03);
    border: 1px solid rgba(0, 240, 255, 0.08);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(0, 240, 255, 0.25);
      background: rgba(0, 240, 255, 0.06);
    }

    .inline-stat-val {
      font-size: 22px;
      font-weight: 700;
      color: #00f0ff;
      text-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
    }

    .inline-stat-lbl {
      font-size: 11px;
      color: @text-secondary;
      margin-top: 4px;
      letter-spacing: 1px;
    }
  }
}

.panel-table {
  .mini-table-wrap {
    max-height: 320px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 240, 255, 0.2);
      border-radius: 2px;
    }
  }
}

.no-data {
  text-align: center;
  padding: 20px 0;
  color: @text-secondary;
  font-size: 13px;
}

// Table dark styling
/deep/ .ivu-table {
  background: transparent;
  color: #c0caf5;
  font-size: 12px;

  &::before { background: transparent; }
  &::after { background: transparent; }

  th {
    background: rgba(0, 240, 255, 0.06);
    color: #00f0ff;
    border-bottom: 1px solid @border-glow;
    font-weight: 600;
    font-size: 12px;
    padding: 8px 6px;
    letter-spacing: 0.5px;
  }

  td {
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    padding: 6px;
    color: #8892b0;
    font-size: 12px;
  }

  tr:hover td {
    background: rgba(0, 240, 255, 0.04);
  }

  .ivu-table-row-hover td {
    background: rgba(0, 240, 255, 0.04) !important;
  }
}

// Loading override
/deep/ .el-loading-mask {
  background: rgba(10, 14, 26, 0.8);
}

// ========== 移动端适配 ==========

// 平板
@media screen and (max-width: 1024px) {
  .immersion-dashboard {
    padding: 12px;
  }

  .top-bar {
    flex-wrap: wrap;
    gap: 8px;

    .brand {
      .brand-text {
        font-size: 20px;
        letter-spacing: 4px;
      }
      .brand-sub {
        font-size: 10px;
      }
    }

    .live-indicator {
      order: 10;
    }

    .top-bar-time {
      font-size: 11px;
    }
  }

  .stat-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 14px 16px;
    gap: 12px;

    .stat-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
    }

    .stat-info .stat-number {
      font-size: 26px;
    }
  }

  .chart-row, .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .panel-chart {
    .chart-inner {
      height: 260px;
    }
    .chart-inner-wide {
      height: 280px;
    }
  }

  .panel-table .mini-table-wrap {
    max-height: 260px;
  }
}

// 大屏手机
@media screen and (max-width: 768px) {
  .immersion-dashboard {
    padding: 8px;
  }

  .top-bar {
    padding-bottom: 10px;
    margin-bottom: 8px;

    .brand {
      gap: 6px;
      .brand-icon {
        font-size: 20px;
      }
      .brand-text {
        font-size: 18px;
        letter-spacing: 3px;
      }
      .brand-sub {
        font-size: 10px;
        letter-spacing: 2px;
      }
    }

    .live-indicator {
      font-size: 11px;
      letter-spacing: 2px;
    }

    .top-bar-time {
      font-size: 10px;
    }
  }

  .dashboard-grid {
    gap: 8px;
  }

  .stat-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 12px 14px;
    gap: 10px;
    border-radius: 10px;

    .stat-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 8px;
    }

    .stat-info {
      .stat-number {
        font-size: 22px;
      }
      .stat-label-text {
        font-size: 11px;
      }
    }
  }

  .panel {
    padding: 10px 12px;
  }

  .panel-header {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .panel-chart {
    .chart-inner {
      height: 220px;
    }
    .chart-inner-wide {
      height: 240px;
    }
  }

  .panel-stat .stat-inline-items {
    gap: 6px;
  }

  .panel-stat .inline-stat {
    min-width: 70px;
    padding: 8px 6px;

    .inline-stat-val {
      font-size: 18px;
    }
    .inline-stat-lbl {
      font-size: 10px;
    }
  }

  .panel-table .mini-table-wrap {
    max-height: 240px;
  }

  /deep/ .ivu-table {
    font-size: 11px;
    th { font-size: 11px; padding: 6px 4px; }
    td { font-size: 11px; padding: 4px; }
  }
}

// 小屏手机
@media screen and (max-width: 480px) {
  .immersion-dashboard {
    padding: 6px;
  }

  .top-bar {
    padding-bottom: 8px;
    margin-bottom: 6px;

    .brand {
      .brand-icon {
        font-size: 16px;
      }
      .brand-text {
        font-size: 15px;
        letter-spacing: 2px;
      }
      .brand-sub {
        display: none;
      }
    }

    .live-indicator {
      font-size: 10px;
      letter-spacing: 1px;
      gap: 4px;
      .live-dot {
        width: 6px;
        height: 6px;
      }
    }

    .top-bar-time {
      font-size: 9px;
      letter-spacing: 0;
    }
  }

  .dashboard-grid {
    gap: 6px;
  }

  .stat-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .stat-card {
    padding: 10px 12px;
    gap: 8px;
    border-radius: 8px;

    .stat-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      svg {
        width: 18px;
        height: 18px;
      }
    }

    .stat-info {
      .stat-number {
        font-size: 18px;
        letter-spacing: 0;
      }
      .stat-label-text {
        font-size: 10px;
        letter-spacing: 0;
      }
    }
  }

  .panel {
    padding: 8px 10px;
    border-radius: 8px;
  }

  .panel-header {
    font-size: 12px;
    margin-bottom: 6px;
    gap: 6px;

    .panel-dot {
      width: 6px;
      height: 6px;
    }
  }

  .panel-chart {
    .chart-inner {
      height: 190px;
    }
    .chart-inner-wide {
      height: 210px;
    }
  }

  .panel-stat .stat-inline-items {
    gap: 4px;
  }

  .panel-stat .inline-stat {
    min-width: 60px;
    padding: 6px 4px;

    .inline-stat-val {
      font-size: 16px;
    }
    .inline-stat-lbl {
      font-size: 9px;
      letter-spacing: 0;
    }
  }

  .panel-table .mini-table-wrap {
    max-height: 200px;
  }

  /deep/ .ivu-table {
    font-size: 10px;
    th { font-size: 10px; padding: 5px 3px; }
    td { font-size: 10px; padding: 3px; }
  }
}
</style>
