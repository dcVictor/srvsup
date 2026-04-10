import { createRouter, createWebHistory } from 'vue-router'
import Monitoramento from '../pages/Monitoramento.vue'
import Escala from '../pages/Escala.vue'
import Login from '../pages/Login.vue' 
import Impressoras from '@/pages/Impressoras.vue'
import GerenciamentoImpressoras from '@/components/GerenciamentoImpressoras.vue'
import ImpressorasDashboard from '@/pages/Impressoras-dashboard.vue'
import ConsultaImpressao from '@/pages/ConsultaImpressao.vue'



const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/monitoramento',
    name: 'monitoramento',
    component: Monitoramento,
    meta: { requerAutenticacao: true } 
  },
  {
    path: '/escala',
    name: 'escala',
    component: Escala,
    meta: { requerAutenticacao: true }
  },
    {
    path: '/impressoras',
    name: 'impressoras',
    component: Impressoras,
    meta: { requerAutenticacao: true }
  },
    {
    path: '/gerenciamentoimpressoras',
    name: 'gerenciamentoimpressoras',
    component: GerenciamentoImpressoras,
    meta: { requerAutenticacao: true }
  },
  {
    path: '/impressorasdashboard',
    name: 'impressorasdashboard',
    component: ImpressorasDashboard,
    meta: { requerAutenticacao: true }
  },

   {
    path: '/ConsultaImpressao',
    name: 'ConsultaImpressao',
    component: ConsultaImpressao,
    meta: { requerAutenticacao: true }
  }
]





const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from) => {
  // 1. Verificação de Autenticação
  if (to.meta.requerAutenticacao) {
    const estaLogado = localStorage.getItem('autenticado') === 'sim'

    if (!estaLogado) {
      // Se não estiver logado, redireciona para o login
      return { name: 'Login' } // Ou o caminho: return '/login'
    }
    // Se estiver logado, não retorna nada (permite a navegação)
  }

  // 2. Proteção contra o erro "No match found" (Câmeras)
  // Se o Vue Router tentar processar uma rota que ele não conhece 
  // e que deveria ser externa (como as do MediaMTX), nós paramos ele aqui.
  if (to.matched.length === 0) {
    console.warn(`Rota não encontrada: ${to.path}. Verifique se é um link externo.`);
    return false; // Cancela a navegação interna do Vue para caminhos desconhecidos
  }
})
export default router