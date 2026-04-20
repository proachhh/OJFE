<template>
  <div class="problem-list-elegant">

    <Row type="flex" :gutter="24">
      <!-- 左侧题目列表 -->
      <Col :span="19">
        <div class="problem-panel">
          <!-- 筛选栏 -->
          <div class="filter-bar">
            <div class="filter-left">
              <Dropdown @on-click="filterByDifficulty" class="filter-dropdown">
                <div class="filter-btn">
                  <Icon type="ios-funnel" />
                  <span>{{ query.difficulty === '' ? $t('m.Difficulty') : $t('m.' + query.difficulty) }}</span>
                  <Icon type="ios-arrow-down" />
                </div>
                <Dropdown-menu slot="list">
                  <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
                  <Dropdown-item name="Low">
                    <Tag color="green" size="small">{{ $t('m.Low') }}</Tag>
                  </Dropdown-item>
                  <Dropdown-item name="Mid">
                    <Tag color="blue" size="small">{{ $t('m.Mid') }}</Tag>
                  </Dropdown-item>
                  <Dropdown-item name="High">
                    <Tag color="orange" size="small">{{ $t('m.High') }}</Tag>
                  </Dropdown-item>
                </Dropdown-menu>
              </Dropdown>

              <div class="filter-switch">
                <i-switch size="small" v-model="showTags" @on-change="handleTagsVisible">
                </i-switch>
                <span class="switch-label">{{ $t('m.Tags') }}</span>
              </div>
            </div>

            <div class="filter-right">
              <div class="search-box">
                <Input v-model="query.keyword"
                       @on-enter="filterByKeyword"
                       :placeholder="$t('m.Search')"
                       class="search-input">
                  <Icon type="ios-search" slot="prefix" />
                </Input>
              </div>
              <Button type="primary" class="reset-btn" @click="onReset">
                <Icon type="md-refresh" />
              </Button>
            </div>
          </div>

          <!-- 题目表格 -->
          <div class="table-container">
            <Table style="width: 100%;"
                   :columns="problemTableColumns"
                   :data="problemList"
                   :loading="loadings.table"
                   class="problem-table"
                   disabled-hover></Table>
          </div>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <Pagination
              :total="total"
              :page-size.sync="query.limit"
              @on-change="pushRouter"
              @on-page-size-change="pushRouter"
              :current.sync="query.page"
              :show-sizer="true">
            </Pagination>
          </div>
        </div>
      </Col>

      <!-- 右侧标签栏 -->
      <Col :span="5">
        <div class="sidebar-panel">
          <div class="sidebar-header">
            <Icon type="ios-pricetags" />
            <span>{{ $t('m.Tags') }}</span>
          </div>

          <!-- 标签搜索 -->
          <div class="tag-search">
            <Input v-model="tagKeyword"
                   :placeholder="$t('m.Search_Tags')"
                   prefix="ios-search"
                   clearable
                   @on-change="onTagSearchChange" />
          </div>

          <!-- 标签云 -->
          <div class="tag-cloud">
            <div v-for="tag in pagedTagList"
                 :key="tag.name"
                 @click="filterByTag(tag.name)"
                 :class="['tag-item', { active: query.tag === tag.name }]">
              {{ m.tag[tag.name] || tag.name }}
            </div>
            <div v-if="pagedTagList.length === 0 && !loadings.tag" class="no-tags">
              {{ $t('m.No_Tags') }}
            </div>
          </div>

          <!-- 标签分页 -->
          <div v-if="totalTagPages > 1" class="tag-pagination">
            <Button size="small" :disabled="tagPage === 1" @click="tagPage--">
              <Icon type="ios-arrow-back" />
            </Button>
            <span class="page-info">{{ tagPage }} / {{ totalTagPages }}</span>
            <Button size="small" :disabled="tagPage >= totalTagPages" @click="tagPage++">
              <Icon type="ios-arrow-forward" />
            </Button>
          </div>

          <!-- 随机一题 -->
          <Button long class="pick-one-btn" @click="pickone">
            <Icon type="ios-shuffle" />
            {{ $t('m.Pick_One') }}
          </Button>
        </div>
      </Col>
    </Row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import api from '@oj/api'
