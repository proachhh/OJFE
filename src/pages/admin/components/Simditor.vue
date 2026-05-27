<template>
  <textarea ref="editor"></textarea>
</template>

<script>
  import Simditor from 'tar-simditor'
  import 'tar-simditor/styles/simditor.css'
  import 'tar-simditor-markdown'
  import 'tar-simditor-markdown/styles/simditor-markdown.css'
  import './simditor-file-upload'

  export default {
    name: 'Simditor',
    props: {
      toolbar: {
        type: Array,
        default: () => ['title', 'bold', 'italic', 'underline', 'fontScale', 'color', 'ol', 'ul', '|', 'blockquote', 'code', 'link', 'table', 'image', 'uploadfile', 'hr', '|', 'indent', 'outdent', 'alignment', '|', 'markdown']
      },
      value: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        editor: null,
        currentValue: this.value
      }
    },
    mounted () {
      this.editor = new Simditor({
        textarea: this.$refs.editor,
        toolbar: this.toolbar,
        pasteImage: true,
        markdown: false,
        upload: {
          url: '/api/admin/upload_image/',
          params: null,
          fileKey: 'image',
          connectionCount: 3,
          leaveConfirm: this.$i18n.t('m.Uploading_is_in_progress')
        },
        allowedStyles: {
          span: ['color']
        }
      })
      this.editor.on('valuechanged', (e, src) => {
        this.currentValue = this.editor.getValue()
      })
      this.editor.on('decorate', (e, src) => {
        this.currentValue = this.editor.getValue()
      })

      this.editor.setValue(this.value)
    },
    methods: {
      parseLatex () {
        const el = this.editor.body
        const html = el.innerHTML
        if (!html || !html.trim()) {
          this.$Message && this.$Message.info('编辑器内容为空')
          return
        }
        const processed = this.processLatex(html)
        if (processed !== html) {
          el.innerHTML = processed
          this.editor.setValue(processed)
          this.$Message && this.$Message.success('LaTeX 公式解析完成')
        } else {
          this.$Message && this.$Message.info('未检测到 LaTeX 公式')
        }
      },
      processLatex (text) {
        const placeholders = []
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
          placeholders.push(inner)
          return '@@LPH' + (placeholders.length - 1) + '@@'
        })
        text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
        text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
        text = text.replace(/(^|[^$@])\$(?!\$)([^$\n]+?)\$(?!\$|$|[0-9])/g, '$1$$$2$$')

        const tagPlaceholders = []
        text = text.replace(/(<[^>]+>)/g, (match) => {
          tagPlaceholders.push(match)
          return '@@TAG' + (tagPlaceholders.length - 1) + '@@'
        })

        const knownCmds = 'times|cdot|frac|sum|int|sqrt|leq|geq|le|ge|alpha|beta|gamma|delta|pi|sigma|omega|lambda|mu|pm|to|rightarrow|Rightarrow|leftarrow|Leftarrow|leftrightarrow|Leftrightarrow|forall|exists|in|notin|subset|subseteq|supset|supseteq|cup|cap|infty|partial|nabla|approx|equiv|neq|propto|sim|ldots|cdots|vdots|ddots|angle|triangle|oplus|otimes|odot|circ|text|mathbf|mathit|mathrm|dfrac|tfrac|binom|bmod|pmod|overline|underline|overrightarrow|overleftarrow|hat|tilde|bar|vec|dot|ddot|not|neg|land|lor|vdash|models|mid|parallel|perp|ast|star|diamond|bullet|div|mod|wedge|vee|bigcirc|bigtriangleup|bigtriangledown|triangleright|triangleleft|sqcap|sqcup|doublecup|doublecap|displaystyle|textstyle|lim|max|min|sup|inf|limsup|liminf|arg|deg|dim|hom|ker|Pr|det|gcd|lcm|log|ln|lg|exp|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth'
        const cmdRe = new RegExp('\\\\(' + knownCmds + ')(?![a-zA-Z])', 'g')
        const mathChars = /^[a-zA-Z0-9_\{\}\^\\,\s\.\-\+\=\<\>\|\(\)\[\]\/\'\*]+$/
        const ranges = []
        let m
        while ((m = cmdRe.exec(text)) !== null) {
          let start = m.index
          let end = m.index + m[0].length
          while (start > 0 && mathChars.test(text[start - 1]) && text.substring(start - 4, start) !== '@@LP') start--
          while (end < text.length && mathChars.test(text[end]) && text.substring(end, end + 3) !== '@@') end++
          let merged = false
          for (let i = ranges.length - 1; i >= 0; i--) {
            const r = ranges[i]
            if (start <= r.end && end >= r.start) {
              r.start = Math.min(r.start, start)
              r.end = Math.max(r.end, end)
              merged = true
              break
            }
          }
          if (!merged) ranges.push({ start, end })
        }
        if (ranges.length === 0) {
          text = text.replace(/@@TAG(\d+)@@/g, (m, idx) => tagPlaceholders[parseInt(idx)])
          text = text.replace(/@@LPH(\d+)@@/g, (m, idx) => '$$' + placeholders[parseInt(idx)] + '$$')
          return text
        }

        ranges.sort((a, b) => a.start - b.start)
        let rst = ''
        let pos = 0
        for (const r of ranges) {
          if (r.start > pos) rst += text.substring(pos, r.start)
          const fragment = text.substring(r.start, r.end).trim()
          if (fragment) rst += '$$' + fragment + '$$'
          pos = r.end
        }
        if (pos < text.length) rst += text.substring(pos)
        text = rst

        text = text.replace(/@@TAG(\d+)@@/g, (m, idx) => tagPlaceholders[parseInt(idx)])
        text = text.replace(/@@LPH(\d+)@@/g, (m, idx) => '$$' + placeholders[parseInt(idx)] + '$$')
        return text
      }
    },
    watch: {
      'value' (val) {
        if (this.currentValue !== val) {
          this.currentValue = val
          this.editor.setValue(val)
        }
      },
      'currentValue' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.$emit('change', newVal)
          this.$emit('input', newVal)
        }
      }
    }
  }
</script>

<style lang="less" scoped>
</style>
