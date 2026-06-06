<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import GridCanvas from './GridCanvas.vue'
import config from '@/config.json'

const emit = defineEmits<{
  navigate: [page: string]
  home: []
}>()

const mainData = config.main
const cardInner = ref<HTMLElement>()

// 滚轮向上 → 回到首页
function onWheel(e: WheelEvent) {
  if (e.deltaY < 0) emit('home')
}

onMounted(() => {
  // 延迟淡入卡片
  setTimeout(() => {
    cardInner.value?.classList.add('in')
  }, 400)
  document.addEventListener('wheel', onWheel, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div class="content-main">
    <!-- 网格背景 Canvas -->
    <GridCanvas />

    <!-- 头像卡片 -->
    <div id="card">
      <div ref="cardInner" class="card-inner fade">
        <header>
          <img
            :src="mainData.avatar.link"
            :width="mainData.avatar.width"
            :height="mainData.avatar.height"
            alt="avatar"
          />
          <h1>{{ mainData.name }}</h1>
          <h2>{{ mainData.signature }}</h2>
        </header>

        <ul>
          <li>
            <a :href="mainData.ul.first.href" @click.prevent="$emit('navigate', 'about')">
              <i :class="'icon icon-' + mainData.ul.first.icon"></i>
              <span>{{ mainData.ul.first.text }}</span>
            </a>
          </li>
          <li>
            <a :href="mainData.ul.second.href" @click.prevent="$emit('navigate', 'projects')">
              <i :class="'icon icon-' + mainData.ul.second.icon"></i>
              <span>{{ mainData.ul.second.text }}</span>
            </a>
          </li>
          <li>
            <a :href="mainData.ul.third.href" @click.prevent="$emit('navigate', 'practice')">
              <i :class="'icon icon-' + mainData.ul.third.icon"></i>
              <span>{{ mainData.ul.third.text }}</span>
            </a>
          </li>
          <li>
            <a :href="mainData.ul.fourth.href" @click.prevent="$emit('navigate', 'contact')">
              <i :class="'icon icon-' + mainData.ul.fourth.icon"></i>
              <span>{{ mainData.ul.fourth.text }}</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-main {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 50;
  background: #060606;
}

/* ====== 卡片 ====== */
#card {
  position: relative;
  width: 100vw;
  height: 100vh;
  color: #93979e;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: width ease 0.5s, height ease 0.5s;
}

.card-inner {
  padding: 0;
  border: 0;
  width: 100%;
  max-width: 700px;
}

.card-inner header {
  margin-bottom: 40px;
}

.card-inner header img {
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.3);
  transition: 0.4s ease-in-out;
  z-index: 2;
  position: relative;
}

.card-inner header h1 {
  margin: 15px 15px 0px;
  color: #fff;
  font-size: 2rem;
  line-height: 1.2em;
  font-weight: 300;
  z-index: 2;
  position: relative;
}

.card-inner header h2 {
  color: #ccc;
  letter-spacing: 3px;
  font-size: 0.8rem;
  font-weight: lighter;
  z-index: 2;
  position: relative;
}

.card-inner ul {
  position: relative;
  margin: 0;
  list-style-type: none;
  display: inline-flex;
  width: 100%;
  justify-content: space-around;
  padding-bottom: 40px;
}

.card-inner ul li {
  z-index: 2;
  position: relative;
  display: inline-block;
  transition: all 0.2s;
  width: 100%;
  height: 100%;
}

.card-inner ul li a {
  color: #b6b6b6;
  transition: all 0.2s;
}

.card-inner ul li a:hover {
  color: #f6f6f6;
  text-shadow: 0 0 2px #f6f6f6;
}

@media screen and (max-width: 540px) {
  .card-inner header h1 {
    font-size: 1rem !important;
  }
  .card-inner header h2 {
    font-size: 0.8rem !important;
  }
  .card-inner ul li {
    font-size: 0.8rem !important;
  }
}
</style>
