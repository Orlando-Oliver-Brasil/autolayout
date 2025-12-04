import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_squads'

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
        .integer('squad_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('squads')
        .onDelete('CASCADE')
      table
        .integer('group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
      table.string('role').defaultTo('member') // Papel no squad (member, leader, etc.)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('joined_at').defaultTo(this.now())
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Índices únicos
      table.unique(['user_id', 'squad_id'])
      table.index(['group_id']) // Para consultas por grupo
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}