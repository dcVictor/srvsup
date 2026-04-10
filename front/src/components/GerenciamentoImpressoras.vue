<template>
  <div class="container-full">
    <header class="main-header">
      <h2>Gerenciamento de Impressoras</h2>
    </header>

    <table class="modern-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome / Setor</th>
                <th>Endereço IP</th>
                <th>Localização Física</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="printers.length === 0">
                <td colspan="5" class="empty-state">Carregando impressoras...</td>
              </tr>
              <tr v-for="printer in printers" :key="printer.codimp">
                <td class="bold">{{ printer.codigo || '---' }}</td>
                <td class="bold">{{ printer.nome }}</td>
                <td>{{ printer.ip }}</td>
                <td class="sub-text">{{ printer.local || 'Não definido' }}</td>
                <td class="row-actions text-center">
                  <button class="action-btn edit" @click="openModal(printer)" title="Editar">✏️</button>
                  <button class="action-btn delete" @click="deletePrinter(printer.codimp)" title="Excluir">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>

    <div class="dashboard-body">
      <div class="top-bar">
        <div> 
        <button class="btn-new" @click="openModal()">
          <span class="icon">+</span> NOVA IMPRESSORA
        </button>

        </div>
      </div>

  
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header" :class="{ 'edit-mode': isEditing }">
          <h2>{{ isEditing ? 'Editar Impressora' : 'Cadastrar Impressora' }}</h2>
          <button class="close-x" @click="closeModal">×</button>
        </header>

        <form @submit.prevent="savePrinter" class="printer-form">
          <div class="form-grid">
            <div class="field-container">
              <label class="field-label">Nome / Setor</label>
              <input type="text" v-model="form.nome" placeholder="Ex: Financeiro" required />
            </div>

            <div class="field-container">
              <label class="field-label">Endereço IP</label>
              <input type="text" v-model="form.ip" placeholder="192.168..." required />
            </div>

            <div class="field-container">
              <label class="field-label">Marca</label>
              <select v-model="form.codmarca" required>
                <option value="" disabled>Selecione...</option>
                <option v-for="marca in marcas" :key="marca.codmarca" :value="marca.codmarca">
                  {{ marca.nomemarca }}
                </option>
              </select>
            </div>

            <div class="field-container">
              <label class="field-label">Código</label>
              <input type="text" v-model="form.codigo" placeholder="Ex: ZALIMP-01" />
            </div>

            <div class="field-container full-width">
              <label class="field-label">Localização Física (Detalhada)</label>
              <input type="text" v-model="form.local" placeholder="Ex: B1-02" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeModal">CANCELAR</button>
            <button type="submit" class="btn-save" :disabled="isLoading">
              {{ isLoading ? 'PROCESSANDO...' : 'SALVAR' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_URL = 'http://192.168.1.12:3000/api';

const marcas = ref([]);
const printers = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);

const form = ref({
  codimp: null,
  nome: '',
  ip: '',
  codmarca: '',
  local: '',
  codigo: ''
});

const fetchMarcas = async () => {
  const res = await fetch(`${API_URL}/marcas`);
  if (res.ok) marcas.value = await res.json();
};

const fetchPrinters = async () => {
  const res = await fetch(`${API_URL}/cadimp`);
  if (res.ok) printers.value = await res.json();
};

const openModal = (printer = null) => {
  if (printer) {
    form.value = { ...printer };
    isEditing.value = true;
  } else {
    resetForm();
    isEditing.value = false;
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const savePrinter = async () => {
  isLoading.value = true;
  try {
    const url = isEditing.value ? `${API_URL}/cadimp/${form.value.codimp}` : `${API_URL}/cadimp`;
    const response = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });

    if (response.ok) {
      await fetchPrinters();
      closeModal();
    }
  } catch (error) {
    alert("Erro ao salvar dados.");
  } finally {
    isLoading.value = false;
  }
};

const deletePrinter = async (codimp) => {
  if (confirm('Deseja realmente excluir esta impressora?')) {
    await fetch(`${API_URL}/cadimp/${codimp}`, { method: 'DELETE' });
    fetchPrinters();
  }
};

const resetForm = () => {
  form.value = { codimp: null, nome: '', ip: '', codmarca: '', local: '', codigo: '' };
};

onMounted(() => {
  fetchMarcas();
  fetchPrinters();
});
</script>

<style scoped>
/* PADRONIZAÇÃO DE FONTE 'SEGUE UI' */
.container-full {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f4f7f6;
  min-height: 100vh;
}

.main-header {
  position: fi;
  background: #388e3c;
  color: white;
  padding: 2px 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  justify-content: center;
  align-items: center;
}

.dashboard-body {
  max-width: 1400px;
  margin: 0 auto;
  padding: 25px;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
}

.btn-new {
  background: #388e3c;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.btn-new:hover {
  background: #2e7d32;
  transform: translateY(-2px);
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.modal-content {
  background: white;
  width: 95%;
  max-width: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.4);
}

.modal-header {
  background: #388e3c;
  color: white;
  padding: 18px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header.edit-mode {
  background: #1976d2; /* Azul para edição */
}

.close-x {
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 30px;
}

.full-width {
  grid-column: span 2;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: bold;
  color: #555;
  margin-bottom: 8px;
  text-transform: uppercase;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.modal-footer {
  background: #fcfcfc;
  padding: 20px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: 1px solid #eee;
}

.btn-save {
  background: #388e3c;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-cancel {
  background: #eee;
  color: #444;
  border: none;
  padding: 12px 25px;
  border-radius: 6px;
  cursor: pointer;
}

/* TABELA ZEBRA COM BORDAS */
.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.modern-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid #388e3c;
  font-size: 13px;
  color: #333;
}

.modern-table td {
  padding: 14px 15px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.modern-table tr:nth-child(even) {
  background: #fafafa;
}

.modern-table tr:hover {
  background: #f1f8e9;
}

.bold { font-weight: bold; }
.sub-text { font-size: 12px; color: #777; }
.text-center { text-align: center; }
.action-btn { background: none; border: none; cursor: pointer; font-size: 18px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }
</style>