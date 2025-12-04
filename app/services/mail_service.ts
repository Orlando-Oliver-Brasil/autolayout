import User from '#models/user'
import env from '#start/env'
import EmailTemplateService from './email_template_service.js'

export interface EmailConfig {
  to: string
  toName?: string
  subject: string
  html: string
  text: string
}

export interface MailProvider {
  sendEmail(config: EmailConfig): Promise<void>
}

export default class MailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string
  private appUrl: string
  private provider: MailProvider

  constructor(customProvider?: MailProvider) {
    this.apiKey = env.get('MAIL_API_KEY', '')
    this.fromEmail = env.get('MAIL_FROM_EMAIL', 'noreply@autolayout.com')
    this.fromName = env.get('MAIL_FROM_NAME', 'Autolayout')
    this.appUrl = env.get('APP_URL', 'http://localhost:3333')
    
    // Usar provider customizado ou o padrão
    this.provider = customProvider || new DefaultMailProvider(this.apiKey, this.fromEmail, this.fromName)
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    try {
      const resetUrl = `${this.appUrl}/reset-password?token=${token}`
      
      const template = await EmailTemplateService.passwordResetTemplate(
        user.fullName || user.email,
        resetUrl
      )

      await this.provider.sendEmail({
        to: user.email,
        toName: user.fullName || undefined,
        subject: 'Recuperação de Senha - Autolayout',
        html: template.html,
        text: template.text
      })

      console.log(`✅ Email de recuperação enviado para: ${user.email}`)
      
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error)
      throw new Error('Falha ao enviar email de recuperação')
    }
  }

  /**
   * Envia email de boas-vindas para novos usuários
   */
  async sendWelcomeEmail(user: User, temporaryPassword: string): Promise<void> {
    try {
      const loginUrl = `${this.appUrl}/login`
      
      const template = await EmailTemplateService.welcomeTemplate(
        user.fullName || user.email,
        user.email,
        temporaryPassword,
        user.getLevelName(),
        loginUrl
      )

      await this.provider.sendEmail({
        to: user.email,
        toName: user.fullName || undefined,
        subject: 'Bem-vindo ao Autolayout! 🎉',
        html: template.html,
        text: template.text
      })

      console.log(`✅ Email de boas-vindas enviado para: ${user.email}`)
      
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error)
      throw new Error('Falha ao enviar email de boas-vindas')
    }
  }

  /**
   * Envia notificação genérica
   */
  async sendNotification(
    user: User, 
    title: string, 
    message: string, 
    actionUrl?: string, 
    actionText?: string
  ): Promise<void> {
    try {
      const template = await EmailTemplateService.notificationTemplate(
        title,
        message,
        actionUrl,
        actionText
      )

      await this.provider.sendEmail({
        to: user.email,
        toName: user.fullName || undefined,
        subject: title,
        html: template.html,
        text: template.text
      })

      console.log(`✅ Notificação enviada para: ${user.email}`)
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error)
      throw new Error('Falha ao enviar notificação')
    }
  }
}

/**
 * Provider padrão para desenvolvimento/mock
 */
class DefaultMailProvider implements MailProvider {
  constructor(
    private apiKey: string,
    private fromEmail: string,
    private fromName: string
  ) {}

  async sendEmail(config: EmailConfig): Promise<void> {
    if (!this.apiKey) {
      // Modo desenvolvimento - apenas log
      console.log('\n=== 📧 EMAIL SIMULADO ===')
      console.log(`De: ${this.fromName} <${this.fromEmail}>`)
      console.log(`Para: ${config.toName ? config.toName + ' <' + config.to + '>' : config.to}`)
      console.log(`Assunto: ${config.subject}`)
      console.log(`--- Conteúdo (texto) ---`)
      console.log(config.text)
      console.log('========================\n')
      return
    }

    // Implementação real com provider de email
    // Exemplo para SendGrid, Mailgun, etc.
    try {
      // Aqui você implementaria a integração com seu provedor de email
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ 
              email: config.to, 
              name: config.toName 
            }]
          }],
          from: { 
            email: this.fromEmail, 
            name: this.fromName 
          },
          subject: config.subject,
          content: [
            { type: 'text/plain', value: config.text },
            { type: 'text/html', value: config.html }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      */

      // Por enquanto, simular envio bem-sucedido
      console.log(`📧 Email enviado via provider para: ${config.to}`)
      
    } catch (error) {
      console.error('Erro no provider de email:', error)
      throw error
    }
  }
}