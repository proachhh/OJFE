<template>
  <div class="lesson-plan-management">
    <Panel :title="$t('m.Lesson_Plan_Management')">
      <div class="list">
        <el-table
          v-loading="loading"
          element-loading-text="loading"
          ref="table"
          :data="lessonPlanList"
          style="width: 100%">
          <el-table-column
            width="80"
            prop="id"
            label="ID">
          </el-table-column>
          <el-table-column
            prop="title"
            label="Title"
            min-width="200">
          </el-table-column>
          <el-table-column
            prop="description"
            label="Description"
            min-width="200">
            <template slot-scope="scope">
              <span class="description-text">{{ scope.row.description }}</span>
            </template>
          </el-table-column>
          <el-table-column
            width="120"
            prop="problems_count"
            label="Problems">
          </el-table-column>
          <el-table-column
            width="150"
            prop="create_time"
            label="CreateTime">
            <template slot-scope="scope">
              {{ scope.row.create_time | localtime }}
            </template>
          </el-table-column>
          <el-table-column
            width="120"
            prop="created_by_username"
            label="Author">
          </el-table-column>
          <el-table-column
            width="100"
            prop="visible"
            label="Visible">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.visible"
                         active-text=""
                         inactive-text=""
                         @change="handleVisibleSwitch(scope.row)">
              </el-switch>
            </template>
          </el-table-column>
          <el-table-column
            fixed="right"
            label="Option"
            width="200">
            <div slot-scope="scope">
              <icon-btn name="Edit" icon="edit" @click.native="openLessonPlanDialog(scope.row.id)"></icon-btn>
              <icon-btn name="Delete" icon="trash" @click.native="deleteLessonPlan(scope.row.id)"></icon-btn>
            </div>
          </el-table-column>
        </el-table>
        <div class="panel-options">
          <el-button type="primary" size="small" @click="openLessonPlanDialog(null)" icon="el-icon-plus">Create</el-button>
          <el-pagination
            class="page"
            layout="prev, pager, next"
            @current-change="currentChange"
            :page-size="pageSize"
            :total="total">
          </el-pagination>
        </div>
      </div>
    </Panel>

    <!-- 教案编辑对话框 -->
    <el-dialog :title="lessonPlanDialogTitle" :visible.sync="showEditDialog"
               :close-on-click-modal="false" width="80%">
      <el-form label-position="top" :model="lessonPlan" ref="form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Title" required>
              <el-input v-model="lessonPlan.title" placeholder="Lesson Plan Title"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Description" required>
              <el-input v-model="lessonPlan.description" placeholder="Brief Description"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Content" required>
          <Simditor v-model="lessonPlan.content"></Simditor>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Cover Image">
              <el-upload
                class="upload-demo"
                action="/api/admin/upload_file/"
                :show-file-list="false"
                :on-success="handleCoverUpload"
                :before-upload="beforeUpload">
                <el-button size="small" type="primary" icon="el-icon-upload">Upload Cover Image</el-button>
              </el-upload>
              <div v-if="lessonPlan.cover_image" class="preview-image">
                <img :src="lessonPlan.cover_image" alt="Cover" />
                <el-button type="text" @click="lessonPlan.cover_image = ''" icon="el-icon-delete">Remove</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="PDF File">
              <el-upload
                class="upload-demo"
                action="/api/admin/upload_file/"
                :show-file-list="false"
                :on-success="handlePdfUpload"
                :before-upload="beforePdfUpload">
                <el-button size="small" type="primary" icon="el-icon-upload">Upload PDF</el-button>
              </el-upload>
              <div v-if="lessonPlan.pdf_file" class="pdf-file-info">
                <div class="pdf-file-row">
                  <i class="el-icon-document"></i>
                  <span class="pdf-file-name">{{ pdfFileName }}</span>
                  <el-button type="text" size="mini" @click="previewPdf" icon="el-icon-view">Preview</el-button>
                  <el-button type="text" size="mini" @click="lessonPlan.pdf_file = ''" icon="el-icon-delete">Remove</el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- PDF 预览弹窗 -->
        <el-dialog title="PDF Preview" :visible.sync="showPdfPreview" width="80%">
          <embed :src="lessonPlan.pdf_file" type="application/pdf" width="100%" height="700px" />
        </el-dialog>

        <el-form-item label="Related Problems">
          <div class="problem-selector">
            <el-input
              v-model="problemSearchKeyword"
              placeholder="Search problems by ID or title..."
              @input="searchProblems"
              clearable>
              <el-button slot="append" icon="el-icon-search" @click="searchProblems"></el-button>
            </el-input>
            <div class="selected-problems" v-if="selectedProblems.length > 0">
              <el-tag
                v-for="problem in selectedProblems"
                :key="problem.id"
                closable
                @close="removeProblem(problem.id)"
                type="success">
                {{ problem._id }} - {{ problem.title }}
              </el-tag>
            </div>
            <div class="search-results" v-if="searchResults.length > 0">
              <div
                v-for="problem in searchResults"
                :key="problem.id"
                class="search-result-item"
                @click="addProblem(problem)"
                :class="{ 'selected': isProblemSelected(problem.id) }">
                <span>{{ problem._id }}</span>
                <span>{{ problem.title }}</span>
                <el-tag size="mini" :type="getDifficultyType(problem.difficulty)">{{ problem.difficulty }}</el-tag>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Visible">
          <el-switch
            v-model="lessonPlan.visible"
            active-text=""
            inactive-text="">
          </el-switch>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showEditDialog = false"></cancel>
        <save type="primary" @click.native="submitLessonPlan"></save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Simditor from '../../components/Simditor.vue'
