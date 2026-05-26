<template>
  <div class="lesson-plan-list-page">
    <div class="main-area">
      <div class="search-row">
        <Input
          v-model="keyword"
          placeholder="搜索教案..."
          class="search-input"
          @on-enter="handleSearch"
          @on-change="debounceSearch"
        >
          <Icon type="ios-search" slot="prefix" />
        </Input>
        <RadioGroup v-model="viewMode" type="button" size="small" class="view-toggle">
          <Radio label="card">
            <Icon type="ios-apps" size="14" />
          </Radio>
          <Radio label="list">
            <Icon type="ios-list" size="14" />
          </Radio>
        </RadioGroup>
      </div>

      <div class="content-row">
        <div class="alpha-sidebar">
          <span
            v-for="letter in activeLetters"
            :key="letter"
            class="alpha-letter"
            :class="{ active: letter === activeLetter }"
            @click="selectLetter(letter)"
          >{{ letter }}</span>
        </div>

        <div class="lesson-plan-panel">
          <div v-if="loading" class="status-box">
            <Spin size="large" fix></Spin>
          </div>
          <div v-else-if="lessonPlans.length === 0" class="status-box">
            <p>暂无教案</p>
          </div>
          <div v-else-if="viewMode === 'card'" class="lesson-plan-grid">
            <div
              v-for="(plan, idx) in lessonPlans"
              :key="plan.id"
              class="lesson-plan-card"
              @click="goToLessonPlan(plan.id)"
            >
              <div class="card-cover">
                <img v-if="plan.cover_image" :src="plan.cover_image" :alt="plan.title" />
                <div v-else class="default-cover">
                  <Icon type="ios-book" size="40" />
                </div>
              </div>
              <div class="card-body">
                <span class="card-num">{{ (offset - 1) * limit + idx + 1 }}</span>
                <div class="card-info">
                  <h3 class="card-title">{{ plan.title }}</h3>
                  <p class="card-desc">{{ plan.description }}</p>
                </div>
              </div>
              <div class="card-footer">
                <span><Icon type="ios-list" /> {{ plan.problems_count }} 题</span>
                <span><Icon type="ios-person" /> {{ plan.created_by_username }}</span>
              </div>
            </div>
          </div>

          <div v-else class="table-wrap">
            <Table :data="lessonPlans" :columns="listColumns" class="lesson-table" disabled-hover
              @on-row-click="(row) => goToLessonPlan(row.id)" size="small">
            </Table>
          </div>

          <div class="pagination-row">
            <Pagination
              :total="total"
              :current.sync="offset"
              :page-size.sync="limit"
              @on-change="handlePageChange"
              @on-page-size-change="handlePageSizeChange"
              :show-sizer="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import Pagination from '@oj/components/Pagination'
import { getPinyinFirstLetter } from '@/utils/pinyin'

export default {
  name: 'LessonPlanList',
  components: {
    Pagination
  },
  data () {
    return {
      lessonPlans: [],
      loading: false,
      keyword: '',
      offset: 1,
      limit: 15,
      total: 0,
      viewMode: 'list',
      activeLetter: '',
      activeLetters: [],
      alphabetIndex: {},
      searchTimer: null
    }
  },
  computed: {
    listColumns () {
      return [
        { title: '#', key: '_index', width: 80, align: 'center', className: 'col-index',
          render: (h, p) => h('span', { style: { color: '#94a3b8', whiteSpace: 'nowrap' } }, (this.offset - 1) * this.limit + p.index + 1) },
        { title: '标题', key: 'title', width: 200, ellipsis: true,
          render: (h, p) => h('span', { style: { fontWeight: '600', color: '#1e3a8a', cursor: 'pointer' } }, p.row.title) },
        { title: '简介', key: 'description', minWidth: 240, ellipsis: true, tooltip: true },
        { title: '题目数', key: 'problems_count', width: 80, align: 'center' },
        { title: '作者', key: 'created_by_username', width: 110, align: 'center' },
        { title: '时间', key: 'create_time', width: 120, align: 'center',
          render: (h, p) => h('span', {}, p.row.create_time ? new Date(p.row.create_time).toLocaleDateString('zh-CN') : '-') }
      ]
    }
  },
  mounted () {
    this.getLessonPlanList()
    this.buildAlphabetIndex()
  },
  methods: {
    getFirstLetter (title) {
      return getPinyinFirstLetter(title)
    },
    buildAlphabetIndex () {
      const seen = {}
      api.getLessonPlanList({ offset: 0, limit: 250 }).then(res => {
        const plans = res.data.data.results || []
        plans.forEach(p => {
          const l = getPinyinFirstLetter(p.title)
          seen[l] = true
        })
        this.alphabetIndex = { ...seen }
        const all = []
        for (let i = 65; i <= 90; i++) all.push(String.fromCharCode(i))
        all.push('#')
        this.activeLetters = all.filter(l => seen[l])
      }).catch(() => {})
    },
    selectLetter (letter) {
      if (this.activeLetter === letter) {
        this.activeLetter = ''
        this.keyword = ''
      } else {
        this.activeLetter = letter
        this.keyword = letter
      }
      this.offset = 1
      this.getLessonPlanList()
    },
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
        this.total = Number(data.total || 0)
        this.loading = false
      }, res => {
        this.loading = false
        this.lessonPlans = []
        this.total = 0
      })
    },
    handleSearch () {
      this.offset = 1
      this.activeLetter = ''
      this.getLessonPlanList()
    },
    debounceSearch () {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.handleSearch(), 300)
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
.lesson-plan-list-page {
  max-width: 1300px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 60px);
}

