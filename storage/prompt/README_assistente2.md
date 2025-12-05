# Assistente 2 - Seleção de Módulos Visuais

Este diretório contém os recursos para o **Assistente 2**, responsável por mapear o conteúdo estruturado do Assistente 1 para módulos visuais específicos.

## Arquivos Disponíveis

### 📄 `assistente2_prompt.txt`
**Prompt completo para o Assistente 2** contendo:
- Instruções detalhadas de funcionamento
- Formato de input esperado (JSON do Assistente 1)  
- Descrição de todos os módulos disponíveis
- Regras de compatibilidade e seleção
- Estratégias de agrupamento e otimização visual
- Formato de output estruturado

### 📄 `assistente2_exemplo.md`
**Exemplo prático de uso** mostrando:
- Input real do Assistente 1 (e-mail Itaú)
- Output esperado do Assistente 2
- Mapeamento detalhado de conteúdo para módulos
- Análise da estratégia de layout

### 🗂️ `../modulos_unificados.json`
**Base de dados unificada** contendo:
- Todos os 13 módulos visuais disponíveis
- Campos `supported_types` para compatibilidade 
- Metadados completos de cada módulo
- 1.114 linhas de especificações detalhadas

## Como Usar

### 1. **Preparar Input**
Use a saída JSON do Assistente 1 como input direto para o Assistente 2.

### 2. **Consultar Módulos**
O Assistente 2 consulta automaticamente o arquivo `modulos_unificados.json` para verificar:
- Tipos de conteúdo suportados (`supported_types`)
- Limitações de caracteres
- Estruturas possíveis
- Prioridades visuais

### 3. **Receber Layout**
O Assistente 2 retorna um JSON com:
- Sequência completa de módulos 
- Mapeamento de conteúdo para cada módulo
- Estratégia de layout aplicada
- Análise da distribuição visual

## Funcionalidades Principais

### ✅ **Compatibilidade Automática**
- Verifica `supported_types` de cada módulo
- Mapeia conteúdo apenas para módulos compatíveis
- Evita incompatibilidades de tipo

### ✅ **Otimização Visual**
- Agrupa conteúdos similares em módulos 2C
- Prioriza elementos de alta importância
- Mantém hierarquia de informações
- Otimiza para escaneabilidade

### ✅ **Preservação de Conteúdo**
- Garante que todo conteúdo do input seja mapeado
- Não perde informações na conversão
- Mantém ordem lógica das seções

### ✅ **Estratégia de Layout**
- Header sempre no topo
- Saudações personalizadas priorizadas  
- CTAs destacados adequadamente
- Divisores visuais quando necessário

## Módulos Disponíveis

### 🔷 **1 Coluna (1C)**
- `1C_tit_res-flu` - Títulos simples
- `1C_txt_res-flu` - Textos e parágrafos  
- `1C_img_res-flu` - Imagens
- `1C_icon_res-flu` - Ícone + título + texto + botão
- `1C_line_res-flu` - Linha divisória
- `1C_name_res-flu` - Saudação com nome

### 🔷 **2 Colunas (2C)**  
- `2C_tit-btn_res-flu` - Título + botão
- `2C_icon_res-flu` - Dois blocos ícone + conteúdo
- `2C_img-120px_res-flu` - Duas imagens pequenas
- `2C_img-196px_res-flu` - Duas imagens médias
- `2C_img-228px_res-flu` - Duas imagens grandes

### 🔷 **Headers**
- `header_res-flu` - Header principal 
- `header_img-228px_res-flu` - Header com imagem

## Tipos de Conteúdo Suportados

- **`titulo`** - Títulos principais
- **`subtitulo`** - Subtítulos de seção
- **`paragrafo`** - Textos explicativos
- **`topico`** - Itens de lista ou benefícios
- **`cta`** - Chamadas para ação
- **`imagem`** - Elementos visuais

## Próximos Passos

1. **Implementar API**: Criar endpoint para receber JSON do Assistente 1
2. **Testar Mapeamentos**: Validar com diferentes tipos de conteúdo
3. **Otimizar Algoritmos**: Refinar lógica de seleção de módulos
4. **Criar Interface**: Desenvolver preview visual do layout gerado

---

*Documentação gerada em 05/12/2025 - Assistente 2 pronto para desenvolvimento*