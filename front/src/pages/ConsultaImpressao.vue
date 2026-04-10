<template>
  <div class="container-full">
    <Header title="45 - Consulta de Consumo por Período" />

    <div class="dashboard">
      <div class="filter-bar">
        <div class="kpi-container">
          <div class="kpi-card">
            <span class="kpi-label">Total Impresso no Período</span>
            <span class="kpi-value">{{ totalPeriodPages }}</span>
          </div>
        </div>

        <div class="actions">
          <div class="date-group">
            <select v-model="filterType" class="select-filter">
              <option value="ALL">TODAS AS IMPRESSORAS</option>
              <option value="ZAL">ALUGADAS (GMAIS - ZAL)</option>
              <option value="ZKL">ALUGADAS (KONICA - ZKL)</option>
              <option value="ZAP">PRÓPRIAS (ZAP)</option>
            </select>

            <input type="date" v-model="startDate" class="date-input" />
            <span class="date-separator">até</span>
            <input type="date" v-model="endDate" class="date-input" />
            
            <button class="btn-filter" @click="fetchHistory">
              FILTRAR
            </button>

            <button class="btn-refresh" @click="handleFullRefresh" title="Sincronizar leituras atuais agora">
              ATUALIZAR DADOS
            </button>
          </div>
        </div>
      </div>

      <Loading :isLoading="loading" message="Processando informações..." />

      <div class="printer-grid">
        <table class="printer-table">
          <thead>
            <tr>
              <th>Impressora</th>
              <th class="text-center">Código Impressora</th>
              <th class="text-center">Local</th>
              <th class="text-center">Leitura Inicial</th>
              <th class="text-center">Leitura Final</th>
              <th class="text-center">Total Produzido</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredHistory.length === 0">
              <td colspan="6" class="empty-state">Nenhuma impressora encontrada para os filtros selecionados.</td>
            </tr>
            <tr v-for="log in filteredHistory" :key="log.codimp">
              <td class="bold">{{ log.nome_impressora }}</td>
              <td class="text-center">{{ log.codigo || '---' }}</td>
              <td class="bold text-center">{{ log.local || 'Não definido' }}</td>
              <td class="text-center info-cell" :title="'Coletado em: ' + formatDate(log.primeira_leitura)">
                {{ log.leitura_inicial }}
              </td>
              <td class="text-center info-cell" :title="'Coletado em: ' + formatDate(log.ultima_leitura)">
                {{ log.leitura_final }}
              </td>
              <td class="bold text-center result-cell">
                {{ calculateDifference(log.leitura_inicial, log.leitura_final) }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="table-footer">
          <span class="row-counter">Registros listados: {{ filteredHistory.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Loading from '@/components/Loading.vue';

const history = ref([]);
const loading = ref(true);
const filterType = ref('ALL');

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substr(0, 10);
const today = now.toISOString().substr(0, 10);

const startDate = ref(firstDay);
const endDate = ref(today);

const filteredHistory = computed(() => {
  if (filterType.value === 'ALL') return history.value;
  return history.value.filter(item => item.codigo && item.codigo.startsWith(filterType.value));
});

const handleFullRefresh = async () => {
  loading.value = true;
  try {
    const responseRefresh = await fetch('http://192.168.1.53:4174/api/printersrefresh');
    if (responseRefresh.ok) await fetchHistory(); 
  } catch (error) {
    console.error('Erro no refresh total:', error);
  } finally {
    loading.value = false;
  }
};

const fetchHistory = async () => {
  if (!loading.value) loading.value = true; 
  try {
    const response = await fetch(`http://192.168.1.53:4174/api/historico?dataInicial=${startDate.value}&dataFinal=${endDate.value}`);
    history.value = await response.json();
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
  } finally {
    loading.value = false;
  }
};

const calculateDifference = (inicial, final) => {
  const result = Number(final) - Number(inicial);
  return isNaN(result) ? 0 : result;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Data não disponível';
  return new Date(dateString).toLocaleString('pt-BR');
};

const totalPeriodPages = computed(() => {
  return filteredHistory.value.reduce((acc, curr) => acc + calculateDifference(curr.leitura_inicial, curr.leitura_final), 0);
});

onMounted(fetchHistory);
</script>

<style scoped>
/* Mantido o seu CSS original */
.container-full {
  background: linear-gradient(180deg, #077e46 0%, #045d33 250px, #045d33 251px, #023b21 100%);
  background-attachment: fixed;
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.dashboard {
  max-width: 2200px; 
  margin: 0 auto;
  padding: 15px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  border-left: 5px solid #43a047;
}

.kpi-label { font-size: 11px; color: #757575; text-transform: uppercase; font-weight: bold; }
.kpi-value { font-size: 24px; color: #045d33; font-weight: bold; }

.actions { display: flex; gap: 10px; }
.date-group { display: flex; align-items: center; gap: 10px; background: #f5f5f5; padding: 8px 15px; border-radius: 6px; }

.select-filter { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; background: white; font-weight: bold; color: #444; outline: none; cursor: pointer; }
.date-input { padding: 6px; border: 1px solid #ccc; border-radius: 4px; }

.btn-filter { background-color: #1976d2; color: white; border: none; padding: 10px 18px; border-radius: 4px; font-weight: bold; cursor: pointer; }
.btn-refresh { background-color: #43a047; color: white; border: none; padding: 10px 18px; border-radius: 4px; font-weight: bold; cursor: pointer; }

.printer-table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd; }
.printer-table th { background-color: #f8f9fa; color: #333; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; padding: 15px; border: 1px solid #ddd; }
.printer-table td { padding: 12px 15px; border: 1px solid #eee; }
.printer-table tbody tr:nth-child(even) { background-color: #fafafa; }
.printer-table tbody tr:hover { background-color: #f1f8e9; }

/* Estilo do Contador de Linhas */
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 5px;
}

.row-counter {
  font-size: 15px;
  color: #888;
  font-style: italic;
}

.text-center { text-align: center !important; }
.bold { font-weight: bold; }
.result-cell { color: #1c66b1; font-size: 1.1rem; }
.info-cell { cursor: pointer; text-decoration: underline dotted #bbb; }
.empty-state { text-align: center; padding: 40px; color: #999; }
</style>