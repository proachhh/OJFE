<template>
  <div class="learning-report">
    <h2>{{$t('m.Learning_Report')}}</h2>

    <!-- 推荐题目区域 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>{{$t('m.Recommended_For_You')}}</span>
      </div>
      <div v-if="recommendations.length">
        <el-table :data="recommendations" style="width: 100%">
          <el-table-column prop="_id" :label="$t('m.Problem_ID')"></el-table-column>
          <el-table-column prop="title" :label="$t('m.Problem')"></el-table-column>
          <el-table-column :label="$t('m.Difficulty')">
            <template slot-scope="scope">
              <Tag :color="getDifficultyColor(scope.row.difficulty)">
                {{ $t('m.' + scope.row.difficulty) }}
              </Tag>
            </template>
          </el-table-column>
          <el-table-column prop="tags" :label="$t('m.Knowledge_Points')">
            <template slot-scope="scope">
              {{ scope.row.tags.join(', ') }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('m.Operation')">
            <template slot-scope="scope">
              <el-button type="text" @click="goToProblem(scope.row._id)">{{$t('m.Start_Solving')}}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else>{{$t('m.No_Recommendations')}}</div>
    </el-card>

    <!-- 整体学习概览 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_submissions }}</div>
          <div class="stat-label">{{$t('m.Total_Submissions')}}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.total_ac }}</div>
          <div class="stat-label">{{$t('m_Total_Accepted')}}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">{{$t('m.Accuracy')}}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 知识点掌握表格 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>{{$t('m.Knowledge_Mastery')}}</span>
      </div>
      <el-table :data="stats.tags" style="width: 100%">
        <el-table-column prop="tag_name" :label="$t('m.Knowledge_Point')"></el-table-column>
        <el-table-column prop="total" :label="$t('m.Submission_Count')"></el-table-column>
        <el-table-column prop="ac" :label="$t('m.Accepted_Count')"></el-table-column>
        <el-table-column prop="accuracy" :label="$t('m.Accuracy')">
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
