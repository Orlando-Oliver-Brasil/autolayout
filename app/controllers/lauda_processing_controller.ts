import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import LaudaProcessing from '#models/lauda_processing'
import OpenAIService from '#services/openai_service'
import { createLaudaProcessingValidator } from '../validators/lauda_processing.js'

export default class LaudaProcessingController {
  /**
   * Cria um novo processamento de lauda
   */
  async store({ request, response }: HttpContext) {
    try {
      // Valida os dados de entrada
      const payload = await request.validateUsing(createLaudaProcessingValidator)
      
      // Cria o registro inicial
      const laudaProcessing = await LaudaProcessing.create({
        laudaContent: payload.content,
        status: 'processing',
        startedAt: DateTime.now(),
      })

      // Processa de forma assíncrona (poderia ser uma queue job)
      // Não aguardamos o resultado para não bloquear a resposta
      this.processLaudaAsync(laudaProcessing.id, payload.content).catch((error) => {
        console.error('Erro no processamento assíncrono:', error)
      })

      return response.status(201).json({
        message: 'Processamento iniciado com sucesso',
        data: {
          id: laudaProcessing.id,
          status: laudaProcessing.status,
          startedAt: laudaProcessing.startedAt,
        },
      })
    } catch (error) {
      return response.status(400).json({
        message: 'Erro na validação dos dados',
        errors: error.messages || [error.message],
      })
    }
  }

  /**
   * Busca o status e resultado do processamento
   */
  async show({ params, response }: HttpContext) {
    try {
      const laudaProcessing = await LaudaProcessing.findOrFail(params.id)

      return response.json({
        data: {
          id: laudaProcessing.id,
          status: laudaProcessing.status,
          startedAt: laudaProcessing.startedAt,
          completedAt: laudaProcessing.completedAt,
          assistant1Result: laudaProcessing.assistant1Result,
          assistant2Result: laudaProcessing.assistant2Result,
          assistant3Result: laudaProcessing.assistant3Result,
          finalLayout: laudaProcessing.finalLayout,
          errorMessage: laudaProcessing.errorMessage,
          processingTime: laudaProcessing.processingTimeMs,
        },
      })
    } catch (error) {
      return response.status(404).json({
        message: 'Processamento não encontrado',
      })
    }
  }

  /**
   * Lista todos os processamentos do usuário
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')

    const query = LaudaProcessing.query()
      .select([
        'id',
        'status',
        'started_at',
        'completed_at',
        'processing_time_ms',
        'error_message',
      ])
      .orderBy('started_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    const laudaProcessings = await query.paginate(page, limit)

    return response.json(laudaProcessings.serialize())
  }

  /**
   * Processa a lauda de forma assíncrona
   */
  private async processLaudaAsync(processingId: number, content: string) {
    const openAIService = new OpenAIService()
    
    try {
      const laudaProcessing = await LaudaProcessing.findOrFail(processingId)
      
      // Processa o pipeline completo
      const results = await openAIService.processCompletePipeline(content)
      
      // Calcula o tempo de processamento
      const startedAt = laudaProcessing.startedAt
      const completedAt = DateTime.now()
      const processingTime = startedAt ? completedAt.toMillis() - startedAt.toMillis() : 0

      // Atualiza o registro com os resultados
      await laudaProcessing.merge({
        status: 'completed',
        completedAt,
        processingTimeMs: processingTime,
        assistant1Result: results.assistant1Result,
        assistant2Result: results.assistant2Result,
        assistant3Result: results.assistant3Result,
        finalLayout: results.finalLayout,
      }).save()

    } catch (error) {
      // Atualiza o registro com o erro
      try {
        const processingRecord = await LaudaProcessing.findOrFail(processingId)
        await processingRecord.merge({
          status: 'failed',
          completedAt: DateTime.now(),
          errorMessage: error.message || 'Erro desconhecido',
        }).save()
      } catch (updateError) {
        console.error(`Erro ao atualizar registro ${processingId}:`, updateError)
      }

      console.error(`Erro no processamento ${processingId}:`, error)
    }
  }

  /**
   * Reprocessa uma lauda existente
   */
  async reprocess({ params, response }: HttpContext) {
    try {
      const laudaProcessing = await LaudaProcessing.findOrFail(params.id)
      
      if (laudaProcessing.status === 'processing') {
        return response.status(400).json({
          message: 'Processamento já está em andamento',
        })
      }

      // Reinicia o processamento
      await laudaProcessing.merge({
        status: 'processing',
        startedAt: DateTime.now(),
        completedAt: null,
        processingTimeMs: null,
        assistant1Result: null,
        assistant2Result: null,
        assistant3Result: null,
        finalLayout: null,
        errorMessage: null,
      }).save()

      // Processa novamente
      this.processLaudaAsync(laudaProcessing.id, laudaProcessing.laudaContent).catch((error) => {
        console.error('Erro no reprocessamento assíncrono:', error)
      })

      return response.json({
        message: 'Reprocessamento iniciado com sucesso',
        data: {
          id: laudaProcessing.id,
          status: laudaProcessing.status,
          startedAt: laudaProcessing.startedAt,
        },
      })
    } catch (error) {
      return response.status(404).json({
        message: 'Processamento não encontrado',
      })
    }
  }

  /**
   * Remove um processamento
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const laudaProcessing = await LaudaProcessing.findOrFail(params.id)
      
      if (laudaProcessing.status === 'processing') {
        return response.status(400).json({
          message: 'Não é possível deletar um processamento em andamento',
        })
      }

      await laudaProcessing.delete()

      return response.status(204)
    } catch (error) {
      return response.status(404).json({
        message: 'Processamento não encontrado',
      })
    }
  }
}