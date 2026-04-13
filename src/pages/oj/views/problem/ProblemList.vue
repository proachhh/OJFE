<template>
  <Row type="flex" :gutter="18">
    <Col :span="19">
      <Panel shadow>
        <div slot="title">{{ $t('m.Problem_List') }}</div>
        <div slot="extra">
          <ul class="filter">
            <li>
              <Dropdown @on-click="filterByDifficulty">
                <span>
                  {{ query.difficulty === '' ? $t('m.Difficulty') : $t('m.' + query.difficulty) }}
                  <Icon type="arrow-down-b"></Icon>
                </span>
                <Dropdown-menu slot="list">
                  <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
                  <Dropdown-item name="Low">{{ $t('m.Low') }}</Dropdown-item>
                  <Dropdown-item name="Mid">{{ $t('m.Mid') }}</Dropdown-item>
                  <Dropdown-item name="High">{{ $t('m.High') }}</Dropdown-item>
                </Dropdown-menu>
              </Dropdown>
            </li>
            <li>
              <i-switch size="large" @on-change="handleTagsVisible">
                <span slot="open">{{ $t('m.Tags') }}</span>
                <span slot="close">{{ $t('m.Tags') }}</span>
              </i-switch>
            </li>
            <li>
              <Input v-model="query.keyword"
                     @on-enter="filterByKeyword"
                     @on-click="filterByKeyword"
                     placeholder="keyword"
                     icon="ios-search-strong" />
            </li>
            <li>
              <Button type="info" @click="onReset">
                <Icon type="refresh"></Icon>
                {{ $t('m.Reset') }}
              </Button>
            </li>
          </ul>
        </div>
        <Table style="width: 100%; font-size: 16px;"
               :columns="problemTableColumns"
               :data="problemList"
               :loading="loadings.table"
               disabled-hover></Table>
      </Panel>
      <Pagination
        :total="total"
        :page-size.sync="query.limit"
        @on-change="pushRouter"
        @on-page-size-change="pushRouter"
        :current.sync="query.page"
        :show-sizer="true">
      </Pagination>
    </Col>

    <Col :span="5">
      <Panel :padding="10">
        <div slot="title" class="taglist-title">{{ $t('m.Tags') }}</div>
        <!-- 标签搜索框 -->
        <Input v-model="tagKeyword"
               :placeholder="$t('m.Search_Tags')"
               search
               clearable
               @on-change="onTagSearchChange"
               style="margin-bottom: 10px;" />
        <!-- 标签按钮区域，固定最小高度避免抖动 -->
        <div style="min-height: 260px;">
          <Button v-for="tag in pagedTagList"
                  :key="tag.name"
                  @click="filterByTag(tag.name)"
                  type="ghost"
                  :disabled="query.tag === tag.name"
                  shape="circle"
                  class="tag-btn">
            {{ m.tag[tag.name] || tag.name }}
          </Button>
          <div v-if="pagedTagList.length === 0 && !loadings.tag" style="text-align: center; color: #999; padding: 20px 0;">
            {{ $t('m.No_Tags') }}
          </div>
        </div>
        <!-- 标签分页 -->
        <div v-if="totalTagPages > 1" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <Button size="small" :disabled="tagPage === 1" @click="tagPage--">
            <Icon type="ios-arrow-back" />
          </Button>
          <span style="font-size: 13px;">{{ tagPage }} / {{ totalTagPages }}</span>
          <Button size="small" :disabled="tagPage >= totalTagPages" @click="tagPage++">
            <Icon type="ios-arrow-forward" />
          </Button>
        </div>
        <Button long id="pick-one" @click="pickone" style="margin-top: 15px;">
          <Icon type="shuffle"></Icon>
          {{ $t('m.Pick_One') }}
        </Button>
      </Panel>
      <Spin v-if="loadings.tag" fix size="large"></Spin>
    </Col>
  </Row>
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
      tagList: [],
      tagKeyword: '',      // 标签搜索关键词
      tagPage: 1,          // 当前标签页码
      tagPageSize: 20,     // 每页显示标签数
      problemTableColumns: [
        {
          title: '#',
          key: '_id',
          width: 80,
          render: (h, params) => {
            return h('Button', {
              props: {
                type: 'text',
                size: 'large'
              },
              on: {
                click: () => {
                  this.$router.push({ name: 'problem-details', params: { problemID: params.row._id } })
                }
              },
              style: {
                padding: '2px 0'
              }
            }, params.row._id)
          }
        },
        {
          title: this.$i18n.t('m.Title'),
          width: 400,
          render: (h, params) => {
            return h('Button', {
              props: {
                type: 'text',
                size: 'large'
              },
              on: {
                click: () => {
                  this.$router.push({ name: 'problem-details', params: { problemID: params.row._id } })
                }
              },
              style: {
                padding: '2px 0',
                overflowX: 'auto',
                textAlign: 'left',
                width: '100%'
              }
            }, params.row.title)
          }
        },
        {
          title: this.$i18n.t('m.Level'),
          render: (h, params) => {
            let t = params.row.difficulty
            let color = 'blue'
            if (t === 'Low') color = 'green'
            else if (t === 'High') color = 'yellow'
            return h('Tag', {
              props: {
                color: color
              }
            }, this.$i18n.t('m.' + params.row.difficulty))
          }
        },
        {
          title: this.$i18n.t('m.Total'),
          key: 'submission_number'
        },
        {
          title: this.$i18n.t('m.AC_Rate'),
          render: (h, params) => {
            return h('span', this.getACRate(params.row.accepted_number, params.row.submission_number))
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
      this.tagPage = 1 // 搜索时重置页码
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
      if (value) {
        this.problemTableColumns.push({
          title: this.$i18n.t('m.Tags'),
          align: 'center',
          render: (h, params) => {
            let tags = []
            params.row.tags.forEach(tag => {
              tags.push(h('Tag', {}, this.m.tag[tag] || tag))
            })
            return h('div', { style: { margin: '8px 0' } }, tags)
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
    // 过滤后的标签列表
    filteredTagList () {
      if (!this.tagKeyword) return this.tagList
      const keyword = this.tagKeyword.toLowerCase()
      return this.tagList.filter(tag => {
        const displayName = this.m.tag[tag.name] || tag.name
        return displayName.toLowerCase().includes(keyword) || tag.name.toLowerCase().includes(keyword)
      })
    },
    // 总页数
    totalTagPages () {
      return Math.ceil(this.filteredTagList.length / this.tagPageSize) || 1
    },
    // 当前页显示的标签
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
.taglist-title {
  margin-left: -10px;
  margin-bottom: -10px;
}

.tag-btn {
  margin-right: 5px;
  margin-bottom: 10px;
}

#pick-one {
  margin-top: 10px;
}
</style>