import api from '../../api.js'

export default {
  name: 'LessonPlanManagement',
  components: {
    Simditor
  },
  data () {
    return {
      lessonPlanList: [],
      loading: false,
      total: 0,
      pageSize: 15,
      currentPage: 1,
      showEditDialog: false,
      currentLessonPlanId: null,
      mode: 'create',
      showPdfPreview: false,
      pdfFileName: '',
      lessonPlan: {
        title: '',
        description: '',
        content: '',
        pdf_file: '',
        cover_image: '',
        visible: true,
        problem_ids: []
      },
      lessonPlanDialogTitle: 'Create Lesson Plan',
      problemSearchKeyword: '',
      searchResults: [],
      selectedProblems: []
    }
  },
  mounted () {
    this.getLessonPlanList()
  },
  methods: {
    currentChange (page) {
      this.currentPage = page
      this.getLessonPlanList(page)
    },
    getLessonPlanList (page) {
      this.loading = true
      api.getLessonPlanList({
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      }).then(res => {
        this.loading = false
        const data = res.data.data
        this.total = data.count || 0
        this.lessonPlanList = data.results || []
      }).catch(() => {
        this.loading = false
        this.lessonPlanList = []
        this.total = 0
      })
    },
    openLessonPlanDialog (id) {
      if (id) {
        this.mode = 'edit'
        this.currentLessonPlanId = id
        this.lessonPlanDialogTitle = 'Edit Lesson Plan'
        this.loadLessonPlanDetail(id)
      } else {
        this.mode = 'create'
        this.currentLessonPlanId = null
        this.lessonPlanDialogTitle = 'Create Lesson Plan'
        this.resetForm()
      }
      this.showEditDialog = true
    },
    loadLessonPlanDetail (id) {
      api.getLessonPlanDetail(id).then(res => {
        const data = res.data.data
        this.lessonPlan = {
          id: data.id,
          title: data.title,
          description: data.description,
          content: data.content,
          pdf_file: data.pdf_file || '',
          cover_image: data.cover_image || '',
          visible: data.visible,
          problem_ids: data.problems ? data.problems.map(p => p.id) : []
        }
        this.selectedProblems = data.problems || []
      }).catch(() => {
        this.$error('Failed to load lesson plan details')
      })
    },
    resetForm () {
      this.lessonPlan = {
        title: '',
        description: '',
        content: '',
        pdf_file: '',
        cover_image: '',
        visible: true,
        problem_ids: []
      }
      this.selectedProblems = []
      this.searchResults = []
      this.problemSearchKeyword = ''
    },
    submitLessonPlan () {
      if (!this.lessonPlan.title || !this.lessonPlan.content) {
        this.$error('Please fill in title and content')
        return
      }
      const problemIds = this.selectedProblems.map(p => p.id)
      const data = {
        title: this.lessonPlan.title,
        description: this.lessonPlan.description || '',
        content: this.lessonPlan.content,
        visible: this.lessonPlan.visible
      }
      if (this.lessonPlan.pdf_file) {
        data.pdf_file = this.lessonPlan.pdf_file
      }
      if (this.lessonPlan.cover_image) {
        data.cover_image = this.lessonPlan.cover_image
      }
      if (problemIds.length > 0) {
        data.problem_ids = problemIds
      }
      let funcName = ''
      if (this.mode === 'create') {
        funcName = 'createLessonPlan'
      } else {
        funcName = 'updateLessonPlan'
        data.id = this.currentLessonPlanId
      }
      api[funcName](data).then(() => {
        this.$success(this.mode === 'create' ? 'Lesson plan created successfully' : 'Lesson plan updated successfully')
        this.showEditDialog = false
        this.getLessonPlanList(this.currentPage)
      }).catch(err => {
        console.error('Lesson plan submit error:', err)
        let errorMsg = 'Operation failed'
        if (err && err.data && err.data.data) {
          errorMsg = err.data.data
        } else if (err && err.data && typeof err.data === 'string') {
          errorMsg = err.data
        }
        this.$error(errorMsg)
      })
    },
    deleteLessonPlan (id) {
      this.$confirm('Are you sure to delete this lesson plan?', 'Warning', {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        api.deleteLessonPlan(id).then(() => {
          this.$success('Lesson plan deleted successfully')
          this.getLessonPlanList(this.currentPage)
        }).catch(() => {
          this.$error('Delete failed')
        })
      }).catch(() => {})
    },
    handleVisibleSwitch (row) {
      api.updateLessonPlan({
        id: row.id,
        visible: row.visible
      }).then(() => {
        this.$success('Visibility updated successfully')
      }).catch(() => {
        row.visible = !row.visible
        this.$error('Update failed')
      })
    },
    handleCoverUpload (response) {
      if (response.success || response.error === null || response.error === undefined) {
        this.lessonPlan.cover_image = response.file_path || response.url || ''
        this.$success('Cover image uploaded successfully')
      } else {
        this.$error('Upload failed: ' + (response.msg || 'Unknown error'))
      }
    },
    handlePdfUpload (response, file) {
      if (response.success || response.error === null || response.error === undefined) {
        let filePath = response.file_path || response.url || ''
        // 移除开头的斜杠，确保路径格式正确
        filePath = filePath.replace(/^\/+/, '')
        this.lessonPlan.pdf_file = '/' + filePath
        this.pdfFileName = response.file_name || file.name
        this.$success('PDF uploaded successfully')
      } else {
        this.$error('Upload failed: ' + (response.msg || 'Unknown error'))
      }
    },
    previewPdf () {
      this.showPdfPreview = true
    },
    beforeUpload (file) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        this.$error('You can only upload image files!')
      }
      return isImage
    },
    beforePdfUpload (file) {
      const isPdf = file.type === 'application/pdf'
      if (!isPdf) {
        this.$error('You can only upload PDF files!')
      }
      return isPdf
    },
    searchProblems () {
      if (!this.problemSearchKeyword) {
        this.searchResults = []
        return
      }
      this.$http.get('/admin/problem', {
        params: {
          keyword: this.problemSearchKeyword,
          offset: 0,
          limit: 20
        }
      }).then(res => {
        this.searchResults = res.data.data.results || []
      })
    },
    addProblem (problem) {
      if (!this.isProblemSelected(problem.id)) {
        this.selectedProblems.push(problem)
      }
    },
    removeProblem (id) {
      this.selectedProblems = this.selectedProblems.filter(p => p.id !== id)
    },
    isProblemSelected (id) {
      return this.selectedProblems.some(p => p.id === id)
    },
    getDifficultyType (difficulty) {
      const types = {
        'Low': 'success',
        'Mid': '',
        'High': 'danger'
      }
      return types[difficulty] || ''
    }
  }
}
</script>

<style lang="less" scoped>
.lesson-plan-management {
  .list {
    .description-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 300px;
      display: inline-block;
    }
  }

  .panel-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;

    .page {
      float: right;
    }
  }

  .preview-image {
    margin-top: 10px;
    img {
      max-width: 200px;
      max-height: 150px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
  }

  .file-info {
    margin-top: 10px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #64748b;
  }

  .problem-selector {
    .selected-problems {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-tag {
        margin: 0;
      }
    }

    .search-results {
      margin-top: 10px;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      .search-result-item {
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f8fafc;
        }

        &.selected {
          background: #e8f5e9;
          cursor: default;
        }

        span:first-child {
          font-weight: 600;
          color: #1e3a8a;
          margin-right: 12px;
        }

        span:nth-child(2) {
          flex: 1;
          color: #334155;
        }
      }
    }
  }
}

.pdf-file-info {
  margin-top: 10px;
  padding: 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;

  .pdf-file-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon-document {
      font-size: 18px;
      color: #0284c7;
    }

    .pdf-file-name {
      flex: 1;
      color: #0c4a6e;
      font-weight: 500;
      font-size: 14px;
    }
  }
}
</style>
