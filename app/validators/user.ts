import vine from '@vinejs/vine'

/**
 * Validator para criar usuário
 */
export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(3).maxLength(100).optional(),
    name: vine.string().trim().minLength(3).maxLength(100).optional(), // Alias para fullName
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8).maxLength(100),
    level: vine.number().range([0, 2]).optional(),
    isActive: vine.boolean().optional(),
    isAdmin: vine.number().range([0, 2]).optional() // Campo para marcar como admin (level 2)
  })
)

/**
 * Validator para atualizar usuário
 */
export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(3).maxLength(100).optional(),
    name: vine.string().trim().minLength(3).maxLength(100).optional(), // Alias para fullName
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value, field) => {
        // Obter o ID do usuário do contexto da requisição
        const currentUserId = field.meta?.userId || field.data?.userId
        
        if (!currentUserId) {
          // Se não há ID do usuário, apenas verificar se email já existe
          const user = await db
            .from('users')
            .where('email', value)
            .first()
          return !user
        }

        // Se há ID do usuário, excluir da verificação
        const user = await db
          .from('users')
          .where('email', value)
          .whereNot('id', currentUserId)
          .first()
        return !user
      })
      .optional(),
    level: vine.number().range([0, 2]).optional(),
    isActive: vine.boolean().optional(),
    isAdmin: vine.number().range([0, 2]).optional() // Campo para marcar como admin (level 2)
  })
)

/**
 * Validator para adicionar usuário a um grupo
 */
export const addUserToGroupValidator = vine.compile(
  vine.object({
    userId: vine.number().exists(async (db, value) => {
      const user = await db.from('users').where('id', value).where('is_active', true).first()
      return !!user
    }),
    groupId: vine.number().exists(async (db, value) => {
      const group = await db.from('groups').where('id', value).where('is_active', true).first()
      return !!group
    }),
    level: vine.number().range([0, 2]).optional()
  })
)

/**
 * Validator para adicionar usuário a um squad
 */
export const addUserToSquadValidator = vine.compile(
  vine.object({
    userId: vine.number().exists(async (db, value) => {
      const user = await db.from('users').where('id', value).where('is_active', true).first()
      return !!user
    }),
    squadId: vine.number().exists(async (db, value) => {
      const squad = await db.from('squads').where('id', value).where('is_active', true).first()
      return !!squad
    }),
    role: vine.enum(['member', 'leader']).optional()
  })
)

/**
 * Validator para alterar senha
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8).maxLength(100),
    confirmPassword: vine.string().sameAs('newPassword')
  })
)

/**
 * Validator para solicitar recuperação de senha
 */
export const requestPasswordResetValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail()
  })
)

/**
 * Validator para redefinir senha
 */
export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(10),
    newPassword: vine.string().minLength(8).maxLength(100),
    confirmPassword: vine.string().sameAs('newPassword')
  })
)

/**
 * Validator para criar grupo
 */
export const createGroupValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).unique(async (db, value) => {
      const group = await db.from('groups').where('name', value).first()
      return !group
    }),
    description: vine.string().trim().maxLength(500).optional(),
    isActive: vine.boolean().optional()
  })
)

/**
 * Validator para atualizar grupo
 */
export const updateGroupValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).unique(async (db, value, field) => {
      // Obter o ID do grupo do contexto da requisição
      const currentGroupId = field.meta?.groupId || field.data?.groupId
      
      if (!currentGroupId) {
        // Se não há ID do grupo, apenas verificar se nome já existe
        const group = await db
          .from('groups')
          .where('name', value)
          .first()
        return !group
      }

      // Se há ID do grupo, excluir da verificação
      const group = await db
        .from('groups')
        .where('name', value)
        .whereNot('id', currentGroupId)
        .first()
      return !group
    }).optional(),
    description: vine.string().trim().maxLength(500).optional(),
    isActive: vine.boolean().optional()
  })
)

/**
 * Validator para criar squad
 */
export const createSquadValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
    groupId: vine.number().exists(async (db, value) => {
      const group = await db.from('groups').where('id', value).where('is_active', true).first()
      return !!group
    }),
    isActive: vine.boolean().optional()
  })
)

/**
 * Validator para atualizar squad
 */
export const updateSquadValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).optional(),
    description: vine.string().trim().maxLength(500).optional(),
    groupId: vine.number().exists(async (db, value) => {
      const group = await db.from('groups').where('id', value).where('is_active', true).first()
      return !!group
    }).optional(),
    isActive: vine.boolean().optional()
  })
)