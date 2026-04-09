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

router.beforeEach((to: any, _from: any, next: any) => {
  if (to.meta.requerAutenticacao) {
    const estaLogado = localStorage.getItem('autenticado') === 'sim'
    
    if (estaLogado) {
      next()
    } else {
      next('/login')
    }
  } else {
    next() 
  }
})

export default router