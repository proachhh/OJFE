export function renderMarkdown (md) {
  if (!md) return ''

  let html = md

  html = html.replace(/&/g, '&amp;')
  html = html.replace(/</g, '&lt;')
  html = html.replace(/>/g, '&gt;')

  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`
  })

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

  html = html.replace(/^---+\s*$/gm, '<hr>')

  html = html.replace(/^(\s*[-*+]\s+.+(\n|$))+/gm, (match) => {
    const items = match.trim().split(/\n\s*/).filter(l => l)
    return '<ul>\n' + items.map(l => l.replace(/^\s*[-*+]\s+/, '').replace(/<\/?li>/g, '')).map(l => '<li>' + l + '</li>').join('\n') + '\n</ul>'
  })

  html = html.replace(/^(\s*\d+\.\s+.+(\n|$))+/gm, (match) => {
    const items = match.trim().split(/\n\s*/).filter(l => l)
    return '<ol>\n' + items.map(l => l.replace(/^\s*\d+\.\s+/, '')).map(l => '<li>' + l + '</li>').join('\n') + '\n</ol>'
  })

  html = html.replace(/\n{2,}/g, '</p><p>')
  html = html.replace(/\n/g, ' ')

  html = '<p>' + html + '</p>'

  html = html.replace(/<p><h([1-6])>/g, '<h$1>')
  html = html.replace(/<\/h([1-6])><\/p>/g, '</h$1>')
  html = html.replace(/<p><pre>/g, '<pre>')
  html = html.replace(/<\/pre><\/p>/g, '</pre>')
  html = html.replace(/<p><ul>/g, '<ul>')
  html = html.replace(/<\/ul><\/p>/g, '</ul>')
  html = html.replace(/<p><ol>/g, '<ol>')
  html = html.replace(/<\/ol><\/p>/g, '</ol>')
  html = html.replace(/<p><hr><\/p>/g, '<hr>')
  html = html.replace(/<p><\/p>/g, '')

  return html
}
