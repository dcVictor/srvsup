<template>
  <v-container fluid>
    <v-card elevation="2" class="pa-4">
      <v-btn
        prepend-icon="mdi-cog"
        variant="text"
        class="mb-4"
        @click="showConfig = !showConfig"
      >
        {{ showConfig ? "Ocultar Configuração" : "Mostrar Configuração de Máquinas" }}
      </v-btn>

      <v-expand-transition>
        <v-card v-show="showConfig" variant="outlined" class="pa-4 mb-6 bg-grey-lighten-4">
          <div class="text-subtitle-1 font-weight-bold mb-4">Configurar Crédito (Número de Operadores):</div>
          <v-row>
            <v-col v-for="mipId in MIP_IDS" :key="mipId" cols="6" sm="4" md="3" lg="2">
              <v-select
                v-model="machineConfigs[mipId]"
                :label="`MIP ${mipId}`"
                :items="configOptions"
                density="compact"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
        </v-card>
      </v-expand-transition>

      <div class="d-flex flex-wrap mb-6" style="gap: 16px">
        <v-btn color="primary" prepend-icon="mdi-shuffle-variant" @click="generateSchedule">Gerar Escala</v-btn>
        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-grid" @click="handleOpenBlankTable">Tabela em Branco</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-account-group" @click="handleOpenManageOperators">Gerenciar Operadores</v-btn>
        
        <v-btn 
          variant="outlined" 
          prepend-icon="mdi-account-off" 
          :color="standbyOperatorsList.length > 0 ? 'warning' : undefined"
          :disabled="displayMatrix.length === 0"
          @click="openStandbyDrawer = true"
        >
          Sobrando ({{ standbyOperatorsList.length }})
        </v-btn>

        <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportToExcel" :disabled="displayMatrix.length === 0">Baixar Excel</v-btn>
      </div>

      <v-table v-if="displayMatrix.length > 0" density="compact" class="border rounded" fixed-header height="800px">
        <thead>
          <tr class="bg-grey-lighten-2">
            <th class="font-weight-bold" style="width: 80px">MIP</th>
            <th class="text-center font-weight-bold" style="width: 80px">Crédito</th>
            <th 
              v-for="(slot, idx) in TIME_SLOTS" 
              :key="idx" 
              class="text-center font-weight-bold cursor-pointer"
              :class="lockedColumns[idx] ? 'bg-teal-lighten-4' : ''"
              @click="toggleColumnLock(idx)"
            >
              <div class="d-flex align-center justify-center" style="gap: 4px">
                {{ slot }}
                <v-icon size="small" :icon="lockedColumns[idx] ? 'mdi-lock' : 'mdi-lock-open-outline'" :color="lockedColumns[idx] ? 'teal' : 'grey'"></v-icon>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(mip, rowIndex) in MIP_IDS" :key="mip">
            <td 
              class="font-weight-bold cursor-pointer"
              :class="getRowClass(rowIndex, mip)"
              @click="toggleRowLock(rowIndex)"
            >
              <v-icon v-if="lockedRows[rowIndex]" size="x-small" color="teal-darken-2" class="mr-1">mdi-lock</v-icon>
              {{ mip }}
            </td>
            <td class="text-center text-caption bg-grey-lighten-4">{{ getMachineConfigLabel(mip) }}</td>
            
            <td 
              v-for="(cellValue, colIndex) in displayMatrix[rowIndex]" 
              :key="colIndex"
              class="text-center cell-hover"
              :style="getCellStyle(rowIndex, colIndex, cellValue)"
              @click="handleCellClick($event, rowIndex, colIndex, cellValue)"
            >
              <div v-if="isOperatorOnBreak(cellValue, colIndex)" class="d-flex flex-column align-center">
                <span class="text-pre">{{ cellValue.replace(' / ', '\n') }}</span>
                <v-chip size="x-small" color="warning" variant="outlined" density="comfortable">Pausa</v-chip>
              </div>
              <span v-else class="text-pre">{{ cellValue.replace(' / ', '\n') }}</span>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-menu 
        v-model="menuVisible" 
        :activator="menuActivator" 
        offset-y 
        :close-on-content-click="true"
        @update:model-value="(val) => { if (!val) menuActivator = null }"
      >
        <v-list density="compact">
          <v-list-item @click="handleOpenSwapDialog(false)" color="primary" prepend-icon="mdi-plus-circle-outline">
            <v-list-item-title>Editar Operadores</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="handleOpenSwapDialog(true)" color="secondary" prepend-icon="mdi-chevron-double-right">
            <v-list-item-title>Editar até o Fim</v-list-item-title>
          </v-list-item>
          
          <v-divider></v-divider>
          
          <v-list-item @click="handleDeleteOperator" prepend-icon="mdi-delete-outline">
            <v-list-item-title>Esvaziar Slot</v-list-item-title>
          </v-list-item>
          
          <v-list-item @click="handleDeleteFromAll" base-color="error" prepend-icon="mdi-broom">
            <v-list-item-title>Excluir da Tabela Toda</v-list-item-title>
          </v-list-item>
          
          <v-divider></v-divider>
          
          <v-list-item @click="menuVisible = false" prepend-icon="mdi-close" base-color="grey-darken-2">
            <v-list-item-title>Cancelar</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card>

    <v-dialog v-model="openManageOperators" max-width="900px" scrollable>
      <v-card>
        <v-card-title class="bg-primary text-white">Gerenciar Operadores</v-card-title>
        <v-card-text class="pa-0">
          <v-table density="compact" fixed-header height="500px">
            <thead>
              <tr>
                <th>Nome</th>
                <th class="text-center">Crítico</th>
                <th>Pausa Default</th>
                <th class="text-center">Ativo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in tempOperatorData" :key="op.id">
                <td>{{ op.name }}</td>
                <td class="text-center">
                  <v-checkbox-btn v-model="op.isPriority" color="amber"></v-checkbox-btn>
                </td>
                <td>
                  <v-select v-model="op.breakTime" :items="TIME_SLOTS.slice(1)" density="compact" hide-details variant="plain"></v-select>
                </td>
                <td class="text-center">
                  <v-switch v-model="op.isActive" color="success" density="compact" hide-details></v-switch>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="openManageOperators = false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveManageOperators">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="openSwapDialog" max-width="500px">
      <v-card>
        <v-card-title>Editar Slot</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap gap-2 mb-4">
            <v-chip v-for="name in pendingSelection" :key="name" closable size="small" color="primary" @click:close="toggleOperatorInSelection(name)">
              {{ name }}
            </v-chip>
          </div>
          <v-text-field v-model="searchTerm" label="Buscar Operador..." prepend-inner-icon="mdi-magnify" density="compact" hide-details class="mb-2"></v-text-field>
          <v-list max-height="300px">
            <v-list-item v-for="op in filteredOperators" :key="op.id" @click="toggleOperatorInSelection(op.name)">
              <template v-slot:prepend>
                <v-checkbox-btn :model-value="pendingSelection.includes(op.name)"></v-checkbox-btn>
              </template>
              <v-list-item-title>{{ op.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="openSwapDialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="handleSaveSwap">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer v-model="openStandbyDrawer" location="right" temporary width="320">
      <div class="pa-4">
        <div class="d-flex align-center justify-space-between bg-grey-lighten-4 pa-2 rounded mb-4">
          <v-btn icon="mdi-chevron-left" variant="text" @click="handlePrevStandbySlot" :disabled="standbySlotIndex === 0"></v-btn>
          <span class="font-weight-bold">{{ TIME_SLOTS[standbySlotIndex] }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" @click="handleNextStandbySlot" :disabled="standbySlotIndex === TIME_SLOTS.length - 1"></v-btn>
        </div>
        <div class="text-h6 mb-2">Sobrando</div>
        <v-list density="compact">
          <v-list-item v-for="name in getStandbyAtSlot(standbySlotIndex)" :key="name">
            <v-list-item-title>{{ name }} <v-icon v-if="isPriority(name)" color="amber" size="x-small">mdi-star</v-icon></v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- CONSTANTES ---
const MIP_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 25, 24, 23, 14, 15, 16, 17, 21, 22, 20, 18, 19];
const TIME_SLOTS = ["05:20", "08:20", "09:30", "10:40", "11:50", "12:50"];
const CRITICAL_MIPS = [19, 18, 20, 22, 16, 1];
const PRIORITY_NAMES_MAP = new Set(["Heidermar", "Jenifer", "Ana Flávia", "Marcia T", "Marcia B", "Ilenir", "Sandra", "Salete", "Jean C"]);
const INACTIVE_AT_START = new Set(["Gregorio", "Victoria", "Danyelis"]);

const configOptions = [
  { title: 'Desativada', value: 0 },
  { title: '1/2 Op.', value: 0.5 },
  { title: '1 Op.', value: 1 },
  { title: '2 Op.', value: 2 },
  { title: '3 Op.', value: 3 },
];

// --- BANCO DE DADOS ---
const db = ref([
  { id: 1, name: "Jussara", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Jussara"), isPriority: PRIORITY_NAMES_MAP.has("Jussara") },
  { id: 2, name: "Cauana", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Cauana"), isPriority: PRIORITY_NAMES_MAP.has("Cauana") },
  { id: 3, name: "Janaina", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Janaina"), isPriority: PRIORITY_NAMES_MAP.has("Janaina") },
  { id: 4, name: "Solgelys", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Solgelys"), isPriority: PRIORITY_NAMES_MAP.has("Solgelys") },
  { id: 5, name: "Isabel", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Isabel"), isPriority: PRIORITY_NAMES_MAP.has("Isabel") },
  { id: 31, name: "Brayan", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Brayan"), isPriority: PRIORITY_NAMES_MAP.has("Brayan") },
  { id: 33, name: "Josué", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Josué"), isPriority: PRIORITY_NAMES_MAP.has("Josué") },
  { id: 34, name: "Roberto", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Roberto"), isPriority: PRIORITY_NAMES_MAP.has("Roberto") },
  { id: 35, name: "Jesus", breakTime: "08:20", isActive: !INACTIVE_AT_START.has("Jesus"), isPriority: PRIORITY_NAMES_MAP.has("Jesus") },
  { id: 6, name: "Ana Flávia", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Ana Flávia"), isPriority: PRIORITY_NAMES_MAP.has("Ana Flávia") },
  { id: 7, name: "Heidermar", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Heidermar"), isPriority: PRIORITY_NAMES_MAP.has("Heidermar") },
  { id: 8, name: "Victoria", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Victoria"), isPriority: PRIORITY_NAMES_MAP.has("Victoria") },
  { id: 9, name: "Simone", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Simone"), isPriority: PRIORITY_NAMES_MAP.has("Simone") },
  { id: 10, name: "Ilenir", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Ilenir"), isPriority: PRIORITY_NAMES_MAP.has("Ilenir") },
  { id: 32, name: "Salete", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Salete"), isPriority: PRIORITY_NAMES_MAP.has("Salete") },
  { id: 37, name: "Larissa", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Larissa"), isPriority: PRIORITY_NAMES_MAP.has("Larissa") },
  { id: 38, name: "Danyelis", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Danyelis"), isPriority: PRIORITY_NAMES_MAP.has("Danyelis") },
  { id: 39, name: "Marcia B", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Marcia B"), isPriority: PRIORITY_NAMES_MAP.has("Marcia B") },
  { id: 40, name: "Gabriel", breakTime: "09:30", isActive: !INACTIVE_AT_START.has("Gabriel"), isPriority: PRIORITY_NAMES_MAP.has("Gabriel") },
  { id: 11, name: "Ana Garcia", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Ana Garcia"), isPriority: PRIORITY_NAMES_MAP.has("Ana Garcia") },
  { id: 12, name: "Jenifer", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Jenifer"), isPriority: PRIORITY_NAMES_MAP.has("Jenifer") },
  { id: 13, name: "Mariangel", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Mariangel"), isPriority: PRIORITY_NAMES_MAP.has("Mariangel") },
  { id: 14, name: "Jean C", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Jean C"), isPriority: PRIORITY_NAMES_MAP.has("Jean C") },
  { id: 15, name: "Emelis", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Emelis"), isPriority: PRIORITY_NAMES_MAP.has("Emelis") },
  { id: 41, name: "Kidia", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Kidia"), isPriority: PRIORITY_NAMES_MAP.has("Kidia") },
  { id: 42, name: "Marcia T", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Marcia T"), isPriority: PRIORITY_NAMES_MAP.has("Marcia T") },
  { id: 43, name: "Jean Pierre", breakTime: "10:40", isActive: !INACTIVE_AT_START.has("Jean Pierre"), isPriority: PRIORITY_NAMES_MAP.has("Jean Pierre") },
  { id: 16, name: "Freddy", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Freddy"), isPriority: PRIORITY_NAMES_MAP.has("Freddy") },
  { id: 17, name: "Sandra", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Sandra"), isPriority: PRIORITY_NAMES_MAP.has("Sandra") },
  { id: 18, name: "Diana", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Diana"), isPriority: PRIORITY_NAMES_MAP.has("Diana") },
  { id: 19, name: "Gregorio", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Gregorio"), isPriority: PRIORITY_NAMES_MAP.has("Gregorio") },
  { id: 20, name: "Augusto", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Augusto"), isPriority: PRIORITY_NAMES_MAP.has("Augusto") },
  { id: 36, name: "Freidimar", breakTime: "11:50", isActive: !INACTIVE_AT_START.has("Freidimar"), isPriority: PRIORITY_NAMES_MAP.has("Freidimar") }
]);

// --- ESTADOS DE CONTROLE ---
const displayMatrix = ref([]);
const showConfig = ref(false);
const lockedColumns = ref(Array(TIME_SLOTS.length).fill(false));
const lockedRows = ref(Array(MIP_IDS.length).fill(false));
const machineConfigs = ref(MIP_IDS.reduce((acc, id) => ({ ...acc, [id]: 1 }), {}));
const menuVisible = ref(false);
const menuActivator = ref(null);
const selectedCell = ref({ rowIndex: null, colIndex: null });
const openSwapDialog = ref(false);
const isFillMode = ref(false);
const searchTerm = ref("");
const pendingSelection = ref([]);
const openStandbyDrawer = ref(false);
const standbySlotIndex = ref(0);
const standbyOperatorsList = ref([]);
const openManageOperators = ref(false);
const tempOperatorData = ref([]);

// --- COMPUTED ---
const filteredOperators = computed(() => {
  return db.value
    .filter(op => op.isActive && op.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// --- AUXILIARES ---
const shuffle = (array) => {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// --- MÉTODOS DE TRAVAMENTO ---
const toggleColumnLock = (index) => { 
  const newArr = [...lockedColumns.value];
  newArr[index] = !newArr[index];
  lockedColumns.value = newArr;
};

const toggleRowLock = (index) => { 
  const newArr = [...lockedRows.value];
  newArr[index] = !newArr[index];
  lockedRows.value = newArr;
};

// --- MÉTODOS DE UI E MENUS ---
const handleOpenManageOperators = () => {
  tempOperatorData.value = JSON.parse(JSON.stringify(db.value));
  openManageOperators.value = true;
};

const handleSaveManageOperators = () => {
  db.value = JSON.parse(JSON.stringify(tempOperatorData.value));
  openManageOperators.value = false;
  syncStandbyList();
};

const getMachineConfigLabel = (mipId) => {
  const val = machineConfigs.value[mipId];
  return val === 0.5 ? '1/2' : (val === 0 ? 'Desat.' : val);
};

const getRowClass = (rowIndex, mipId) => {
  if (lockedRows.value[rowIndex]) return 'bg-teal-lighten-5';
  if (CRITICAL_MIPS.includes(mipId)) return 'bg-orange-lighten-5';
  return '';
};

const getCellStyle = (r, c, val) => {
  if (val === 'N/A') return { backgroundColor: '#eeeeee', color: '#9e9e9e' };
  return (lockedColumns.value[c] || lockedRows.value[r]) ? { border: '2px solid #4db6ac' } : {};
};

const handleCellClick = (e, rowIndex, colIndex, cellValue) => {
  if (cellValue === 'N/A') return;
  menuVisible.value = false; 
  const targetElement = e.currentTarget; 
  setTimeout(() => {
    selectedCell.value = { rowIndex, colIndex };
    menuActivator.value = targetElement; 
    menuVisible.value = true;
  }, 50); 
};

const handleOpenSwapDialog = (fillToEnd) => {
  const { rowIndex, colIndex } = selectedCell.value;
  const val = displayMatrix.value[rowIndex][colIndex];
  pendingSelection.value = val ? val.split(" / ") : [];
  isFillMode.value = fillToEnd;
  openSwapDialog.value = true;
  menuVisible.value = false;
};

const toggleOperatorInSelection = (name) => {
  const idx = pendingSelection.value.indexOf(name);
  if (idx > -1) pendingSelection.value.splice(idx, 1);
  else pendingSelection.value.push(name);
};

const handleSaveSwap = () => {
  const { rowIndex, colIndex } = selectedCell.value;
  const newMatrix = JSON.parse(JSON.stringify(displayMatrix.value));
  const newVal = pendingSelection.value.join(" / ");
  
  if (isFillMode.value) {
    for (let i = colIndex; i < TIME_SLOTS.length; i++) {
        if (newMatrix[rowIndex][i] !== "N/A") newMatrix[rowIndex][i] = newVal;
    }
  } else {
    newMatrix[rowIndex][colIndex] = newVal;
  }
  
  displayMatrix.value = newMatrix;
  openSwapDialog.value = false;
  syncStandbyList();
};

const handleDeleteOperator = () => {
  displayMatrix.value[selectedCell.value.rowIndex][selectedCell.value.colIndex] = "";
  menuVisible.value = false;
  syncStandbyList();
};

const handleDeleteFromAll = () => {
  const name = displayMatrix.value[selectedCell.value.rowIndex][selectedCell.value.colIndex];
  if (!name) return;
  displayMatrix.value = displayMatrix.value.map(row => row.map(cell => cell === name ? "" : cell));
  menuVisible.value = false;
  syncStandbyList();
};

// --- ALGORITMO DE GERAÇÃO ---
const generateSchedule = () => {
  const regularOperators = db.value.filter(op => op.isActive);
  if (regularOperators.length === 0) return alert("Nenhum operador ativo.");

  const slotMapping = {};
  let currentSlotIndex = 0;
  const halfMips = [];

  MIP_IDS.forEach(mipId => {
    const req = machineConfigs.value[mipId];
    slotMapping[mipId] = [];
    if (req >= 1) {
      for (let i = 0; i < req; i++) {
        slotMapping[mipId].push(currentSlotIndex);
        currentSlotIndex++;
      }
    } else if (req === 0.5) {
      halfMips.push(mipId);
    }
  });

  for (let i = 0; i < halfMips.length; i += 2) {
    const mip1 = halfMips[i]; const mip2 = halfMips[i + 1];
    slotMapping[mip1].push(currentSlotIndex);
    if (mip2) slotMapping[mip2].push(currentSlotIndex);
    currentSlotIndex++;
  }
  
  const totalSlots = currentSlotIndex;
  if (totalSlots === 0) return alert("Nenhuma máquina ativa.");

  let newMatrix = displayMatrix.value.length > 0 
    ? displayMatrix.value.map(row => [...row]) 
    : MIP_IDS.map(mipId => machineConfigs.value[mipId] === 0 ? Array(TIME_SLOTS.length).fill("N/A") : Array(TIME_SLOTS.length).fill(""));

  let currentSlotsState = Array(totalSlots).fill(null);
  let operatorsOnBreak = [];
  let leftoversPool = [];
  let standbyOperators = [];

  for (let timeIndex = 0; timeIndex < TIME_SLOTS.length; timeIndex++) {
    const timeSlot = TIME_SLOTS[timeIndex];
    const isLastSlot = timeIndex === TIME_SLOTS.length - 1;
    const isFirstSlot = timeIndex === 0;

    const isLocked = lockedColumns.value[timeIndex];

    if (isLocked) {
      MIP_IDS.forEach((mipId, mipIdx) => {
        const assignedSlots = slotMapping[mipId];
        if (assignedSlots && assignedSlots.length > 0) {
          const cellVal = newMatrix[mipIdx][timeIndex];
          if (cellVal && cellVal !== "N/A" && cellVal !== "") {
            const names = cellVal.split(" / ");
            names.forEach((name, nameIdx) => {
              if (nameIdx < assignedSlots.length) {
                const opObj = regularOperators.find(o => o.name === name) || { name: name };
                currentSlotsState[assignedSlots[nameIdx]] = opObj;
              }
            });
          } else {
            assignedSlots.forEach(sId => currentSlotsState[sId] = { name: "" });
          }
        }
      });

      const allocatedNames = new Set(currentSlotsState.filter(s => s && s.name).map(s => s.name));
      if (isFirstSlot) standbyOperators = regularOperators.filter(op => !allocatedNames.has(op.name));

      const workingNow = currentSlotsState.filter(s => s && s.name && s.name !== "");
      const nextTimeSlot = TIME_SLOTS[timeIndex + 1];
      operatorsOnBreak = [];
      
      workingNow.forEach(op => {
        if (op.breakTime === nextTimeSlot && !isLastSlot) operatorsOnBreak.push(op);
      });

      leftoversPool = regularOperators.filter(op => !allocatedNames.has(op.name));

    } else {
      const lockedRowOperators = new Set();

      MIP_IDS.forEach((mipId, mipIdx) => {
        if (lockedRows.value[mipIdx]) {
          const assignedSlots = slotMapping[mipId];
          if (assignedSlots && assignedSlots.length > 0) {
            const cellVal = displayMatrix.value[mipIdx]?.[timeIndex];
            if (cellVal && cellVal !== "N/A" && cellVal !== "") {
              const names = cellVal.split(" / ");
              names.forEach((name, nameIdx) => {
                if (nameIdx < assignedSlots.length) {
                  const opObj = regularOperators.find(o => o.name === name) || { name: name };
                  currentSlotsState[assignedSlots[nameIdx]] = opObj;
                  lockedRowOperators.add(name);
                }
              });
            } else {
              assignedSlots.forEach(sId => currentSlotsState[sId] = { name: "" });
            }
          }
        }
      });

      if (isFirstSlot) {
        let priorityOperatorsPool = shuffle(regularOperators.filter(op => op.isPriority && !lockedRowOperators.has(op.name)));
        let regularOperatorsPool = shuffle(regularOperators.filter(op => !op.isPriority && !lockedRowOperators.has(op.name)));
        
        const criticalSlotIndices = new Set();
        MIP_IDS.forEach((mipId) => {
          if (CRITICAL_MIPS.includes(mipId) && machineConfigs.value[mipId] > 0) {
            slotMapping[mipId].forEach(slotIdx => criticalSlotIndices.add(slotIdx));
          }
        });

        criticalSlotIndices.forEach(slotIdx => {
          if (currentSlotsState[slotIdx] === null && priorityOperatorsPool.length > 0) {
            currentSlotsState[slotIdx] = priorityOperatorsPool.shift();
          }
        });

        let initialPool = [...priorityOperatorsPool, ...regularOperatorsPool];
        currentSlotsState = currentSlotsState.map(slot => {
          if (slot === null) {
            if (initialPool.length > 0) return initialPool.shift();
            return { name: "" };
          }
          return slot;
        });

        standbyOperators = [...initialPool];

      } else {
        let coveragePool = [...operatorsOnBreak, ...leftoversPool];
        coveragePool = coveragePool.filter(op => !lockedRowOperators.has(op.name));

        operatorsOnBreak = [];
        leftoversPool = [];

        if (timeSlot === "08:20") {
          const availableStandby = standbyOperators.filter(op => !lockedRowOperators.has(op.name));
          coveragePool = [...coveragePool, ...availableStandby];
          standbyOperators = [];
        }

        currentSlotsState = currentSlotsState.map(operatorOnSlot => {
          if (operatorOnSlot && operatorOnSlot.name !== "") {
            if (lockedRowOperators.has(operatorOnSlot.name)) return operatorOnSlot;
            
            if (operatorOnSlot.breakTime === timeSlot && !isLastSlot) {
              operatorsOnBreak.push(operatorOnSlot);
              return null;
            }
          }
          return operatorOnSlot;
        });

        coveragePool = shuffle(coveragePool);

        currentSlotsState = currentSlotsState.map(slot => {
          if (slot === null) {
            const validIndex = coveragePool.findIndex(op => op.breakTime !== timeSlot);
            if (validIndex !== -1) {
              const [selectedOp] = coveragePool.splice(validIndex, 1);
              return selectedOp;
            } else {
              return { name: "" };
            }
          }
          return slot;
        });

        leftoversPool = [...coveragePool];
      }
      
      MIP_IDS.forEach((mipId, mipArrayIndex) => {
        const assignedSlotIndices = slotMapping[mipId];
        if (!assignedSlotIndices || assignedSlotIndices.length === 0) {
          if (machineConfigs.value[mipId] === 0) newMatrix[mipArrayIndex][timeIndex] = "N/A";
          else newMatrix[mipArrayIndex][timeIndex] = "";
          return;
        }
        const operators = assignedSlotIndices.map(slotIdx => currentSlotsState[slotIdx]);
        const formattedName = operators.map(op => (op && op.name) ? op.name : "").join(" / ");
        newMatrix[mipArrayIndex][timeIndex] = formattedName;
      });
    }
  }
  
  displayMatrix.value = newMatrix;
  showConfig.value = false;
  syncStandbyList();
};

const handleOpenBlankTable = () => {
  displayMatrix.value = MIP_IDS.map(id => machineConfigs.value[id] === 0 ? Array(TIME_SLOTS.length).fill("N/A") : Array(TIME_SLOTS.length).fill(""));
  lockedRows.value = Array(MIP_IDS.length).fill(false);
  lockedColumns.value = Array(TIME_SLOTS.length).fill(false);
  syncStandbyList();
};

const syncStandbyList = () => {
  if (displayMatrix.value.length === 0) return;
  const used = new Set();
  displayMatrix.value.forEach(row => { if(row[0] && row[0] !== "N/A") row[0].split(" / ").forEach(n => used.add(n)); });
  standbyOperatorsList.value = db.value.filter(o => o.isActive && !used.has(o.name)).map(o => o.name);
};

const getStandbyAtSlot = (idx) => {
  const used = new Set();
  displayMatrix.value.forEach(row => { const v = row[idx]; if(v && v !== "N/A") v.split(" / ").forEach(n => used.add(n)); });
  return db.value.filter(o => o.isActive && !used.has(o.name)).map(o => o.name).sort();
};

const isOperatorOnBreak = (cellValue, colIdx) => {
  if (!cellValue || cellValue === "N/A") return false;
  const name = cellValue.split(" / ")[0];
  return db.value.find(o => o.name === name)?.breakTime === TIME_SLOTS[colIdx];
};

const handlePrevStandbySlot = () => { if(standbySlotIndex.value > 0) standbySlotIndex.value--; };
const handleNextStandbySlot = () => { if(standbySlotIndex.value < TIME_SLOTS.length - 1) standbySlotIndex.value++; };
const isPriority = (n) => db.value.find(o => o.name === n)?.isPriority;

// --- FUNÇÃO DE EXPORTAÇÃO EXCEL ---
const exportToExcel = () => {
  if (displayMatrix.value.length === 0) return;
  const excelData = [];
  excelData.push(["MIP", ...TIME_SLOTS]);
  
  MIP_IDS.forEach((mipId, index) => {
    const rowData = [mipId];
    if (displayMatrix.value[index]) { 
      rowData.push(...displayMatrix.value[index]); 
    }
    excelData.push(rowData);
  });
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  const wscols = [
    { wch: 6 }, 
    ...TIME_SLOTS.map(() => ({ wch: 20 }))
  ];
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Escala V28");
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(data, `escala_producao_v28.xlsx`);
};

onMounted(() => { handleOpenBlankTable(); });
</script>

<style scoped>
.text-pre { white-space: pre-wrap; font-size: 0.8rem; line-height: 1.1; }
.cursor-pointer { cursor: pointer; }
.cell-hover:hover { background-color: #f0f0f0 !important; }
</style>