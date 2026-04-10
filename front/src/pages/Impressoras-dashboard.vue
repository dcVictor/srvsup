<template>
   <div class="container-full">
    <Header title="Teste - Dashboard Impressoras" />
      <div class="dashboard">
   
    
    <Loading :isLoading="loading" message="Consultando impressoras" />
    
    <div class="printer-grid">
      <div v-for="printer in printers" :key="printer.id" class="printer-card">
        <h3 class ="printer-name">{{ printer.name }}</h3>
        <p><strong>Modelo:</strong> {{ printer.model }}</p>
        <p><strong>IP:</strong> {{ printer.ip }}</p>
        <p><strong>Páginas Impressas:</strong> {{ printer.pagesPrinted }}</p>
        
        <div class="toner-section">
          <p><strong>Nível de Toner:</strong> {{ printer.tonerLevel }}%</p>
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              :style="{ width: printer.tonerLevel + '%', backgroundColor: getTonerColor(printer.tonerLevel) }"
            ></div>
          </div>
        </div>

        <p class="status">
          Status: <span :class="printer.status">{{ formatStatus(printer.status) }}</span>
        </p>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Loading from '@/components/Loading.vue';

const printers = ref([]);
const loading = ref(true);

// Função para buscar dados da nossa API Node.js
const fetchPrinters = async () => {
  try {
    const response = await fetch('http://192.168.1.53:4174/api/printers');
    printers.value = await response.json();
  } catch (error) {
    console.error('Erro ao buscar impressoras:', error);
  } finally {
    loading.value = false;
  }
};

// Funções auxiliares para UI
const getTonerColor = (level) => {
  if (level > 50) return '#4caf50'; // Verde
  if (level > 15) return '#ff9800'; // Laranja
  return '#f44336'; // Vermelho
};

const formatStatus = (status) => {
  const statusMap = {
    'online': 'Online',
    'low_toner': 'Toner Baixo',
    'offline': 'Offline'
  };
  return statusMap[status] || status;
};

// Busca os dados quando o componente for montado
onMounted(() => {
  fetchPrinters();
  // Opcional: Atualizar a cada 60 segundos
  // setInterval(fetchPrinters, 60000); 
});
</script>

<style scoped>
/* Estilos básicos para o layout ficar apresentável */

.container-full {
  background-color: #f5f5f5;
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.system-header {
  background-color: #1a1a1a; /* Escuro conforme o print */
  color: #ff9800; /* Cor laranja do título '231 - Requisitar' */
  padding: 10px 20px;
  text-align: center;
  border-bottom: 4px solid var(--primary-green);
  font-size: 20px;
  font-weight: bold;
}

.dashboard { padding: 20px; font-family: sans-serif; }
.printer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.printer-card { border: 1px solid #ccc; border-radius: 8px; padding: 15px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.progress-bar-bg { width: 100%; background-color: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden; }
.progress-bar-fill { height: 100%; transition: width 0.5s ease-in-out; }
.online { color: green; font-weight: bold; }
.low_toner { color: orange; font-weight: bold; }
.offline { color: red; font-weight: bold; }
</style>