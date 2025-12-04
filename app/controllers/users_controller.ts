import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Group from '#models/group'
import Squad from '#models/squad'
import UserGroup from '#models/user_group'
import UserSquad from '#models/user_squad'
import { 
  updateUserValidator, 
  createUserValidator, 
  changePasswordValidator,
  requestPasswordResetValidator,
  resetPasswordValidator,
  addUserToGroupValidator,
  addUserToSquadValidator
} from '#validators/user'

const Database = db
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'
import MailService from '#services/mail_service'

export default class UsersController {
  /**
   * Lista usuários baseado no contexto (grupo/squad específico ou global)
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const groupId = request.input('groupId')
      const squadId = request.input('squadId')

      let users: any
      let formattedUsers: any[] = []

      if (squadId) {
        // Buscar usuários de um squad específico
        if (!await currentUser.belongsToSquad(squadId)) {
          return response.status(403).json({
            status: 'error',
            message: 'Você não tem acesso a este squad'
          })
        }

        const squad = await Squad.query()
          .where('id', squadId)
          .preload('users', (query) => {
            query.pivotColumns(['role', 'is_active', 'joined_at'])
              .wherePivot('is_active', true)
          })
          .firstOrFail()

        formattedUsers = squad.users.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          level: user.level,
          levelName: user.getLevelName(),
          isActive: user.isActive,
          isAdmin: user.level === 2,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          squadRole: user.$pivot?.role,
          joinedAt: user.$pivot?.joined_at
        }))

      } else if (groupId) {
        // Buscar usuários de um grupo específico
        if (!await currentUser.belongsToGroup(groupId)) {
          return response.status(403).json({
            status: 'error',
            message: 'Você não tem acesso a este grupo'
          })
        }

        const group = await Group.query()
          .where('id', groupId)
          .preload('users', (query) => {
            query.pivotColumns(['level', 'is_active', 'joined_at'])
              .wherePivot('is_active', true)
          })
          .firstOrFail()

        formattedUsers = group.users.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          level: user.level,
          levelName: user.getLevelName(),
          isActive: user.isActive,
          isAdmin: user.level === 2,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          groupLevel: user.$pivot?.level,
          joinedAt: user.$pivot?.joined_at
        }))

      } else {
        // Buscar todos os usuários (apenas super admin global)
        if (!currentUser.isSuperAdmin) {
          return response.status(403).json({
            status: 'error',
            message: 'Acesso negado'
          })
        }

        const usersPaginated = await User.query()
          .preload('groups', (query) => {
            query.pivotColumns(['level', 'is_active', 'joined_at'])
              .wherePivot('is_active', true)
          })
          .preload('squads', (query) => {
            query.pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
              .wherePivot('is_active', true)
          })
          .orderBy('createdAt', 'desc')
          .paginate(page, limit)

        const usersData = usersPaginated.serialize()
        
        formattedUsers = usersData.data.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          level: user.level,
          levelName: user.getLevelName(),
          isActive: user.isActive,
          isAdmin: user.level === 2,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          groups: user.groups,
          squads: user.squads
        }))

        return response.json({
          status: 'success',
          data: {
            users: formattedUsers,
            meta: usersData.meta
          }
        })
      }

      return response.json({
        status: 'success',
        data: {
          users: formattedUsers,
          total: formattedUsers.length
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar usuários',
        errors: error.message
      })
    }
  }

  /**
   * Criar novo usuário
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUserValidator)

      // Processar os dados antes de criar
      const userData: any = {
        email: payload.email,
        password: payload.password,
        isActive: payload.isActive !== undefined ? payload.isActive : true
      }
      
      // Tratar name como alias para fullName
      if (payload.name) {
        userData.fullName = payload.name
      } else if (payload.fullName) {
        userData.fullName = payload.fullName
      }
      
      // Tratar isAdmin (converte para level)
      if (payload.isAdmin !== undefined) {
        userData.level = payload.isAdmin ? 2 : 0 // 2 = admin, 0 = membro
      } else {
        userData.level = payload.level || 0
      }

      const user = await User.create(userData)

      return response.status(201).json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            name: user.fullName, // Incluir alias
            email: user.email,
            level: user.level,
            levelName: user.getLevelName(),
            isActive: user.isActive,
            isAdmin: user.level === 2, // Calcular isAdmin
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao criar usuário',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Adicionar usuário a um grupo
   */
  async addToGroup({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const { userId, groupId, level } = await request.validateUsing(addUserToGroupValidator)

      // Verificar se o usuário atual pode gerenciar este grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para gerenciar este grupo'
        })
      }

      // Verificar se o usuário alvo existe
      await User.findOrFail(userId)

      // Verificar se já não está no grupo
      const existingMembership = await UserGroup.query()
        .where('userId', userId)
        .where('groupId', groupId)
        .first()

      if (existingMembership) {
        if (existingMembership.isActive) {
          return response.status(400).json({
            status: 'error',
            message: 'Usuário já pertence a este grupo'
          })
        } else {
          // Reativar membership
          await existingMembership.merge({ 
            isActive: true, 
            level: level || 0,
            joinedAt: DateTime.now()
          }).save()
        }
      } else {
        // Criar nova membership
        await UserGroup.create({
          userId,
          groupId,
          level: level || 0,
          isActive: true,
          joinedAt: DateTime.now()
        })
      }

      return response.json({
        status: 'success',
        message: 'Usuário adicionado ao grupo com sucesso'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao adicionar usuário ao grupo',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Adicionar usuário a um squad
   */
  async addToSquad({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const { userId, squadId, role } = await request.validateUsing(addUserToSquadValidator)

      // Buscar squad e grupo
      const squad = await Squad.query()
        .where('id', squadId)
        .preload('group')
        .firstOrFail()

      const groupId = squad.groupId

      // Verificar se o usuário atual pode gerenciar este squad/grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para gerenciar este squad'
        })
      }

      // Verificar se o usuário alvo pertence ao grupo
      const targetUser = await User.findOrFail(userId)
      if (!await targetUser.belongsToGroup(groupId)) {
        return response.status(400).json({
          status: 'error',
          message: 'Usuário deve pertencer ao grupo antes de ser adicionado ao squad'
        })
      }

      // Verificar se já não está no squad
      const existingMembership = await UserSquad.query()
        .where('userId', userId)
        .where('squadId', squadId)
        .first()

      if (existingMembership) {
        if (existingMembership.isActive) {
          return response.status(400).json({
            status: 'error',
            message: 'Usuário já pertence a este squad'
          })
        } else {
          // Reativar membership
          await existingMembership.merge({ 
            isActive: true, 
            role: role || 'member',
            joinedAt: DateTime.now()
          }).save()
        }
      } else {
        // Criar nova membership
        await UserSquad.create({
          userId,
          squadId,
          groupId,
          role: role || 'member',
          isActive: true,
          joinedAt: DateTime.now()
        })
      }

      return response.json({
        status: 'success',
        message: 'Usuário adicionado ao squad com sucesso'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao adicionar usuário ao squad',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Buscar usuário específico
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const userId = params.id

      const user = await User.query()
        .where('id', userId)
        .preload('groups', (query) => {
          query.pivotColumns(['level', 'is_active', 'joined_at'])
            .wherePivot('is_active', true)
        })
        .preload('squads', (query) => {
          query.pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
            .wherePivot('is_active', true)
        })
        .firstOrFail()

      // Verificar se pode visualizar este usuário
      if (!currentUser.isSuperAdmin && currentUser.id !== user.id) {
        // Verificar se compartilham algum grupo
        const userGroups = await user.getActiveGroups()
        const currentUserGroups = await currentUser.getActiveGroups()
        
        const hasSharedGroup = userGroups.some((ug: any) => 
          currentUserGroups.some((cug: any) => cug.id === ug.id)
        )

        if (!hasSharedGroup) {
          return response.status(403).json({
            status: 'error',
            message: 'Você não tem permissão para visualizar este usuário'
          })
        }
      }

      return response.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            name: user.fullName, // Incluir alias
            email: user.email,
            level: user.level,
            levelName: user.getLevelName(),
            isActive: user.isActive,
            isAdmin: user.level === 2, // Calcular isAdmin
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            groups: user.groups,
            squads: user.squads
          }
        }
      })
    } catch (error) {
      return response.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      })
    }
  }

  /**
   * Atualizar usuário
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const userId = params.id
      
      // Passar o ID do usuário no contexto da validação
      const payload = await request.validateUsing(updateUserValidator, {
        meta: { userId: parseInt(userId) }
      })

      const targetUser = await User.findOrFail(userId)

      // Verificar permissão para atualizar
      if (!currentUser.isSuperAdmin && currentUser.id !== targetUser.id) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para atualizar este usuário'
        })
      }

      // Processar os dados antes de aplicar
      const updateData: any = {}
      
      // Tratar name como alias para fullName
      if (payload.name) {
        updateData.fullName = payload.name
      } else if (payload.fullName) {
        updateData.fullName = payload.fullName
      }
      
      // Outros campos
      if (payload.email !== undefined) updateData.email = payload.email
      if (payload.isActive !== undefined) updateData.isActive = payload.isActive
      
      // Tratar isAdmin (converte para level)
      if (payload.isAdmin !== undefined) {
        console.log('Payload isAdmin:', payload.isAdmin)
        updateData.level = payload.isAdmin ? payload.isAdmin : 0 // 2 = Superadmin 1 = admin, 0 = membro
        //updateData.isAdmin = updateData.level > 0 ? true : false

      } 
      // Verificar se pode alterar o nível global
      if (updateData.level !== undefined && updateData.level > currentUser.level) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não pode definir um nível superior ao seu'
        })
      }

      // Não permitir que usuário desative a si mesmo
      if (updateData.isActive === false && targetUser.id === currentUser.id) {
        return response.status(400).json({
          status: 'error',
          message: 'Você não pode desativar sua própria conta'
        })
      }

      if(updateData.isActive !== undefined && !updateData.isActive) {
        updateData.isActive = payload.isActive
      }



      await targetUser.merge(updateData).save()

      return response.json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: {
          user: {
            id: targetUser.id,
            fullName: targetUser.fullName,
            name: targetUser.fullName, // Incluir alias
            email: targetUser.email,
            level: targetUser.level,
            levelName: targetUser.getLevelName(),
            isActive: targetUser.isActive,
            isAdmin: targetUser.level > 0, // Calcular isAdmin
            createdAt: targetUser.createdAt,
            updatedAt: targetUser.updatedAt
          }
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao atualizar usuário',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Exclusão lógica de usuário (desativa e remove de grupos/squads)
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const userId = params.id
      
      const targetUser = await User.findOrFail(userId)
      
      // Verificar permissão - apenas super admins ou o próprio usuário pode excluir
      if (!currentUser.isSuperAdmin && currentUser.id !== targetUser.id) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para excluir este usuário'
        })
      }
      
      // Verificar se não está tentando excluir a si mesmo (apenas admins podem)
      if (targetUser.id === currentUser.id && !currentUser.isSuperAdmin) {
        return response.status(400).json({
          status: 'error',
          message: 'Você não pode excluir sua própria conta'
        })
      }
      
      // Usar transação para garantir consistência
      await Database.transaction(async (trx) => {
        // Invalidar todos os tokens de acesso do usuário antes de desativar
        await trx.from('auth_access_tokens').where('tokenable_id', targetUser.id).delete()
        
        // Desativar usuário
        await targetUser
          .useTransaction(trx)
          .merge({ isActive: false })
          .save()
        
        // Remover de todos os grupos (desativar relacionamentos)
        await trx
          .from('user_groups')
          .where('user_id', targetUser.id)
          .update({ is_active: false, created_at: DateTime.now().toSQL() })
        
        // Remover de todos os squads (desativar relacionamentos)
        await trx
          .from('user_squads')
          .where('user_id', targetUser.id)
          .update({ is_active: false, created_at: DateTime.now().toSQL() })
      })
      
      return response.json({
        status: 'success',
        message: 'Usuário desativado e removido de todos os grupos e squads com sucesso',
        data: {
          userId: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
          deactivatedAt: new Date().toISOString()
        }
      })
      
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao excluir usuário',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Remover usuário de um grupo
   */
  async removeFromGroup({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const { userId, groupId } = params

      // Verificar permissão
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para gerenciar este grupo'
        })
      }

      // Não permitir que usuário remova a si mesmo
      if (currentUser.id == userId) {
        return response.status(400).json({
          status: 'error',
          message: 'Você não pode remover a si mesmo do grupo'
        })
      }

      const userGroup = await UserGroup.query()
        .where('userId', userId)
        .where('groupId', groupId)
        .firstOrFail()

      await userGroup.merge({ isActive: false }).save()

      // Também remover de todos os squads deste grupo
      await UserSquad.query()
        .where('userId', userId)
        .where('groupId', groupId)
        .update({ isActive: false })

      return response.json({
        status: 'success',
        message: 'Usuário removido do grupo com sucesso'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao remover usuário do grupo'
      })
    }
  }

  /**
   * Alterar própria senha ou senha de outro usuário (admin)
   */
  async changePassword({ auth, params, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const targetUserId = params.id || currentUser.id // Se não especificado, altera própria senha
      
      let payload: any

      if (targetUserId === currentUser.id.toString()) {
        // Alterando própria senha - requer senha atual
        payload = await request.validateUsing(changePasswordValidator)
        
        // Verificar senha atual
        const isValidPassword = await hash.verify(currentUser.password, payload.currentPassword)
        if (!isValidPassword) {
          return response.status(400).json({
            status: 'error',
            message: 'Senha atual incorreta'
          })
        }
      } else {
        // Admin alterando senha de outro usuário - não requer senha atual
        if (!currentUser.isSuperAdmin) {
          return response.status(403).json({
            status: 'error',
            message: 'Apenas super administradores podem alterar senhas de outros usuários'
          })
        }
        
        // Validar apenas a nova senha
        payload = { newPassword: request.input('newPassword') }
        if (!payload.newPassword || payload.newPassword.length < 8) {
          return response.status(400).json({
            status: 'error',
            message: 'Nova senha deve ter pelo menos 8 caracteres'
          })
        }
      }

      const targetUser = await User.findOrFail(targetUserId)

      // Atualizar senha
      await targetUser.merge({ password: payload.newPassword }).save()
      
      // Invalidar todos os tokens de acesso existentes por segurança
      await Database.from('auth_access_tokens').where('tokenable_id', targetUser.id).delete()

      return response.json({
        status: 'success',
        message: targetUserId === currentUser.id.toString() 
          ? 'Senha alterada com sucesso. Faça login novamente para obter um novo token.'
          : `Senha do usuário ${targetUser.fullName || targetUser.email} alterada com sucesso.`,
        data: {
          userId: targetUser.id,
          email: targetUser.email,
          requiresReauth: true
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao alterar senha',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Solicitar recuperação de senha
   */
  async requestPasswordReset({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(requestPasswordResetValidator)

      const user = await User.findBy('email', email)
      if (!user || !user.isActive) {
        return response.json({
          status: 'success',
          message: 'Se o email existe, um link de recuperação foi enviado'
        })
      }

      // Gerar token de recuperação
      const resetToken = randomBytes(32).toString('hex')
      const resetExpires = DateTime.now().plus({ hours: 1 })

      await user.merge({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }).save()

      // Enviar email de recuperação
      const mailService = new MailService()
      await mailService.sendPasswordResetEmail(user, resetToken)

      return response.json({
        status: 'success',
        message: 'Link de recuperação enviado para o email'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao solicitar recuperação de senha'
      })
    }
  }

  /**
   * Redefinir senha com token
   */
  async resetPassword({ request, response }: HttpContext) {
    try {
      const { token, newPassword } = await request.validateUsing(resetPasswordValidator)

      const user = await User.query()
        .where('passwordResetToken', token)
        .where('passwordResetExpires', '>', DateTime.now().toSQL())
        .first()

      if (!user) {
        return response.status(400).json({
          status: 'error',
          message: 'Token inválido ou expirado'
        })
      }

      // Atualizar senha e limpar token
      await user.merge({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }).save()

      return response.json({
        status: 'success',
        message: 'Senha redefinida com sucesso'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao redefinir senha',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Listar grupos do usuário atual
   */
  async getMyGroups({ auth, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groups = await currentUser.getActiveGroups()

      return response.json({
        status: 'success',
        data: { groups }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar grupos'
      })
    }
  }

  /**
   * Listar squads do usuário atual em um grupo específico
   */
  async getMySquads({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = params.groupId

      // Verificar se pertence ao grupo
      if (!await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não pertence a este grupo'
        })
      }

      const squads = await currentUser.getActiveSquads(groupId)

      return response.json({
        status: 'success',
        data: { squads }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar squads'
      })
    }
  }

  /**
   * Listar todos os grupos (apenas super admin)
   */
  async getAllGroups({ auth, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      
      if (!currentUser.isSuperAdmin) {
        return response.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        })
      }

      const groups = await Group.query()
        .where('isActive', true)
        .orderBy('name', 'asc')

      return response.json({
        status: 'success',
        data: { groups }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar grupos'
      })
    }
  }

  /**
   * Listar squads de um grupo específico
   */
  async getSquads({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = params.groupId

      // Verificar acesso ao grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Acesso negado a este grupo'
        })
      }

      const squads = await Squad.query()
        .where('groupId', groupId)
        .where('isActive', true)
        .orderBy('name', 'asc')

      return response.json({
        status: 'success',
        data: { squads }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar squads'
      })
    }
  }
}