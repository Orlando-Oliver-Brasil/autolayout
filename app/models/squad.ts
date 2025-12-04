import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Group from './group.js'
import UserSquad from './user_squad.js'

export default class Squad extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare groupId: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos diretos
  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @hasMany(() => UserSquad)
  declare userSquads: HasMany<typeof UserSquad>

  // Relacionamentos many-to-many
  @manyToMany(() => User, {
    pivotTable: 'user_squads',
    localKey: 'id',
    pivotForeignKey: 'squad_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['group_id', 'role', 'is_active', 'joined_at']
  })
  declare users: ManyToMany<typeof User>

  // Métodos auxiliares
  public async getActiveUsers() {
    return await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
      })
      .preload('squads', (query) => {
        query.where('squads.id', this.id)
          .pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
      })
  }

  public async getLeaders() {
    return await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
          .wherePivot('role', 'leader')
      })
      .preload('squads', (query) => {
        query.where('squads.id', this.id)
          .pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
      })
  }

  public async getMembers() {
    return await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
          .wherePivot('role', 'member')
      })
      .preload('squads', (query) => {
        query.where('squads.id', this.id)
          .pivotColumns(['group_id', 'role', 'is_active', 'joined_at'])
      })
  }

  // Métodos de contagem
  public async getUserCount(): Promise<number> {
    const result = await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
      })
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  public async getLeaderCount(): Promise<number> {
    const result = await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
          .wherePivot('role', 'leader')
      })
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  public async getMemberCount(): Promise<number> {
    const result = await User.query()
      .whereHas('squads', (query) => {
        query.where('squads.id', this.id)
          .wherePivot('is_active', true)
          .wherePivot('role', 'member')
      })
      .count('* as total')
    
    return Number(result[0].$extras.total)
  }

  // Métodos de verificação
  public async hasUser(userId: number): Promise<boolean> {
    const userSquad = await UserSquad.query()
      .where('user_id', userId)
      .where('squad_id', this.id)
      .where('is_active', true)
      .first()
    
    return !!userSquad
  }

  public async getUserRole(userId: number): Promise<string | null> {
    const userSquad = await UserSquad.query()
      .where('user_id', userId)
      .where('squad_id', this.id)
      .where('is_active', true)
      .first()
    
    return userSquad?.role ?? null
  }

  public async isUserLeader(userId: number): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'leader'
  }

  // Métodos de estatísticas
  public async getStats() {
    const [totalUsers, totalLeaders, totalMembers] = await Promise.all([
      this.getUserCount(),
      this.getLeaderCount(),
      this.getMemberCount()
    ])

    return {
      totalUsers,
      totalLeaders,
      totalMembers,
      groupId: this.groupId
    }
  }

  // Métodos de relacionamento com grupo
  public async loadGroupInfo() {
    const group = await Group.findOrFail(this.groupId)
    return {
      squad: {
        id: this.id,
        name: this.name,
        description: this.description,
        isActive: this.isActive
      },
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      }
    }
  }
}