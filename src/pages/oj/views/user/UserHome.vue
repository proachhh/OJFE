<template>
  <div class="user-home-elegant">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-line"></span>
        {{ profile.user ? profile.user.username : $t('m.User_Home') }}
        <span class="title-line"></span>
      </h1>
      <p class="page-subtitle">{{ profile.school || 'Coder Profile' }}</p>
    </div>

    <div class="profile-panel">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img class="avatar" :src="profile.avatar"/>
        </div>
        <p v-if="profile.mood" class="user-mood">{{ profile.mood }}</p>
      </div>

      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">
            <Icon type="ios-checkmark-circle" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ $t('m.UserHomeSolved') }}</p>
            <p class="stat-value">{{ profile.accepted_number }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <Icon type="ios-paper" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ $t('m.UserHomeserSubmissions') }}</p>
            <p class="stat-value">{{ profile.submission_number }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <Icon type="ios-trophy" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ $t('m.UserHomeScore') }}</p>
            <p class="stat-value">{{ profile.total_score }}</p>
          </div>
        </div>
      </div>

      <div class="problems-section">
        <div class="section-header">
          <Icon type="ios-checkmark" />
          <span>{{ $t('m.List_Solved_Problems') }}</span>
          <Poptip v-if="refreshVisible" trigger="hover" placement="right-start">
            <Icon type="ios-help-circle" class="help-icon" />
            <div slot="content">
              <p>{{ $t('m.Problem_ID_Not_Exist_Message') }}</p>
              <Button type="info" @click="freshProblemDisplayID">{{ $t('m.Regenerate_Button') }}</Button>
            </div>
          </Poptip>
        </div>
        <div v-if="!problems.length" class="no-problems">
          <p>{{ $t('m.UserHomeIntro') }}</p>
        </div>
        <div v-else class="problems-grid">
          <Button 
            v-for="problemID of problems" 
            :key="problemID" 
            class="problem-btn"
            @click="goProblem(problemID)"
          >
            {{ problemID }}
          </Button>
        </div>
      </div>

      <div class="social-section">
        <a v-if="profile.github" :href="profile.github" class="social-link">
          <Icon type="social-github-outline" size="24" />
        </a>
        <a v-if="profile.user && profile.user.email" :href="'mailto:'+ profile.user.email" class="social-link">
          <Icon type="ios-email-outline" size="24" />
        </a>
        <a v-if="profile.blog" :href="profile.blog" class="social-link">
          <Icon type="ios-world-outline" size="24" />
        </a>
      </div>
    </div>
  </div>
</template>
<script>
  import { mapActions } from 'vuex'
  import time from '@/utils/time'
  import api from '@oj/api'

  export default {
    data () {
      return {
        username: '',
        profile: {},
        problems: []
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      init () {
        this.username = this.$route.query.username
        api.getUserInfo(this.username).then(res => {
          this.changeDomTitle({title: res.data.data.user.username})
          this.profile = res.data.data
          this.getSolvedProblems()
          let registerTime = time.utcToLocal(this.profile.user.create_time, 'YYYY-MM-D')
          console.log('The guy registered at ' + registerTime + '.')
        })
      },
      getSolvedProblems () {
        let ACMProblems = this.profile.acm_problems_status.problems || {}
        let OIProblems = this.profile.oi_problems_status.problems || {}
        // todo oi problems
        let ACProblems = []
        for (let problems of [ACMProblems, OIProblems]) {
          Object.keys(problems).forEach(problemID => {
            if (problems[problemID]['status'] === 0) {
              ACProblems.push(problems[problemID]['_id'])
            }
          })
        }
        ACProblems.sort()
        this.problems = ACProblems
      },
      goProblem (problemID) {
        this.$router.push({name: 'problem-details', params: {problemID: problemID}})
      },
      freshProblemDisplayID () {
        api.freshDisplayID().then(res => {
          this.$success(this.$t('m.Update_Successfully'))
          this.init()
        })
      }
    },
    computed: {
      refreshVisible () {
        if (!this.username) return true
        if (this.username && this.username === this.$store.getters.user.username) return true
        return false
      }
    },
    watch: {
      '$route' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init()
        }
      }
    }
  }
</script>

<style lang="less" scoped>
.user-home-elegant {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
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

/* 主面板 */
.profile-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 40px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }
}

/* 头像区域 */
.avatar-section {
  text-align: center;
  margin-bottom: 32px;

  .avatar-wrapper {
    display: inline-block;
    padding: 4px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border-radius: 50%;

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid white;
      object-fit: cover;
    }
  }

  .user-mood {
    margin-top: 16px;
    font-size: 1rem;
    color: #64748b;
    font-style: italic;
  }
}

/* 统计卡片区域 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f4f8;
    border-color: #1e3a8a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border-radius: 12px;
    color: white;
    font-size: 24px;
  }

  .stat-info {
    flex: 1;

    .stat-label {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 4px 0 0 0;
    }
  }
}

/* 题目区域 */
.problems-section {
  margin-bottom: 32px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;

    .help-icon {
      color: #94a3b8;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #1e3a8a;
      }
    }
  }

  .no-problems {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
  }

  .problems-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .problem-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid #1e3a8a;
      color: #1e3a8a;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: #1e3a8a;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(30, 58, 138, 0.2);
      }
    }
  }
}

/* 社交链接区域 */
.social-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;

  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    color: #64748b;
    transition: all 0.2s ease;

    &:hover {
      background: #1e3a8a;
      border-color: #1e3a8a;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }
  }
}
</style>
