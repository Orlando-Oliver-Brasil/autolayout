import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'layouts'

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
      
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.text('content').notNullable()
      table.text('suggested_layout').nullable()
      table.enum('layout_type', ['email', 'newsletter', 'marketing']).defaultTo('email')
      table.enum('status', ['draft', 'processing', 'completed', 'failed']).defaultTo('draft')
      table.json('metadata').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}