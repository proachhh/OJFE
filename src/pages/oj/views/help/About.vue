<template>
  <div class="about-elegant">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-line"></span>
        {{ $t('m.Compiler') }} & {{ $t('m.Judger') }}
        <span class="title-line"></span>
      </h1>
      <p class="page-subtitle">Supported Languages & Result Explanations</p>
    </div>

    <div class="about-panel">
      <div class="section">
        <div class="section-header">
          <Icon type="ios-code" />
          <span>{{ $t('m.Compiler') }} & {{ $t('m.Judger') }}</span>
        </div>
        <div class="content markdown-body">
          <div class="language-list">
            <div class="language-item" v-for="lang in languages" :key="lang.name">
              <div class="language-name">{{ lang.name }} ( {{ lang.description }} )</div>
              <pre class="language-command">{{ lang.config.compile.compile_command }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <div class="section">
        <div class="section-header">
          <Icon type="ios-list" />
          <span>{{ $t('m.Result_Explanation') }}</span>
        </div>
        <div class="content">
          <div class="result-list">
            <div class="result-item">
              <span class="result-status status-pending">{{ $t('m.Pending') }} & {{ $t('m.Judging') }}</span>
              <span class="result-desc">{{ $t('m.Pending_Judging_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-compile-error">{{ $t('m.Compile_Error') }}</span>
              <span class="result-desc">{{ $t('m.Compile_Error_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-accepted">{{ $t('m.Accepted') }}</span>
              <span class="result-desc">{{ $t('m.Accepted_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-wrong">{{ $t('m.Wrong_Answer') }}</span>
              <span class="result-desc">{{ $t('m.Wrong_Answer_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-runtime-error">{{ $t('m.Runtime_Error') }}</span>
              <span class="result-desc">{{ $t('m.Runtime_Error_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-time-limit">{{ $t('m.Time_Limit_Exceeded') }}</span>
              <span class="result-desc">{{ $t('m.Time_Limit_Exceeded_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-memory-limit">{{ $t('m.Memory_Limit_Exceeded') }}</span>
              <span class="result-desc">{{ $t('m.Memory_Limit_Exceeded_Description') }}</span>
            </div>
            <div class="result-item">
              <span class="result-status status-system-error">{{ $t('m.System_Error') }}</span>
              <span class="result-desc">{{ $t('m.System_Error_Description') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import utils from '@/utils/utils'

  export default {
    data () {
      return {
        languages: []
      }
    },
    beforeRouteEnter (to, from, next) {
      utils.getLanguages().then(languages => {
        next(vm => {
          vm.languages = languages
        })
      })
    }
  }
</script>

<style scoped lang="less">
.about-elegant {
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
.about-panel {
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

.section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.3rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f5f9;

    .ivu-icon {
      font-size: 24px;
    }
  }

  .content {
    font-size: 16px;
  }
}

.section-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 40px 0;
}

/* 语言列表 */
.language-list {
  .language-item {
    padding: 16px;
    margin-bottom: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #1e3a8a;
    transition: all 0.2s ease;

    &:hover {
      background: #f0f4f8;
      transform: translateX(4px);
    }

    .language-name {
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 8px;
    }

    .language-command {
      background: white;
      padding: 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #475569;
      margin: 0;
      overflow-x: auto;
    }
  }
}

/* 结果说明列表 */
.result-list {
  .result-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    margin-bottom: 12px;
    background: #f8fafc;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: #f0f4f8;
      transform: translateX(4px);
    }

    .result-status {
      font-weight: 600;
      white-space: nowrap;
      min-width: 150px;
    }

    .result-desc {
      color: #64748b;
      flex: 1;
    }
  }

  .status-pending {
    color: #f59e0b;
  }

  .status-compile-error {
    color: #ef4444;
  }

  .status-accepted {
    color: #10b981;
  }

  .status-wrong {
    color: #ef4444;
  }

  .status-runtime-error {
    color: #f97316;
  }

  .status-time-limit {
    color: #a855f7;
  }

  .status-memory-limit {
    color: #8b5cf6;
  }

  .status-system-error {
    color: #64748b;
  }
}
</style>
