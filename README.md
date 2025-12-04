# 🚀 AutoLayout Backend API

Sistema backend robusto para plataforma de geração de layouts de email com assistência de IA, desenvolvido com AdonisJS 6, MySQL e TypeScript.

## 📋 Índice

- [✨ Características Principais](#-características-principais) 
- [🛠️ Tecnologias](#️-tecnologias)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🔧 Instalação](#-instalação)
- [⚙️ Configuração](#️-configuração)
- [🗄️ Banco de Dados](#️-banco-de-dados)
- [🏃 Execução](#-execução)
- [🔗 API Endpoints](#-api-endpoints)
- [📁 Arquitetura](#-arquitetura)
- [🛡️ Segurança](#️-segurança)
- [📧 Sistema de Email](#-sistema-de-email)
- [🔌 GitHub Repository](#-github-repository)


## 🛠️ Tecnologias

| Categoria | Tecnologia | Versão | Propósito |
|-----------|------------|--------|-----------|
| **Framework** | [AdonisJS](https://adonisjs.com/) | 6.x | Framework Node.js moderno |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | 5.8 | Type safety e desenvolvimento |
| **Banco** | [MySQL](https://www.mysql.com/) | 8.x | Banco relacional principal |
| **ORM** | [Lucid ORM](https://lucid.adonisjs.com/) | 21.x | Mapeamento objeto-relacional |
| **Validação** | [VineJS](https://vinejs.dev/) | 3.x | Validação de dados robusta |
| **Autenticação** | JWT + Access Tokens | - | Sistema de autenticação |
| **Email** | SMTP + Templates | - | Sistema de comunicação |

## 📋 Pré-requisitos

- **Node.js** 18.x ou superior
- **MySQL** 8.x ou superior  
- **npm** ou **yarn**
- **Git** para controle de versão

## 🔧 Instalação

### 1. Clone o Repositório
```powershell
git clone https://github.com/Orlando-Oliver-Brasil/autolayout.git
cd autolayout/backend/v1
```

### 2. Instale as Dependências
```powershell
npm install
```

### 3. Configure o Ambiente
```powershell
copy .env.example .env
```

## ⚙️ Configuração

### 1. Configuração do Banco de Dados

Edite o arquivo `.env`:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=autolayout

# Application Settings  
NODE_ENV=development
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
APP_URL=http://127.0.0.1:3333

# Email Configuration (SMTP)
MAIL_FROM_EMAIL=noreply@autolayout.com
MAIL_FROM_NAME=Autolayout
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OpenAI Integration (Future)
OPENAI_API_KEY=sua_api_key_aqui
```

### 2. Gerar Chave da Aplicação
```powershell
node ace generate:key
```

### 3. Configurar Base URL
Certifique-se que `APP_URL` corresponde ao seu ambiente.

## 🗄️ Banco de Dados

### 1. Criar Banco de Dados
```sql
CREATE DATABASE autolayout 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### 2. Executar Migrações
```powershell
node ace migration:run
```

### 3. Popular Dados Iniciais
```powershell
node ace db:seed
```

### 📊 Estrutura do Banco

| Tabela | Propósito | Relacionamentos |
|--------|-----------|-----------------|
| `users` | Usuários do sistema | - |
| `groups` | Organizações principais | hasMany squads, users |
| `squads` | Equipes especializadas | belongsTo group, hasMany users |
| `user_groups` | Pivot: usuário ↔ grupo | level, is_active, joined_at |
| `user_squads` | Pivot: usuário ↔ squad | role, group_id, joined_at |
| `access_tokens` | Tokens JWT ativos | belongsTo user |
| `layouts` | Layouts gerados | belongsTo user |

## 🏃 Execução

### Desenvolvimento com Hot Reload
```powershell
node ace serve --watch
```

### Produção
```powershell
# Build da aplicação
node ace build

# Executar em produção
cd build
npm ci --production
node bin/server.js
```

### Verificar Status
```powershell
curl http://127.0.0.1:3333
```

## 🔗 API Endpoints

### 🔐 Autenticação
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/v1/auth/login` | Login com email/senha | ❌ |
| `POST` | `/api/v1/auth/logout` | Logout e invalidação do token | ✅ |
| `GET` | `/api/v1/auth/me` | Dados do usuário autenticado | ✅ |
| `POST` | `/api/v1/auth/change-password` | Alterar própria senha | ✅ |

### 👥 Gestão de Usuários
| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/v1/users` | Listar usuários (contexto) | Member+ |
| `POST` | `/api/v1/users` | Criar usuário | Admin+ |
| `GET` | `/api/v1/users/:id` | Exibir usuário específico | Member+ |
| `PUT` | `/api/v1/users/:id` | Atualizar usuário | Admin+ |
| `DELETE` | `/api/v1/users/:id` | Excluir usuário (soft delete) | Admin+ |
| `PATCH` | `/api/v1/users/:id/change-password` | Alterar senha usuário | Admin+ |

### 🏢 Gestão de Grupos
| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/v1/groups` | Listar grupos | Member+ |
| `POST` | `/api/v1/groups` | Criar grupo | Super Admin |
| `GET` | `/api/v1/groups/:id` | Exibir grupo específico | Member |
| `PUT` | `/api/v1/groups/:id` | Atualizar grupo | Super Admin |
| `DELETE` | `/api/v1/groups/:id` | Desativar grupo | Super Admin |

### 🎯 Gestão de Squads
| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| `GET` | `/api/v1/squads` | Listar squads | Member+ |
| `POST` | `/api/v1/squads` | Criar squad | Admin+ |
| `GET` | `/api/v1/squads/:id` | Exibir squad específico | Member |
| `PUT` | `/api/v1/squads/:id` | Atualizar squad | Admin+ |
| `DELETE` | `/api/v1/squads/:id` | Desativar squad | Admin+ |

### 🔗 Associações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/users/add-to-group` | Adicionar usuário ao grupo |
| `POST` | `/api/v1/users/add-to-squad` | Adicionar usuário ao squad |
| `DELETE` | `/api/v1/users/remove-from-group` | Remover usuário do grupo |
| `DELETE` | `/api/v1/users/remove-from-squad` | Remover usuário do squad |

### 📊 Relatórios e Consultas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/users/my-groups` | Grupos do usuário autenticado |
| `GET` | `/api/v1/users/my-squads` | Squads do usuário autenticado |
| `GET` | `/api/v1/users/:id/groups` | Grupos de usuário específico |
| `GET` | `/api/v1/users/:id/squads` | Squads de usuário específico |

## 📁 Arquitetura

```
v1/                                 # Raiz da aplicação
├── 📁 app/                        # Código da aplicação
│   ├── 🎮 controllers/            # Controladores da API
│   │   ├── auth_controller.ts     # Autenticação e sessões
│   │   ├── users_controller.ts    # CRUD e gestão de usuários
│   │   ├── groups_controller.ts   # Gestão de grupos
│   │   ├── squads_controller.ts   # Gestão de squads
│   │   └── layouts_controller.ts  # Layouts (preparado)
│   │
│   ├── 🚀 services/               # Camada de serviços
│   │   ├── mail_service.ts        # Serviço principal de email
│   │   ├── mail_config.ts         # Configuração de email
│   │   ├── mail_providers.ts      # Providers SMTP
│   │   ├── email_template_service.ts # Templates de email
│   │   └── openai_service.ts      # Integração OpenAI (mock)
│   │
│   ├── 🛡️ middleware/             # Middlewares de segurança
│   │   ├── auth_middleware.ts     # Autenticação JWT
│   │   ├── role_middleware.ts     # Controle de níveis
│   │   ├── group_access_middleware.ts # Acesso granular
│   │   └── user_management_middleware.ts # Gestão de usuários
│   │
│   ├── 🗂️ models/                 # Models do Lucid ORM
│   │   ├── user.ts               # Usuários + relacionamentos
│   │   ├── group.ts              # Grupos organizacionais
│   │   ├── squad.ts              # Equipes especializadas
│   │   ├── user_group.ts         # Pivot: usuário-grupo
│   │   ├── user_squad.ts         # Pivot: usuário-squad
│   │   └── layout.ts             # Layouts gerados
│   │
│   ├── ✅ validators/             # Validadores VineJS
│   │   ├── auth.ts               # Validação de autenticação
│   │   └── user.ts               # Validação de usuários/grupos
│   │
│   ├── 🎨 templates/              # Templates de email
│   │   ├── welcome_email.html    # Boas-vindas (HTML)
│   │   ├── welcome_email.txt     # Boas-vindas (texto)
│   │   ├── password_reset_email.html # Reset senha (HTML)
│   │   └── password_reset_email.txt  # Reset senha (texto)
│   │
│   └── 🚫 exceptions/             # Tratamento de erros
│       └── handler.ts            # Handler global de erros
│
├── ⚙️ config/                     # Configurações
│   ├── app.ts                    # Configuração da aplicação
│   ├── database.ts               # Configuração do banco
│   ├── auth.ts                   # Configuração de autenticação
│   └── cors.ts                   # Configuração CORS
│
├── 🗄️ database/                   # Estrutura do banco
│   ├── migrations/               # Migrações do banco
│   └── seeders/                  # Dados iniciais
│
├── 🚀 start/                     # Inicialização
│   ├── routes.ts                 # Definição das rotas
│   ├── kernel.ts                 # Configuração de middlewares
│   └── env.ts                    # Variáveis de ambiente
│
└── 📦 bin/                       # Executáveis
    ├── server.ts                 # Servidor HTTP
    ├── console.ts                # CLI commands
    └── test.ts                   # Test runner
```

## 🛡️ Segurança

### Autenticação e Autorização

#### 🔐 JWT + Access Tokens
```typescript
// Configuração robusta de tokens
static accessTokens = DbAccessTokensProvider.forModel(User, {
  expiresIn: '7 days',
  prefix: 'oat_',
  table: 'access_tokens',
  type: 'auth_token',
  tokenSecretLength: 40
})
```

#### 🛡️ Middleware Chain
1. **AuthMiddleware**: Validação de token JWT
2. **RoleMiddleware**: Controle por nível (0-2)  
3. **GroupAccessMiddleware**: Acesso granular por organização
4. **UserManagementMiddleware**: Validações de gestão

### Controle de Acesso

#### Níveis Hierárquicos
```typescript
// Níveis globais do sistema
enum UserLevel {
  MEMBER = 0,      // Usuário básico
  ADMIN = 1,       // Administrador
  SUPER_ADMIN = 2  // Super administrador
}

// Roles específicos em squads
enum SquadRole {
  MEMBER = 'member',
  LEADER = 'leader'
}
```

#### Validações de Permissão
```typescript
// Exemplo de verificação granular
public async canManageUserInGroup(
  targetUser: User, 
  groupId: number
): Promise<boolean> {
  if (this.isSuperAdmin) return true
  
  const myLevel = await this.getGroupLevel(groupId)
  const targetLevel = await targetUser.getGroupLevel(groupId)
  
  return myLevel !== null && myLevel >= 1 && 
         (targetLevel === null || myLevel >= targetLevel)
}
```

## 📧 Sistema de Email

### Arquitetura de Email

O sistema de email segue o **Provider Pattern** para máxima flexibilidade:

```typescript
// Provider Interface
interface MailProvider {
  send(to: string, subject: string, htmlContent: string, textContent: string): Promise<void>
}

// Implementações disponíveis
- SMTPProvider     // Servidor SMTP customizado
- MockProvider     // Desenvolvimento e testes
```

### Templates Profissionais

#### 🎨 Templates HTML/Texto
- **Welcome Email**: Boas-vindas com CSS responsivo
- **Password Reset**: Recuperação de senha segura
- **Notifications**: Notificações personalizáveis

#### 🔧 Sistema de Templates
```typescript
export class EmailTemplateService {
  // Processamento de variáveis {{variableName}}
  private processVariables(content: string, variables: Record<string, string>): string
  
  // Templates tipados
  async getWelcomeEmailTemplate(user: User, tempPassword: string)
  async getPasswordResetTemplate(user: User, resetToken: string)
}
```

### Configuração SMTP

```env
# Configuração simplificada (somente SMTP)
MAIL_FROM_EMAIL=noreply@autolayout.com
MAIL_FROM_NAME=Autolayout
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Uso do Sistema

```typescript
// Exemplo de uso em controller
const mailService = createMailService()

// Envio de boas-vindas
await mailService.sendWelcomeEmail(user, temporaryPassword)

// Envio de reset de senha  
await mailService.sendPasswordResetEmail(user, resetToken)

// Notificação personalizada
await mailService.sendNotification(
  user,
  'Título da Notificação',
  'Conteúdo da mensagem...',
  'https://app.autolayout.com/dashboard',
  'Ver Detalhes'
)
```

## 🔌 GitHub Repository

**Repository**: [https://github.com/Orlando-Oliver-Brasil/autolayout.git](https://github.com/Orlando-Oliver-Brasil/autolayout.git)

### Estrutura do Repositório
```
autolayout.gi/
├── backend/              # API Backend (este projeto)
```

## 📄 Licença

ISC

## 👤 Autor

**Orlando Libardi**
orlando.libardi@gmail.com | orlandolibardi@oliver.agency

