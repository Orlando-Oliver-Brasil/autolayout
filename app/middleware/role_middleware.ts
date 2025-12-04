import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para verificar nível de acesso do usuário
 */
export default class RoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      level?: number // Nível mínimo necessário
      levels?: number[] // Níveis específicos permitidos
    } = {}
  ) {
    const user = ctx.auth.user!

    if (!user) {
      return ctx.response.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado'
      })
    }

    if (!user.isActive) {
      return ctx.response.status(403).json({
        status: 'error',
        message: 'Usuário inativo'
      })
    }

    // Verificar nível específico
    if (options.level !== undefined && user.level < options.level) {
      return ctx.response.status(403).json({
        status: 'error',
        message: 'Nível de acesso insuficiente',
        required: options.level,
        current: user.level
      })
    }

    // Verificar níveis específicos
    if (options.levels && !options.levels.includes(user.level)) {
      return ctx.response.status(403).json({
        status: 'error',
        message: 'Nível de acesso não autorizado',
        allowed: options.levels,
        current: user.level
      })
    }

    return next()
  }
}