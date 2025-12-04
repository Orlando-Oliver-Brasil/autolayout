import vine from '@vinejs/vine'

/**
 * Validator para criação de layout
 */
export const createLayoutValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().maxLength(1000).optional(),
    content: vine.string().trim().minLength(10),
    layoutType: vine.enum(['email', 'newsletter', 'marketing']).optional(),
    metadata: vine.object({}).optional()
  })
)

/**
 * Validator para atualização de layout
 */
export const updateLayoutValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional(),
    content: vine.string().trim().minLength(10).optional(),
    layoutType: vine.enum(['email', 'newsletter', 'marketing']).optional(),
    suggestedLayout: vine.string().optional(),
    status: vine.enum(['draft', 'processing', 'completed', 'failed']).optional(),
    metadata: vine.object({}).optional()
  })
)