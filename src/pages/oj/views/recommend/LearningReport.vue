<template>
  <div class="learning-report">
    <h2>{{$t('m.Learning_Report')}}</h2>

    <!-- 整体概览卡片（四列） -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_submissions }}</div>
          <div class="stat-label">{{$t('m.Total_Submissions')}}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_ac }}</div>
          <div class="stat-label">{{$t('m.Total_Accepted')}}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">{{$t('m.Accuracy')}}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.beat_percent }}%</div>
          <div class="stat-label">{{$t('m.Beat_Percent', { percent: stats.beat_percent })}}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 两栏布局（左侧推荐，右侧雷达图） -->
    <el-row :gutter="20">
      <!-- 推荐题目区域 -->
      <el-col :span="14">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>{{$t('m.Recommended_For_You')}}</span>
          </div>
          <div v-if="recommendations.length">
            <el-table :data="recommendations" style="width: 100%">
              <el-table-column prop="_id" :label="$t('m.Problem_ID')" width="100"></el-table-column>
              <el-table-column prop="title" :label="$t('m.Problem')"></el-table-column>
              <el-table-column :label="$t('m.Difficulty')" width="100">
                <template slot-scope="scope">
                  <Tag :color="getDifficultyColor(scope.row.difficulty)">
                    {{ $t('m.' + scope.row.difficulty) }}
                  </Tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('m.Knowledge_Points')">
                <template slot-scope="scope">
                   {{ translateTags(scope.row.tags) }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('m.Recommendation_Reason')" min-width="150">
                <template slot-scope="scope">
                  {{ scope.row.reason }}
                </template>
              </el-table-column>
              <el-table-column :label="$t('m.Operation')" width="100">
                <template slot-scope="scope">
                  <el-button type="text" @click="goToProblem(scope.row._id)">{{$t('m.Start_Solving')}}</el-button>
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
          <div v-else>{{$t('m.No_Recommendations')}}</div>
        </el-card>
      </el-col>

      <!-- 右侧雷达图 -->
      <el-col :span="10">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>{{$t('m.Knowledge_Mastery_Radar')}}</span>
          </div>
          <div id="radar-chart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学习趋势折线图 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>{{$t('m.Learning_Trend')}}</span>
      </div>
      <div id="trend-chart" style="height: 300px;"></div>
    </el-card>

    <!-- 薄弱知识点建议 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>{{$t('m.Learning_Advice')}}</span>
      </div>
      <div style="font-size: 16px; color: #666;">
        {{ getWeaknessAdvice() }}
      </div>
    </el-card>

    <!-- 知识点掌握详情表格 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>{{$t('m.Knowledge_Mastery_Details')}}</span>
      </div>
      <el-table :data="stats.tags" style="width: 100%">
        <el-table-column :label="$t('m.Knowledge_Point')">
          <template slot-scope="scope">
             {{ translateTag(scope.row.tag_name) }}
          </template>
        </el-table-column>
        <el-table-column prop="total" :label="$t('m.Submission_Count')"></el-table-column>
        <el-table-column prop="ac" :label="$t('m.Accepted_Count')"></el-table-column>
        <el-table-column :label="$t('m.Accuracy')" width="180">
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

export default {
  data() {
    return {
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
      trendData: {
        dates: [],
        rates: []
      }
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchRecommendations()
    this.fetchTrendData()
  },
  methods: {
     // 安全翻译标签
  translateTag(tagName) {
    if (!tagName) return '';
    const key = `m.tag.${tagName}`;
    // 尝试获取翻译，如果翻译结果等于 key 本身（说明无对应翻译），则返回原始标签名
    const translated = this.$t(key);
    return translated === key ? tagName : translated;
  },

  // 批量翻译标签（用于推荐卡片）
  // 替换原来的 translateTags 函数
translateTags(tags) {
  if (!tags || !tags.length) return '';
  // 直接使用 translateTag 处理每个标签
  return tags.map(tag => this.translateTag(tag)).join(', ');
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
    fetchTrendData() {
      axios.get('/learning-trend/', { params: { days: 7 } })
        .then(res => {
          const trend = res.data.trend
          this.trendData = {
            dates: trend.map(item => item.date),
            rates: trend.map(item => item.accuracy)
          }
          this.$nextTick(() => {
            this.drawTrendChart()
          })
        })
        .catch(err => console.error(err))
    },
    drawRadar() {
  // 确保 this 不为 null
  if (!this || !this.stats || !this.stats.tags || this.stats.tags.length === 0) {
    return;
  }
  
  const chart = echarts.init(document.getElementById('radar-chart'));
  chart.setOption({
    radar: {
      indicator: this.stats.tags.map(tag => ({
        name: this.translateTag(tag.tag_name),
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
      data: [{ value: this.stats.tags.map(tag => tag.accuracy), name: this.$t('m.Accuracy') }],
      areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
      lineStyle: { color: '#409EFF', width: 2 },
      itemStyle: { color: '#409EFF' }
    }]
  });
},
    drawTrendChart() {
      if (!this.trendData.dates.length) return
      const chart = echarts.init(document.getElementById('trend-chart'))
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: this.trendData.dates },
        yAxis: { type: 'value', name: this.$t('m.Accuracy') + ' (%)', min: 0, max: 100 },
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
    translateTags(tags) {
        if (this === null) {
    console.error('this is null in translateTags');
    return '';
  }
      if (!tags || tags.length === 0) return ''
      return tags.map(tag => this.$t('m.tag.' + tag, tag)).join(', ')
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
    },
    getWeaknessAdvice() {
  if (!this.stats.tags || this.stats.tags.length === 0) {
    return this.$t('m.No_Knowledge_Data');  // 需在翻译文件中添加该字段
  }
  const weakest = this.stats.tags[0];  // 已按正确率升序
  const tagDisplay = this.translateTag(weakest.tag_name);

  if (weakest.total === 0) {
    return this.$t('m.Weakness_Advice_No_Practice', { tag: tagDisplay });
  }
  if (weakest.accuracy === 0 && weakest.total > 0) {
    // 可选：添加更细致的提示
    return `「${tagDisplay}」知识点您已提交 ${weakest.total} 次，但尚未通过任何一题，建议加强练习。`;
  }
  if (weakest.accuracy < 100) {
    return this.$t('m.Weakness_Advice_Need_Improve', { tag: tagDisplay, accuracy: weakest.accuracy });
  }
  return this.$t('m.Weakness_Advice_Excellent');
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