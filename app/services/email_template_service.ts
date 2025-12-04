import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface EmailTemplate {
  html: string
  text: string
}

export interface TemplateVariables {
  [key: string]: string | number | boolean
}

export default class EmailTemplateService {
  private static templatesPath = join(process.cwd(), 'app', 'templates')

  /**
   * Carrega template de arquivo
   */
  private static async loadTemplate(templateName: string, extension: 'html' | 'txt'): Promise<string> {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.${extension}`)
      const templateContent = await readFile(templatePath, 'utf-8')
      return templateContent
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}.${extension}:`, error)
      throw new Error(`Template ${templateName}.${extension} não encontrado`)
    }
  }

  /**
   * Substitui variáveis no template
   */
  private static replaceVariables(template: string, variables: TemplateVariables): string {
    let processedTemplate = template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g')
      processedTemplate = processedTemplate.replace(placeholder, String(value))
    }

    // Verificar se há variáveis não substituídas
    const unprocessedVariables = processedTemplate.match(/{{\w+}}/g)
    if (unprocessedVariables) {
      console.warn('Variáveis não processadas encontradas:', unprocessedVariables)
    }

    return processedTemplate
  }

  /**
   * Processa template completo (HTML + Text)
   */
  static async processTemplate(
    templateName: string, 
    variables: TemplateVariables
  ): Promise<EmailTemplate> {
    try {
      const [htmlTemplate, textTemplate] = await Promise.all([
        this.loadTemplate(templateName, 'html'),
        this.loadTemplate(templateName, 'txt')
      ])

      return {
        html: this.replaceVariables(htmlTemplate, variables),
        text: this.replaceVariables(textTemplate, variables)
      }
    } catch (error) {
      console.error(`Erro ao processar template ${templateName}:`, error)
      throw error
    }
  }

  /**
   * Template de recuperação de senha
   */
  static async passwordResetTemplate(userName: string, resetUrl: string): Promise<EmailTemplate> {
    return this.processTemplate('password_reset_email', {
      userName: userName || 'usuário',
      resetUrl
    })
  }

  /**
   * Template de boas-vindas
   */
  static async welcomeTemplate(
    userName: string,
    userEmail: string,
    temporaryPassword: string,
    userLevel: string,
    loginUrl: string
  ): Promise<EmailTemplate> {
    return this.processTemplate('welcome_email', {
      userName: userName || 'usuário',
      userEmail,
      temporaryPassword,
      userLevel,
      loginUrl
    })
  }

  /**
   * Template genérico para notificações
   */
  static async notificationTemplate(
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<EmailTemplate> {
    // Implementar template genérico de notificação
    const variables: TemplateVariables = {
      title,
      message,
      actionUrl: actionUrl || '',
      actionText: actionText || ''
    }

    // Para este exemplo, vamos usar um template inline simples
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>{{title}}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          ${actionUrl ? '<p><a href="{{actionUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{actionText}}</a></p>' : ''}
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">© 2025 Autolayout</p>
        </div>
      </body>
      </html>
    `

    const textTemplate = `
      {{title}}
      
      {{message}}
      
      ${actionUrl ? 'Link: {{actionUrl}}' : ''}
      
      © 2025 Autolayout
    `

    return {
      html: this.replaceVariables(htmlTemplate, variables),
      text: this.replaceVariables(textTemplate, variables)
    }
  }

  /**
   * Valida se todas as variáveis necessárias estão presentes
   */
  static validateTemplate(template: string, requiredVariables: string[]): boolean {
    for (const variable of requiredVariables) {
      if (!template.includes(`{{${variable}}}`)) {
        console.error(`Variável obrigatória ${variable} não encontrada no template`)
        return false
      }
    }
    return true
  }
}