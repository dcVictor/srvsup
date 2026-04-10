<template>
  <div class="container-full">
    <Header title="Teste - Gerenciamento Impressoras" />
    <Loading :isLoading="loading" message="Consultando impressoras" />
    <div class="dashboard">
  
      
      <div class="printer-grid">
        <table class="printer-table">
          <thead>
            <tr>
              <th>Impressora</th>
              <th>Modelo</th>
              <th>IP</th>
              <th>Páginas</th>
              <th>Nível de Toner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="printer in printers" :key="printer.id">
              <td class="bold">{{ printer.name }}</td>
              <td>{{ printer.model }}</td>
              <td>{{ printer.ip }}</td>
              <td>{{ printer.pagesPrinted }}</td>
              <td>
                <div class="toner-container">
                  <div class="progress-bar-bg">
                    <div 
                      class="progress-bar-fill" 
                      :style="{ width: printer.tonerLevel + '%', backgroundColor: getTonerColor(printer.tonerLevel) }"
                    ></div>
                  </div>
                  <span class="toner-text">{{ printer.tonerLevel }}%</span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', printer.status]">
                  {{ formatStatus(printer.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button class="btn-add-header" @click="showModal = true">
          <span class="icon">+</span> ADICIONAR IMPRESSORA
        </button>
    </div>

  
  

    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <button class="modal-close-btn" @click="closeModal">x</button>
          <GerenciamentoImpressoras @updated="fetchPrinters" />
        </div>
      </div>
      
    </Transition>
  </div>

  
</template>

<script setup>
import { ref, onMounted } from 'vue';
import GerenciamentoImpressoras from '@/components/GerenciamentoImpressoras.vue'
import Header from '@/components/Header.vue';
import Loading from '@/components/Loading.vue';

const printers = ref([]);
const loading = ref(true);
const showModal = ref(false);

const closeModal = () => {
  showModal.value = false;
};

const fetchPrinters = async () => {
  try {
    const response = await fetch('http://192.168.1.53:3000/api/printers');
    printers.value = await response.json();
  } catch (error) {
    console.error('Erro ao buscar impressoras:', error);
  } finally {
    loading.value = false;
  }
};

const getTonerColor = (level) => {
  if (level > 50) return '#4caf50'; 
  if (level > 15) return '#ff9800'; 
  return '#f44336'; 
};

const formatStatus = (status) => {
  const statusMap = {
    'online': 'Online',
    'low_toner': 'Toner Baixo',
    'offline': 'Offline'
  };
  return statusMap[status] || status;
};

onMounted(() => {
  fetchPrinters();
});
</script>

<style scoped>
.container-full {
  /* Fundo verde degradê conforme a imagem */
  background: linear-gradient(180deg, #077e46 0%, #045d33 250px, #045d33 251px, #023b21 100%);
  background-attachment: fixed;
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

/* Fundo escurecido que cobre a tela toda */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6); /* Preto com 60% de transparência */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* Garante que fique acima de headers e modais */
  backdrop-filter: blur(4px); /* Efeito de desfoque no fundo */
}

/* A caixinha branca do Popup */
.loading-popup {
  background: white;
  padding: 30px 50px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  border-top: 4px solid #bbbaba; /* Detalhe em laranja conforme seu header */
}

.loading-popup p {
  margin-top: 15px;
  color: #333;
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Spinner animado com as cores do seu sistema */
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #43a047; /* Verde */
  border-right: 5px solid #a3a3a3; /* Laranja */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.icon{
  display: flex;
  align-items: center;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
}

.btn-add-header {
  background-color: #43a047;
  color: white;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  margin-left: 10px;
  

}

.btn-add-header:hover { background-color: #2e7d32; }

.dashboard {  max-width: 14000px; margin: 0 auto; }

.printer-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  font-size: 0.9rem;
}

.printer-table th {
  text-align: left;
  padding: 12px 15px;
  border-bottom: 1px solid #e0e0e0;
  color: #757575;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.printer-table td { padding: 12px 15px; border-bottom: 1px solid #eee; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: #fff;
  
  border-radius: 8px;
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
   right: 15px;
  background: none; border: none;
  font-size: 30px; cursor: pointer; color: #ffffff;
}

/* Transição suave do modal */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Status e Toner (mantidos do original) */
.toner-container { display: flex; align-items: center; gap: 10px; }
.progress-bar-bg { flex-grow: 1; max-width: 100px; background-color: #eee; height: 8px; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; transition: width 0.6s ease; }
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
.online { color: #2e7d32; background: #e8f5e9; }
.low_toner { color: #ef6c00; background: #fff3e0; }
.offline { color: #c62828; background: #ffebee; }
</style>