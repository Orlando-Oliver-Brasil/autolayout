import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Registra um novo usuário
   */
  async register({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerValidator)
      
      const user = await User.create(payload)
      
      return response.status(201).json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email
          }
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao criar usuário',
        errors: error.messages || error.message
      })
    }
  }

  /**
   * Faz login do usuário e retorna token
   */
  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)

      const user = await User.verifyCredentials(email, password)
      
      // Verificar se o usuário está ativo
      if (!user.isActive) {
        return response.status(401).json({
          status: 'error',
          message: 'Conta desativada. Entre em contato com o administrador.'
        })
      }
      
      // Invalidar todos os tokens existentes do usuário antes de criar um novo
      const existingTokens = await User.accessTokens.all(user)
      await Promise.all(existingTokens.map(token => 
        User.accessTokens.delete(user, token.identifier)
      ))
      
      const token = await User.accessTokens.create(user, ['*'], {
        name: 'auth_token',
        expiresIn: '7 days'
      })

      return response.json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email
          },
          token: {
            type: 'bearer',
            token: token.value!.release()
          }
        }
      })
    } catch (error) {
      return response.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas ou conta desativada'
      })
    }
  }

  /**
   * Logout do usuário
   */
  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)

      return response.json({
        status: 'success',
        message: 'Logout realizado com sucesso'
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao fazer logout'
      })
    }
  }

  /**
   * Retorna informações do usuário autenticado
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

      return response.json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      })
    } catch (error) {
      return response.status(400).json({
        status: 'error',
        message: 'Erro ao buscar informações do usuário'
      })
    }
  }
}