<template>
  <div class="monitoramento-container">
    
    <div class="cameras-wrapper">
      <div class="cameras-grid">
        <div 
          v-for="camera in cameras" 
          :key="camera.id" 
          class="camera-item"
          :class="{ 'camera-expandida': cameraExpandida && cameraExpandida.id === camera.id }"
          @click="toggleFullscreen(camera)"
        >
          <iframe 
            :src="`${camera.url}?autoplay=true&muted=true`"
            class="camera-iframe"
            :title="camera.nome"
          ></iframe>
          
          <div class="camera-label">{{ camera.nome }}</div>

          <div 
            v-if="cameraExpandida && cameraExpandida.id === camera.id" 
            class="btn-fechar-fullscreen"
            @click.stop="toggleFullscreen(camera)"
          >
            ✖ FECHAR
          </div>
        </div>
      </div>

      <div v-if="manterAberto" class="badge-alerta">
        ● MODO MANTER ABERTO ATIVO
      </div>
    </div>

    <div class="painel-controle">
      <div class="painel-conteudo">
        
        <div class="cabecalho">
          <h2>PORTARIA</h2>
          <h3>Catraca Entrada - Matriz</h3>
        </div>

        <div class="divisor"></div>

        <div class="controles">
          <button 
            class="btn-liberar" 
            :class="{ 'btn-desativado': manterAberto }"
            :disabled="manterAberto"
            @click="abrirPorta('catraca5')"
          >
            {{ manterAberto ? 'PORTA ABERTA' : 'LIBERAR ENTRADA' }}
          </button>

          <label class="toggle-container" :class="{ 'toggle-ativo': manterAberto }">
            <div class="switch">
              <input type="checkbox" v-model="manterAberto" />
              <span class="slider"></span>
            </div>
            <span class="toggle-label">MANTER ABERTO</span>
          </label>
        </div>

        <div class="rodape">
          Sistema de Segurança - Zagonel
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="snackbarOpen" class="snackbar" :class="error ? 'snackbar-erro' : 'snackbar-sucesso'">
        {{ error ? `Erro: ${error}` : "Catraca Liberada!" }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import api from '../services/api.js' 

// --- ESTADOS ---
const snackbarOpen = ref(false);
const error = ref(null);
const manterAberto = ref(false);
const cameraExpandida = ref(null); // Guarda qual câmera está em tela cheia
let intervalo = null;
let snackbarTimeout = null;

// --- CONFIGURAÇÃO DAS 8 CÂMERAS ---
const baseUrl = "http://192.168.1.53/mediamtx";
const cameras = ref([
  { id: 1, nome: "Câmera 1", url: `${baseUrl}/cam1` },
  { id: 2, nome: "Câmera 2", url: `${baseUrl}/cam2` },
  { id: 3, nome: "Câmera 3", url: `${baseUrl}/cam3` },
  { id: 4, nome: "Câmera 4", url: `${baseUrl}/cam4` },
  { id: 5, nome: "Câmera 5", url: `${baseUrl}/cam5` },
  { id: 6, nome: "Câmera 6", url: `${baseUrl}/cam6` },
  { id: 7, nome: "Câmera 7", url: `${baseUrl}/cam7` },
  { id: 8, nome: "Câmera 8", url: `${baseUrl}/cam8` },
]);

// --- FUNÇÕES ---
const mostrarSnackbar = () => {
  snackbarOpen.value = true;
  if (snackbarTimeout) clearTimeout(snackbarTimeout);
  snackbarTimeout = setTimeout(() => {
    snackbarOpen.value = false;
  }, 4000);
};

const abrirPorta = async (idCatraca) => {
  try {
    error.value = null;
    await api.post('/api/abrir-porta', { idCatraca });
    
    if (!manterAberto.value) {
      mostrarSnackbar();
    }
  } catch (err) {
    error.value = err.message || "Falha de comunicação";
    mostrarSnackbar();
    manterAberto.value = false; 
  }
};

const toggleFullscreen = (camera) => {
  // Se a câmera clicada já for a expandida, nós a fechamos (setamos para null)
  if (cameraExpandida.value && cameraExpandida.value.id === camera.id) {
    cameraExpandida.value = null;
  } else {
    // Caso contrário, expande a câmera clicada
    cameraExpandida.value = camera;
  }
};

// --- EFEITOS ---
watch(manterAberto, (novoValor) => {
  if (novoValor) {
    abrirPorta('catraca5'); 
    intervalo = setInterval(() => {
      abrirPorta('catraca5');
    }, 3000);
  } else {
    if (intervalo) clearInterval(intervalo);
  }
});

onBeforeUnmount(() => {
  if (intervalo) clearInterval(intervalo);
  if (snackbarTimeout) clearTimeout(snackbarTimeout);
});
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.monitoramento-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

/* --- LADO ESQUERDO: CÂMERAS --- */
.cameras-wrapper {
  flex: 1;
  position: relative;
  background-color: #000;
  padding: 2px; /* Reduzido para deixar o grid maior */
}

.cameras-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); 
  grid-template-rows: repeat(2, 1fr);    
  gap: 2px; /* Espaçamento mínimo estilo monitor de segurança */
  width: 100%;
  height: 100%;
}

