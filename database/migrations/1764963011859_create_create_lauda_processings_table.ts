import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lauda_processings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Dados da requisição
      table.text('lauda_content').notNullable()
      table.string('user_id').nullable()
      table.string('status').defaultTo('pending') // pending, processing, completed, failed
      
      // Resultados das etapas
      table.json('assistant_1_result').nullable()
      table.json('assistant_2_result').nullable()
      table.json('assistant_3_result').nullable()
      table.json('final_layout').nullable()
      
      // Metadados de processamento
      table.integer('processing_time_ms').nullable()
      table.string('error_message').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('completed_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Índices
      table.index('status')
      table.index('user_id')
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}