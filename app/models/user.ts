import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Layout from './layout.js'
import Group from './group.js'
import Squad from './squad.js'
import UserGroup from './user_group.js'
import UserSquad from './user_squad.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare level: number // Nível global padrão do usuário

  @column()
  declare isActive: boolean

  @column({ serializeAs: null })
  declare passwordResetToken: string | null

  @column.dateTime({ serializeAs: null })
  declare passwordResetExpires: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos diretos
  @hasMany(() => Layout)
  declare layouts: HasMany<typeof Layout>

  @hasMany(() => UserGroup)
  declare userGroups: HasMany<typeof UserGroup>

  @hasMany(() => UserSquad)
  declare userSquads: HasMany<typeof UserSquad>

  // Relacionamentos many-to-many
  @manyToMany(() => Group, {
    pivotTable: 'user_groups',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'group_id',
    pivotColumns: ['level', 'is_active', 'joined_at']
  })
  declare groups: ManyToMany<typeof Group>

  @manyToMany(() => Squad, {
    pivotTable: 'user_squads',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'squad_id',
    pivotColumns: ['group_id', 'role', 'is_active', 'joined_at']
  })
  declare squads: ManyToMany<typeof Squad>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  // Métodos auxiliares para níveis globais
  public get isMember(): boolean {
    return this.level === 0
  }

  public get isAdmin(): boolean {
    return this.level === 1
  }

  public get isSuperAdmin(): boolean {
    return this.level === 2
  }

  public getLevelName(): string {
    const levels = ['Membro', 'Administrador', 'Super Administrador']
    return levels[this.level] || 'Desconhecido'
  }

  // Métodos para verificar permissões específicas de organização
  public async canManageUserInGroup(targetUser: User, groupId: number): Promise<boolean> {
    // Super admin global pode gerenciar qualquer usuário
    if (this.isSuperAdmin) {
      return true
    }

    // Verificar se ambos usuários pertencem ao grupo
    const currentUserGroup = await UserGroup.query()
      .where('user_id', this.id)
      .where('group_id', groupId)
      .where('is_active', true)
      .first()

    const targetUserGroup = await UserGroup.query()
      .where('user_id', targetUser.id)
      .where('group_id', groupId)
      .where('is_active', true)
      .first()

    if (!currentUserGroup || !targetUserGroup) {
      return false
    }

    // Admin de grupo pode gerenciar membros e outros admins do mesmo grupo
    if (currentUserGroup.isAdmin || currentUserGroup.isSuperAdmin) {
      return currentUserGroup.level >= targetUserGroup.level
    }

    // Membro só pode gerenciar a si mesmo
    return this.id === targetUser.id
  }

  public async canManageUserInSquad(targetUser: User, squadId: number): Promise<boolean> {
    // Super admin global pode gerenciar qualquer usuário
    if (this.isSuperAdmin) {
      return true
    }

    // Verificar se ambos usuários pertencem ao squad
    const currentUserSquad = await UserSquad.query()
      .where('user_id', this.id)
      .where('squad_id', squadId)
      .where('is_active', true)
      .first()

    const targetUserSquad = await UserSquad.query()
      .where('user_id', targetUser.id)
      .where('squad_id', squadId)
      .where('is_active', true)
      .first()

    if (!currentUserSquad || !targetUserSquad) {
      return false
    }

    // Verificar permissão no nível do grupo
    const canManageInGroup = await this.canManageUserInGroup(targetUser, currentUserSquad.groupId)
    if (canManageInGroup) {
      return true
    }

    // Leader do squad pode gerenciar membros do squad
    if (currentUserSquad.isLeader) {
      return true
    }

    // Membro só pode gerenciar a si mesmo
    return this.id === targetUser.id
  }

  // Métodos para obter grupos e squads ativos
  public async getActiveGroups() {
    return await Group.query()
      .whereHas('users', (query) => {
        query.where('users.id', this.id)
          .wherePivot('is_active', true)
      })
      .preload('users', (query) => {
        query.where('users.id', this.id)
          .pivotColumns(['level', 'is_active', 'joined_at'])
      })
  }

  public async getActiveSquads(groupId?: number) {
    let query = Squad.query()
      .whereHas('users', (subQuery) => {
        subQuery.where('users.id', this.id)
          .wherePivot('is_active', true)
        if (groupId) {
          subQuery.wherePivot('group_id', groupId)
        }
      })
      .preload('users', (subQuery) => {
        subQuery.where('users.id', this.id)
          .pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
      })

    return await query
  }

  // Método para verificar se usuário pertence a um grupo específico
  public async belongsToGroup(groupId: number): Promise<boolean> {
    const userGroup = await UserGroup.query()
      .where('user_id', this.id)
      .where('group_id', groupId)
      .where('is_active', true)
      .first()

    return !!userGroup
  }

  // Método para verificar se usuário pertence a um squad específico
  public async belongsToSquad(squadId: number): Promise<boolean> {
    const userSquad = await UserSquad.query()
      .where('user_id', this.id)
      .where('squad_id', squadId)
      .where('is_active', true)
      .first()

    return !!userSquad
  }

  // Métodos de níveis e papeis específicos
  public async getGroupLevel(groupId: number): Promise<number | null> {
    const userGroup = await UserGroup.query()
      .where('user_id', this.id)
      .where('group_id', groupId)
      .where('is_active', true)
      .first()

    return userGroup?.level ?? null
  }

  public async getSquadRole(squadId: number): Promise<string | null> {
    const userSquad = await UserSquad.query()
      .where('user_id', this.id)
      .where('squad_id', squadId)
      .where('is_active', true)
      .first()

    return userSquad?.role ?? null
  }

  public async isGroupAdmin(groupId: number): Promise<boolean> {
    const level = await this.getGroupLevel(groupId)
    return level !== null && level >= 1
  }

  public async isSquadLeader(squadId: number): Promise<boolean> {
    const role = await this.getSquadRole(squadId)
    return role === 'leader'
  }

  // Métodos de contagem
  public async getGroupCount(): Promise<number> {
    const result = await UserGroup.query()
      .where('user_id', this.id)
      .where('is_active', true)
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  public async getSquadCount(groupId?: number): Promise<number> {
    let query = UserSquad.query()
      .where('user_id', this.id)
      .where('is_active', true)
    
    if (groupId) {
      query = query.where('group_id', groupId)
    }
    
    const result = await query.count('* as total')
    return Number(result[0].$extras.total)
  }

  public async getLayoutCount(): Promise<number> {
    const result = await Layout.query()
      .where('user_id', this.id)
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  // Métodos de estatísticas
  public async getStats() {
    const [groupCount, squadCount, layoutCount] = await Promise.all([
      this.getGroupCount(),
      this.getSquadCount(),
      this.getLayoutCount()
    ])

    return {
      user: {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        level: this.level,
        levelName: this.getLevelName(),
        isActive: this.isActive,
        createdAt: this.createdAt
      },
      counts: {
        groups: groupCount,
        squads: squadCount,
        layouts: layoutCount
      }
    }
  }

  // Métodos de validação
  public isValidForLogin(): boolean {
    return this.isActive && !!this.email && !!this.password
  }

  public canCreateGroup(): boolean {
    return this.isSuperAdmin
  }

  public canCreateLayout(): boolean {
    return this.isActive
  }

  // Método para serialização pública (sem dados sensíveis)
  public toPublicJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      level: this.level,
      levelName: this.getLevelName(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}