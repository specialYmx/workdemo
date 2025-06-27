import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _770607e8 = () => interopDefault(import('..\\pages\\db\\index.vue' /* webpackChunkName: "pages/db/index" */))
const _44574020 = () => interopDefault(import('..\\pages\\knowledge\\index.vue' /* webpackChunkName: "pages/knowledge/index" */))
const _00c34124 = () => interopDefault(import('..\\pages\\updates\\index.vue' /* webpackChunkName: "pages/updates/index" */))
const _79926eb4 = () => interopDefault(import('..\\pages\\index.vue' /* webpackChunkName: "pages/index" */))
const _6d59e58a = () => interopDefault(import('..\\pages\\document-compare\\_id.vue' /* webpackChunkName: "pages/document-compare/_id" */))
const _1f63a353 = () => interopDefault(import('..\\pages\\document\\_id.vue' /* webpackChunkName: "pages/document/_id" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/db",
    component: _770607e8,
    name: "db"
  }, {
    path: "/knowledge",
    component: _44574020,
    name: "knowledge"
  }, {
    path: "/updates",
    component: _00c34124,
    name: "updates"
  }, {
    path: "/",
    component: _79926eb4,
    name: "index"
  }, {
    path: "/document-compare/:id?",
    component: _6d59e58a,
    name: "document-compare-id"
  }, {
    path: "/document/:id?",
    component: _1f63a353,
    name: "document-id"
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
