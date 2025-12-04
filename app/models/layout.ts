import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Layout extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare content: string // Conteúdo original do texto/lauda

  @column()
  declare suggestedLayout: string | null // Layout sugerido pela IA em formato HTML ou JSON

  @column()
  declare layoutType: 'email' | 'newsletter' | 'marketing' // Tipo de layout

  @column()
  declare status: 'draft' | 'processing' | 'completed' | 'failed' // Status do processamento

  @column()
  declare metadata: any | null // Dados adicionais como parâmetros da IA, preferências, etc.

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}