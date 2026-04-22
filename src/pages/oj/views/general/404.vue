<template>
  <div class="error404-elegant">
    <div class="error404-content">
      <div class="error-code">
        4<span><Icon type="ios-navigate-outline"></Icon></span>4
      </div>
      <p class="error-message">YOU&nbsp;&nbsp;LOOK&nbsp;&nbsp;LOST</p>
      <p class="error-subtitle">The page you're looking for doesn't exist or has been moved</p>
      <div class="error-actions">
        <Button @click="goHome" size="large" class="action-btn" type="ghost">
          <Icon type="ios-home" />
          {{$t('m.Go_Home')}}
        </Button>
        <Button @click="backPage" size="large" class="action-btn primary" type="primary">
          <Icon type="ios-arrow-back" />
          {{$t('m.Back')}}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Error404',
    methods: {
      backPage () {
        this.$router.go(-1)
      },
      goHome () {
        this.$router.push({
          name: 'home'
        })
      }
    }
  }
</script>

<style lang="less" scoped>
  @keyframes error404animation {
    0% {
      transform: rotateZ(0deg);
    }
    20% {
      transform: rotateZ(-60deg);
    }
    40% {
      transform: rotateZ(-10deg);
    }
    60% {
      transform: rotateZ(50deg);
    }
    80% {
      transform: rotateZ(-20deg);
    }
    100% {
      transform: rotateZ(0deg);
    }
  }

  .error404-elegant {
    min-height: calc(100vh - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
    padding: 40px 20px;
  }

  .error404-content {
    text-align: center;
    max-width: 600px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
    padding: 60px 40px;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
    }

    .error-code {
      text-align: center;
      font-size: 180px;
      font-weight: 700;
      color: #1e3a8a;
      height: 200px;
      line-height: 200px;
      margin-bottom: 20px;

      span {
        display: inline-block;
        color: #3b82f6;
        font-size: 160px;
        animation: error404animation 3s ease 0s infinite alternate;
      }
    }

    .error-message {
      display: block;
      text-align: center;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 8px;
      color: #1e3a8a;
      margin-bottom: 12px;
    }

    .error-subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 40px;
    }

    .error-actions {
      display: flex;
      justify-content: center;
      gap: 20px;

      .action-btn {
        width: 180px;
        font-size: 16px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.2s ease;

        .ivu-icon {
          margin-right: 8px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
        }

        &.primary {
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          border: none;

          &:hover {
            background: linear-gradient(135deg, #1e40af, #2563eb);
          }
        }
      }
    }
  }
</style>
