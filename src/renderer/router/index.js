import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/pages/Main.vue'
import Register from '@/pages/register'
import { checkRegisteStatus } from '@/lib/leancloud'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: Main,
      async beforeEnter(to, from, next) {
        console.log('checkRegisteStatus')
        const registerStatus = await checkRegisteStatus()
        console.log('registerStatus', registerStatus)
        if (registerStatus) {
          next()
        } else {
          next('/register')
        }
      },
    }, {
      path: '/register',
      name: 'register',
      component: Register,
    },
  ],
})
