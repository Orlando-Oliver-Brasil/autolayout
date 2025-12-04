import type { HttpContext } from '@adonisjs/core/http'
import Group from '#models/group'
import { createGroupValidator, updateGroupValidator } from '#validators/user'

export default class GroupsController {
  /**
   * Listar grupos
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      let query = Group.query().where('isActive', true)

      // Se não for super admin, mostrar apenas grupos onde o usuário participa
      if (!currentUser.isSuperAdmin) {
        const userGroups = await currentUser.getActiveGroups()
        const groupIds = userGroups.map((g: any) => g.id)
        
        if (groupIds.length === 0) {
          return response.json({
            status: 'success',
            data: {
              groups: [],
              meta: { total: 0, page: 1, perPage: limit, lastPage: 1 }
            }
          })
        }
        
        query = query.whereIn('id', groupIds)
      }

      const groupsPaginated = await query
        .preload('users', (query) => {
          query.pivotColumns(['level', 'is_active', 'joined_at'])
            .wherePivot('is_active', true)
        })
        .preload('squads', (query) => {
          query.where('isActive', true)
        })
        .orderBy('name', 'asc')
        .paginate(page, limit)

      const groupsData = groupsPaginated.serialize()
      
      // Formatar dados dos grupos
      const formattedGroups = groupsData.data.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        usersCount: group.users?.length || 0,
        squadsCount: group.squads?.length || 0,
        users: group.users || [],
        squads: group.squads || []
      }))

      return response.json({
        status: 'success',
        data: {
          groups: formattedGroups,
          meta: groupsData.meta
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao listar grupos',
        errors: error.message
      })
    }
  }

  /**
   * Criar grupo (apenas super admin)
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      
      // Verificar permissão
      if (!currentUser.isSuperAdmin) {
        return response.status(403).json({
          status: 'error',
          message: 'Apenas super administradores podem criar grupos'
        })
      }
      
      const payload = await request.validateUsing(createGroupValidator)
      const group = await Group.create({
        ...payload,
        isActive: true
      })

      // Formatar resposta do grupo criado
      const formattedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        usersCount: 0,
        squadsCount: 0
      }

      return response.status(201).json({
        status: 'success',
        message: 'Grupo criado com sucesso',
        data: { group: formattedGroup }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao criar grupo',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Buscar grupo específico
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = parseInt(params.groupId)
      
      if (isNaN(groupId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do grupo inválido'
        })
      }
      
      // Verificar se o grupo existe e se o usuário tem acesso
      const group = await Group.query()
        .where('id', groupId)
        .where('isActive', true)
        .first()
      
      if (!group) {
        return response.status(404).json({
          status: 'error',
          message: 'Grupo não encontrado'
        })
      }
      
      // Se não for super admin, verificar se pertence ao grupo
      if (!currentUser.isSuperAdmin && !await currentUser.belongsToGroup(groupId)) {
        return response.status(403).json({
          status: 'error',
          message: 'Você não tem acesso a este grupo'
        })
      }
      
      await group.load('users', (query: any) => {
        query.pivotColumns(['level', 'is_active', 'joined_at'])
          .wherePivot('is_active', true)
      })
      await group.load('squads', (query: any) => {
        query.where('isActive', true)
      })

      // Formatar dados do grupo
      const formattedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        usersCount: group.users?.length || 0,
        squadsCount: group.squads?.length || 0,
        users: group.users || [],
        squads: group.squads || []
      }

      return response.json({
        status: 'success',
        data: { group: formattedGroup }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao buscar grupo',
        errors: error.message
      })
    }
  }

  /**
   * Atualizar grupo (apenas super admin)
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = parseInt(params.groupId)
      
      if (isNaN(groupId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do grupo inválido'
        })
      }
      
      // Verificar permissão
      if (!currentUser.isSuperAdmin) {
        return response.status(403).json({
          status: 'error',
          message: 'Apenas super administradores podem atualizar grupos'
        })
      }
      
      const group = await Group.find(groupId)
      
      if (!group) {
        return response.status(404).json({
          status: 'error',
          message: 'Grupo não encontrado'
        })
      }
      
      // Passar o ID do grupo no contexto da validação
      const payload = await request.validateUsing(updateGroupValidator, {
        meta: { groupId: groupId }
      })
      
      await group.merge(payload).save()

      // Formatar resposta do grupo atualizado
      const formattedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }

      return response.json({
        status: 'success',
        message: 'Grupo atualizado com sucesso',
        data: { group: formattedGroup }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao atualizar grupo',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Desativar grupo (apenas super admin)
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const currentUser = auth.user!
      const groupId = parseInt(params.groupId)
      
      if (isNaN(groupId)) {
        return response.status(400).json({
          status: 'error',
          message: 'ID do grupo inválido'
        })
      }
      
      // Verificar permissão
      if (!currentUser.isSuperAdmin) {
        return response.status(403).json({
          status: 'error',
          message: 'Apenas super administradores podem desativar grupos'
        })
      }
      
      const group = await Group.find(groupId)
      
      if (!group) {
        return response.status(404).json({
          status: 'error',
          message: 'Grupo não encontrado'
        })
      }
      
      await group.merge({ isActive: false }).save()

      return response.json({
        status: 'success',
        message: 'Grupo desativado com sucesso',
        data: {
          groupId: group.id,
          name: group.name,
          deactivatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao desativar grupo',
        errors: error.message
      })
    }
  }
}