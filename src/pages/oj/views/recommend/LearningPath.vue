<template>
  <Card class="learning-path-card" :bordered="false">
    <p slot="title">{{ $t('m.Learning_Path') }}</p>
    <div class="path-container">
      <div v-if="loading" class="loading">
        <Spin fix></Spin>
      </div>
      <div v-else-if="error" class="error">
        <Icon type="ios-warning" size="20" />
        <span>{{ error }}</span>
      </div>
      <div v-else>
        <Form inline>
          <FormItem :label="$t('m.Start_Topic')">
            <Select v-model="startTopic" filterable :placeholder="$t('m.Select_Start_Topic')" style="width: 200px">
              <Option v-for="topic in allTopics" :key="topic" :value="topic">
                {{ translateTopic(topic) }}
              </Option>
            </Select>
          </FormItem>
          <FormItem :label="$t('m.Target_Topic')">
            <Select v-model="targetTopic" filterable :placeholder="$t('m.Select_Target_Topic')" style="width: 200px">
              <Option v-for="topic in allTopics" :key="topic" :value="topic">
                {{ translateTopic(topic) }}
              </Option>
            </Select>
          </FormItem>
          <FormItem>
            <Button type="primary" @click="fetchPath" :loading="loading">
              {{ $t('m.Generate_Path') }}
            </Button>
          </FormItem>
        </Form>

        <div v-if="pathData" class="path-timeline">
          <div class="weak-info">
            <span class="label">{{ $t('m.Your_Weakest_Topic') }}:</span>
            <Tag color="error">{{ translateTopic(pathData.weak_topic) }}</Tag>
          </div>
          <Divider />
          <Timeline>
            <TimelineItem v-for="(item, index) in pathData.path" :key="index">
              <div class="timeline-node">
                <p class="topic-name">
                  <Icon type="ios-bookmark" size="16" color="#2d8cf0" />
                  {{ translateTopic(item.topic) }}
                </p>
                <div v-if="item.problem" class="problem-suggestion">
                  <span class="suggestion-label">{{ $t('m.Suggested_Problem') }}:</span>
                  <router-link :to="`/problem/${item.problem.display_id}`" class="problem-link">
                    {{ item.problem.title }}
                    <Tag :color="getDifficultyColor(item.problem.difficulty)" size="small">
                      {{ item.problem.difficulty }}
                    </Tag>
                  </router-link>
                </div>
                <div v-else class="no-problem">
                  <Icon type="ios-information-circle" size="14" />
                  {{ $t('m.No_Problem_Yet') }}
                </div>
              </div>
            </TimelineItem>
          </Timeline>
        </div>
        <div v-else class="placeholder">
          <Icon type="ios-git-branch" size="48" color="#c5c8ce" />
          <p>{{ $t('m.Select_Topic_To_Generate_Path') }}</p>
        </div>
      </div>
    </div>
  </Card>
</template>

<script>
import api from '@oj/api'

export default {
  data () {
    return {
      loading: false,
      error: '',
      allTopics: [],
      startTopic: '',
      targetTopic: '',
      pathData: null
    }
  },
  mounted () {
    this.fetchAllTopics()
  },
  methods: {
    // 翻译知识点名称（优先使用 m.tag 映射）
    translateTopic (topic) {
      if (!topic) return ''
      const key = 'm.tag.' + topic
      const translated = this.$t(key)
      return translated === key ? topic : translated
    },
    fetchAllTopics () {
      api.getLearningStats().then(res => {
        const tags = res.data.tags
        if (tags && tags.length > 0) {
          this.allTopics = tags.map(t => t.tag_name)
        } else {
          this.error = '暂无知识点数据，请先提交一些题目'
        }
      }).catch(err => {
        console.error('learning-stats 请求失败:', err)
        this.error = this.$i18n.t('m.Fetch_Topics_Failed')
      })
    },
    fetchPath () {
      if (!this.targetTopic) {
        this.$Message.warning(this.$i18n.t('m.Please_Select_Target_Topic'))
        return
      }
      this.loading = true
      this.error = ''
      this.pathData = null
      const params = { target_topic: this.targetTopic }
      if (this.startTopic) params.start_topic = this.startTopic
      api.getLearningPath(params).then(res => {
        this.pathData = res.data.data || res.data
        this.loading = false
      }).catch(err => {
        this.loading = false
        if (err.response && err.response.status === 404) {
          this.error = err.response.data.error || this.$i18n.t('m.Path_Not_Found')
        } else {
          this.error = this.$i18n.t('m.Network_Error')
        }
      })
    },
    getDifficultyColor (difficulty) {
      const map = { 'Low': 'success', 'Mid': 'warning', 'High': 'error' }
      return map[difficulty] || 'default'
    }
  }
}
</script>

<style scoped lang="less">
.learning-path-card {
  margin-top: 20px;
}
.path-container {
  min-height: 200px;
  position: relative;
}
.loading, .error, .placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #808695;
}
.error {
  color: #ed4014;
}
.topic-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.problem-suggestion {
  margin-top: 6px;
  padding-left: 22px;
  .suggestion-label {
    color: #808695;
    margin-right: 8px;
  }
  .problem-link {
    color: #2d8cf0;
    &:hover {
      text-decoration: underline;
    }
  }
}
.no-problem {
  margin-top: 6px;
  padding-left: 22px;
  color: #808695;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.weak-info {
  display: flex;
  align-items: center;
  gap: 8px;
  .label {
    color: #515a6e;
    font-weight: 500;
  }
}
.placeholder {
  text-align: center;
  p {
    margin-top: 16px;
  }
}
</style>