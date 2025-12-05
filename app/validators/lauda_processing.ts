import vine from '@vinejs/vine'

/**
 * Validator for creating a new lauda processing
 */
export const createLaudaProcessingValidator = vine.compile(
  vine.object({
    content: vine
      .string()
      .trim()
      .minLength(10)
      .maxLength(50000),
  })
)