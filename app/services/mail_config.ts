/**
 * Configuração do serviço de email usando SMTP
 */

import MailService from './mail_service.js'
import { SMTPProvider } from './mail_providers.js'
import env from '#start/env'

/**
 * Configuração com SMTP
 */
export function createSMTPService(): MailService {
  const provider = new SMTPProvider(
    {
      host: env.get('SMTP_HOST') || 'localhost',
      port: Number(env.get('SMTP_PORT', '587')),
      secure: env.get('SMTP_SECURE', 'false').toLowerCase() === 'true',
      user: env.get('SMTP_USER') || '',
      pass: env.get('SMTP_PASS') || ''
    },
    env.get('MAIL_FROM_EMAIL', 'noreply@autolayout.com'),
    env.get('MAIL_FROM_NAME', 'Autolayout')
  )
  
  return new MailService(provider)
}

/**
 * Factory para criar o serviço de email SMTP
 */
export function createMailService(): MailService {
  return createSMTPService()
}
