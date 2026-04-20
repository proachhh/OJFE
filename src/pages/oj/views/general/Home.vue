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
      <div class="section-header">
        <h2 class="section-title">最新公告</h2>
      </div>
      <Announcements />
    </section>
  </div>
</template>

<script>
import KnowledgeGraphSection from './KnowledgeGraphSection.vue'
import Announcements from './Announcements.vue'

export default {
  name: 'home',
  components: { KnowledgeGraphSection, Announcements }
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

@media (max-width: 768px) {
  .content-section .hero-text {
    left: 24px;
    right: 24px;
    .hero-title { font-size: 2.2rem; }
  }
}
</style>