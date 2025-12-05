## EXEMPLO DE USO DO ASSISTENTE 2 (CORRIGIDO)

### INPUT (resultado do Assistente 1):
```json
{
  "marca": "Itaú Massificado",
  "produto_servico": "Limite Garantido - Cofrinhos", 
  "header": "Limite Garantido \nAplicou, liberou. Simples, rápido e seguro!",
  "corpo_email": {
    "secoes": [
      {
        "secao": 1,
        "conteudo": [
          {
            "tipo": "titulo",
            "texto": "Olá, %%=ProperCase([Primeiro_Nome])=%%."
          },
          {
            "tipo": "paragrafo", 
            "texto": "Você sabia que é possível aumentar cada vez mais o seu limite do cartão de crédito sem precisar passar por uma nova análise de crédito?"
          }
        ]
      },
      {
        "secao": 2,
        "conteudo": [
          {
            "tipo": "paragrafo",
            "texto": "Com o Limite Garantido do Itaú Personnalité é assim: quanto mais você aplica no Cofrinhos pelo app, mais limite é disponibilizado no seu cartão de crédito para usar como quiser!"
          }
        ]
      },
      {
        "secao": 3,
        "conteudo": [
          {
            "tipo": "subtitulo", 
            "texto": "Continue aplicando para ter um limite cada vez maior:"
          },
          {
            "tipo": "topico",
            "texto": "Para cada R$ 1,00 reservado, você tem R$ 1,00 de aumento de limite"
          },
          {
            "tipo": "topico",
            "texto": "Seu limite aumenta de forma automática, sem complicação"
          },
          {
            "tipo": "cta",
            "texto": "Aplicar no Cofrinhos"
          }
        ]
      }
    ]
  }
}
```

### OUTPUT CORRETO do Assistente 2:
```json
{
  "email_layout": {
    "total_modules": 6,
    "layout_strategy": "Header impactante seguido de saudação personalizada, explicação do benefício em parágrafos, subtítulo de introdução, tópicos destacados individualmente com ícones e CTA final prominente",
    "modules": [
      {
        "module_position": 1,
        "module_name": "header_res-flu",
        "module_purpose": "Header principal com mensagem de impacto",
        "content_mapping": {
          "title": "Limite Garantido",
          "text": "Aplicou, liberou. Simples, rápido e seguro!"
        },
        "source_sections": ["header"],
        "content_elements_used": ["header"]
      },
      {
        "module_position": 2,
        "module_name": "1C_name_res-flu",
        "module_purpose": "Saudação personalizada para engajamento inicial",
        "content_mapping": {
          "title": "Olá, %%=ProperCase([Primeiro_Nome])=%%."
        },
        "source_sections": [1],
        "content_elements_used": ["titulo"]
      },
      {
        "module_position": 3,
        "module_name": "1C_txt_res-flu",
        "module_purpose": "Apresentação do problema/oportunidade",
        "content_mapping": {
          "text": "Você sabia que é possível aumentar cada vez mais o seu limite do cartão de crédito sem precisar passar por uma nova análise de crédito?"
        },
        "source_sections": [1],
        "content_elements_used": ["paragrafo"]
      },
      {
        "module_position": 4,
        "module_name": "1C_txt_res-flu",
        "module_purpose": "Explicação da solução/benefício",
        "content_mapping": {
          "text": "Com o Limite Garantido do Itaú Personnalité é assim: quanto mais você aplica no Cofrinhos pelo app, mais limite é disponibilizado no seu cartão de crédito para usar como quiser!"
        },
        "source_sections": [2],
        "content_elements_used": ["paragrafo"]
      },
      {
        "module_position": 5,
        "module_name": "1C_tit_res-flu",
        "module_purpose": "Introdução dos benefícios detalhados",
        "content_mapping": {
          "title": "Continue aplicando para ter um limite cada vez maior:"
        },
        "source_sections": [3],
        "content_elements_used": ["subtitulo"]
      },
      {
        "module_position": 6,
        "module_name": "1C_icon_res-flu", 
        "module_purpose": "Primeiro benefício destacado com ícone",
        "content_mapping": {
          "icon": "icone-dinheiro",
          "title": "Aumento Proporcional",
          "text": "Para cada R$ 1,00 reservado, você tem R$ 1,00 de aumento de limite"
        },
        "source_sections": [3],
        "content_elements_used": ["topico"]
      },
      {
        "module_position": 7,
        "module_name": "1C_icon_res-flu",
        "module_purpose": "Segundo benefício destacado com ícone",
        "content_mapping": {
          "icon": "icone-automatico",
          "title": "Processo Automático", 
          "text": "Seu limite aumenta de forma automática, sem complicação"
        },
        "source_sections": [3],
        "content_elements_used": ["topico"]
      },
      {
        "module_position": 8,
        "module_name": "1C_icon_res-flu",
        "module_purpose": "Call-to-action final destacado",
        "content_mapping": {
          "icon": "icone-aplicacao",
          "title": "Comece agora mesmo!",
          "text": "Aumente seu limite de forma inteligente e segura",
          "button": "Aplicar no Cofrinhos"
        },
        "source_sections": [3],
        "content_elements_used": ["cta"]
      }
    ]
  },
  "layout_analysis": {
    "content_distribution": "Header para impacto inicial, saudação para personalização, 2 blocos de texto explicativo, título de seção e benefícios individuais destacados com ícones, CTA final prominente",
    "visual_hierarchy": "Máxima prioridade no header, alta na saudação e CTAs, média nos textos explicativos, cada tópico recebe destaque individual para melhor compreensão",
    "strategic_notes": "Cada tópico foi transformado em um módulo 1C_icon_res-flu individual para melhor destaque visual. CTA destacado com ícone e botão para maximizar conversão. Sequência lógica: impacto > personalização > problema > solução > benefícios > ação."
  }
}
```

### ❌ COMPARAÇÃO COM VERSÃO INCORRETA:
```json
// ERRO: Uso incorreto do 2C_icon_res-flu
{
  "content_mapping": {
    "left": {  // ❌ Campo "left" não existe!
      "title": "Aumento Proporcional",
      "text": "Para cada R$ 1,00 reservado..."
    },
    "right": {  // ❌ Campo "right" não existe!
      "title": "Processo Automático", 
      "text": "Seu limite aumenta..."
    }
  }
}

// CORREÇÃO: Use dois módulos 1C_icon_res-flu separados
{
  "module_position": 6,
  "module_name": "1C_icon_res-flu",
  "content_mapping": {
    "icon": "icone-dinheiro",  // ✅ Campo correto
    "title": "Aumento Proporcional",  // ✅ Campo correto
    "text": "Para cada R$ 1,00 reservado..."  // ✅ Campo correto
  }
}
```

Este exemplo demonstra como o Assistente 2 deve processar o conteúdo estruturado e mapear para módulos visuais usando APENAS os campos especificados nas estruturas exatas dos módulos.