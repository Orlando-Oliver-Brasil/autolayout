import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware de debug para verificar tokens de autenticação
 */
export default class DebugAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    console.log('🔍 Debug Auth Middleware')
    console.log('URL:', ctx.request.url())
    console.log('Method:', ctx.request.method())
    console.log('Headers Authorization:', ctx.request.header('authorization'))
    console.log('Headers:', ctx.request.headers())
    
    try {
      await next()
    } catch (error) {
      console.log('❌ Erro no middleware:', error.message)
      throw error
    }
  }
}