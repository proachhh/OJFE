<template>
  <div class="learning-report">
    <h2>学习报告</h2>

    <!-- 整体概览卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_submissions }}</div>
          <div class="stat-label">总提交次数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_ac }}</div>
          <div class="stat-label">总正确次数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 两栏布局 -->
    <el-row :gutter="20">
      <!-- 左侧：推荐题目 -->
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
              <el-table-column prop="tags" label="知识点">
                <template slot-scope="scope">
                   {{ translateTags(scope.row.tags) }}
                </template>
              </el-table-column>
              <el-table-column label="推荐理由" min-width="120">
                <template slot-scope="scope">
                  基于您薄弱知识点 {{ scope.row.tags[0] || '热门' }} 推荐
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template slot-scope="scope">
                  <el-button type="text" @click="goToProblem(scope.row._id)">开始做题</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else>暂无推荐题目，继续刷题吧！</div>
        </el-card>
      </el-col>

      <!-- 右侧：雷达图 -->
      <el-col :span="10">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>知识点掌握雷达图</span>
          </div>
          <div id="radar-chart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 知识点掌握详情表格（带进度条） -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>知识点掌握详情</span>
      </div>
      <el-table :data="stats.tags" style="width: 100%">
        <el-table-column label="知识点">
            <template slot-scope="scope">
                {{ $t(`tag.${scope.row.tag_name}`, scope.row.tag_name) }}
            </template>
        </el-table-column>
        <el-table-column prop="total" label="提交次数"></el-table-column>
        <el-table-column prop="ac" label="正确次数"></el-table-column>
        <el-table-column label="正确率" width="180">
          <template slot-scope="scope">
             {{ $t(`tag.${scope.row.tag_name}`, scope.row.tag_name) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import echarts from 'echarts'

export default {
  data() {
    return {
      stats: {
        total_submissions: 0,
        total_ac: 0,
        accuracy: 0,
        tags: []
      },
      recommendations: []
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchRecommendations()
  },
  methods: {
    translateTags(tags) {
        if (!tags || tags.length === 0) return ''
        return tags.map(tag => this.$t(`tag.${tag}`, tag)).join(', ')
    },
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
      axios.get('/recommend/')
        .then(res => {
          this.recommendations = res.data.recommendations
        })
        .catch(err => console.error(err))
    },
    goToProblem(id) {
      this.$router.push({ name: 'problem-details', params: { problemID: id } })
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
    drawRadar() {
      if (!this.stats.tags || this.stats.tags.length === 0) return
      const chart = echarts.init(document.getElementById('radar-chart'))
      chart.setOption({
        radar: {
          indicator: this.stats.tags.map(tag => ({ name: tag.tag_name, max: 100 })),
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
