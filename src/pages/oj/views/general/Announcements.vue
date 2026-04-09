<template>
  <Panel shadow :padding="10">
    <div slot="title">
      {{ title }}
    </div>
    <div slot="extra">
      <Button v-if="listVisible" type="info" @click="init" :loading="btnLoading">
        {{ $t('m.Refresh') }}
      </Button>
      <Button v-else type="ghost" icon="ios-undo" @click="goBack">
        {{ $t('m.Back') }}
      </Button>
    </div>

    <transition-group name="announcement-animate" mode="in-out">
      <div class="no-announcement" v-if="!announcements.length" key="no-announcement">
        <p>{{ $t('m.No_Announcements') }}</p>
      </div>

      <template v-if="listVisible">
        <div class="announcement-layout" key="layout">
          <!-- 左侧轮播图 -->
          <div class="carousel-side" v-if="carouselItems.length">
            <div class="carousel-wrapper">
              <Carousel
                v-model="carouselIndex"
                :autoplay="true"
                :autoplay-speed="3000"
                :dots="'inside'"
                :radius-dot="true"
                :trigger="'hover'"
                :arrow="'always'"
                :height="carouselHeight"
                class="carousel"
              >
                <CarouselItem v-for="(item, index) in carouselItems" :key="index">
                  <div class="carousel-item" @click="goAnnouncement(item.announcement)">
                    <img :src="item.image" :alt="item.announcement.title" />
                    <div class="carousel-title">{{ item.announcement.title }}</div>
                  </div>
                </CarouselItem>
              </Carousel>
            </div>
          </div>
          <div v-else class="carousel-side empty-carousel">
            <p>{{ $t('m.No_Image_Announcement') }}</p>
          </div>

          <!-- 右侧列表（只显示标题，极简风格） -->
          <div class="list-side">
            <div class="list-header">
              <span>{{ $t('m.Recent_Announcements') }}</span>
              <Button type="text" icon="ios-arrow-down" @click="scrollToListBottom" :title="$t('m.Scroll_to_Bottom')" size="small" />
            </div>
            <ul class="announcements-container" ref="announcementList">
              <li v-for="announcement in announcements" :key="announcement.id" @click="goAnnouncement(announcement)">
                <Tooltip :content="`${announcement.created_by.username} · ${announcement.create_time | localtime}`" placement="left">
                  <span class="item-title">{{ announcement.title }}</span>
                </Tooltip>
              </li>
            </ul>
            <div class="pagination-wrapper" v-if="!isContest">
              <Pagination
                :total="total"
                :page-size="limit"
                @on-change="getAnnouncementList"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-katex v-html="announcement.content" key="content" class="content-container markdown-body"></div>
      </template>
    </transition-group>
  </Panel>
</template>

<script>
import api from '@oj/api'
import Pagination from '@oj/components/Pagination'

export default {
  name: 'Announcement',
  components: {
    Pagination
  },
  data () {
    return {
      limit: 10,
      total: 10,
      btnLoading: false,
      announcements: [],
      announcement: '',
      listVisible: true,
      carouselIndex: 0,
      carouselHeight: '200px',
      resizeTimer: null
    }
  },
  mounted () {
    this.calcCarouselHeight()
    window.addEventListener('resize', this.handleResize)
    this.init()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeTimer) clearTimeout(this.resizeTimer)
  },
  methods: {
    // 防抖处理 resize 事件
    handleResize () {
      if (this.resizeTimer) clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.calcCarouselHeight()
      }, 100)
    },
    // 计算轮播图高度（基于容器宽度 16:9）
    calcCarouselHeight () {
      this.$nextTick(() => {
        const wrapper = this.$el.querySelector('.carousel-wrapper')
        if (wrapper) {
          const width = wrapper.clientWidth
          // 只有宽度有效时才计算，避免高度突变为异常值
          if (width > 0) {
            this.carouselHeight = (width * 9 / 16) + 'px'
          }
        }
      })
    },
    // 滚动公告列表到底部
    scrollToListBottom () {
      const listEl = this.$refs.announcementList
      if (listEl) {
        listEl.scrollTo({
          top: listEl.scrollHeight,
          behavior: 'smooth'
        })
      }
    },
    init () {
      if (this.isContest) {
        this.getContestAnnouncementList()
      } else {
        this.getAnnouncementList()
      }
    },
    getAnnouncementList (page = 1) {
      this.btnLoading = true
      api.getAnnouncementList((page - 1) * this.limit, this.limit).then(res => {
        this.btnLoading = false
        this.announcements = res.data.data.results
        this.total = res.data.data.total
        // 数据更新后重新计算轮播图高度（因为可能新增/减少了包含图片的公告）
        this.$nextTick(() => {
          this.calcCarouselHeight()
        })
      }, () => {
        this.btnLoading = false
      })
    },
    getContestAnnouncementList () {
      this.btnLoading = true
      api.getContestAnnouncementList(this.$route.params.contestID).then(res => {
        this.btnLoading = false
        this.announcements = res.data.data
        this.$nextTick(() => {
          this.calcCarouselHeight()
        })
      }, () => {
        this.btnLoading = false
      })
    },
    goAnnouncement (announcement) {
      this.announcement = announcement
      this.listVisible = false
    },
    goBack () {
      this.listVisible = true
      this.announcement = ''
    },
    // 提取公告内容中第一张图片的URL
    extractFirstImage (content) {
      if (!content) return null
      // 匹配 Markdown 图片语法: ![alt](url)
      const mdMatch = content.match(/!\[.*?\]\((.*?)\)/)
      if (mdMatch) return mdMatch[1]
      // 匹配 HTML img 标签
      const htmlMatch = content.match(/<img[^>]+src="([^">]+)"/)
      if (htmlMatch) return htmlMatch[1]
      return null
    }
  },
  computed: {
    title () {
      if (this.listVisible) {
        return this.isContest ? this.$i18n.t('m.Contest_Announcements') : this.$i18n.t('m.Announcements')
      } else {
        return this.announcement.title
      }
    },
    isContest () {
      return !!this.$route.params.contestID
    },
    carouselItems () {
      return this.announcements
        .map(ann => {
          const image = this.extractFirstImage(ann.content)
          return image ? { announcement: ann, image } : null
        })
        .filter(item => item !== null)
    }
  }
}
</script>

<style scoped lang="less">
.announcement-layout {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.carousel-side {
  flex: 2; // 轮播图占 2 份，更宽
  min-width: 0;
}

.empty-carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f9;
  border-radius: 8px;
  color: #808695;
}

.list-side {
  flex: 1; // 列表占 1 份，更窄
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 12px 4px;
  font-weight: 500;
  color: #17233d;
  border-bottom: 1px solid #e8eaec;
}

.announcements-container {
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c5c8ce;
    border-radius: 2px;
  }

  li {
    padding: 12px 4px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.2s;
    &:hover {
      background: #f8f8f9;
    }
    &:last-child {
      border-bottom: none;
    }
  }
}

.item-title {
  font-size: 14px;
  color: #17233d;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-wrapper {
  margin-top: 12px;
  text-align: right;
}

.carousel-wrapper {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel {
  /deep/ .ivu-carousel-item {
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.carousel-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .carousel-title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 16px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    color: white;
    font-size: 16px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

.content-container {
  padding: 0 20px 20px 20px;
}

.no-announcement {
  text-align: center;
  font-size: 16px;
}

.announcement-animate-enter-active {
  animation: fadeIn 1s;
}
</style>