<template>
  <div class="home-container">
    <section class="content-section">
      <KnowledgeGraphSection />
      <div class="hero-text">
        <h1 class="hero-title">探索 · 知识星海</h1>
        <p class="hero-subtitle">From Zero to Hero，构建你的专属学习路径</p>
      </div>
    </section>

    <div class="scroll-spacer"></div>

    <section class="announcement-section">
      <div class="section-header animate-on-scroll" data-animation="fade-up">
        <h2 class="section-title">最新公告</h2>
      </div>
      <div class="animate-on-scroll" data-animation="fade-up">
        <Announcements />
      </div>
    </section>

    <section class="features-section">
      <div class="section-header animate-on-scroll" data-animation="fade-up">
        <h2 class="section-title">为什么选择我们</h2>
        <p class="section-subtitle">专业、高效、智能的算法学习平台</p>
      </div>
      <div class="feature-row" v-for="(feature, index) in features" :key="index" :class="{ 'reverse': index % 2 === 1, 'animate-on-scroll': true }" :data-animation="index % 2 === 0 ? 'slide-left' : 'slide-right'">
        <div class="feature-info">
          <div class="feature-icon-large" :style="{ background: feature.color }">
            <Icon :type="feature.icon" size="36" color="#fff" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.desc }}</p>
        </div>
        <div class="feature-screenshot">
          <img :src="feature.screenshot" :alt="feature.title" />
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-item animate-on-scroll" v-for="(stat, index) in stats" :key="index" :data-animation="'fade-up'" :style="{ transitionDelay: (index * 0.15) + 's' }">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-content animate-on-scroll" data-animation="fade-up">
        <h2 class="cta-title">准备好开始了吗？</h2>
        <p class="cta-subtitle">加入数名开发者，一起提升算法能力</p>
        <div class="cta-buttons">
          <Button type="primary" size="large" class="cta-btn" @click="goToProblems">
            <Icon type="ios-rocket" /> 开始刷题
          </Button>
          <Button size="large" class="cta-btn-outline" @click="goToLearningPath">
            <Icon type="ios-map" /> 学习路径
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import KnowledgeGraphSection from './KnowledgeGraphSection.vue'
import Announcements from './Announcements.vue'

export default {
  name: 'home',
  components: { KnowledgeGraphSection, Announcements },
  data() {
    return {
      features: [
        {
          icon: 'ios-analytics',
          title: '智能知识图谱',
          desc: '可视化展示知识点关联，帮助你系统性地学习和理解算法体系',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          screenshot: require('../../../../../static/pictures/graph.png')
        },
        {
          icon: 'ios-trending-up',
          title: '个性化推荐',
          desc: '基于你的学习数据，智能推荐适合你的题目，高效提升',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          screenshot: require('../../../../../static/pictures/recommend.png')
        },
        {
          icon: 'ios-speedometer',
          title: '实时评测系统',
          desc: '支持多种编程语言，秒级评测结果，详细的错误反馈帮助你快速定位问题',
          color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          screenshot: require('../../../../../static/pictures/languages.png')
        },
        {
          icon: 'ios-robot',
          title: 'AI生成题目',
          desc: 'AI智能生成个性化练习题，针对薄弱知识点精准强化',
          color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          screenshot: require('../../../../../static/pictures/AI4problem.png')
        },
        {
          icon: 'ios-book',
          title: '教案辅导',
          desc: '系统化教案与智能辅导，帮助你循序渐进掌握每个知识点',
          color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          screenshot: require('../../../../../static/pictures/lesson.png')
        }
      ],
      stats: [
        { number: '1000+', label: '精选题目' },
        { number: '50+', label: '活跃用户' },
        { number: '500+', label: '总提交数' },
        { number: '99.9%', label: '系统稳定性' }
      ]
    }
  },
  methods: {
    goToProblems() {
      this.$router.push({ name: 'problem-list' })
    },
    goToLearningPath() {
      this.$router.push({ name: 'learning-path' })
    },
    initScrollAnimations() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view')
            } else {
              entry.target.classList.remove('in-view')
            }
          })
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
      )
      this.$nextTick(() => {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
          observer.observe(el)
        })
      })
    }
  },
  mounted() {
    this.initScrollAnimations()
  }
}
</script>