import utils from '@/utils/utils'
import { ProblemMixin } from '@oj/components/mixins'
import Pagination from '@oj/components/Pagination'
import { m } from '@/i18n/oj/zh-CN.js'

export default {
  name: 'ProblemList',
  mixins: [ProblemMixin],
  components: {
    Pagination
  },
  data () {
    return {
      m: m,
      showTags: true,
      tagList: [],
      tagKeyword: '',
      tagPage: 1,
      tagPageSize: 20,
      problemTableColumns: [
        {
          title: '#',
          key: '_id',
          width: 85,
          align: 'center',
          render: (h, params) => {
            return h('div', {
              style: { 'white-space': 'nowrap', 'font-weight': '600', 'color': '#1e3a8a', 'cursor': 'pointer' },
              on: {
                click: () => {
                  this.$router.push({ name: 'problem-details', params: { problemID: params.row._id } })
                }
              }
            }, params.row._id)
          }
        },
        {
          title: this.$i18n.t('m.Title'),
          minWidth: 200,
          render: (h, params) => {
            return h('div', {
              class: 'problem-title',
              on: {
                click: () => {
                  this.$router.push({ name: 'problem-details', params: { problemID: params.row._id } })
                }
              }
            }, params.row.title)
          }
        },
        {
          title: this.$i18n.t('m.Level'),
          width: 90,
          align: 'center',
          render: (h, params) => {
            let t = params.row.difficulty
            let color = 'blue'
            let className = 'level-mid'
            if (t === 'Low') {
              color = 'green'
              className = 'level-low'
            } else if (t === 'High') {
              color = 'orange'
              className = 'level-high'
            }
            return h('Tag', {
              props: { color: color },
              class: ['level-tag', className]
            }, this.$i18n.t('m.' + params.row.difficulty))
          }
        },
        {
          title: this.$i18n.t('m.Total'),
          key: 'submission_number',
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('span', { class: 'stat-number' }, params.row.submission_number)
          }
        },
        {
          title: this.$i18n.t('m.AC_Rate'),
          width: 110,
          align: 'center',
          render: (h, params) => {
            const rate = this.getACRate(params.row.accepted_number, params.row.submission_number)
            const numRate = parseInt(rate)
            let color = '#67c23a'
            if (numRate < 30) color = '#f56c6c'
            else if (numRate < 60) color = '#e6a23c'
            return h('div', { style: { 'white-space': 'nowrap', 'min-width': '70px' } }, [
              h('span', { style: { color, 'font-weight': '600', 'font-size': '11px' } }, rate.replace('.00', '')),
              h('div', { style: { width: '50px', height: '3px', background: '#e2e8f0', 'border-radius': '2px', 'margin-top': '2px', 'margin-left': 'auto', 'margin-right': 'auto', overflow: 'hidden' } }, [
                h('div', {
                  style: { width: rate, height: '100%', 'border-radius': '2px', background: color }
                })
              ])
            ])
          }
        }
      ],
      problemList: [],
      limit: 20,
      total: 0,
      loadings: {
        table: true,
        tag: true
      },
      routeName: '',
      query: {
        keyword: '',
        difficulty: '',
        tag: '',
        page: 1,
        limit: 10
      }
    }
  },
  mounted () {
    this.init()
    // 默认显示标签列
    this.$nextTick(() => {
      this.handleTagsVisible(true)
    })
  },
  methods: {
    init (simulate = false) {
      this.routeName = this.$route.name
      let query = this.$route.query
      this.query.difficulty = query.difficulty || ''
      this.query.keyword = query.keyword || ''
      this.query.tag = query.tag || ''
      this.query.page = parseInt(query.page) || 1
      if (this.query.page < 1) {
        this.query.page = 1
      }
      this.query.limit = parseInt(query.limit) || 10
      if (!simulate) {
        this.getTagList()
      }
      this.getProblemList()
    },
    pushRouter () {
      this.$router.push({
        name: 'problem-list',
        query: utils.filterEmptyValue(this.query)
      })
    },
    getProblemList () {
      let offset = (this.query.page - 1) * this.query.limit
      this.loadings.table = true
      api.getProblemList(offset, this.limit, this.query).then(res => {
        this.loadings.table = false
        this.total = res.data.data.total
        this.problemList = res.data.data.results
        if (this.isAuthenticated) {
          this.addStatusColumn(this.problemTableColumns, res.data.data.results)
        }
      }, res => {
        this.loadings.table = false
      })
    },
    getTagList () {
      api.getProblemTagList().then(res => {
        this.tagList = res.data.data
        this.loadings.tag = false
      }, res => {
        this.loadings.tag = false
      })
    },
    onTagSearchChange () {
      this.tagPage = 1
    },
    filterByTag (tagName) {
      this.query.tag = tagName
      this.query.page = 1
      this.pushRouter()
    },
    filterByDifficulty (difficulty) {
      this.query.difficulty = difficulty
      this.query.page = 1
      this.pushRouter()
    },
    filterByKeyword () {
      this.query.page = 1
      this.pushRouter()
    },
    handleTagsVisible (value) {
      this.showTags = value
      if (value) {
        this.problemTableColumns.push({
          title: this.$i18n.t('m.Tags'),
          align: 'center',
          width: 240,
          render: (h, params) => {
            let tags = []
            params.row.tags.slice(0, 3).forEach(tag => {
              tags.push(h('span', { 
                class: 'problem-tag-item',
                style: {
                  display: 'inline-block',
                  padding: '2px 8px',
                  margin: '0 3px',
                  background: '#fff',
                  color: '#1e3a8a',
                  border: '1px solid #1e3a8a',
                  borderRadius: '3px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap'
                }
              }, this.m.tag[tag] || tag))
            })
            if (params.row.tags.length > 3) {
              tags.push(h('span', { 
                class: 'more-tag-item',
                style: {
                  display: 'inline-block',
                  padding: '2px 6px',
                  margin: '0 3px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap'
                }
              }, '+' + (params.row.tags.length - 3)))
            }
            return h('div', { 
              class: 'tags-container',
              style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }
            }, tags)
          }
        })
      } else {
        this.problemTableColumns.splice(this.problemTableColumns.length - 1, 1)
      }
    },
    onReset () {
      this.$router.push({ name: 'problem-list' })
    },
    pickone () {
      api.pickone().then(res => {
        this.$success('Good Luck')
        this.$router.push({ name: 'problem-details', params: { problemID: res.data.data } })
      })
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    filteredTagList () {
      if (!this.tagKeyword) return this.tagList
      const keyword = this.tagKeyword.toLowerCase()
      return this.tagList.filter(tag => {
        const displayName = this.m.tag[tag.name] || tag.name
        return displayName.toLowerCase().includes(keyword) || tag.name.toLowerCase().includes(keyword)
      })
    },
    totalTagPages () {
      return Math.ceil(this.filteredTagList.length / this.tagPageSize) || 1
    },
    pagedTagList () {
      const start = (this.tagPage - 1) * this.tagPageSize
      return this.filteredTagList.slice(start, start + this.tagPageSize)
    }
  },
  watch: {
    '$route' (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.init(true)
      }
    },
    'isAuthenticated' (newVal) {
      if (newVal === true) {
        this.init()
      }
    }
  }
}
</script>

