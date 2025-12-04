import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export default class FileLoggerMiddleware {
  private logDir = 'logs'
  
  constructor() {
    // Criar diretório de logs se não existir
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const start = Date.now()
    
    try {
      await next()
      
      // Log de sucesso
      this.writeLog('app.log', {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        method: ctx.request.method(),
        url: ctx.request.url(),
        status: ctx.response.getStatus(),
        duration: `${Date.now() - start}ms`,
        userAgent: ctx.request.header('user-agent'),
        ip: ctx.request.ip()
      })
      
    } catch (error) {
      // Log de erro
      this.writeLog('errors.log', {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        method: ctx.request.method(),
        url: ctx.request.url(),
        error: error.message,
        stack: error.stack,
        duration: `${Date.now() - start}ms`,
        userAgent: ctx.request.header('user-agent'),
        ip: ctx.request.ip(),
        headers: ctx.request.headers()
      })
      
      throw error
    }
  }

  private writeLog(filename: string, data: any) {
    const logPath = join(this.logDir, filename)
    const logLine = JSON.stringify(data) + '\n'
    
    try {
      writeFileSync(logPath, logLine, { flag: 'a' })
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }
}