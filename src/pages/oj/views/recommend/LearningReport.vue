<template>
  <div class="learning-report-elegant">

    <!-- 整体概览卡片（四列） -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_submissions }}</div>
        <div class="stat-label">{{ $t('m.Total_Submissions') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_ac }}</div>
        <div class="stat-label">{{ $t('m.Total_Accepted') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.accuracy }}%</div>
        <div class="stat-label">{{ $t('m.Accuracy') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.beat_percent }}%</div>
        <div class="stat-label">{{ $t('m.Beat_Percent', { percent: stats.beat_percent }) }}</div>
      </div>
    </div>

    <!-- 两栏布局（左侧推荐，右侧雷达图） -->
    <div class="main-content">
      <!-- 推荐题目区域 -->
      <div class="recommendations-section">
        <div class="section-header">
          <Icon type="ios-lightbulb" />
          <span>{{ $t('m.Recommended_For_You') }}</span>
        </div>
        <div v-if="recommendations.length" class="table-container">
          <Table :data="recommendations" :columns="recommendColumns" class="recommend-table" disabled-hover></Table>
          <!-- 分页组件 -->
          <div class="pagination-wrapper">
            <Pagination
              :total="recommendTotal"
              :page-size.sync="recommendLimit"
              :current.sync="recommendPage"
              @on-change="onRecommendPageChange"
              @on-page-size-change="onRecommendPageSizeChange"
              show-sizer>
            </Pagination>
          </div>
        </div>
        <div v-else class="no-data">
          <Icon type="ios-inbox" size="48" />
          <p>{{ $t('m.No_Recommendations') }}</p>
        </div>
      </div>

      <!-- 右侧雷达图 -->
      <div class="radar-section">
        <div class="section-header">
          <Icon type="ios-radar" />
          <span>{{ $t('m.Knowledge_Mastery_Radar') }}</span>
        </div>
        <div id="radar-chart" class="chart-container"></div>
        <!-- 切换按钮 -->
        <div class="radar-toggle">
          <Button 
            :type="currentRadarType === 'knowledge' ? 'primary' : 'default'"
            @click="switchRadarType('knowledge')"
            size="small">
            {{ $t('m.Knowledge_Points') }}
          </Button>
          <Button 
            :type="currentRadarType === 'language' ? 'primary' : 'default'"
            @click="switchRadarType('language')"
            size="small">
            {{ $t('m.Language') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 学习趋势折线图 -->
    <div class="trend-section">
      <div class="section-header">
        <Icon type="ios-trending-up" />
        <span>{{ $t('m.Learning_Trend') }}</span>
      </div>
      <div id="trend-chart" class="chart-container-large"></div>
    </div>

    <!-- 薄弱知识点建议 -->
    <div class="advice-section">
      <div class="section-header">
        <Icon type="ios-chatbubbles" />
        <span>{{ $t('m.Learning_Advice') }}</span>
      </div>
      <div class="advice-content">
        <Icon type="ios-information-circle" class="advice-icon" />
        <p>{{ getWeaknessAdvice() }}</p>
      </div>
    </div>

    <!-- 知识点掌握详情表格 -->
    <div class="mastery-section">
      <div class="section-header">
        <Icon type="ios-analytics" />
        <span>{{ $t('m.Knowledge_Mastery_Details') }}</span>
      </div>
      <Table :data="stats.tags" :columns="masteryColumns" class="mastery-table" disabled-hover></Table>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'
import Pagination from '@oj/components/Pagination'

export default {
  components: {
    Pagination
  },
  data() {
    return {
      stats: {
        total_submissions: 0,
        total_ac: 0,
        accuracy: 0,
        beat_percent: 0,
        tags: [],
        lang_stats: []  
      },
      recommendations: [],
      recommendPage: 1,
      recommendLimit: 5,
      recommendTotal: 0,
      trendData: {
        dates: [],
        rates: []
      },
      currentRadarType: 'knowledge',
      recommendColumns: [
        {
          title: this.$t('m.Problem_ID'),
          key: '_id',
          width: 100,
          align: 'center'
        },
        {
          title: this.$t('m.Problem'),
          key: 'title',
          ellipsis: true,
          tooltip: true
        },
        {
          title: this.$t('m.Difficulty'),
          key: 'difficulty',
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('Tag', {
              props: {
                color: this.getDifficultyColor(params.row.difficulty)
              }
            }, this.$t('m.' + params.row.difficulty))
          }
        },
        {
          title: this.$t('m.Knowledge_Points'),
          key: 'tags',
          render: (h, params) => {
            return h('span', this.translateTags(params.row.tags))
          }
        },
        {
          title: this.$t('m.Recommendation_Reason'),
          key: 'reason',
          ellipsis: true,
          tooltip: true
        },
        {
          title: this.$t('m.Operation'),
          width: 120,
          align: 'center',
          render: (h, params) => {
            return h('Button', {
              props: {
                type: 'primary',
                size: 'small'
              },
              on: {
                click: () => this.goToProblem(params.row._id)
              }
            }, this.$t('m.Start_Solving'))
          }
        }
      ],
      masteryColumns: [
        {
          title: this.$t('m.Knowledge_Point'),
          key: 'tag_name',
          render: (h, params) => {
            return h('span', this.translateTag(params.row.tag_name))
          }
        },
        {
          title: this.$t('m.Submission_Count'),
          key: 'total',
          align: 'center'
        },
        {
          title: this.$t('m.Accepted_Count'),
          key: 'ac',
          align: 'center'
        },
        {
          title: this.$t('m.Accuracy'),
          key: 'accuracy',
          width: 180,
          render: (h, params) => {
            return h('Progress', {
              props: {
                percent: params.row.accuracy,
                status: params.row.accuracy < 30 ? 'wrong' : params.row.accuracy < 70 ? 'normal' : 'success'
              }
            })
          }
        }
      ]
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchRecommendations()
    this.fetchTrendData()
    // 延迟重绘图表，确保 DOM 已渲染
    this.$nextTick(() => {
      setTimeout(() => {
        this.drawRadar()
        this.drawTrendChart()
      }, 300)
    })
  },
  methods: {
    translateTag(tagName) {
        if (!tagName) return '';
        const key = `m.tag.${tagName}`;
        // 尝试获取翻译，如果翻译结果等于 key 本身（说明无对应翻译），则返回原始标签名
        const translated = this.$t(key);
        return translated === key ? tagName : translated;
    },
    translateTags(tags) {
    if (!tags || !tags.length) return '';
    // 直接使用 translateTag 处理每个标签
    return tags.map(tag => this.translateTag(tag)).join(', ');
    },
    switchRadarType(type) {
        if (this.currentRadarType === type) return;
        this.currentRadarType = type;
        this.$nextTick(() => {
            this.drawRadar();
        });
    },
    fetchStats() {
      axios.get('/learning-stats/')
        .then(res => {
          this.stats = res.data
          if (!this.stats.lang_stats) this.stats.lang_stats = [];
          this.$nextTick(() => {
            this.drawRadar();
          });
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
    onRecommendPageChange(page) {
      this.recommendPage = page
      this.fetchRecommendations()
    },
    onRecommendPageSizeChange(pageSize) {
      this.recommendLimit = pageSize
      this.recommendPage = 1
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
        const chartDom = document.getElementById('radar-chart');
        if (!chartDom) {
            console.warn('Radar chart DOM not found');
            return;
        }

        let existingChart = echarts.getInstanceByDom(chartDom);
        if (existingChart) {
            existingChart.dispose();
        }

        let radarData = [];
        let indicator = [];

        if (this.currentRadarType === 'knowledge') {
            radarData = this.stats.tags || [];
            indicator = radarData.map(tag => ({
            name: this.translateTag(tag.tag_name),
            max: 100
            }));
        } else {
            radarData = this.stats.lang_stats || [];
            indicator = radarData.map(lang => ({
            name: lang.lang_name,
            max: 100
            }));
        }

        if (!radarData.length) {
            return;
        }

        const chart = echarts.init(chartDom);
        chart.setOption({
            radar: {
            indicator: indicator,
            shape: 'circle',
            name: { textStyle: { fontSize: 12, color: '#333' } }
            },
            series: [{
            type: 'radar',
            data: [{
                value: radarData.map(item => item.accuracy),
                name: this.$t('m.Accuracy')
            }],
            areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
            lineStyle: { color: '#409EFF', width: 2 },
            itemStyle: { color: '#409EFF' }
            }]
        });
    },
    drawTrendChart() {
      const chartDom = document.getElementById('trend-chart');
      if (!chartDom) {
        console.warn('Trend chart DOM not found');
        return;
      }
      if (!this.trendData.dates.length) return
      const chart = echarts.init(chartDom)
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
    return this.$t('m.Weakness_Advice_No_Submission', { total: weakest.total });
  }
  if (weakest.accuracy < 100) {
    return this.$t('m.Weakness_Advice_Need_Improve', { tag: tagDisplay, accuracy: weakest.accuracy });
  }
  return this.$t('m.Weakness_Advice_Excellent');
}
  }
}
</script>

<style scoped lang="less">
.learning-report-elegant {
  max-width: 1400px;
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

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(30, 58, 138, 0.12);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
  }
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

/* 区域通用样式 */
.recommendations-section,
.radar-section,
.trend-section,
.advice-section,
.mastery-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  padding: 24px;

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

/* 推荐表格 */
.recommendations-section {
  .table-container {
    .recommend-table {
      border-radius: 8px;
      overflow: hidden;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      position: relative;
      z-index: 1001;
    }
  }

  .no-data {
    text-align: center;
    padding: 60px 20px;
    color: #94a3b8;

    .ivu-icon {
      margin-bottom: 16px;
    }

    p {
      font-size: 16px;
      margin: 0;
    }
  }
}

/* 雷达图 */
.radar-section {
  .chart-container {
    height: 350px;
    margin-bottom: 16px;
  }

  .radar-toggle {
    display: flex;
    justify-content: center;
    gap: 12px;
    position: relative;
    z-index: 10;
    padding-top: 8px;

    .ivu-btn {
      position: relative;
      z-index: 10;
    }
  }
}

/* 趋势图 */
.trend-section {
  margin-bottom: 40px;

  .chart-container-large {
    height: 350px;
  }
}

/* 建议区域 */
.advice-section {
  margin-bottom: 40px;

  .advice-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;

    .advice-icon {
      font-size: 24px;
      color: #3b82f6;
      flex-shrink: 0;
    }

    p {
      margin: 0;
      font-size: 15px;
      line-height: 1.8;
      color: #334155;
    }
  }
}

/* 知识点掌握详情 */
.mastery-section {
  .mastery-table {
    border-radius: 8px;
    overflow: hidden;
  }
}
</style>