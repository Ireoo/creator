import Vue from 'vue'
import router from '@/router'
// import LandingPage from '@/components/LandingPage'
import App from '@/App'

describe('App.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      router,
      render: h => h(App),
    }).$mount()

    expect(vm.$el.querySelector('.title').textContent).to.contain('Welcome to your new project!')
  })
})
