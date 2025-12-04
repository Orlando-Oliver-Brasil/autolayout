import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RequestLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const start = Date.now()
    
    await next()
    
    const duration = Date.now() - start
    console.log(`🌐 ${ctx.request.method()} ${ctx.request.url()} - ${ctx.response.getStatus()} (${duration}ms)`)
  }
}