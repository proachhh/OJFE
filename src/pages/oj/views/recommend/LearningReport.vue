<template>
  <div class="learning-report">
    <h2>学习报告</h2>

    <!-- 整体概览卡片（四列） -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_submissions }}</div>
          <div class="stat-label">总提交次数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_ac }}</div>
          <div class="stat-label">总正确次数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.beat_percent }}%</div>
          <div class="stat-label">击败了全站{{ stats.beat_percent }}%的用户</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 两栏布局（左侧推荐，右侧雷达图） -->
    <el-row :gutter="20">
      <!-- 推荐题目区域 -->
      <el-col :span="14">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>为你推荐</span>
          </div>
          <div v-if="recommendations.length">
            <el-table :data="recommendations" style="width: 100%">
              <el-table-column prop="_id" label="题号" width="100"></el-table-column>
              <el-table-column prop="title" label="题目"></el-table-column>
              <el-table-column label="难度" width="100">
                <template slot-scope="scope">
                  <Tag :color="getDifficultyColor(scope.row.difficulty)">
                    {{ $t('m.' + scope.row.difficulty) }}
                  </Tag>
                </template>
              </el-table-column>
              <el-table-column label="知识点">
                <template slot-scope="scope">
                  {{ translateTags(scope.row.tags) }}
                </template>
              </el-table-column>
              <el-table-column label="推荐理由" min-width="150">
                <template slot-scope="scope">
                  {{ scope.row.reason }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template slot-scope="scope">
                  <el-button type="text" @click="goToProblem(scope.row._id)">开始做题</el-button>
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页组件 -->
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="recommendPage"
              :page-sizes="[5, 10, 20]"
              :page-size="recommendLimit"
              layout="total, sizes, prev, pager, next, jumper"
              :total="recommendTotal"
              style="margin-top: 15px; text-align: center;">
            </el-pagination>
          </div>
          <div v-else>暂无推荐题目，继续刷题吧！</div>
        </el-card>
      </el-col>

      <!-- 右侧雷达图 -->
      <el-col :span="10">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>知识点掌握雷达图</span>
          </div>
          <div id="radar-chart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学习趋势折线图 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>学习趋势（最近7天正确率）</span>
      </div>
      <div id="trend-chart" style="height: 300px;"></div>
    </el-card>

    <!-- 薄弱知识点建议 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>学习建议</span>
      </div>
      <div style="font-size: 16px; color: #666;">
        {{ getWeaknessAdvice() }}
      </div>
    </el-card>

    <!-- 最近提交记录 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>最近提交</span>
      </div>
      <el-table :data="recentSubmissions" style="width: 100%">
        <el-table-column prop="problem.title" label="题目"></el-table-column>
        <el-table-column label="结果">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === 0 ? 'success' : 'danger'">
              {{ scope.row.result === 0 ? '正确' : '错误' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="时间" width="180"></el-table-column>
      </el-table>
    </el-card>

    <!-- 知识点掌握详情表格 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>知识点掌握详情</span>
      </div>
      <el-table :data="stats.tags" style="width: 100%">
        <el-table-column label="知识点">
          <template slot-scope="scope">
            {{ m.tag[scope.row.tag_name] || scope.row.tag_name }}
          </template>
        </el-table-column>
        <el-table-column prop="total" label="提交次数"></el-table-column>
        <el-table-column prop="ac" label="正确次数"></el-table-column>
        <el-table-column label="正确率" width="180">
          <template slot-scope="scope">
            <el-progress :percentage="scope.row.accuracy" :color="progressColor(scope.row.accuracy)"></el-progress>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import echarts from 'echarts'
import { m } from '@/i18n/oj/zh-CN.js'

export default {
  data() {
    return {
      m: m,
      stats: {
        total_submissions: 0,
        total_ac: 0,
        accuracy: 0,
        beat_percent: 0,
        tags: []
      },
      recommendations: [],
      recommendPage: 1,
      recommendLimit: 5,
      recommendTotal: 0,
      recentSubmissions: [],
      trendData: {
        dates: [],
        rates: []
      }
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchRecommendations()
    this.fetchRecentSubmissions()
    this.fetchTrendData()
  },
  methods: {
    fetchStats() {
      axios.get('/learning-stats/')
        .then(res => {
          this.stats = res.data
          this.$nextTick(() => {
            this.drawRadar()
          })
        })
        .catch(err => console.error(err))
    },
    fetchRecommendations() {
      const offset = (this.recommendPage - 1) * this.recommendLimit
      axios.get('/recommend/', { params: { limit: this.recommendLimit, offset } })
        .then(res => {
          this.recommendations = res.data.recommendations
          this.recommendTotal = res.data.total
        })
        .catch(err => console.error(err))
    },
    handleSizeChange(val) {
      this.recommendLimit = val
      this.recommendPage = 1
      this.fetchRecommendations()
    },
    handleCurrentChange(val) {
      this.recommendPage = val
      this.fetchRecommendations()
    },
    fetchRecentSubmissions() {
      axios.get('/api/submissions/', { params: { myself: 1, limit: 5 } })
        .then(res => {
          this.recentSubmissions = res.data.data.results
        })
        .catch(err => console.error(err))
    },
    fetchTrendData() {
      // 模拟最近7天的正确率数据（可替换为真实接口）
      const today = new Date()
      const dates = []
      const rates = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        dates.push(`${d.getMonth()+1}/${d.getDate()}`)
        rates.push(Math.floor(Math.random() * 100))
      }
      this.trendData = { dates, rates }
      this.$nextTick(() => {
        this.drawTrendChart()
      })
    },
    drawRadar() {
      if (!this.stats.tags || this.stats.tags.length === 0) return
      const chart = echarts.init(document.getElementById('radar-chart'))
      chart.setOption({
        radar: {
          indicator: this.stats.tags.map(tag => ({
            name: this.m.tag[tag.tag_name] || tag.tag_name,
            max: 100
          })),
          shape: 'circle',
          name: {
            textStyle: {
              fontSize: 12,
              color: '#333'
            }
          }
        },
        series: [{
          type: 'radar',
          data: [{ value: this.stats.tags.map(tag => tag.accuracy), name: '正确率' }],
          areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
          lineStyle: { color: '#409EFF', width: 2 },
          itemStyle: { color: '#409EFF' }
        }]
      })
    },
    drawTrendChart() {
      if (!this.trendData.dates.length) return
      const chart = echarts.init(document.getElementById('trend-chart'))
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: this.trendData.dates },
        yAxis: { type: 'value', name: '正确率 (%)', min: 0, max: 100 },
        series: [{
          type: 'line',
          data: this.trendData.rates,
          smooth: true,
          areaStyle: {},
          lineStyle: { color: '#409EFF', width: 2 },
          symbol: 'circle',
          symbolSize: 8
        }]
      })
    },
    getWeaknessAdvice() {
      if (!this.stats.tags.length) return ''
      const sorted = [...this.stats.tags].sort((a,b) => a.accuracy - b.accuracy)
      const weakest = sorted[0]
      if (weakest.accuracy === 100) return '太棒了！你已掌握所有知识点，继续保持！'
      if (weakest.total === 0) return `您还未练习过「${weakest.tag_name}」相关的题目，建议开始练习。`
      return `您对「${weakest.tag_name}」的正确率仅为 ${weakest.accuracy}%，建议加强练习。`
    },
    translateTags(tags) {
      if (!tags || tags.length === 0) return ''
      return tags.map(tag => this.m.tag[tag] || tag).join(', ')
    },
    getDifficultyColor(level) {
      if (level === 'Low') return 'green'
      if (level === 'Mid') return 'blue'
      if (level === 'High') return 'yellow'
      return ''
    },
    progressColor(accuracy) {
      if (accuracy < 30) return '#f56c6c'
      if (accuracy < 70) return '#e6a23c'
      return '#67c23a'
    },
    goToProblem(id) {
      this.$router.push({ name: 'problem-details', params: { problemID: id } })
    }
  }
}
</script>

<style scoped>
.learning-report {
  padding: 20px;
}
.stats-cards {
  margin-bottom: 20px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}
.stat-label {
  text-align: center;
  color: #909399;
  margin-top: 10px;
}
</style>