<style scoped lang="less">
.problem-list-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30px;

  .page-title {
    font-size: 1.8rem;
    font-weight: 300;
    color: #1a1a2e;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;

    .title-line {
      width: 50px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #1e3a8a, transparent);
    }
  }

  .page-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}

/* 主面板 */
.problem-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-dropdown {
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: #334155;

    &:hover {
      border-color: #1e3a8a;
      color: #1e3a8a;
    }

    i {
      font-size: 14px;
    }
  }
}

.filter-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  .switch-label {
    font-size: 14px;
    color: #334155;
  }
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  .search-input {
    width: 240px;

    /deep/ .ivu-input {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding-left: 36px;

      &:focus {
        border-color: #1e3a8a;
        box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
      }
    }

    /deep/ .ivu-input-prefix {
      left: 12px;
      color: #94a3b8;
    }
  }
}

.reset-btn {
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  color: #64748b;

  &:hover {
    background: #e2e8f0;
    color: #334155;
  }
}

/* 表格容器 */
.table-container {
  padding: 0;
}

.problem-table {
  /deep/ .ivu-table {
    font-size: 14px;
    table-layout: fixed;

    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 8px;
      height: 40px;
      white-space: nowrap !important;
      overflow: hidden;
    }

    th .ivu-table-cell {
      white-space: nowrap !important;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      height: 36px;
      vertical-align: middle;
    }

    tr:hover td {
      background: #f8fafc;
    }
  }
}

