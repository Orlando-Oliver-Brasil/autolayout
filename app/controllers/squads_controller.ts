import type { HttpContext } from '@adonisjs/core/http'
import Squad from '#models/squad'
import { createSquadValidator, updateSquadValidator } from '#validators/user'

export default class SquadsController {
  /**
   * Listar squads de um grupo
   */
  async index({ auth, params, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = parseInt(params.groupId)
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      if (isNaN(groupId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do grupo inválido'
        })
      }

      // Verificar acesso ao grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem acesso aos squads deste grupo'
        })
      }

      const squadsPaginated = await Squad.query()
        .where('groupId', groupId)
        .where('isActive', true)
        .preload('users', (query) => {
          query.pivotColumns(['role', 'is_active', 'joined_at'])
            .wherePivot('is_active', true)
        })
        .preload('group')
        .orderBy('name', 'asc')
        .paginate(page, limit)

      const squadsData = squadsPaginated.serialize()
      
      // Formatar dados dos squads
      const formattedSquads = squadsData.data.map((squad: any) => ({
        id: squad.id,
        name: squad.name,
        description: squad.description,
        groupId: squad.groupId,
        isActive: squad.isActive,
        createdAt: squad.createdAt,
        updatedAt: squad.updatedAt,
        usersCount: squad.users?.length || 0,
        users: squad.users || [],
        group: squad.group
      }))

      return response.json({
        status: 'success',
        data: {
          squads: formattedSquads,
          meta: squadsData.meta
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar squads',
        errors: error.message
      })
    }
  }

  /**
   * Criar squad
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const payload = await request.validateUsing(createSquadValidator)

      // Verificar se pode criar squad neste grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(payload.groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para criar squads neste grupo'
        })
      }

      const squad = await Squad.create({
        ...payload,
        isActive: true
      })

      // Carregar relacionamentos
      await squad.load('group')

      // Formatar resposta do squad criado
      const formattedSquad = {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        groupId: squad.groupId,
        isActive: squad.isActive,
        createdAt: squad.createdAt,
        updatedAt: squad.updatedAt,
        usersCount: 0,
        group: squad.group
      }

      return response.status(201).json({
        status: 'success',
        message: 'Squad criado com sucesso',
        data: { squad: formattedSquad }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao criar squad',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Buscar squad específico
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const squadId = parseInt(params.id)
      
      if (isNaN(squadId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do squad inválido'
        })
      }

      const squad = await Squad.query()
        .where('id', squadId)
        .where('isActive', true)
        .preload('users', (query) => {
          query.pivotColumns(['role', 'is_active', 'joined_at'])
            .wherePivot('is_active', true)
        })
        .preload('group')
        .first()
      
      if (!squad) {
        return response.status(404).json({
          status: 'error',
          message: 'Squad não encontrado'
        })
      }

      // Verificar acesso ao squad
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(squad.groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem acesso a este squad'
        })
      }

      // Formatar dados do squad
      const formattedSquad = {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        groupId: squad.groupId,
        isActive: squad.isActive,
        createdAt: squad.createdAt,
        updatedAt: squad.updatedAt,
        usersCount: squad.users?.length || 0,
        users: squad.users || [],
        group: squad.group
      }

      return response.json({
        status: 'success',
        data: { squad: formattedSquad }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao buscar squad',
        errors: error.message
      })
    }
  }

  /**
   * Atualizar squad
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const squadId = parseInt(params.id)
      
      if (isNaN(squadId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do squad inválido'
        })
      }

      const squad = await Squad.find(squadId)
      
      if (!squad) {
        return response.status(404).json({
          status: 'error',
          message: 'Squad não encontrado'
        })
      }

      // Verificar permissão
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(squad.groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para atualizar este squad'
        })
      }

      const payload = await request.validateUsing(updateSquadValidator)
      await squad.merge(payload).save()

      // Formatar resposta do squad atualizado
      const formattedSquad = {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        groupId: squad.groupId,
        isActive: squad.isActive,
        createdAt: squad.createdAt,
        updatedAt: squad.updatedAt
      }

      return response.json({
        status: 'success',
        message: 'Squad atualizado com sucesso',
        data: { squad: formattedSquad }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao atualizar squad',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Desativar squad
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const squadId = parseInt(params.id)
      
      if (isNaN(squadId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do squad inválido'
        })
      }

      const squad = await Squad.find(squadId)
      
      if (!squad) {
        return response.status(404).json({
          status: 'error',
          message: 'Squad não encontrado'
        })
      }

      // Verificar permissão
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(squad.groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para desativar este squad'
        })
      }

      await squad.merge({ isActive: false }).save()

      return response.json({
        status: 'success',
        message: 'Squad desativado com sucesso',
        data: {
          squadId: squad.id,
          name: squad.name,
          groupId: squad.groupId,
          deactivatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao desativar squad',
        errors: error.message
      })
    }
  }
}