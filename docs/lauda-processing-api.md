# Processamento de Lauda - API REST

Este documento descreve a implementação da API REST para processamento de lauda utilizando o pipeline de 3 assistentes de IA.

## Visão Geral

A API oferece endpoints para processar laudas através do sistema de 3 assistentes:
- **Assistente 1**: Extração e estruturação de conteúdo
- **Assistente 2**: Seleção de módulos visuais  
- **Assistente 3**: Seleção de ícones contextual

## Endpoints

### POST /api/v1/lauda-processing
Inicia o processamento de uma nova lauda.

**Request Body:**
```json
{
  "content": "Conteúdo da lauda a ser processada..."
}
```

**Response (201):**
```json
{
  "message": "Processamento iniciado com sucesso",
  "data": {
    "id": 1,
    "status": "processing",
    "startedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /api/v1/lauda-processing/:id
Consulta o status e resultado de um processamento específico.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "completed",
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "assistant1Result": { /* resultado do assistente 1 */ },
    "assistant2Result": { /* resultado do assistente 2 */ },
    "assistant3Result": { /* resultado do assistente 3 */ },
    "finalResult": { /* layout final com ícones */ },
    "processingTime": 135000,
    "errorMessage": null
  }
}
```

### GET /api/v1/lauda-processing
Lista todos os processamentos do usuário com paginação.

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)
- `status` (opcional): Filtrar por status (processing, completed, failed)

**Response (200):**
```json
{
  "meta": {
    "total": 25,
    "perPage": 20,
    "currentPage": 1,
    "lastPage": 2
  },
  "data": [
    {
      "id": 5,
      "status": "completed",
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:32:15Z",
      "processingTime": 135000,
      "errorMessage": null
    }
  ]
}
```

### POST /api/v1/lauda-processing/:id/reprocess
Reprocessa uma lauda existente.

**Response (200):**
```json
{
  "message": "Reprocessamento iniciado com sucesso",
  "data": {
    "id": 1,
    "status": "processing",
    "startedAt": "2024-01-15T11:00:00Z"
  }
}
```

### DELETE /api/v1/lauda-processing/:id
Remove um processamento (apenas se não estiver em andamento).

**Response (204):** _No content_

## Status do Processamento

- **processing**: Processamento em andamento
- **completed**: Processamento concluído com sucesso
- **failed**: Processamento falhou (veja errorMessage)

## Estrutura do Banco de Dados

A tabela `lauda_processings` armazena:

```sql
CREATE TABLE lauda_processings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  original_content LONGTEXT NOT NULL,
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  processing_time INT NULL,
  assistant1_result JSON NULL,
  assistant2_result JSON NULL,
  assistant3_result JSON NULL,
  final_result JSON NULL,
  error_message TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Fluxo de Processamento

1. **Recebimento**: API recebe lauda e cria registro inicial
2. **Assistente 1**: Extrai e estrutura o conteúdo
3. **Assistente 2**: Seleciona módulos visuais apropriados
4. **Assistente 3**: Adiciona ícones contextuais
5. **Finalização**: Salva resultados e marca como concluído

## Configuração

### Variáveis de Ambiente

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
ASSISTANT_1_ID=asst_IeEnwClW8gB69TxxIsmM0Ndv
ASSISTANT_2_ID=asst_pUL1JoKSAes0TRguMlIis7B7
ASSISTANT_3_ID=asst_npGeazEzGOXL2o6CaUSn43iP
```

### Dependências

- OpenAI API (Assistants v2)
- MySQL/MariaDB
- AdonisJS 6

## Tratamento de Erros

A API trata os seguintes cenários de erro:

- **400**: Dados de entrada inválidos
- **401**: Não autenticado
- **404**: Processamento não encontrado
- **500**: Erro interno do servidor ou falha na API OpenAI

## Performance

- Processamento assíncrono (não bloqueia a resposta inicial)
- Armazenamento completo dos resultados intermediários
- Medição automática do tempo de processamento
- Logs estruturados para debugging

## Segurança

- Autenticação obrigatória via token API
- Validação de entrada com VineJS
- Sanitização de conteúdo
- Rate limiting (pode ser configurado no middleware)

## Monitoramento

Todos os processamentos são logados e podem ser monitorados através:
- Status de processamento em tempo real
- Métricas de tempo de processamento
- Logs de erro detalhados
- Histórico completo de processamentos