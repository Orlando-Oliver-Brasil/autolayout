import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class LaudaProcessing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare laudaContent: string

  @column()
  declare userId: string | null

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed'

  @column({
    serialize: (value: string | null) => {
      if (!value) return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    },
    prepare: (value: Record<string, any> | null) => {
      return value ? JSON.stringify(value) : null
    }
  })
  declare assistant1Result: Record<string, any> | null

  @column({
    serialize: (value: string | null) => {
      if (!value) return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    },
    prepare: (value: Record<string, any> | null) => {
      return value ? JSON.stringify(value) : null
    }
  })
  declare assistant2Result: Record<string, any> | null

  @column({
    serialize: (value: string | null) => {
      if (!value) return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    },
    prepare: (value: Record<string, any> | null) => {
      return value ? JSON.stringify(value) : null
    }
  })
  declare assistant3Result: Record<string, any> | null

  @column({
    serialize: (value: string | null) => {
      if (!value) return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    },
    prepare: (value: Record<string, any> | null) => {
      return value ? JSON.stringify(value) : null
    }
  })
  declare finalLayout: Record<string, any> | null

  @column()
  declare processingTimeMs: number | null

  @column()
  declare errorMessage: string | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}