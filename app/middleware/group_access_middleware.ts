import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Group from '#models/group'
import Squad from '#models/squad'
import UserGroup from '#models/user_group'
import UserSquad from '#models/user_squad'

// Extend HttpContext para incluir propriedades customizadas
declare module '@adonisjs/core/http' {
  interface HttpContext {
    targetGroup?: Group
    targetSquad?: Squad
    userGroupLevel?: number
    userSquadRole?: string
  }
}

/**
 * Middleware para verificar acesso a grupos e squads
 * 
 * Opções disponíveis:
 * - type: 'group' | 'squad' - Tipo de recurso a ser verificado
 * - requireMembership: boolean - Exige que o usuário seja membro do grupo/squad
 * - requireAdminLevel: boolean - Exige nível administrativo (level >= 1 ou leader)
 * - requireLeaderRole: boolean - Exige papel de líder no squad (apenas para squads)
 * 
 * Propriedades adicionadas ao contexto:
 * - ctx.targetGroup: Group - Grupo encontrado (quando type = 'group')
 * - ctx.targetSquad: Squad - Squad encontrado (quando type = 'squad')
 * - ctx.userGroupLevel: number - Nível do usuário no grupo
 * - ctx.userSquadRole: string - Papel do usuário no squad
 */
export default class GroupAccessMiddleware {

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      type: 'group' | 'squad'
      requireMembership?: boolean
      requireAdminLevel?: boolean
      requireLeaderRole?: boolean
    }
  ) {
    const currentUser = ctx.auth.user!
    
    // Super admin global tem acesso a tudo
    if (currentUser.isSuperAdmin) {
      return next()
    }

    try {
      if (options.type === 'group') {
        const groupId = parseInt(ctx.params.groupId || ctx.request.input('groupId'))
        
        if (!groupId || isNaN(groupId)) {
          return ctx.response.status(400).json({
            status: 'error',
            message: 'ID do grupo inválido ou não fornecido'
          })
        }

        const group = await Group.findOrFail(groupId)
        
        if (options.requireMembership) {
          const userGroup = await UserGroup.query()
            .where('user_id', currentUser.id)
            .where('group_id', groupId)
            .where('is_active', true)
            .first()
            
          if (!userGroup) {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você não tem acesso a este grupo'
            })
          }
          
          // Verificar nível de admin se necessário
          if (options.requireAdminLevel && userGroup.level < 1) {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você precisa ser administrador para acessar este recurso'
            })
          }
          
          ctx.userGroupLevel = userGroup.level
        }

        ctx.targetGroup = group
        
      } else if (options.type === 'squad') {
        const squadId = parseInt(ctx.params.squadId || ctx.request.input('squadId'))
        
        if (!squadId || isNaN(squadId)) {
          return ctx.response.status(400).json({
            status: 'error',
            message: 'ID do squad inválido ou não fornecido'
          })
        }

        const squad = await Squad.query()
          .where('id', squadId)
          .preload('group')
          .firstOrFail()

        if (options.requireMembership) {
          // Verificar se pertence ao grupo da squad
          const userGroup = await UserGroup.query()
            .where('user_id', currentUser.id)
            .where('group_id', squad.groupId)
            .where('is_active', true)
            .first()
            
          if (!userGroup) {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você não tem acesso ao grupo deste squad'
            })
          }
          
          // Verificar se pertence ao squad especificamente
          const userSquad = await UserSquad.query()
            .where('user_id', currentUser.id)
            .where('squad_id', squadId)
            .where('is_active', true)
            .first()
            
          if (!userSquad) {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você não tem acesso a este squad'
            })
          }
          
          // Verificar se é líder se necessário
          if (options.requireAdminLevel && userSquad.role !== 'leader' && userGroup.level < 1) {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você precisa ser líder do squad ou administrador do grupo'
            })
          }
          
          // Verificar se é especificamente líder do squad
          if (options.requireLeaderRole && userSquad.role !== 'leader') {
            return ctx.response.status(403).json({
              status: 'error',
              message: 'Você precisa ser líder deste squad'
            })
          }
          
          ctx.userGroupLevel = userGroup.level
          ctx.userSquadRole = userSquad.role
        }

        ctx.targetSquad = squad
      }

      return next()
      
    } catch (error) {
      return ctx.response.status(404).json({
        status: 'error',
        message: `${options.type === 'group' ? 'Grupo' : 'Squad'} não encontrado`
      })
    }
  }
}