import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Criar usuário de teste
    await User.firstOrCreate(
      { email: 'admin@autolayout.com' },
      {
        fullName: 'Administrador',
        email: 'admin@autolayout.com',
        password: 'password123',
        level: 2, // Super admin
        isActive: true
      }
    )

    await User.firstOrCreate(
      { email: 'user@autolayout.com' },
      {
        fullName: 'Usuário Teste',
        email: 'user@autolayout.com',
        password: 'password123',
        level: 0, // Usuário comum
        isActive: true
      }
    )

    await User.firstOrCreate(
      { email: 'manager@autolayout.com' },
      {
        fullName: 'Gerente Teste',
        email: 'manager@autolayout.com',
        password: 'password123',
        level: 1, // Admin
        isActive: true
      }
    )
  }
}