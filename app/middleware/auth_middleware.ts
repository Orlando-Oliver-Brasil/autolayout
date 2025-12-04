import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import logger from '@adonisjs/core/services/logger'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  
  private writeErrorLog(data: any) {
    const logDir = 'logs'
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    
    const logPath = join(logDir, 'auth-errors.log')
    const logLine = JSON.stringify(data) + '\n'
    
    try {
      writeFileSync(logPath, logLine, { flag: 'a' })
    } catch (error) {
      console.error('Failed to write auth error log:', error)
    }
  }

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const authHeader = ctx.request.header('authorization')
    
    logger.info('🔐 Auth Middleware - Iniciando autenticação', {
      url: ctx.request.url(),
      method: ctx.request.method(),
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'N/A',
      userAgent: ctx.request.header('user-agent')
    })
    
    try {
      await ctx.auth.authenticateUsing(options.guards || ['api'])
      
      logger.info('✅ Auth Middleware - Autenticação bem sucedida', {
        userId: ctx.auth.user?.id,
        userEmail: ctx.auth.user?.email
      })
      
      return next()
    } catch (error) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'Missing',
        fullAuthHeader: authHeader || 'Missing',
        url: ctx.request.url(),
        method: ctx.request.method(),
        userAgent: ctx.request.header('user-agent'),
        ip: ctx.request.ip(),
        headers: ctx.request.headers()
      }
      
      // Log via logger padrão
      logger.error('❌ Auth Middleware - Falha na autenticação', errorDetails)
      
      // Log direto no arquivo
      this.writeErrorLog(errorDetails)
      
      return ctx.response.status(401).json({
        status: 'error',
        message: 'Token de autenticação inválido ou expirado'
      })
    }
  }
}