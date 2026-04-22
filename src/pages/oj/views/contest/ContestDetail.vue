<template>
  <div class="flex-container">
    <div id="contest-main">
      <!--children-->
      <transition name="fadeInUp">
        <router-view></router-view>
      </transition>
      <!--children end-->
      <div class="flex-container" v-if="route_name === 'contest-details'">
        <template>
          <div id="contest-desc">
            <Panel :padding="20" shadow>
              <div slot="title">
                {{contest.title}}
              </div>
              <div slot="extra">
                <Tag type="dot" :color="countdownColor">
                  <span id="countdown">{{countdown}}</span>
                </Tag>
              </div>
              <div v-html="contest.description" class="markdown-body"></div>
              <div v-if="passwordFormVisible" class="contest-password">
                <Input v-model="contestPassword" type="password"
                       placeholder="contest password" class="contest-password-input"
                       @on-enter="checkPassword"/>
                <Button type="info" @click="checkPassword">Enter</Button>
              </div>
            </Panel>
            <Table :columns="columns" :data="contest_table" disabled-hover style="margin-bottom: 40px;"></Table>
          </div>
        </template>
      </div>

    </div>
    <div v-show="showMenu" id="contest-menu">
      <VerticalMenu @on-click="handleRoute">
        <VerticalMenu-item :route="{name: 'contest-details', params: {contestID: contestID}}">
          <Icon type="home"></Icon>
          {{$t('m.Overview')}}
        </VerticalMenu-item>

        <VerticalMenu-item :disabled="contestMenuDisabled"
                           :route="{name: 'contest-announcement-list', params: {contestID: contestID}}">
          <Icon type="chatbubble-working"></Icon>
          {{$t('m.Announcements')}}
        </VerticalMenu-item>

        <VerticalMenu-item :disabled="contestMenuDisabled"
                           :route="{name: 'contest-problem-list', params: {contestID: contestID}}">
          <Icon type="ios-photos"></Icon>
          {{$t('m.Problems')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled"
                           :route="{name: 'contest-submission-list'}">
          <Icon type="navicon-round"></Icon>
          {{$t('m.Submissions')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled"
                           :route="{name: 'contest-rank', params: {contestID: contestID}}">
          <Icon type="stats-bars"></Icon>
          {{$t('m.Rankings')}}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="showAdminHelper"
                           :route="{name: 'acm-helper', params: {contestID: contestID}}">
          <Icon type="ios-paw"></Icon>
          {{$t('m.Admin_Helper')}}
        </VerticalMenu-item>
      </VerticalMenu>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import api from '@oj/api'
  import { mapState, mapGetters, mapActions } from 'vuex'
  import { types } from '@/store'
  import { CONTEST_STATUS_REVERSE, CONTEST_STATUS } from '@/utils/constants'
  import time from '@/utils/time'

  export default {
    name: 'ContestDetail',
    components: {},
    data () {
      return {
        CONTEST_STATUS: CONTEST_STATUS,
        route_name: '',
        btnLoading: false,
        contestID: '',
        contestPassword: '',
        columns: [
          {
            title: this.$i18n.t('m.StartAt'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.start_time))
            }
          },
          {
            title: this.$i18n.t('m.EndAt'),
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.end_time))
            }
          },
          {
            title: this.$i18n.t('m.ContestType'),
            render: (h, params) => {
              return h('span', this.$i18n.t('m.' + params.row.contest_type ? params.row.contest_type.replace(' ', '_') : ''))
            }
          },
          {
            title: this.$i18n.t('m.Rule'),
            render: (h, params) => {
              return h('span', this.$i18n.t('m.' + params.row.rule_type))
            }
          },
          {
            title: this.$i18n.t('m.Creator'),
            render: (h, data) => {
              return h('span', data.row.created_by.username)
            }
          }
        ]
      }
    },
    mounted () {
      this.contestID = this.$route.params.contestID
      this.route_name = this.$route.name
      this.$store.dispatch('getContest').then(res => {
        this.changeDomTitle({title: res.data.data.title})
        let data = res.data.data
        let endTime = moment(data.end_time)
        if (endTime.isAfter(moment(data.now))) {
          this.timer = setInterval(() => {
            this.$store.commit(types.NOW_ADD_1S)
          }, 1000)
        }
      })
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      handleRoute (route) {
        this.$router.push(route)
      },
      checkPassword () {
        if (this.contestPassword === '') {
          this.$error('Password can\'t be empty')
          return
        }
        this.btnLoading = true
        api.checkContestPassword(this.contestID, this.contestPassword).then((res) => {
          this.$success('Succeeded')
          this.$store.commit(types.CONTEST_ACCESS, {access: true})
          this.btnLoading = false
        }, (res) => {
          this.btnLoading = false
        })
      }
    },
    computed: {
      ...mapState({
        showMenu: state => state.contest.itemVisible.menu,
        contest: state => state.contest.contest,
        contest_table: state => [state.contest.contest],
        now: state => state.contest.now
      }),
      ...mapGetters(
        ['contestMenuDisabled', 'contestRuleType', 'contestStatus', 'countdown', 'isContestAdmin',
          'OIContestRealTimePermission', 'passwordFormVisible']
      ),
      countdownColor () {
        if (this.contestStatus) {
          return CONTEST_STATUS_REVERSE[this.contestStatus].color
        }
      },
      showAdminHelper () {
        return this.isContestAdmin && this.contestRuleType === 'ACM'
      }
    },
    watch: {
      '$route' (newVal) {
        this.route_name = newVal.name
        this.contestID = newVal.params.contestID
        this.changeDomTitle({title: this.contest.title})
      }
    },
    beforeDestroy () {
      clearInterval(this.timer)
      this.$store.commit(types.CLEAR_CONTEST)
    }
  }
</script>

<style scoped lang="less">
.contest-detail-elegant {
  max-width: 1400px;
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

/* 主布局 */
.flex-container {
  display: flex;
  gap: 24px;

  #contest-main {
    flex: 1;
    min-width: 0;

    #contest-desc {
      .contest-panel {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        margin-bottom: 24px;

        .contest-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfc;

          .contest-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 12px;
          }

          .contest-status {
            display: flex;
            align-items: center;
            gap: 12px;

            #countdown {
              font-size: 16px;
              font-weight: 600;
            }
          }
        }

        .contest-content {
          padding: 24px;

          .markdown-body {
            line-height: 1.8;
            color: #334155;
          }
        }

        .contest-password {
          margin-top: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;

          &-input {
            flex: 1;
            max-width: 300px;
          }
        }
      }

      .contest-table {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        padding: 24px;
      }
    }
  }

  #contest-menu {
    flex: none;
    width: 240px;

    .menu-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      position: sticky;
      top: 80px;
    }
  }
}

pre {
  display: inline-block;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}
</style>
