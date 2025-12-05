import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

interface OpenAIThread {
  id: string
  object: string
  created_at: number
}

interface OpenAIMessage {
  id: string
  object: string
  created_at: number
  content: Array<{
    type: 'text'
    text: {
      value: string
    }
  }>
  role: 'user' | 'assistant'
}

interface OpenAIRun {
  id: string
  object: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired'
  created_at: number
}

interface AssistantPipelineResult {
  assistant1Result: Record<string, any>
  assistant2Result: Record<string, any>
  assistant3Result: Record<string, any>
  finalLayout: Record<string, any>
}

export default class OpenAIService {
  private readonly baseUrl = 'https://api.openai.com/v1'
  private readonly apiKey: string
  private readonly maxRetries = 3
  private readonly requestTimeout = 60000 // 60 segundos

  constructor() {
    this.apiKey = env.get('OPENAI_API_KEY')
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required but not configured')
    }
  }

  /**
   * Cria uma thread para conversação com o assistente
   */
  private async createThread(): Promise<string> {
    return this.retryOperation(async () => {
      logger.debug('Creating new OpenAI thread')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

      try {
        const response = await fetch(`${this.baseUrl}/threads`, {
          method: 'POST',
          headers: this.getHeaders(),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create thread: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json() as OpenAIThread
        logger.debug(`Created thread: ${data.id}`)
        return data.id
      } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout while creating thread')
        }
        throw error
      }
    })
  }

  /**
   * Adiciona uma mensagem à thread
   */
  private async addMessage(threadId: string, content: string): Promise<void> {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }

    return this.retryOperation(async () => {
      logger.debug(`Adding message to thread: ${threadId}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

      try {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            role: 'user',
            content: content,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to add message: ${response.status} ${response.statusText} - ${errorText}`)
        }

        logger.debug('Message added successfully')
      } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout while adding message')
        }
        throw error
      }
    })
  }

  /**
   * Executa o assistente e aguarda a resposta
   */
  private async runAssistant(threadId: string, assistantId: string): Promise<string> {
    return this.retryOperation(async () => {
      logger.debug(`Running assistant ${assistantId} on thread ${threadId}`)
      
      // Inicia a execução
      const runResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      })

      if (!runResponse.ok) {
        const errorText = await runResponse.text()
        throw new Error(`Failed to run assistant: ${runResponse.status} ${runResponse.statusText} - ${errorText}`)
      }

      const runData = await runResponse.json() as OpenAIRun
      const runId = runData.id
      logger.debug(`Assistant run started: ${runId}`)

      // Aguarda a conclusão com timeout maior
      const maxWaitTime = 300000 // 5 minutos
      const startTime = Date.now()
      let status = runData.status
      
      while (status === 'in_progress' || status === 'queued') {
        // Verifica timeout
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error(`Assistant run timeout after ${maxWaitTime / 1000} seconds`)
        }

        await this.sleep(2000) // Aguarda 2 segundos

        const statusResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`, {
          headers: this.getHeaders(),
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`)
        }

        const statusData = await statusResponse.json() as OpenAIRun
        status = statusData.status
        logger.debug(`Assistant run status: ${status}`)

        if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          throw new Error(`Assistant run failed with status: ${status}`)
        }
      }

      // Busca as mensagens da thread
      const messagesResponse = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
        headers: this.getHeaders(),
      })

      if (!messagesResponse.ok) {
        throw new Error(`Failed to retrieve messages: ${messagesResponse.statusText}`)
      }

      const messagesData = await messagesResponse.json() as { data: OpenAIMessage[] }
      const lastMessage = messagesData.data[0]

      if (lastMessage?.content?.[0]?.text?.value) {
        logger.debug('Assistant response received successfully')
        return lastMessage.content[0].text.value
      }

      throw new Error('No valid response received from assistant')
    })
  }

  /**
   * Processa lauda com o Assistente 1 (Extração)
   */
  async processWithAssistant1(laudaContent: string): Promise<Record<string, any>> {
    const assistantId = env.get('ASSISTANT_1_ID')
    if (!assistantId) {
      throw new Error('ASSISTANT_1_ID is not configured')
    }

    logger.debug('Processing with Assistant 1 (Content Extraction)')
    const threadId = await this.createThread()

    await this.addMessage(threadId, laudaContent)
    const response = await this.runAssistant(threadId, assistantId)

    try {
      const cleanedResponse = this.cleanJsonResponse(response)
      const result = JSON.parse(cleanedResponse)
      logger.debug('Assistant 1 processing completed successfully')
      return result
    } catch (error) {
      logger.error('Failed to parse Assistant 1 response:', { response, error: error.message })
      throw new Error(`Failed to parse Assistant 1 response: ${error.message}`)
    }
  }

  /**
   * Processa estrutura com o Assistente 2 (Módulos)
   */
  async processWithAssistant2(structuredData: Record<string, any>): Promise<Record<string, any>> {
    const assistantId = env.get('ASSISTANT_2_ID')
    if (!assistantId) {
      throw new Error('ASSISTANT_2_ID is not configured')
    }

    logger.debug('Processing with Assistant 2 (Module Selection)')
    const threadId = await this.createThread()

    await this.addMessage(threadId, JSON.stringify(structuredData, null, 2))
    const response = await this.runAssistant(threadId, assistantId)

    try {
      const cleanedResponse = this.cleanJsonResponse(response)
      const result = JSON.parse(cleanedResponse)
      logger.debug('Assistant 2 processing completed successfully')
      return result
    } catch (error) {
      logger.error('Failed to parse Assistant 2 response:', { response, cleanedResponse: this.cleanJsonResponse(response), error: error.message })
      throw new Error(`Failed to parse Assistant 2 response: ${error.message}`)
    }
  }

  /**
   * Processa layout com o Assistente 3 (Ícones)
   */
  async processWithAssistant3(layoutData: Record<string, any>): Promise<Record<string, any>> {
    const assistantId = env.get('ASSISTANT_3_ID')
    if (!assistantId) {
      throw new Error('ASSISTANT_3_ID is not configured')
    }

    logger.debug('Processing with Assistant 3 (Icon Selection)')
    const threadId = await this.createThread()

    await this.addMessage(threadId, JSON.stringify(layoutData, null, 2))
    const response = await this.runAssistant(threadId, assistantId)

    try {
      const cleanedResponse = this.cleanJsonResponse(response)
      const result = JSON.parse(cleanedResponse)
      logger.debug('Assistant 3 processing completed successfully')
      return result
    } catch (error) {
      logger.error('Failed to parse Assistant 3 response:', { response, error: error.message })
      throw new Error(`Failed to parse Assistant 3 response: ${error.message}`)
    }
  }

  /**
   * Processa pipeline completo (3 assistentes em sequência)
   */
  async processCompletePipeline(laudaContent: string): Promise<AssistantPipelineResult> {
    if (!laudaContent || laudaContent.trim().length === 0) {
      throw new Error('Lauda content cannot be empty')
    }

    const startTime = Date.now()
    logger.info('Starting complete AI pipeline processing')

    try {
      // Etapa 1: Extração e estruturação
      logger.info('Pipeline step 1: Content extraction and structuring')
      const assistant1Result = await this.processWithAssistant1(laudaContent)
      
      // Etapa 2: Seleção de módulos
      logger.info('Pipeline step 2: Visual module selection')
      const assistant2Result = await this.processWithAssistant2(assistant1Result)
      
      // Etapa 3: Seleção de ícones
      logger.info('Pipeline step 3: Icon selection')
      const assistant3Result = await this.processWithAssistant3(assistant2Result)

      const totalTime = Date.now() - startTime
      logger.info(`Complete pipeline processing finished in ${totalTime}ms`)

      return {
        assistant1Result,
        assistant2Result,
        assistant3Result,
        finalLayout: assistant3Result,
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error(`Pipeline processing failed after ${totalTime}ms:`, error)
      throw error
    }
  }

  /**
   * Obtém os headers padrão para requisições OpenAI
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json',
    }
  }

  /**
   * Implementa retry logic para operações que podem falhar temporariamente
   */
  private async retryOperation<T>(operation: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= this.maxRetries) {
        logger.error(`Operation failed after ${this.maxRetries} attempts:`, error)
        throw error
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Exponential backoff, max 10s
      logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delay}ms:`, error.message)
      
      await this.sleep(delay)
      return this.retryOperation(operation, attempt + 1)
    }
  }

  /**
   * Limpa a resposta removendo código Markdown e outros formatadores
   */
  private cleanJsonResponse(response: string): string {
    // Remove código Markdown (```json, ```, etc.)
    let cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Remove possíveis textos antes e depois do JSON
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}') + 1
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd)
    }

    return cleaned
  }

  /**
   * Utilitário para aguardar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}