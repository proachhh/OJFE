const PINYIN_INITIALS = 'ABCDEFGHIJKLMNOPQRSTWXYZ'
const INITIAL_BOUNDARIES = {
  'A': '阿', 'B': '八', 'C': '擦', 'D': '大', 'E': '鹅', 'F': '发',
  'G': '嘎', 'H': '哈', 'J': '击', 'K': '喀', 'L': '拉', 'M': '妈',
  'N': '拿', 'O': '哦', 'P': '啪', 'Q': '七', 'R': '然', 'S': '撒',
  'T': '他', 'W': '挖', 'X': '西', 'Y': '压', 'Z': '匝'
}

export function getPinyinFirstLetter (title) {
  if (!title) return '#'
  const ch = title.charAt(0)
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase()
  const code = ch.charCodeAt(0)
  if (code < 0x4e00 || code > 0x9fff) return '#'

  try {
    for (let i = 0; i < PINYIN_INITIALS.length; i++) {
      const initial = PINYIN_INITIALS[i]
      const refChar = INITIAL_BOUNDARIES[initial]
      if (!refChar) continue
      const nextInitial = PINYIN_INITIALS[i + 1]
      const nextRefChar = nextInitial ? INITIAL_BOUNDARIES[nextInitial] : null
      if (ch.localeCompare(refChar, 'zh-CN') >= 0 && (!nextRefChar || ch.localeCompare(nextRefChar, 'zh-CN') < 0)) {
        return initial
      }
    }
  } catch (e) {
    // localeCompare fallback
  }
  return '#'
}
