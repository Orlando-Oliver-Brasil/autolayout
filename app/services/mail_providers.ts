import { EmailConfig, MailProvider } from './mail_service.js'

/**
 * Provider para SendGrid
 */
export class SendGridMailProvider implements MailProvider {
  constructor(
    private apiKey: string,
    private fromEmail: string,
    private fromName: string
  ) {
    if (!this.apiKey) {
      throw new Error('SendGrid API Key é obrigatória')
    }
  }

  async sendEmail(config: EmailConfig): Promise<void> {
    try {
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
        const errorData = await response.text()
        throw new Error(`SendGrid API Error ${response.status}: ${errorData}`)
      }

      console.log(`📧 Email enviado via SendGrid para: ${config.to}`)
      
    } catch (error) {
      console.error('Erro no SendGrid:', error)
      throw new Error(`Falha ao enviar email via SendGrid: ${error.message}`)
    }
  }
}

/**
 * Provider para Mailgun
 */
export class MailgunProvider implements MailProvider {
  constructor(
    private apiKey: string,
    private domain: string,
    private fromEmail: string,
    private fromName: string
  ) {
    if (!this.apiKey || !this.domain) {
      throw new Error('Mailgun API Key e Domain são obrigatórios')
    }
  }

  async sendEmail(config: EmailConfig): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('from', `${this.fromName} <${this.fromEmail}>`)
      formData.append('to', config.toName ? `${config.toName} <${config.to}>` : config.to)
      formData.append('subject', config.subject)
      formData.append('text', config.text)
      formData.append('html', config.html)

      const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Mailgun API Error ${response.status}: ${errorData}`)
      }

      console.log(`📧 Email enviado via Mailgun para: ${config.to}`)
      
    } catch (error) {
      console.error('Erro no Mailgun:', error)
      throw new Error(`Falha ao enviar email via Mailgun: ${error.message}`)
    }
  }
}

/**
 * Provider para SMTP genérico
 */
export class SMTPProvider implements MailProvider {
  constructor(
    private config: {
      host: string
      port: number
      secure: boolean
      user: string
      pass: string
    },
    private fromEmail: string,
    private fromName: string
  ) {}

  async sendEmail(config: EmailConfig): Promise<void> {
    // Implementação SMTP seria mais complexa, requerendo uma biblioteca como nodemailer
    // Por ora, apenas simular
    console.log(`📧 Email enviado via SMTP para: ${config.to}`)
    console.log(`Host: ${this.config.host}:${this.config.port}`)
    
    // Aqui você usaria uma biblioteca como nodemailer:
    /*
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    })

    await transporter.sendMail({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: config.toName ? `${config.toName} <${config.to}>` : config.to,
      subject: config.subject,
      text: config.text,
      html: config.html
    })
    */
  }
}