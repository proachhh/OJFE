import Vue from 'vue'

const chatState = new Vue({
  data () {
    return {
      messages: [],
      aiModel: 'agent',
      inputText: ''
    }
  }
})

export default chatState
