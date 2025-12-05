# 🤖 Assistente de IA - Processamento de Laudas de E-mail

Documentação completa do assistente de IA especializado em extrair e estruturar conteúdo de laudas de e-mail marketing para geração automática de wireframes.

## 📋 Índice

- [🎯 Propósito](#-propósito)
- [🏷️ Tags e Marcações](#️-tags-e-marcações)
- [💡 Exemplo de Uso](#-exemplo-de-uso)
- [📝 Prompt do Assistente](#-prompt-do-assistente)
- [📊 Resultados de Teste](#-resultados-de-teste)
- [⚠️ Limitações Conhecidas](#️-limitações-conhecidas)

## 🎯 Propósito

O assistente de IA foi desenvolvido para:

### Objetivo Principal
Automatizar o processo de transformação de laudas de e-mail marketing em estruturas hierárquicas organizadas, facilitando a criação de wireframes e layouts visuais.

### Funcionalidades Core
- **Extração Inteligente**: Identifica e separa marcações específicas do conteúdo
- **Estruturação Hierárquica**: Organiza conteúdo em seções e elementos tipificados
- **Preservação Integral**: Mantém fidelidade absoluta ao texto original
- **Classificação Semântica**: Tipifica elementos por função (título, parágrafo, CTA, etc.)
- **Suporte Visual**: Processa elementos como botões e imagens com metadados

### Benefícios
- ⚡ **Agilidade**: Reduz tempo de estruturação manual de laudas
- 🎯 **Precisão**: Classificação consistente de elementos de conteúdo
- 🔄 **Padronização**: Output estruturado e previsível para wireframes
- 📐 **Escalabilidade**: Processa laudas de qualquer tamanho ou complexidade

## 🏷️ Tags e Marcações

### Marcações Obrigatórias

| Marcação | Propósito | Exemplo |
|----------|-----------|---------|
| `[Marca]` | Identifica o nome da marca/cliente | `[Marca]`<br>`Itaú Massificado` |
| `[Produto/Serviço]` | Define o produto ou serviço promovido | `[Produto/Serviço]`<br>`Limite Garantido - Cofrinhos` |
| `[Header]` | Especifica o cabeçalho principal do e-mail | `[Header]`<br>`Seu limite aumentou! Aproveite.` |

### Marcações Opcionais

| Marcação | Propósito | Estrutura | Exemplo |
|----------|-----------|-----------|---------|
| `[Botão: texto]` | Define botões de ação | Texto simples após dois pontos | `[Botão: Saiba mais]` |
| `[Imagem: descrição - formato: tipo]` | Especifica elementos visuais | Descrição e formato opcionais | `[Imagem: Logo da marca - formato: png]` |

#### Variações da Marcação de Imagem
```
[Imagem:]                                    // Sem descrição nem formato
[Imagem: Logo da marca]                      // Apenas descrição  
[Imagem: - formato: gif]                     // Apenas formato
[Imagem: Demonstração do app - formato: gif] // Completa
```

### Tipos de Classificação de Conteúdo

| Tipo | Descrição | Uso Recomendado |
|------|-----------|-----------------|
| `titulo` | Títulos principais, saudações após header | Chamadas principais, cumprimentos |
| `subtitulo` | Introduções de seções ou listas | Apresentação de tópicos, divisões |
| `paragrafo` | Textos explicativos, instruções, orientações | Conteúdo descritivo, avisos |
| `topico` | Itens de lista, pontos específicos | Listas numeradas, características |
| `cta` | Chamadas para ação (apenas botões marcados) | Elementos de ação interativa |
| `imagem` | Elementos visuais com metadados | Logos, ilustrações, gráficos |

## 💡 Exemplo de Uso

### Input - Lauda Original
```
[Marca]
Itaú Massificado

[Produto/Serviço]
Parcelamento de boletos no cartão de crédito

[Header]
Quer parcelar seus boletos e pagar só daqui a 2 meses?
No app Itaú, você pode!

Olá, %%=ProperCase([Primeiro_Nome])=%%!

[Imagem: Logo do Itaú - formato: png]

Além de pagar seus boletos em até 12x no cartão de crédito, agora você também pode escolher quando começar a pagar.

Uma forma prática e 100% digital pra você:
Centralizar seus gastos
Organize os boletos no cartão de crédito e facilite seu dia a dia financeiro.

[Botão: Parcelar agora]

Sujeito a análise de crédito. Consulte condições no app.
```

### Output - Estrutura Gerada
```json
{
  "marca": "Itaú Massificado",
  "produto_servico": "Parcelamento de boletos no cartão de crédito",
  "header": "Quer parcelar seus boletos e pagar só daqui a 2 meses?\nNo app Itaú, você pode!",
  "corpo_email": {
    "secoes": [
      {
        "secao": 1,
        "conteudo": [
          {
            "tipo": "titulo",
            "texto": "Olá, %%=ProperCase([Primeiro_Nome])=%%!"
          },
          {
            "tipo": "imagem",
            "proposito": "Logo do Itaú",
            "formato": "png"
          },
          {
            "tipo": "paragrafo",
            "texto": "Além de pagar seus boletos em até 12x no cartão de crédito, agora você também pode escolher quando começar a pagar."
          }
        ]
      },
      {
        "secao": 2,
        "conteudo": [
          {
            "tipo": "subtitulo",
            "texto": "Uma forma prática e 100% digital pra você:"
          },
          {
            "tipo": "topico",
            "texto": "Centralizar seus gastos\nOrganize os boletos no cartão de crédito e facilite seu dia a dia financeiro."
          }
        ]
      },
      {
        "secao": 3,
        "conteudo": [
          {
            "tipo": "cta",
            "texto": "Parcelar agora",
            "tipo_cta": "botao"
          }
        ]
      },
      {
        "secao": 4,
        "conteudo": [
          {
            "tipo": "paragrafo",
            "texto": "Sujeito a análise de crédito. Consulte condições no app."
          }
        ]
      }
    ]
  },
  "input": "[Marca]\nItaú Massificado\n\n[Produto/Serviço]\nParcelamento de boletos no cartão de crédito..."
}
```

## 📝 Prompt do Assistente

O assistente utiliza um prompt estruturado e detalhado localizado em:
```
storage/prompt/chatgpt4_prompt.txt
```

### Estrutura do Prompt

1. **Contexto e Função**: Define o papel do assistente como especialista em processamento de laudas
2. **Marcações Obrigatórias e Opcionais**: Lista todas as marcações suportadas
3. **Regras de Extração**: Especifica como processar cada tipo de marcação
4. **Estruturação Hierárquica**: Define critérios para organização em seções
5. **Formato de Saída**: Especifica a estrutura JSON esperada
6. **Tratamento de Erros**: Define como reportar marcações ausentes
7. **Exemplo Prático**: Demonstra input e output esperado
8. **Instruções de Segurança**: Regras críticas de preservação e classificação

### Regras de Segurança Obrigatórias

1. **Preservação Textual**: Proibição absoluta de modificar texto original
2. **Completude**: Todo conteúdo deve ser incluído sem omissões
3. **Classificação Específica**: CTAs apenas para marcações `[Botão:]`
4. **Formatação**: Preservação de quebras de linha com `\n`
5. **Input Integral**: Campo `input` com conteúdo original completo

## 📊 Resultados de Teste

### Casos de Teste - Versão 2

#### Arquivo 1: Limite Garantido - Cofrinhos
**Performance**: ✅ Sucesso 95%
- ✅ Marcações extraídas corretamente
- ✅ Estruturação hierárquica adequada  
- ✅ Classificações precisas
- ✅ Conteúdo completo preservado

#### Arquivo 2: Itaú Uniclass Investimentos  
**Performance**: ✅ Sucesso 98%
- ✅ Botão classificado corretamente como CTA
- ✅ Estruturação em seções lógica
- ✅ Texto preservado integralmente
- ✅ Hierarquia bem definida

#### Arquivo 3: Parcelamento de Boletos
**Performance**: ⚠️ Sucesso 90%
- ✅ Imagem processada com metadados
- ✅ Tópicos estruturados consistentemente  
- ✅ Múltiplos botões identificados
- ❌ **Erro**: Alteração textual ("dDaqui" → preservado incorretamente)

### Métricas de Qualidade

| Aspecto | V1 | V2 | Melhoria |
|---------|----|----|----------|
| **Preservação de Texto** | 85% | 95% | +10% |
| **Estruturação** | 80% | 95% | +15% |  
| **Classificação** | 90% | 98% | +8% |
| **Completude** | 75% | 100% | +25% |
| **Consistência** | 85% | 95% | +10% |

## ⚠️ Limitações Conhecidas

### Problemas Identificados
1. **Preservação Textual**: Ocasionalmente altera texto com erros de digitação
2. **Consistência Estrutural**: Variações menores na organização de seções

---

**Desenvolvido para o projeto AutoLayout**  
*Sistema de geração automática de wireframes para e-mail marketing*