<style lang="less">
html, body {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
}

.home-container {
  width: 100vw;
  min-height: 200vh;
  position: relative;
  overflow-x: hidden;
}

/* 固定全屏背景区域 - 透明背景，让 index.html 的背景图显示 */
.content-section {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background: transparent;
  pointer-events: none;

  .hero-text {
    position: absolute;
    left: 60px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    z-index: 10;
    animation: fadeInUp 0.9s ease-out both;
    max-width: 420px;
    pointer-events: auto;

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0 0 20px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      text-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .hero-subtitle {
      font-size: 1.2rem;
      font-weight: 300;
      margin: 0;
      opacity: 0.85;
      line-height: 1.7;
    }
  }
}

/* 让页面可以滚动，推开公告区域 */
.scroll-spacer {
  height: 100vh;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

/* 公告区域在滚动后出现 */
.announcement-section {
  position: relative;
  z-index: 2;
  padding: 80px 20px 100px;
  background: #f5f7fa;

  .section-header {
    text-align: center;
    margin-bottom: 60px;

    .section-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: #17233d;
      margin: 0 0 20px;
    }

    .section-divider {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #1e3a8a, #0ea5e9);
      margin: 0 auto;
      border-radius: 2px;
    }
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(-50%) translateY(30px); }
  to   { opacity: 1; transform: translateY(-50%) translateY(0); }
}

/* 特色功能区域 */
.features-section {
  position: relative;
  z-index: 2;
  padding: 100px 60px;
  background: white;

  .section-header {
    text-align: center;
    margin-bottom: 80px;

    .section-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: #17233d;
      margin: 0 0 12px;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
    }
  }

  .feature-row {
    max-width: 1200px;
    margin: 0 auto 80px;
    display: flex;
    align-items: center;
    gap: 60px;

    &:last-child {
      margin-bottom: 0;
    }

    &.reverse {
      flex-direction: row-reverse;
    }

    .feature-info {
      flex: 1;
      min-width: 0;

      .feature-icon-large {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .feature-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 16px;
      }

      .feature-desc {
        font-size: 1.05rem;
        color: #64748b;
        line-height: 1.8;
        margin: 0;
      }
    }

    .feature-screenshot {
      flex: 1;
      min-width: 0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;

      img {
        width: 100%;
        display: block;
        border-radius: 16px;
      }
    }
  }
}

/* 滚动动画 */
.animate-on-scroll {
  opacity: 0;
  transition: opacity 0.7s ease, transform 0.7s ease;

  &[data-animation="fade-up"] {
    transform: translateY(40px);
  }

  &[data-animation="slide-left"] {
    transform: translateX(-80px);
  }

  &[data-animation="slide-right"] {
    transform: translateX(80px);
  }

  &[data-animation="scale-up"] {
    transform: scale(0.9);
  }

  &.in-view {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

/* 数据统计区域 */
.stats-section {
  position: relative;
  z-index: 2;
  padding: 80px 40px;
  background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);

  .stats-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
  }

  .stat-item {
    text-align: center;
    color: white;

    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .stat-label {
      font-size: 1rem;
      opacity: 0.85;
      letter-spacing: 0.05em;
    }
  }
}

/* CTA 区域 */
.cta-section {
  position: relative;
  z-index: 2;
  padding: 100px 40px;
  background: #f8fafc;
  text-align: center;

  .cta-content {
    max-width: 600px;
    margin: 0 auto;

    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 16px;
    }

    .cta-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0 0 40px;
    }

    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;

      .cta-btn {
        padding: 0 32px;
        height: 48px;
        font-size: 1rem;
        border-radius: 12px;
      }

      .cta-btn-outline {
        padding: 0 32px;
        height: 48px;
        font-size: 1rem;
        border-radius: 12px;
        border: 2px solid #1e3a8a;
        color: #1e3a8a;

        &:hover {
          background: #1e3a8a;
          color: white;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .content-section .hero-text {
    left: 24px;
    right: 24px;
    .hero-title { font-size: 2.2rem; }
  }

  .features-section {
    padding: 60px 24px;

    .feature-row {
      flex-direction: column;
      gap: 32px;

      &.reverse {
        flex-direction: column;
      }
    }
  }

  .stats-section .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }

  .cta-section .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>