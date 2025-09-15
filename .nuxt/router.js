import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _486f1f76 = () => interopDefault(import('..\\pages\\crawlConfig\\index.vue' /* webpackChunkName: "pages/crawlConfig/index" */))
const _79a57578 = () => interopDefault(import('..\\pages\\crawlStatistics\\index.vue' /* webpackChunkName: "pages/crawlStatistics/index" */))
const _3c20d440 = () => interopDefault(import('..\\pages\\lawyerIndex\\index.vue' /* webpackChunkName: "pages/lawyerIndex/index" */))
const _f95945d8 = () => interopDefault(import('..\\pages\\lawyerKnowledge\\index.vue' /* webpackChunkName: "pages/lawyerKnowledge/index" */))
const _472a0619 = () => interopDefault(import('..\\pages\\lawyerUpdate\\index.vue' /* webpackChunkName: "pages/lawyerUpdate/index" */))
const _056e9ab0 = () => interopDefault(import('..\\pages\\manualReview\\index.vue' /* webpackChunkName: "pages/manualReview/index" */))
const _6dea137f = () => interopDefault(import('..\\pages\\taskHistory\\index.vue' /* webpackChunkName: "pages/taskHistory/index" */))
const _7f6b54ff = () => interopDefault(import('..\\pages\\lawyerKnowledge\\detail.vue' /* webpackChunkName: "pages/lawyerKnowledge/detail" */))
const _3669cc9a = () => interopDefault(import('..\\pages\\lawyerUpdate\\detail.vue' /* webpackChunkName: "pages/lawyerUpdate/detail" */))
const _4420b1eb = () => interopDefault(import('..\\pages\\manualReview\\detail.vue' /* webpackChunkName: "pages/manualReview/detail" */))
const _79926eb4 = () => interopDefault(import('..\\pages\\index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/crawlConfig",
    component: _486f1f76,
    name: "crawlConfig"
  }, {
    path: "/crawlStatistics",
    component: _79a57578,
    name: "crawlStatistics"
  }, {
    path: "/lawyerIndex",
    component: _3c20d440,
    name: "lawyerIndex"
  }, {
    path: "/lawyerKnowledge",
    component: _f95945d8,
    name: "lawyerKnowledge"
  }, {
    path: "/lawyerUpdate",
    component: _472a0619,
    name: "lawyerUpdate"
  }, {
    path: "/manualReview",
    component: _056e9ab0,
    name: "manualReview"
  }, {
    path: "/taskHistory",
    component: _6dea137f,
    name: "taskHistory"
  }, {
    path: "/lawyerKnowledge/detail",
    component: _7f6b54ff,
    name: "lawyerKnowledge-detail"
  }, {
    path: "/lawyerUpdate/detail",
    component: _3669cc9a,
    name: "lawyerUpdate-detail"
  }, {
    path: "/manualReview/detail",
    component: _4420b1eb,
    name: "manualReview-detail"
  }, {
    path: "/",
    component: _79926eb4,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
