<template>
  <header class="system-header">
    <div class="header-container">
      <div class="menu-section">
        <button class="menu-btn" @click="isOpen = !isOpen">
          <span class="menu-icon">☰</span>
          MENU
        </button>
        
        <Transition name="slide">
          <div v-if="isOpen" class="dropdown-menu" @click="isOpen = false">
            <router-link to="/impressorasdashboard" class="menu-item">Painel Monitoramento</router-link>
            <router-link to="/impressoras" class="menu-item">Gerenciar Impressoras</router-link>
            <router-link to="/consultaimpressao" class="menu-item">Consulta de Consumo</router-link>
          </div>
        </Transition>
      </div>

      <div class="title-section">
        <span class="page-title">{{ title }}</span>
      </div>

      <div class="empty-section"></div>
    </div>
  </header>
  
  <div v-if="isOpen" class="menu-overlay" @click="isOpen = false"></div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  title: {
    type: String,
    required: true
  }
});

const isOpen = ref(false);
</script>

<style scoped>
.system-header {
  background-color: #1a1a1a;
  color: #ff9800;
  padding: 0 20px;
  height: 60px;
  position: relative;
  z-index: 10001;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 100%;
}

.title-section {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.menu-section, .empty-section {
  flex: 0 0 150px; /* Largura fixa para os lados para garantir o centro */
}

.menu-btn {
  background: #333;
  color: #fff;
  border: 1px solid #444;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
}

.menu-btn:hover {
  background: #444;
}

.dropdown-menu {
  position: absolute;
  top: 65px;
  left: 20px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  width: 250px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-item {
  padding: 15px 20px;
  color: #eee;
  text-decoration: none;
  border-bottom: 1px solid #333;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #ff9800;
  color: #1a1a1a;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
}

/* Transição do Menu */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>