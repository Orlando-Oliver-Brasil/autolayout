/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Rota de health check
router.get('/', async () => {
  return {
    message: 'Autolayout API v1',
    status: 'online',
    timestamp: new Date().toISOString()
  }
})

// Grupo de rotas da API v1
router.group(() => {
  
  // Rotas públicas de autenticação
  router.group(() => {
    router.post('/auth/login', '#controllers/auth_controller.login')
    router.post('/auth/forgot-password', '#controllers/users_controller.requestPasswordReset')
    router.post('/auth/reset-password', '#controllers/users_controller.resetPassword')
  })
  
  // Rotas protegidas por autenticação
  router.group(() => {
    /**
     * Rotas de autenticação protegidas
     */
    router.post('/auth/logout', '#controllers/auth_controller.logout')
    router.get('/auth/me', '#controllers/auth_controller.me')
    router.post('/auth/change-password', '#controllers/users_controller.changePassword') // Própria senha
    
    /**
     * Rotas de gerenciamento de usuários
     */
    // Listar usuários (contexto específico: todos, por grupo, ou por squad)
    router.get('/users', '#controllers/users_controller.index')
    
    // Criar usuário básico (apenas admins e super admins)
    router.post('/users', '#controllers/users_controller.store').use(middleware.role({ level: 1 }))
    
    // Ver dados de usuário específico
    router.get('/users/:id', '#controllers/users_controller.show')
    
    // Atualizar usuário
    router.put('/users/:id', '#controllers/users_controller.update')
    
    // Alterar senha de usuário específico (admin function)
    router.patch('/users/:id/change-password', '#controllers/users_controller.changePassword')
    
    // Excluir usuário (exclusão lógica)
    router.delete('/users/:id', '#controllers/users_controller.destroy')
    
    // Adicionar usuário a grupo
    router.post('/users/groups', '#controllers/users_controller.addToGroup')
    
    // Adicionar usuário a squad
    router.post('/users/squads', '#controllers/users_controller.addToSquad')
    
    // Remover usuário de grupo
    router.delete('/users/:userId/groups/:groupId', '#controllers/users_controller.removeFromGroup')

    /**
     * Rotas para informações pessoais do usuário
     */
    // Meus grupos
    router.get('/me/groups', '#controllers/users_controller.getMyGroups')
    
    // Meus squads de um grupo específico
    router.get('/me/groups/:groupId/squads', '#controllers/users_controller.getMySquads')

    /**
     * Rotas de grupos
     */
    // Listar grupos
    router.get('/groups', '#controllers/groups_controller.index')
    
    // Criar grupo (apenas super admin)
    router.post('/groups', '#controllers/groups_controller.store').use(middleware.role({ level: 2 }))
    
    // Ver grupo específico
    router.get('/groups/:groupId', '#controllers/groups_controller.show')
    
    // Atualizar grupo (apenas super admin)
    router.put('/groups/:groupId', '#controllers/groups_controller.update')
      .use(middleware.role({ level: 2 }))
    
    // Desativar grupo (apenas super admin)
    router.delete('/groups/:groupId', '#controllers/groups_controller.destroy')
      .use(middleware.role({ level: 2 }))

    /**
     * Rotas de squads
     */
    // Listar squads de um grupo
    router.get('/groups/:groupId/squads', '#controllers/squads_controller.index')
    
    // Criar squad em um grupo
    router.post('/groups/squads', '#controllers/squads_controller.store')
    
    // Ver squad específico
    router.get('/squads/:squadId', '#controllers/squads_controller.show')
      .use(middleware.groupAccess({ type: 'squad', requireMembership: true }))
    
    // Atualizar squad
    router.put('/squads/:squadId', '#controllers/squads_controller.update')
      .use(middleware.groupAccess({ type: 'squad', requireMembership: true }))
    
    // Desativar squad
    router.delete('/squads/:squadId', '#controllers/squads_controller.destroy')
      .use(middleware.groupAccess({ type: 'squad', requireMembership: true }))

    /**
     * Rotas de layouts (mantendo as existentes)
     */
    router.get('/layouts', '#controllers/layouts_controller.index')
    router.post('/layouts', '#controllers/layouts_controller.store')
    router.get('/layouts/:id', '#controllers/layouts_controller.show')
    router.put('/layouts/:id', '#controllers/layouts_controller.update')
    router.delete('/layouts/:id', '#controllers/layouts_controller.destroy')
    router.post('/layouts/suggestions', '#controllers/layouts_controller.generateSuggestions')

    /**
     * Rotas de processamento de lauda
     */
    router.post('/lauda-processing', '#controllers/lauda_processing_controller.store')
    router.get('/lauda-processing/:id', '#controllers/lauda_processing_controller.show')
    router.get('/lauda-processing', '#controllers/lauda_processing_controller.index')
    router.post('/lauda-processing/:id/reprocess', '#controllers/lauda_processing_controller.reprocess')
    router.delete('/lauda-processing/:id', '#controllers/lauda_processing_controller.destroy')

    /**
     * Rotas administrativas (apenas super admins)
     */
    router.group(() => {
      // Registrar usuário via admin (diferente do registro público)
      router.post('/admin/users', '#controllers/auth_controller.register')
      
      // Listar todos os grupos (sem filtro de participação)
      router.get('/admin/groups', '#controllers/users_controller.getAllGroups')
      
      // Estatísticas e relatórios do sistema
      router.get('/admin/stats', async ({ response }) => {
        return response.json({
          status: 'success',
          message: 'Estatísticas do sistema (a implementar)'
        })
      })
      
    }).use(middleware.role({ level: 2 }))
    
  }).use(middleware.requestLogger()).use(middleware.auth())
  
}).prefix('/api/v1')
