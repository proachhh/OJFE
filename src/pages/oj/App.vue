<template>
  <div>
    <NavBar></NavBar>
    <GlobalSidebar></GlobalSidebar>
    <div class="content-app" :class="{ 'home-page': isHomePage }">
      <router-view></router-view>
      <div v-if="!isHomePage" class="footer">
        <p v-html="website.website_footer"></p>
        <p>Powered by <a href="https://github.com/QingdaoU/OnlineJudge">OnlineJudge</a>
          <span v-if="version">&nbsp; Version: {{ version }}</span>
        </p>
      </div>
    </div>
    <BackTop></BackTop>
    <AIChatWindow></AIChatWindow>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import NavBar from '@oj/components/NavBar.vue'
  import AIChatWindow from '@oj/views/chat/Chat.vue'
  import GlobalSidebar from '@oj/components/GlobalSidebar.vue'

  export default {
    name: 'app',
    components: {
      NavBar,
      AIChatWindow,
      GlobalSidebar
    },
    data () {
      return {
        version: process.env.VERSION
      }
    },
    created () {
      try {
        document.body.removeChild(document.getElementById('app-loader'))
      } catch (e) {
      }
    },
    mounted () {
      this.getWebsiteConfig()
      this.toggleHomeBackground()
    },
    methods: {
      ...mapActions(['getWebsiteConfig', 'changeDomTitle']),
      toggleHomeBackground () {
        const homeBg = document.getElementById('home-bg')
        if (homeBg) {
          if (this.isHomePage) {
            homeBg.classList.remove('hide')
          } else {
            homeBg.classList.add('hide')
          }
        }
      }
    },
    computed: {
      ...mapState(['website', 'sidebarCollapsed']),
      isHomePage () {
        return this.$route.path === '/' || this.$route.path === '/home' || this.$route.path === '/learning-path'
      }
    },
    watch: {
      'website' () {
        this.changeDomTitle()
      },
      '$route' () {
        this.changeDomTitle()
        this.toggleHomeBackground()
      }
    }
  }
</script>

<style lang="less">

  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  a {
    text-decoration: none;
    background-color: transparent;
    &:active, &:hover {
      outline-width: 0;
    }
  }


  .content-app {
  min-height: 100vh;
  margin-top: 80px;
  padding: 0 2%;
}

.content-app.home-page {
  margin-top: 0;
  padding: 0;
}

  .footer {
    margin-top: 20px;
    margin-bottom: 10px;
    text-align: center;
    font-size: small;
  }



</style>
