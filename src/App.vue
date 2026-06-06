<script setup lang="ts">
import { ref } from 'vue'
import IntroPage from './components/IntroPage.vue'
import MainPage from './components/MainPage.vue'
import ContactPage from './components/ContactPage.vue'
import PracticePage from './components/PracticePage.vue'
import AboutPage from './components/AboutPage.vue'
import ProjectsPage from './components/ProjectsPage.vue'

type Page = 'intro' | 'main' | 'contact' | 'practice' | 'about' | 'projects'

const currentPage = ref<Page>('intro')
const direction = ref<'forward' | 'back'>('forward')

/** 进入子页面（main → contact/practice/about/projects） */
function goTo(page: Page) {
  direction.value = 'forward'
  currentPage.value = page
}

/** 从子页面返回 main */
function goBack() {
  direction.value = 'back'
  currentPage.value = 'main'
}

/** 从 main 滚轮向上回到首页 */
function goHome() {
  direction.value = 'back'
  currentPage.value = 'intro'
}
</script>

<template>
  <Transition :name="'slide-' + direction">
    <IntroPage
      v-if="currentPage === 'intro'"
      key="intro"
      @enter="goTo('main')"
    />
    <MainPage
      v-else-if="currentPage === 'main'"
      key="main"
      @navigate="goTo"
      @home="goHome"
    />
    <ContactPage
      v-else-if="currentPage === 'contact'"
      key="contact"
      @back="goBack"
    />
    <PracticePage
      v-else-if="currentPage === 'practice'"
      key="practice"
      @back="goBack"
    />
    <AboutPage
      v-else-if="currentPage === 'about'"
      key="about"
      @back="goBack"
    />
    <ProjectsPage
      v-else-if="currentPage === 'projects'"
      key="projects"
      @back="goBack"
    />
  </Transition>
</template>

<!-- Transition 样式不能用 scoped，因为 Vue 动态添加的 class 不受 scoped 控制 -->
<style>
/* ====== 前进动画（intro→main, main→子页面） ====== */
.slide-forward-leave-active {
  transition: transform 0.8s ease, opacity 0.8s ease;
}
.slide-forward-leave-to {
  transform: translateY(-100vh);
  opacity: 0;
}

.slide-forward-enter-active {
  transition: transform 0.8s ease, opacity 0.8s ease;
}
.slide-forward-enter-from {
  transform: translateY(100vh);
  opacity: 0;
}

/* ====== 返回动画（子页面→main） ====== */
.slide-back-leave-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}
.slide-back-leave-to {
  transform: translateY(100vh);
  opacity: 0;
}

.slide-back-enter-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}
.slide-back-enter-from {
  transform: translateY(-100vh);
  opacity: 0;
}
</style>
