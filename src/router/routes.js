const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'chain-reaction',
        name: 'chain-reaction',
        component: () => import('pages/ChainReactionPage.vue'),
      },
      {
        path: 'solitaire',
        name: 'solitaire',
        component: () => import('pages/SolitairePage.vue'),
      },
      {
        path: 'ripple',
        name: 'ripple',
        component: () => import('pages/RipplePage.vue'),
      },
      {
        path: 'constellation',
        name: 'constellation',
        component: () => import('pages/ConstellationPage.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
      },
      {
        path: 'stats',
        name: 'stats',
        component: () => import('pages/StatsPage.vue'),
      },
    ],
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
