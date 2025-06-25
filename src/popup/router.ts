import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
