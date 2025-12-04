import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('level').defaultTo(0).notNullable() // Nível global padrão do usuário
      table.boolean('is_active').defaultTo(true)
      table.string('password_reset_token').nullable()
      table.timestamp('password_reset_expires').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('level')
      table.dropColumn('is_active')
      table.dropColumn('password_reset_token')
      table.dropColumn('password_reset_expires')
    })
  }
}