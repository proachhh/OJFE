<template>
  <div class="faq-elegant">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-line"></span>
        {{ $t('m.Frequently_Asked_Questions') }}
        <span class="title-line"></span>
      </h1>
      <p class="page-subtitle">Find Answers to Common Questions</p>
    </div>

    <div class="faq-panel">
      <div class="faq-list">
        <div class="faq-item" v-for="(faq, index) in faqs" :key="index">
          <div class="faq-question">
            <Icon type="ios-help-circle" />
            <span>{{ faq.question }}</span>
          </div>
          <div class="faq-answer" v-html="faq.answer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      faqs: [
        {
          question: this.$t('m.Where_is_the_input_and_the_output'),
          answer: `<p>${this.$t('m.Where_is_the_input_and_the_output_answer_part_1')} <code>stdin</code> ('${this.$t('m.Standard_Input')}') ${this.$t('m.Where_is_the_input_and_the_output_answer_part_3')} <code>stdout</code>
            ('${this.$t('m.Standard_Output')}') ${this.$t('m.Where_is_the_input_and_the_output_answer_part_5')} <code>scanf</code> ${this.$t('m.Where_is_the_input_and_the_output_answer_part_6')} <code>cin</code>
            ${this.$t('m.Where_is_the_input_and_the_output_answer_part_7')} <code>printf</code> ${this.$t('m.Where_is_the_input_and_the_output_answer_part_8')} <code>cout</code> ${this.$t('m.Where_is_the_input_and_the_output_answer_part_9')} <code>${this.$t('m.Runtime_Error')}</code>.
          </p>`
        },
        {
          question: this.$t('m.What_is_the_meaning_of_submission_execution_time'),
          answer: `<p>${this.$t('m.What_is_the_meaning_of_submission_execution_time_answer')}</p>`
        },
        {
          question: this.$t('m.How_Can_I_use_CPP_Int64'),
          answer: `<p>${this.$t('m.How_Can_I_use_CPP_Int64_answer_part_1')}<code>long long</code> ${this.$t('m.How_Can_I_use_CPP_Int64_answer_part_2')} <code>cin/cout</code> ${this.$t('m.or')} <code>%lld</code>, ${this.$t('m.using')}<code> __int64</code> ${this.$t('m.How_Can_I_use_CPP_Int64_answer_part_3')} <code>${this.$t('m.Compile_Error')}</code>.</p>`
        },
        {
          question: this.$t('m.Java_specifications'),
          answer: `<p>${this.$t('m.Java_specifications_answer_part_1')} <code>Main</code> ${this.$t('m.Java_specifications_answer_part_2')} <code>Main</code> ${this.$t('m.Java_specifications_answer_part_3')}</p>`
        },
        {
          question: this.$t('m.About_presentation_error'),
          answer: `<p>${this.$t('m.About_presentation_error_answer_part_1')} <b>${this.$t('m.last')}</b> ${this.$t('m.About_presentation_error_answer_part_2')} <code> ${this.$t('m.Wrong_Answer')}</code>.</p>`
        },
        {
          question: this.$t('m.How_to_report_bugs'),
          answer: `<p>${this.$t('m.How_to_report_bugs_answer_part_1')} <a href="https://github.com/QingdaoU/OnlineJudge">Github</a>
            ${this.$t('m.How_to_report_bugs_answer_part_2')}
          </p>`
        }
      ]
    }
  }
}
</script>

<style lang="less" scoped>
.faq-elegant {
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
.faq-panel {
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

/* FAQ 列表 */
.faq-list {
  .faq-item {
    padding: 24px;
    margin-bottom: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border-left: 4px solid #1e3a8a;
    transition: all 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f0f4f8;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
    }

    .faq-question {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 12px;

      .ivu-icon {
        font-size: 20px;
        color: #3b82f6;
      }
    }

    .faq-answer {
      padding-left: 32px;
      font-size: 15px;
      color: #64748b;
      line-height: 1.8;

      code {
        background: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        color: #1e3a8a;
      }

      a {
        color: #3b82f6;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
