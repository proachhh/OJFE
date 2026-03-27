<template>
  <div class="learning-report">
    <h2>学习报告</h2>

    <!-- 推荐题目区域 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>为你推荐</span>
      </div>
      <div v-if="recommendations.length">
        <el-table :data="recommendations" style="width: 100%">
	  <el-table-column prop="_id" label="题号"></el-table-column>
          <el-table-column prop="title" label="题目"></el-table-column>
	  <el-table-column label="难度">
  	    <template slot-scope="scope">
    		<Tag :color="getDifficultyColor(scope.row.difficulty)">
        	  {{ $t('m.' + scope.row.difficulty) }}
    		</Tag>
  	    </template>
          </el-table-column>
          <el-table-column prop="tags" label="知识点">
            <template slot-scope="scope">
              {{ scope.row.tags.join(', ') }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button type="text" @click="goToProblem(scope.row._id)">开始做题</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else>暂无推荐题目，继续刷题吧！</div>
    </el-card>

    <!-- 整体学习概览 -->
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

    <!-- 知识点掌握表格 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>知识点掌握情况</span>
      </div>
      <el-table :data="stats.tags" style="width: 100%">
        <el-table-column prop="tag_name" label="知识点"></el-table-column>
        <el-table-column prop="total" label="提交次数"></el-table-column>
        <el-table-column prop="ac" label="正确次数"></el-table-column>
        <el-table-column prop="accuracy" label="正确率">
          <template slot-scope="scope">
            {{ scope.row.accuracy }}%
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

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
    fetchStats() {
      axios.get('/learning-stats/')
        .then(res => {
          this.stats = res.data
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
      window.location.href = `/problem/${id}`
    },
    getDifficultyColor(level) {
      if (level === 'Low') return 'green'
      if (level === 'Mid') return 'blue'
      if (level === 'High') return 'yellow'
      return ''
    }
  }
}
</script>

<style scoped>
.learning-report {
  padding: 20px;
}
.stats-cards {
  margin: 20px 0;
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
