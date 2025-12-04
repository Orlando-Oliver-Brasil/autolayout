import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Group from './group.js'

export default class UserGroup extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare groupId: number

  @column()
  declare level: number // Nível do usuário nesta organização (0: membro, 1: admin, 2: super admin)

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

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  // Métodos auxiliares
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
}