import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Squad from './squad.js'
import Group from './group.js'

export default class UserSquad extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare squadId: number

  @column()
  declare groupId: number // Para garantir consistência

  @column()
  declare role: string // Papel no squad (member, leader, etc.)

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Squad)
  declare squad: BelongsTo<typeof Squad>

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  // Métodos auxiliares
  public get isLeader(): boolean {
    return this.role === 'leader'
  }

  public get isMember(): boolean {
    return this.role === 'member'
  }
}