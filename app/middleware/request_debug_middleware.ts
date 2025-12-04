import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RequestDebugMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    console.log('🔍 === DEBUG REQUEST ===')
    console.log('URL:', ctx.request.url())
    console.log('Method:', ctx.request.method())
    console.log('All Headers:', JSON.stringify(ctx.request.headers(), null, 2))
    console.log('Authorization Header:', ctx.request.header('authorization'))
    console.log('User-Agent:', ctx.request.header('user-agent'))
    console.log('Content-Type:', ctx.request.header('content-type'))
    console.log('========================\n')
    
    return next()
  }
}