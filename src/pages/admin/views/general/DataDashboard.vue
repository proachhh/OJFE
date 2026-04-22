<template>
  <div class="data-dashboard">
    <div class="page-header">
      <h2>数据看板</h2>
      <p>Data Dashboard</p>
    </div>

    <div class="overview-cards">
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <i class="el-icon-fa-users"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_users || 0 }}</div>
          <div class="card-label">总用户数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
          <i class="el-icon-fa-file-code-o"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_problems || 0 }}</div>
          <div class="card-label">总题目数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
          <i class="el-icon-fa-send"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_submissions || 0 }}</div>
          <div class="card-label">总提交数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
          <i class="el-icon-fa-trophy"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_contests || 0 }}</div>
          <div class="card-label">总比赛数</div>
        </div>
      </div>
    </div>

    <div class="activity-stats">
      <div class="stat-group">
        <h3>活跃统计</h3>
        <div class="stat-items">
          <div class="stat-item">
            <span class="stat-label">今日提交</span>
            <span class="stat-value">{{ overview.today_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周提交</span>
            <span class="stat-value">{{ overview.week_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本月提交</span>
            <span class="stat-value">{{ overview.month_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日活跃用户</span>
            <span class="stat-value">{{ overview.today_active_users || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周活跃用户</span>
            <span class="stat-value">{{ overview.week_active_users || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">进行中比赛</span>
            <span class="stat-value">{{ overview.active_contests || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未开始比赛</span>
            <span class="stat-value">{{ overview.upcoming_contests || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-panel">
        <h3>难度分布</h3>
        <div id="difficulty-chart" class="chart-container"></div>
      </div>
      <div class="chart-panel">
        <h3>提交结果分布</h3>
        <div id="result-chart" class="chart-container"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-panel">
        <h3>语言分布</h3>
        <div id="language-chart" class="chart-container"></div>
      </div>
      <div class="chart-panel">
        <h3>标签分布 Top 10</h3>
        <div id="tag-chart" class="chart-container"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-panel full-width">
        <h3>每日提交趋势（最近7天）</h3>
        <div id="daily-chart" class="chart-container-wide"></div>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>完成率最高题目 Top 10</h3>
        <Table :data="mostCompleted" :columns="problemColumns" size="small" disabled-hover></Table>
      </div>
      <div class="table-panel">
        <h3>完成率最低题目 Top 10</h3>
        <Table :data="leastCompleted" :columns="problemColumns" size="small" disabled-hover></Table>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>用户排名 Top 20</h3>
        <Table :data="userRanking" :columns="userColumns" size="small" disabled-hover></Table>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>历史提交最多用户</h3>
        <Table :data="topSubmittersAllTime" :columns="submitterColumns" size="small" disabled-hover></Table>
      </div>
      <div class="table-panel">
        <h3>本周提交最多用户</h3>
        <Table :data="topSubmittersWeek" :columns="submitterWeekColumns" size="small" disabled-hover></Table>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@admin/api'

export default {
  name: 'data-dashboard',
  data () {
    return {
      loading: false,
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
        {
          title: 'ID',
          key: '_id',
          width: 80
        },
        {
          title: '题目标题',
          key: 'title',
          ellipsis: true
        },
        {
          title: '难度',
          key: 'difficulty',
          width: 80,
          render: (h, params) => {
            const colorMap = { Low: 'green', Mid: 'blue', High: 'red' }
            const labelMap = { Low: '简单', Mid: '中等', High: '困难' }
            return h('Tag', {
              props: { color: colorMap[params.row.difficulty] || 'default' }
            }, labelMap[params.row.difficulty] || params.row.difficulty)
          }
        },
        {
          title: '提交数',
          key: 'submission_count',
          width: 80
        },
        {
          title: '通过数',
          key: 'accepted_count',
          width: 80
        },
        {
          title: '通过率',
          key: 'pass_rate',
          width: 100,
          render: (h, params) => {
            return h('span', params.row.pass_rate.toFixed(1) + '%')
          }
        }
      ],
      userColumns: [
        {
          title: '排名',
          key: 'rank',
          width: 60
        },
        {
          title: '用户名',
          key: 'username',
          width: 120
        },
        {
          title: '真实姓名',
          key: 'real_name',
          width: 120,
          render: (h, params) => {
            return h('span', params.row.real_name || '-')
          }
        },
        {
          title: '通过数',
          key: 'accepted_count',
          width: 80
        },
        {
          title: '提交数',
          key: 'submission_count',
          width: 80
        },
        {
          title: 'AC率',
          key: 'ac_rate',
          width: 80,
          render: (h, params) => {
            return h('span', params.row.ac_rate.toFixed(1) + '%')
          }
        },
        {
          title: 'OI总分',
          key: 'total_score',
          width: 100
        }
      ],
      submitterColumns: [
        {
          title: '用户名',
          key: 'username',
          width: 120
        },
        {
          title: '真实姓名',
          key: 'real_name',
          width: 120,
          render: (h, params) => {
            return h('span', params.row.real_name || '-')
          }
        },
        {
          title: '提交数',
          key: 'submission_count',
          width: 100
        },
        {
          title: '通过数',
          key: 'accepted_count',
          width: 100
        },
        {
          title: 'OI总分',
          key: 'total_score',
          width: 100
        }
      ],
      submitterWeekColumns: [
        {
          title: '用户名',
          key: 'username',
          width: 120
        },
        {
          title: '真实姓名',
          key: 'real_name',
          width: 120,
          render: (h, params) => {
            return h('span', params.row.real_name || '-')
          }
        },
        {
          title: '本周提交',
          key: 'submission_count',
          width: 100
        },
        {
          title: '本周通过',
          key: 'accepted_count',
          width: 100
        }
      ]
    }
  },
  mounted () {
    this.fetchData()
  },
  methods: {
    fetchData () {
      this.loading = true
      api.getDataDashboard().then(res => {
        const data = res.data.data
        this.overview = data.overview || {}
        this.problemStats = data.problem_stats || {}
        this.difficultyDistribution = data.difficulty_distribution || []
        this.problemCompletion = data.problem_completion || {}
        this.topSubmitters = data.top_submitters || {}
        this.userRanking = data.user_ranking || []
        this.submissionStats = data.submission_stats || {}
        this.mostCompleted = this.problemCompletion.most_completed || []
        this.leastCompleted = this.problemCompletion.least_completed || []
        this.topSubmittersAllTime = this.topSubmitters.all_time || []
        this.topSubmittersWeek = this.topSubmitters.this_week || []
        this.loading = false
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.drawDifficultyChart()
            this.drawResultChart()
            this.drawLanguageChart()
            this.drawTagChart()
            this.drawDailyChart()
            window.addEventListener('resize', this.handleResize)
          })
        })
      }).catch(() => {
        this.loading = false
      })
    },
    drawDifficultyChart () {
      const chartDom = document.getElementById('difficulty-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const labelMap = { Low: '简单', Mid: '中等', High: '困难' }
      const colorMap = { Low: '#67c23a', Mid: '#e6a23c', High: '#f56c6c' }
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}题 (通过率 {d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}题' },
          data: this.difficultyDistribution.map(item => ({
            name: labelMap[item.name] || item.name,
            value: item.count,
            passRate: item.pass_rate,
            itemStyle: { color: colorMap[item.name] || '#409eff' }
          }))
        }]
      })
    },
    drawResultChart () {
      const chartDom = document.getElementById('result-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const resultDistribution = this.submissionStats.result_distribution || []
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}次' },
          data: resultDistribution.map(item => ({
            name: item.status,
            value: item.count
          }))
        }]
      })
    },
    drawLanguageChart () {
      const chartDom = document.getElementById('language-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const languageDistribution = this.submissionStats.language_distribution || []
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}次' },
          data: languageDistribution.map(item => ({
            name: item.language,
            value: item.count
          }))
        }]
      })
    },
    drawTagChart () {
      const chartDom = document.getElementById('tag-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const tagsDistribution = this.problemStats.tags_distribution || []
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: tagsDistribution.map(item => item.name).reverse(),
          axisLabel: { interval: 0 }
        },
        series: [{
          type: 'bar',
          data: tagsDistribution.map(item => item.count).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          barWidth: '60%'
        }]
      })
    },
    drawDailyChart () {
      const chartDom = document.getElementById('daily-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const dailySubmissions = this.submissionStats.daily_submissions || []
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['总提交', '通过'], left: 'center' },
        grid: { left: '50px', right: '30px', bottom: '40px', top: '50px' },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dailySubmissions.map(item => item.date)
        },
        yAxis: { type: 'value' },
        series: [
          {
            name: '总提交',
            type: 'line',
            smooth: true,
            data: dailySubmissions.map(item => item.total),
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#409eff' }
          },
          {
            name: '通过',
            type: 'line',
            smooth: true,
            data: dailySubmissions.map(item => item.accepted),
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#67c23a' }
          }
        ]
      })
      setTimeout(() => {
        chart.resize()
      }, 200)
    },
    handleResize () {
      const charts = ['difficulty-chart', 'result-chart', 'language-chart', 'tag-chart', 'daily-chart']
      charts.forEach(id => {
        const chartDom = document.getElementById(id)
        if (chartDom) {
          const chart = echarts.getInstanceByDom(chartDom)
          if (chart) chart.resize()
        }
      })
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="less" scoped>
.data-dashboard {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    letter-spacing: 2px;
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 28px;
    color: #fff;
  }
}

.card-content {
  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
  }

  .card-label {
    font-size: 14px;
    color: #64748b;
    margin-top: 4px;
  }
}

.activity-stats {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }

  .stat-items {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 24px;
    background: #f8fafc;
    border-radius: 12px;
    min-width: 120px;

    .stat-label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
    }
  }
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;

  &.single-row {
    grid-template-columns: 1fr;
  }
}

.chart-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  width: 100%;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.chart-container {
  height: 350px;
  width: 100%;
  min-width: 400px;
}

.chart-container-wide {
  height: 300px;
  width: 100%;
  min-width: 600px;
}

.tables-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.table-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }
}
</style>