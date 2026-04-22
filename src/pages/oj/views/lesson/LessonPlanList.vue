<template>
  <div class="lesson-plan-list-elegant">
    <div class="search-section">
      <Input 
        v-model="keyword" 
        placeholder="Search lesson plans..." 
        class="search-input"
        @on-enter="handleSearch"
        @on-change="handleSearch"
      >
        <Icon type="ios-search" slot="prefix" />
      </Input>
    </div>

    <div class="lesson-plan-panel">
      <div v-if="loading" class="loading-container">
        <Spin size="large" fix></Spin>
      </div>
      <div v-else-if="lessonPlans.length === 0" class="empty-container">
        <p>No lesson plans available</p>
      </div>
      <div v-else class="lesson-plan-grid">
        <div 
          v-for="plan in lessonPlans" 
          :key="plan.id" 
          class="lesson-plan-card"
          @click="goToLessonPlan(plan.id)"
        >
          <div class="card-cover">
            <img v-if="plan.cover_image" :src="plan.cover_image" :alt="plan.title" />
            <div v-else class="default-cover">
              <Icon type="ios-book" size="48" />
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ plan.title }}</h3>
            <p class="card-description">{{ plan.description }}</p>
            <div class="card-footer">
              <span class="problems-count">
                <Icon type="ios-list" />
                {{ plan.problems_count }} {{ plan.problems_count === 1 ? 'Problem' : 'Problems' }}
              </span>
              <span class="author">
                <Icon type="ios-person" />
                {{ plan.created_by_username }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > limit" class="pagination-wrapper">
        <Pagination 
          :total="total" 
          :page-size.sync="limit" 
          :current.sync="offset"
          @on-change="handlePageChange"
          show-sizer
          @on-page-size-change="handlePageSizeChange"
        ></Pagination>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'LessonPlanList',
  data () {
    return {
      lessonPlans: [],
      loading: false,
      keyword: '',
      offset: 1,
      limit: 20,
      total: 0
    }
  },
  mounted () {
    this.getLessonPlanList()
  },
  methods: {
    getLessonPlanList () {
      this.loading = true
      const params = {
        offset: (this.offset - 1) * this.limit,
        limit: this.limit
      }
      if (this.keyword) {
        params.keyword = this.keyword
      }
      api.getLessonPlanList(params).then(res => {
        const data = res.data.data
        this.lessonPlans = data.results || []
        this.total = data.count || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.lessonPlans = []
        this.total = 0
      })
    },
    handleSearch () {
      this.offset = 1
      this.getLessonPlanList()
    },
    handlePageChange (page) {
      this.offset = page
      this.getLessonPlanList()
    },
    handlePageSizeChange (pageSize) {
      this.limit = pageSize
      this.offset = 1
      this.getLessonPlanList()
    },
    goToLessonPlan (id) {
      this.$router.push({ name: 'lesson-plan-details', params: { id } })
    }
  }
}
</script>

<style lang="less" scoped>
.lesson-plan-list-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
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

/* 搜索区域 */
.search-section {
  max-width: 600px;
  margin: 0 auto 30px;

  .search-input {
    width: 100%;
  }
}

/* 主面板 */
.lesson-plan-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 30px;
  transition: box-shadow 0.3s ease;
  position: relative;
  min-height: 400px;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }

  .loading-container,
  .empty-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    font-size: 1.1rem;
    color: #94a3b8;
  }
}

/* 卡片网格 */
.lesson-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

/* 卡片样式 */
.lesson-plan-card {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(30, 58, 138, 0.12);
    border-color: #1e3a8a;

    .card-cover img {
      transform: scale(1.05);
    }
  }

  .card-cover {
    height: 180px;
    overflow: hidden;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .default-cover {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
  }

  .card-content {
    padding: 20px;

    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0 0 10px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .card-description {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 16px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      line-height: 1.5;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #94a3b8;

      .problems-count,
      .author {
        display: flex;
        align-items: center;
        gap: 6px;

        .ivu-icon {
          font-size: 16px;
        }
      }
    }
  }
}

/* 分页区域 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
</style>
