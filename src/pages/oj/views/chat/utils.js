export function formatAgentResponse (agentData) {
  const intent = agentData.intent

  if (agentData.error) {
    return { content: `❌ **出错了**：${agentData.error}` }
  }

  if (intent === 'resource' && agentData.content) {
    const content = typeof agentData.content === 'string'
      ? agentData.content
      : JSON.stringify(agentData.content, null, 2)
    return { content }
  }

  if (intent === 'recommend' && agentData.recommendations && agentData.recommendations.length) {
    let content = '**📋 为您推荐以下题目：**\n\n'
    agentData.recommendations.slice(0, 10).forEach((r, i) => {
      const diffEmoji = r.difficulty === 'High' ? '🔴' : r.difficulty === 'Mid' ? '🟡' : '🟢'
      content += `**${i + 1}.** [${r.title}](/problem/${r._id}) ${diffEmoji} \`${r.difficulty}\`  \n> ${r.reason}\n\n`
    })
    content += `\n_共 ${agentData.total || agentData.recommendations.length} 条推荐_`
    return { content }
  }

  if (intent === 'recommend') {
    return { content: '暂未找到合适的推荐题目，请多刷几道题后再试试。' }
  }

  if (intent === 'learning_path' && agentData.error) {
    return { content: `❌ 路径规划失败：${agentData.error}\n\n你可以尝试更换目标知识点，或者先完成学习画像引导。` }
  }

  if (intent === 'learning_path' && agentData.path_plan && agentData.path_plan.length) {
    const total = agentData.path_plan.length
    return { content: `**🗺️ 学习路径：${agentData.start || ''} → ${agentData.goal || ''}**` + (agentData.fallback ? ' *(备选路径)*' : '') + `\n\n共 ${total} 个知识节点，详情请查看下方的路径规划。` }
  }

  if (intent === 'hint' && agentData.hint) return { content: agentData.hint }
  if (intent === 'hint' && agentData.content) return { content: agentData.content }
  if (intent === 'analyze_error' && agentData.analysis) return { content: agentData.analysis }

  if (intent === 'profile_onboarding') {
    return { content: `**${agentData.question || '请完成画像引导'}**\n\n*(第 ${agentData.step || '?'}/${agentData.total_steps || '?'} 步)*\n\n你可以在这里继续回答，或者前往 [学习画像](/profile-onboarding) 页面完成引导。` }
  }

  if (intent === 'profile') {
    return { content: agentData.message || '画像已更新。' }
  }

  if (intent === 'general') {
    return { content: '抱歉，我没太明白你的意思。你可以试试问我：\n- 📚 推荐题目\n- 🗺️ 规划学习路径\n- 📝 生成练习题\n- 💡 解题提示\n- 🔍 分析错误' }
  }

  const content = agentData.message || JSON.stringify(agentData, null, 2)
  return { content }
}

export function extractAgentDisplay (agentData) {
  const intent = agentData.intent
  if (intent === 'learning_path' && agentData.path_plan && agentData.path_plan.length) {
    return {
      displayType: 'path_plan',
      displayData: {
        nodes: agentData.path_plan,
        start: agentData.start || '',
        goal: agentData.goal || '',
        fallback: agentData.fallback || false
      }
    }
  }
  return { displayType: null, displayData: null }
}
