<template>
  <div class="problem-list-elegant">

    <Row type="flex" :gutter="24">
      <!-- 左侧题目列表 -->
      <Col :span="19">
        <div class="problem-panel">
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
                <i-switch size="small" v-model="showTags" @on-change="handleTagsVisible"></i-switch>
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

          <div class="table-container">
            <Table style="width: 100%;"
                   :columns="problemTableColumns"
                   :data="problemList"
                   :loading="loadings.table"
                   class="problem-table"
                   disabled-hover></Table>
          </div>

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

      <!-- 右侧标签栏（卡片样式） -->
      <Col :span="5">
        <div class="sidebar-panel">
          <div class="sidebar-header">
            <Icon type="ios-pricetags" />
            <span>{{ $t('m.Tags') }}</span>
          </div>

          <div class="tag-search">
            <Input v-model="tagKeyword"
                   :placeholder="$t('m.Search_Tags')"
                   prefix="ios-search"
                   clearable
                   @on-change="onTagSearchChange" />
          </div>

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

          <div v-if="totalTagPages > 1" class="tag-pagination">
            <Button size="small" :disabled="tagPage === 1" @click="tagPage--">
              <Icon type="ios-arrow-back" />
            </Button>
            <span class="page-info">{{ tagPage }} / {{ totalTagPages }}</span>
            <Button size="small" :disabled="tagPage >= totalTagPages" @click="tagPage++">
              <Icon type="ios-arrow-forward" />
            </Button>
          </div>

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
          width: 100,
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
          minWidth: 260,
          render: (h, params) => {
            return h('div', {
              class: 'problem-title',
              style: { 'white-space': 'normal', 'word-break': 'break-word' },
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
          width: 100,
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
          width: 120,
          align: 'center',
          render: (h, params) => {
            return h('span', { class: 'stat-number' }, params.row.submission_number)
          }
        },
        {
          title: this.$i18n.t('m.AC_Rate'),
          width: 140,
          align: 'center',
          render: (h, params) => {
            const rate = this.getACRate(params.row.accepted_number, params.row.submission_number)
            const numRate = parseInt(rate)
            let color = '#67c23a'
            if (numRate < 30) color = '#f56c6c'
            else if (numRate < 60) color = '#e6a23c'
            return h('div', { style: { 'white-space': 'nowrap', 'min-width': '70px' } }, [
              h('span', { style: { color, 'font-weight': '600', 'font-size': '12px' } }, rate.replace('.00', '')),
              h('div', { style: { width: '50px', height: '4px', background: '#e2e8f0', 'border-radius': '2px', 'margin-top': '4px', 'margin-left': 'auto', 'margin-right': 'auto', overflow: 'hidden' } }, [
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
          width: 300,
          render: (h, params) => {
            let tags = []
            params.row.tags.forEach(tag => {
              tags.push(h('span', { 
                class: 'problem-tag-item',
                style: {
                  display: 'inline-block',
                  padding: '4px 10px',
                  margin: '0 4px 4px 0',
                  background: '#fff',
                  color: '#1e3a8a',
                  border: '1px solid #1e3a8a',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }
              }, this.m.tag[tag] || tag))
            })
            if (params.row.tags.length === 0) {
              tags.push(h('span', { style: { color: '#94a3b8', fontSize: '12px' } }, this.$t('m.None')))
            }
            return h('div', { 
              class: 'tags-container',
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px'
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
  font-size: 15px;

  // 左侧面板卡片样式（白色背景、圆角、阴影）
  .problem-panel {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  // 右侧面板卡片样式
  .sidebar-panel {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    padding: 20px;
  }

  // 筛选栏样式（与卡片内部协调）
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfc;

    .filter-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .filter-btn {
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #1e3a8a;
          color: #1e3a8a;
        }
      }

      .filter-switch {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        cursor: pointer;
      }
    }

    .filter-right {
      display: flex;
      gap: 12px;

      .search-input {
        width: 240px;
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
    }
  }

  // 表格样式（字体增大，行高增加，无省略）
  .problem-table {
    /deep/ .ivu-table {
      font-size: 15px;

      th {
        font-size: 14px;
        padding: 12px 8px;
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }

      td {
        padding: 10px 8px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
        line-height: 1.5;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }
  }

  .problem-title {
    color: #334155;
    cursor: pointer;
    font-weight: 500;
    word-break: break-word;
    white-space: normal;
    line-height: 1.4;
    &:hover {
      color: #1e3a8a;
    }
  }

  .level-tag {
    font-size: 13px;
    padding: 4px 12px;
    border-radius: 14px;
  }

  .stat-number {
    font-size: 15px;
    font-weight: 500;
  }

  .pagination-wrapper {
    padding: 20px 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: center;
  }

  // 右侧标签云（卡片内样式）
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
  }

  .tag-search {
    margin-bottom: 16px;
  }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    min-height: 200px;
    align-content: flex-start;

    .tag-item {
      padding: 8px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 14px;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover, &.active {
        background: #1e3a8a;
        color: white;
        border-color: #1e3a8a;
        transform: translateY(-2px);
      }
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
      font-size: 14px;
      color: #64748b;
    }
  }

  .pick-one-btn {
    margin-top: 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border: none;
    color: white;
    font-weight: 600;
    height: 48px;
    font-size: 15px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(30, 58, 138, 0.3);
    }
  }

  // 表格内标签换行容器
  .tags-container {
    gap: 6px;
  }

  * {
    box-sizing: border-box;
  }
}
</style>