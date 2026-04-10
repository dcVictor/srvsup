<template>
  <v-container fluid class="login-container">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card class="login-card" elevation="24">
          <v-card-text class="pa-8">
            <div class="text-center mb-8">
              <img
                :src="logoZagonel"
                class="logo"
                alt="Logo"
              />
            </div>

            <form @submit.prevent="makeLogin">
              <div class="mb-6">
                <label class="field-label">Usuário</label>
                <v-text-field
                  :disabled="inLogin"
                  v-model="login"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  autocomplete="username"
                  placeholder="Digite seu usuário"
                  prepend-inner-icon="mdi-account-outline"
                  class="input-field"
                  @keypress.enter="passwordInput.focus()"
                />
              </div>

              <div class="mb-6">
                <label class="field-label">Senha</label>
                <v-text-field
                  ref="passwordInput"
                  :disabled="inLogin"
                  v-model="password"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Digite sua senha"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  class="input-field"
                  @keypress.enter="makeLogin"
                  @click:append-inner="showPassword = !showPassword"
                />
              </div>

              <v-alert
                v-if="erro"
                type="error"
                variant="tonal"
                class="mb-4"
                density="compact"
                text="Usuário ou senha incorretos."
              ></v-alert>

              <v-btn
                block
                size="x-large"
                color="#009e53"
                @click="makeLogin"
                :loading="loading"
                class="login-button elevation-2 text-white"
                rounded="xl"
              >
                <span class="button-text">Entrar</span>
              </v-btn>
            </form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logoZagonel from "@/assets/logo_zagonel.png"

const router = useRouter()
const passwordInput = ref()

// Variáveis de estado
const login = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const inLogin = ref(false)
const erro = ref(false)

const makeLogin = async () => { // Adicionado async para o fetch
  if (!login.value || !password.value) {
    erro.value = true
    return
  }

  loading.value = true
  inLogin.value = true
  erro.value = false


  if (login.value === 'recepcao' && password.value === 'Zagonel@2025!!') {
    localStorage.setItem('autenticado', 'sim')
    router.push('/monitoramento')
    return finalizarLogin()
  } 
  
  if(login.value === 'producao' && password.value === 'Zagonel123'){
    localStorage.setItem('autenticado', 'sim')
    router.push('/escala')
    return finalizarLogin()
  }

  if(login.value === 'impressao' && password.value === 'Zagonel123'){
    localStorage.setItem('autenticado', 'sim')
    router.push('/consultaimpressao')
    return finalizarLogin()
  }

 
  try {
    const response = await fetch('http://192.168.1.53:3000/api/login-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user: login.value, 
        pass: password.value 
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      localStorage.setItem('autenticado', 'sim')
      localStorage.setItem('usuario_ad', login.value)
     
      router.push('/consultaimpressao') 
    } else {
      erro.value = true
    }
  } catch (e) {
    console.error("Erro na conexão com o AD:", e)
    erro.value = true
  } finally {
    finalizarLogin()
  }
}

const finalizarLogin = () => {
  loading.value = false
  inLogin.value = false
}
</script>

<style scoped>
.login-container {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1a1a1a 0%, #262626 25%, #009e53 100%);
  overflow: hidden;
  z-index: 9999;
}

.login-container::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 158, 83, 0.15) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.fill-height {
  min-height: 100vh;
}

.login-card {
  background: linear-gradient(
    145deg,
    rgba(30, 30, 35, 0.95),
    rgba(20, 25, 30, 0.98)
  ) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: visible;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0, 158, 83, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 158, 83, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
}

.login-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 48px rgba(0, 158, 83, 0.25), 0 0 0 1px rgba(0, 158, 83, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(0, 158, 83, 0.4);
}

.login-card::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 158, 83, 0.03) 0%, transparent 70%);
  pointer-events: none;
}

.logo {
  width: 200px;
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.field-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.input-field {
  border-radius: 10px;
}

.input-field :deep(.v-field) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
}

.input-field :deep(.v-field--focused) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.input-field :deep(.v-text-field__details) {
  margin-top: 4px;
}

.input-field :deep(.v-field__outline) {
  color: rgba(255, 255, 255, 0.15) !important;
  transition: all 0.3s ease;
}

.input-field :deep(.v-field--focused .v-field__outline) {
  color: #00c569 !important;
  box-shadow: 0 0 0 3px rgba(0, 198, 105, 0.1), 0 4px 12px rgba(0, 158, 83, 0.15);
}

.input-field :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.6);
}

.input-field :deep(.v-field--focused .v-icon) {
  color: #00c569;
}

.input-field :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.input-field :deep(input) {
  color: #fff;
}

.mb-6 {
  margin-bottom: 24px;
}

.mb-8 {
  margin-bottom: 32px;
}

.login-button {
  height: 56px !important;
  border-radius: 10px !important;
  text-transform: none;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #009e53 0%, #00c569 100%) !important;
  box-shadow: 0 4px 16px rgba(0, 158, 83, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 198, 105, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 158, 83, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.button-text {
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 600px) {
  .logo {
    width: 160px;
  }

  .field-label {
    font-size: 13px;
  }

  .button-text {
    font-size: 15px;
  }
}
</style>