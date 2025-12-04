import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

/**
 * Middleware para verificar se o usuário pode gerenciar outro usuário
 * Adaptado para estrutura many-to-many
 */
export default class UserManagementMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: {
    requireSameGroup?: boolean
    requireSameSquad?: boolean
    groupId?: string
    squadId?: string
  } = {}) {
    const currentUser = ctx.auth.user!
    const targetUserId = ctx.params.id || ctx.request.input('userId')

    if (!targetUserId) {
      return ctx.response.status(400).json({
        status: 'error',
        message: 'ID do usuário não fornecido'
      })
    }

    try {
      const targetUser = await User.findOrFail(targetUserId)
      
      // Super admin global pode gerenciar qualquer usuário
      if (currentUser.isSuperAdmin) {
        ctx.targetUser = targetUser
        return next()
      }

      // Se for o próprio usuário, pode gerenciar
      if (currentUser.id === targetUser.id) {
        ctx.targetUser = targetUser
        return next()
      }

      // Verificar contexto específico (grupo ou squad)
      if (options.groupId) {
        const groupId = parseInt(options.groupId) || parseInt(ctx.params.groupId) || parseInt(ctx.request.input('groupId'))
        if (groupId && await currentUser.canManageUserInGroup(targetUser, groupId)) {
          ctx.targetUser = targetUser
          return next()
        }
      }

      if (options.squadId) {
        const squadId = parseInt(options.squadId) || parseInt(ctx.params.squadId) || parseInt(ctx.request.input('squadId'))
        if (squadId && await currentUser.canManageUserInSquad(targetUser, squadId)) {
          ctx.targetUser = targetUser
          return next()
        }
      }

      // Verificar se compartilham pelo menos um grupo (para operações gerais)
      if (!options.requireSameGroup && !options.requireSameSquad) {
        const currentUserGroups = await currentUser.getActiveGroups()
        const targetUserGroups = await targetUser.getActiveGroups()
        
        const hasSharedGroup = currentUserGroups.some(cug => 
          targetUserGroups.some(tug => tug.id === cug.id)
        )

        if (hasSharedGroup) {
          ctx.targetUser = targetUser
          return next()
        }
      }

      return ctx.response.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para gerenciar este usuário'
      })
      
    } catch (error) {
      return ctx.response.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      })
    }
  }
}