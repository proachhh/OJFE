<template>
  <div id="header" :class="{ 'header-transparent': isHome && !scrolled, 'header-scrolled': !isHome || scrolled }">
    <div class="header-content">
      <div class="logo">
        <img :src="logoSrc" alt="学校标志" class="logo-img" />
      </div>
      
      <Menu theme="light" mode="horizontal" @on-select="handleRoute" :active-name="activeMenu" class="oj-menu">
        <Menu-item name="/">
          <Icon type="home"></Icon>
          {{$t('m.Home')}}
        </Menu-item>
        <Menu-item name="/problem">
          <Icon type="ios-keypad"></Icon>
          {{$t('m.NavProblems')}}
        </Menu-item>
        <Menu-item name="/contest">
          <Icon type="trophy"></Icon>
          {{$t('m.Contests')}}
        </Menu-item>
        <Menu-item name="/learning-report">
          <Icon type="ios-pulse-strong"></Icon>
          {{$t('m.NavStatus')}}
        </Menu-item>
        <Menu-item name="/learning-path">
          <Icon type="ios-git-branch"></Icon>
          {{$t('m.Learning_Path')}}
        </Menu-item>
        <Menu-item name="/lesson-plan">
          <Icon type="ios-book"></Icon>
          {{$t('m.Lesson_Plans')}}
        </Menu-item>
        <!-- <Submenu name="rank">
          <template slot="title">
            <Icon type="podium"></Icon>
            {{$t('m.Rank')}}
          </template>
          <Menu-item name="/acm-rank">
            {{$t('m.ACM_Rank')}}
          </Menu-item>
          <Menu-item name="/oi-rank">
            {{$t('m.OI_Rank')}}
          </Menu-item>
        </Submenu> -->
        <!-- <Submenu name="about">
          <template slot="title">
            <Icon type="information-circled"></Icon>
            {{$t('m.About')}}
          </template>
          <Menu-item name="/about">
            {{$t('m.Judger')}}
          </Menu-item>
          <Menu-item name="/FAQ">
            {{$t('m.FAQ')}}
          </Menu-item>
        </Submenu> -->
        
      </Menu>
      
      <div class="auth-menu">
        <template v-if="!isAuthenticated">
          <Button type="ghost"
                  ref="loginBtn"
                  shape="circle"
                  @click="handleBtnClick('login')">{{$t('m.Login')}}
          </Button>
          <Button v-if="website.allow_register"
                  type="ghost"
                  shape="circle"
                  @click="handleBtnClick('register')"
                  style="margin-left: 8px;">{{$t('m.Register')}}
          </Button>
        </template>
        <template v-else>
          <Dropdown class="drop-menu" @on-click="handleRoute" placement="bottom" trigger="click">
            <div class="user-info">
              <img :src="user.avatar || '/static/avatar/default.png'" class="user-avatar" />
              <span class="user-name">{{ user.username }}</span>
            </div>
            <Dropdown-menu slot="list">
              <Dropdown-item name="/user-home">{{$t('m.MyHome')}}</Dropdown-item>
              <Dropdown-item name="/status?myself=1">{{$t('m.MySubmissions')}}</Dropdown-item>
              <Dropdown-item name="/setting/profile">{{$t('m.Settings')}}</Dropdown-item>
              <Dropdown-item v-if="isAdminRole" name="/admin">{{$t('m.Management')}}</Dropdown-item>
              <Dropdown-item divided name="/logout">{{$t('m.Logout')}}</Dropdown-item>
            </Dropdown-menu>
          </Dropdown>
        </template>
      </div>
    </div>
    
    <Modal v-model="modalVisible" :width="400">
      <div slot="header" class="modal-title">{{$t('m.Welcome_to')}} {{website.website_name_shortcut}}</div>
      <component :is="modalStatus.mode" v-if="modalVisible"></component>
      <div slot="footer" style="display: none"></div>
    </Modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import login from '@oj/views/user/Login'
  import register from '@oj/views/user/Register'

  export default {
    components: {
      login,
      register
    },
    data () {
      return {
        scrolled: false
      }
    },
    mounted () {
      this.getProfile()
      window.addEventListener('scroll', this.handleScroll)
    },
    beforeDestroy () {
      window.removeEventListener('scroll', this.handleScroll)
    },
    methods: {
      ...mapActions(['getProfile', 'changeModalStatus']),
      handleRoute (route) {
        if (route && route.indexOf('admin') < 0) {
          this.$router.push(route)
        } else {
          window.open('/admin/')
        }
      },
      handleBtnClick (mode) {
        this.changeModalStatus({
          visible: true,
          mode: mode
        })
      },
      handleScroll () {
        // 滚动到公告区域（约100vh）时才变白色背景
        this.scrolled = window.scrollY > window.innerHeight * 0.9
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus', 'user', 'isAuthenticated', 'isAdminRole']),
      logoSrc () {
        // 首页未滚动时显示 logo.png，学习页面（透明背景）也显示 logo.png，其他情况显示 logo2.png
        const isLearningPath = this.$route.path === '/learning-path'
        return (this.isHome && !this.scrolled) || (isLearningPath && !this.scrolled) ? require('@/assets/logo.png') : require('@/assets/logo2.png')
      },
      activeMenu () {
        const path = this.$route.path
        // 处理各种路由匹配
        if (path === '/' || path.startsWith('/home')) return '/'
        if (path.startsWith('/problem')) return '/problem'
        if (path.startsWith('/contest')) return '/contest'
        if (path.startsWith('/learning-report') || path.startsWith('/status')) return '/learning-report'
        if (path.startsWith('/learning-path')) return '/learning-path'
        if (path.startsWith('/lesson-plan')) return '/lesson-plan'
        if (path.startsWith('/chat')) return '/chat'
        return '/' + path.split('/')[1]
      },
      isHome () {
        return this.$route.path === '/' || this.$route.path === '/home'
      },
      modalVisible: {
        get () {
          return this.modalStatus.visible
        },
        set (value) {
          this.changeModalStatus({visible: value})
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  #header {
    min-width: 300px;
    position: fixed;
    top: 0;
    left: 0;
    height: 80px;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease;
    border: none !important;
    padding-top: 10px;
    
    &.header-transparent {
      background-color: transparent;
      box-shadow: none;
      border: none !important;
      
      &::before, &::after {
        display: none !important;
      }

      .header-content {
        background-color: transparent;
        
        .oj-menu {
          border-bottom: none !important;
          
          &::after {
            display: none !important;
          }
          
          .ivu-menu-item, .ivu-menu-submenu-title {
            border: 2px solid rgba(255, 255, 255, 0.8);
            color: rgba(255, 255, 255, 0.9) !important;
            
            &:hover {
              background: rgba(255, 255, 255, 0.15) !important;
              box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
            }
            
            &.ivu-menu-item-active {
              background: rgba(255, 255, 255, 0.25) !important;
              color: rgba(255, 255, 255, 1) !important;
              border-color: rgba(255, 255, 255, 1);
              box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
            }
            
            .ivu-icon {
              color: rgba(255, 255, 255, 0.9);
            }
          }
        }
        
        .auth-menu {
          .user-info {
            &:hover {
              background: rgba(255, 255, 255, 0.15);
            }
            
            .user-avatar {
              border-color: rgba(255, 255, 255, 0.9);
            }
            
            .user-name {
              color: rgba(255, 255, 255, 0.9);
            }
          }
          
          .ivu-btn-ghost {
            border: 2px solid rgba(255, 255, 255, 0.8);
            color: rgba(255, 255, 255, 0.9);
            
            &:hover {
              background: rgba(255, 255, 255, 0.15);
              box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
            }
          }
        }
      }
    }
    
    &.header-scrolled {
      background-color: #fff;
      box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.08);
      padding-top: 0;
      border: none !important;
      
      &::before, &::after {
        display: none !important;
      }
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      gap: 30px;
    }

    .logo {
      flex-shrink: 0;
      
      .logo-img {
        height: 46px;
        object-fit: contain;
        vertical-align: middle;
        transition: transform 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .oj-menu {
      background: transparent;
      flex: 1;
      max-width: 800px;
      border-bottom: none !important;
      box-shadow: none !important;
      margin-top: 4px;
      
      &::after {
        display: none !important;
      }
      
      .ivu-menu-item, .ivu-menu-submenu-title {
        margin: 0 4px;
        padding: 0 16px;
        height: 40px;
        line-height: 40px;
        border-radius: 20px;
        border: 2px solid #1e3a8a;
        color: #1e3a8a !important;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(30, 58, 138, 0.1) !important;
          box-shadow: 0 0 12px rgba(30, 58, 138, 0.2);
        }
        
        &.ivu-menu-item-active {
          background: #1e3a8a !important;
          color: #fff !important;
          border-color: #1e3a8a;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
          
          .ivu-icon {
            color: #fff !important;
          }
        }
        
        .ivu-icon {
          color: #1e3a8a;
          margin-right: 6px;
        }
      }
      
      .ivu-menu-submenu {
        &>.ivu-menu-submenu-title {
          border-radius: 20px;
        }
      }
    }

    .auth-menu {
      flex-shrink: 0;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 24px;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(30, 58, 138, 0.1);
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #1e3a8a;
        }
        
        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e3a8a;
        }
      }
      
      .ivu-btn-ghost {
        border: 2px solid #1e3a8a;
        color: #1e3a8a;
        border-radius: 20px;
        padding: 8px 20px;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(30, 58, 138, 0.1);
          box-shadow: 0 0 12px rgba(30, 58, 138, 0.2);
        }
      }
    }
  }

  .modal {
    &-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  @media (max-width: 1200px) {
    #header .header-content {
      gap: 16px;
    }
    
    .oj-menu {
      max-width: 600px;
      
      .ivu-menu-item, .ivu-menu-submenu-title {
        padding: 0 12px;
        font-size: 14px;
      }
    }
  }
  
  @media (max-width: 992px) {
    .oj-menu {
      display: none;
    }
  }

  /* 移除所有可能的边框线 */
  .ivu-menu-horizontal {
    border-bottom: none !important;
    
    &::after {
      display: none !important;
    }
  }
  
  .ivu-menu-light {
    border-bottom: none !important;
  }
</style>