.camera-item {
  position: relative;
  background-color: #111;
  overflow: hidden;
  border: 1px solid #222;
  cursor: pointer; /* Cursor de mãozinha para indicar clique */
  transition: border-color 0.2s;
}

/* Efeito de hover suave nas câmeras */
.camera-item:hover {
  border-color: #1976d2;
}

/* Classe dinâmica para a câmera em Tela Cheia */
.camera-expandida {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 50; /* Fica acima das outras câmeras */
  border: none;
  background-color: #000;
}

.camera-iframe {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none; /* Mantido para não bloquear o clique do Vue */
}

.camera-label {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  z-index: 2;
}

.btn-fechar-fullscreen {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 0, 0, 0.8);
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  z-index: 60;
  transition: background-color 0.2s;
}

.btn-fechar-fullscreen:hover {
  background-color: rgba(255, 0, 0, 1);
}

.badge-alerta {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(255, 0, 0, 0.8);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: bold;
  animation: pulse 1.5s infinite;
  z-index: 100; /* Fica acima de tudo, inclusive da câmera expandida */
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* --- LADO DIREITO: PAINEL --- */
.painel-controle {
  width: 350px;
  background-color: #1a1a1a;
  border-left: 2px solid #333;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 32px;
  z-index: 10;
}

.painel-conteudo {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.cabecalho { text-align: center; }
.cabecalho h2 { color: #fff; font-weight: bold; margin-bottom: 8px; font-size: 2rem; }
.cabecalho h3 { color: #aaa; text-transform: uppercase; font-size: 1rem; font-weight: normal; }

.divisor { border-bottom: 1px solid #333; width: 100%; }

.controles { display: flex; flex-direction: column; align-items: center; gap: 16px; }

.btn-liberar {
  height: 120px;
  width: 100%;
  font-size: 1.4rem;
  color: #fff;
  background-color: #1976d2;
  font-weight: bold;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-liberar:hover:not(:disabled) { background-color: #1565c0; }
.btn-desativado { background-color: #afacacef !important; cursor: not-allowed; }

.toggle-container {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 10px 15px; border-radius: 8px; width: 100%; cursor: pointer;
  transition: background-color 0.3s;
}
.toggle-ativo { background-color: rgba(211, 47, 47, 0.1); }

.switch { position: relative; display: inline-block; width: 40px; height: 20px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc; transition: .4s; border-radius: 34px;
}
.slider:before {
  position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
  background-color: white; transition: .4s; border-radius: 50%;
}
input:checked + .slider { background-color: #d32f2f; }
input:checked + .slider:before { transform: translateX(20px); }

.toggle-label { color: #fff; font-weight: bold; }

.rodape { color: #666; text-align: center; font-size: 0.8rem; margin-top: 16px; }

/* --- SNACKBAR (Notificações) --- */
.snackbar {
  position: fixed; top: 20px; right: 20px; padding: 16px 24px; border-radius: 8px;
  color: #fff; font-weight: bold; z-index: 1000; box-shadow: 0px 4px 6px rgba(0,0,0,0.3);
}
.snackbar-sucesso { background-color: #2e7d32; }
.snackbar-erro { background-color: #d32f2f; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-20px); }
</style>