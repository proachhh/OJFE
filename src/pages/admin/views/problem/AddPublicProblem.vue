<template>
  <div class="add-public-problem">
    <div class="search-row">
      <el-input
        v-model="keyword"
        placeholder="请输入题目标题或 Display ID 搜索..."
        prefix-icon="el-icon-search"
        clearable
        class="search-input"
        @keyup.enter.native="doSearch"
        @clear="doSearch">
        <el-button slot="append" icon="el-icon-search" @click="doSearch">搜索</el-button>
      </el-input>
    </div>

    <div v-if="errorMsg" class="error-msg">
      <i class="el-icon-warning"></i> {{ errorMsg }}
    </div>

    <el-table
      :data="problems"
      v-loading="loading"
      highlight-current-row
      @row-click="handleRowClick"
      style="width: 100%; cursor: pointer">
      <el-table-column
        label="ID"
        width="80"
        prop="id">
      </el-table-column>
      <el-table-column
        label="Display ID"
        width="140"
        prop="_id">
      </el-table-column>
      <el-table-column
        label="标题"
        prop="title"
        min-width="200">
      </el-table-column>
      <el-table-column
        label="难度"
        width="80"
        prop="difficulty">
        <template slot-scope="{row}">
          <el-tag :type="difficultyType(row.difficulty)" size="small">{{ row.difficulty || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="80"
        align="center"
        fixed="right">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" icon="el-icon-plus" @click.stop="handleAddProblem(row)">加入</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && problems.length === 0 && !errorMsg" class="empty-hint">
      <p v-if="searched">没有匹配的题目，请尝试其他关键词</p>
      <p v-else>暂无公共题目，请先在题目管理中创建题目</p>
    </div>

    <el-pagination
      v-if="total > limit"
      class="page"
      layout="prev, pager, next"
      @current-change="onPageChange"
      :current-page="page"
      :page-size="limit"
      :total="total">
    </el-pagination>
  </div>
</template>

<script>
import api from '@admin/api'

let searchTimer = null

export default {
  name: 'add-problem-from-public',
  props: ['contestID'],
  data () {
    return {
      page: 1,
      limit: 10,
      total: 0,
      loading: false,
      problems: [],
      keyword: '',
      errorMsg: '',
      searched: false
    }
  },
  mounted () {
    this.getPublicProblem(1)
  },
  methods: {
    doSearch () {
      this.searched = true
      this.getPublicProblem(1)
    },
    onPageChange (page) {
      this.getPublicProblem(page)
    },
    getPublicProblem (page) {
      page = page || 1
      this.page = page
      this.loading = true
      this.errorMsg = ''
      api.getProblemList({
        keyword: this.keyword,
        offset: (page - 1) * this.limit,
        limit: this.limit,
        show_all: 'true'
      }).then(res => {
        this.loading = false
        this.total = res.data.data.total
        this.problems = res.data.data.results
      }).catch(err => {
        this.loading = false
        const errData = err && err.data
        if (errData && errData.data) {
          this.errorMsg = errData.data
        } else {
          this.errorMsg = '加载题目列表失败，请检查网络后重试'
        }
      })
    },
    handleRowClick (row) {
      this.handleAddProblem(row)
    },
    handleAddProblem (row) {
      const title = row.title || ''
      this.$prompt(
        `请为此竞赛题目指定 Display ID`,
        `添加「${title}」到竞赛`,
        {
          confirmButtonText: '确认添加',
          cancelButtonText: '取消',
          inputPattern: /^\S+$/,
          inputErrorMessage: 'Display ID 不能为空或包含空格'
        }
      ).then(({value}) => {
        api.addProblemFromPublic({
          problem_id: row.id,
          contest_id: this.contestID,
          display_id: value
        }).then(() => {
          this.$success('添加成功')
          this.$emit('on-change')
        }).catch(err => {
          const errData = err && err.data
          this.$error(errData && errData.data ? errData.data : '添加失败')
        })
      }).catch(() => {})
    },
    difficultyType (diff) {
      const map = { 'Low': 'success', 'Mid': 'warning', 'High': 'danger' }
      return map[diff] || 'info'
    }
  },
  watch: {
    keyword () {
      this.searched = false
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        this.doSearch()
      }, 400)
    }
  },
  beforeDestroy () {
    if (searchTimer) clearTimeout(searchTimer)
  }
}
</script>

<style scoped>
.add-public-problem {
  min-height: 300px;
}

.search-row {
  margin-bottom: 16px;
}

.search-input {
  max-width: 520px;
}

.error-msg {
  color: #f56c6c;
  font-size: 14px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fef0f0;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.empty-hint {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

.page {
  margin-top: 20px;
  text-align: right;
}
</style>
