import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
      table.integer('level').defaultTo(0).notNullable() // Nível do usuário nesta organização
      table.boolean('is_active').defaultTo(true)
      table.timestamp('joined_at').defaultTo(this.now())
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Índice único para evitar duplicação
      table.unique(['user_id', 'group_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}