.content-row {
  display: flex;
  gap: 0;
  align-items: stretch;
}

.alpha-sidebar {
  width: 36px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px 0 0 8px;
  border: 1px solid #e2e8f0;
  border-right: none;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  position: relative;
  z-index: 2;

  .alpha-letter {
    display: inline-block;
    width: 28px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 11px;
    color: #64748b;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s;
    user-select: none;

    &:hover {
      background: #e8f0fe;
      color: #1e3a8a;
    }

    &.active {
      background: #1e3a8a;
      color: #fff;
      font-weight: 600;
    }
  }
}

.main-area {
  flex: 1;
  min-width: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .search-input {
    flex: 1;
    max-width: 480px;
  }

  .view-toggle {
    flex-shrink: 0;
    margin-left: auto;
  }
}

.lesson-plan-panel {
  background: #fff;
  border-radius: 0 10px 10px 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  min-height: 400px;

  .status-box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    font-size: 15px;
    color: #94a3b8;
  }
}

.lesson-plan-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.lesson-plan-card {
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 58, 138, 0.1);
    border-color: #1e3a8a;
  }

  .card-cover {
    height: 100px;
    overflow: hidden;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .default-cover {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.6);
    }
  }

  .card-body {
    display: flex;
    gap: 8px;
    padding: 10px 10px 0;
    flex: 1;

    .card-num {
      color: #c0c8d8;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      padding-top: 1px;
      min-width: 18px;
      text-align: right;
    }

    .card-info {
      flex: 1;
      min-width: 0;

      .card-title {
        font-size: 14px;
        font-weight: 600;
        color: #1e3a8a;
        margin: 0 0 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-desc {
        font-size: 12px;
        color: #94a3b8;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        line-height: 1.4;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    border-top: 1px solid #e8ecf1;
    font-size: 11px;
    color: #94a3b8;
    margin-top: auto;

    span {
      display: flex;
      align-items: center;
      gap: 3px;
    }
  }
}

.table-wrap {
  .lesson-table {
    font-size: 14px;
    /deep/ .ivu-table-row { cursor: pointer; }
    /deep/ td { padding: 10px 8px; font-size: 14px; }
    /deep/ th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 8px;
      font-size: 14px;
    }
    /deep/ .ivu-table-row:hover td {
      background: #f0f9ff;
    }
    /deep/ .col-index {
      padding-left: 4px;
      padding-right: 4px;
    }
    /deep/ .col-index .ivu-table-cell {
      padding-left: 0;
      padding-right: 0;
    }
  }
}

.pagination-row {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 18px 0 0;
  margin-top: 16px;
  border-top: 1px solid #f1f5f9;

  /deep/ .ivu-page-item,
  /deep/ .ivu-page-prev,
  /deep/ .ivu-page-next {
    cursor: pointer;
    pointer-events: auto;
  }

  /deep/ .ivu-page {
    text-align: center;
  }
}
</style>