.problem-id {
  font-weight: 600;
  color: #1e3a8a;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3b82f6;
    transform: scale(1.05);
  }
}

.problem-title {
  color: #334155;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;          // 防止标题换行
  overflow: hidden;
  text-overflow: ellipsis;      // 超出显示省略号
  max-width: 100%;              // 确保在列宽内截断

  &:hover {
    color: #1e3a8a;
  }
}

.level-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;

  &.level-low {
    background: rgba(103, 194, 58, 0.1) !important;
    color: #67c23a !important;
    border: 1px solid rgba(103, 194, 58, 0.3);
  }

  &.level-mid {
    background: rgba(64, 158, 255, 0.1) !important;
    color: #409eff !important;
    border: 1px solid rgba(64, 158, 255, 0.3);
  }

  &.level-high {
    background: rgba(230, 162, 60, 0.1) !important;
    color: #e6a23c !important;
    border: 1px solid rgba(230, 162, 60, 0.3);
  }
}

.stat-number {
  color: #64748b;
  font-weight: 500;
}

.ac-rate {
  white-space: nowrap;

  .rate-text {
    font-weight: 600;
    font-size: 11px;
  }

  .rate-bar {
    width: 40px;
    height: 3px;
    background: #e2e8f0;
    border-radius: 2px;
    margin-top: 2px;
    overflow: hidden;

    .rate-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  }
}

/* 表格中的标签区域 - 带边框样式 */
.problem-tags-row {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 6px !important;

  .problem-tag-bordered {
    display: inline-block !important;
    padding: 3px 8px !important;
    background: white !important;
    color: #1e3a8a !important;
    border: 1px solid #1e3a8a !important;
    border-radius: 3px !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    line-height: 1.4 !important;
  }

  .more-tags-bordered {
    display: inline-block !important;
    padding: 3px 6px !important;
    background: #f1f5f9 !important;
    color: #64748b !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 3px !important;
    font-size: 10px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    line-height: 1.4 !important;
  }
}

/* 分页 */
.pagination-wrapper {
  padding: 20px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* 侧边栏 */
.sidebar-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;

  i {
    font-size: 18px;
  }
}

.tag-search {
  margin-bottom: 16px;

  /deep/ .ivu-input {
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    &:focus {
      border-color: #1e3a8a;
    }
  }
}

/* 标签云 - 修复粘在一起、换行问题 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;                // 标签之间的水平与垂直间距
  min-height: 200px;
  align-content: flex-start; // 顶部对齐

  .tag-item {
    padding: 6px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    font-size: 13px;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;     // 强制标签内文字不换行

    &:hover {
      background: #1e3a8a;
      color: white;
      border-color: #1e3a8a;
      transform: translateY(-2px);
    }

    &.active {
      background: #1e3a8a;
      color: white;
      border-color: #1e3a8a;
    }
  }

  .no-tags {
    text-align: center;
    color: #94a3b8;
    padding: 40px 0;
    width: 100%;
  }
}

.tag-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;

  .page-info {
    font-size: 13px;
    color: #64748b;
  }

  /deep/ .ivu-btn {
    border-radius: 6px;
  }
}

.pick-one-btn {
  margin-top: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  border: none;
  color: white;
  font-weight: 600;
  height: 44px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(30, 58, 138, 0.3);
  }

  i {
    margin-right: 6px;
  }
}
</style>
