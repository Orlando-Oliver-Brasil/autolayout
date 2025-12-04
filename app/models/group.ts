import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Squad from './squad.js'
import UserGroup from './user_group.js'

export default class Group extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos diretos
  @hasMany(() => Squad)
  declare squads: HasMany<typeof Squad>

  @hasMany(() => UserGroup)
  declare userGroups: HasMany<typeof UserGroup>

  // Relacionamentos many-to-many
  @manyToMany(() => User, {
    pivotTable: 'user_groups',
    localKey: 'id',
    pivotForeignKey: 'group_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['level', 'is_active', 'joined_at']
  })
  declare users: ManyToMany<typeof User>

  // Métodos auxiliares
  public async getActiveUsers() {
    return await User.query()
      .whereHas('groups', (query) => {
        query.where('groups.id', this.id)
          .wherePivot('is_active', true)
      })
      .preload('groups', (query) => {
        query.where('groups.id', this.id)
          .pivotColumns(['level', 'is_active', 'joined_at'])
      })
  }

  public async getAdmins() {
    return await User.query()
      .whereHas('groups', (query) => {
        query.where('groups.id', this.id)
          .wherePivot('is_active', true)
          .wherePivot('level', '>=', 1)
      })
      .preload('groups', (query) => {
        query.where('groups.id', this.id)
          .pivotColumns(['level', 'is_active', 'joined_at'])
      })
  }

  public async getActiveSquads() {
    return await Squad.query()
      .where('group_id', this.id)
      .where('is_active', true)
      .orderBy('name', 'asc')
  }

  // Métodos de contagem
  public async getUserCount(): Promise<number> {
    const result = await User.query()
      .whereHas('groups', (query) => {
        query.where('groups.id', this.id)
          .wherePivot('is_active', true)
      })
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  public async getSquadCount(): Promise<number> {
    const result = await Squad.query()
      .where('group_id', this.id)
      .where('is_active', true)
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  // Métodos de verificação
  public async hasUser(userId: number): Promise<boolean> {
    const userGroup = await UserGroup.query()
      .where('user_id', userId)
      .where('group_id', this.id)
      .where('is_active', true)
      .first()
    
    return !!userGroup
  }

  public async getUserLevel(userId: number): Promise<number | null> {
    const userGroup = await UserGroup.query()
      .where('user_id', userId)
      .where('group_id', this.id)
      .where('is_active', true)
      .first()
    
    return userGroup?.level ?? null
  }

  // Métodos de estatísticas
  public async getStats() {
    const [userCount, squadCount, adminCount] = await Promise.all([
      this.getUserCount(),
      this.getSquadCount(),
      User.query()
        .whereHas('groups', (query) => {
          query.where('groups.id', this.id)
            .wherePivot('is_active', true)
            .wherePivot('level', '>=', 1)
        })
        .count('* as total')
        .then(result => Number(result[0].$extras.total))
    ])

    return {
      totalUsers: userCount,
      totalSquads: squadCount,
      totalAdmins: adminCount,
      totalMembers: userCount - adminCount
    }
  }
}