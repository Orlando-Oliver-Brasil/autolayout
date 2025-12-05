// EXEMPLO DE USO DO ASSISTENTE 3 - SELEÇÃO DE ÍCONES REAIS

// INPUT: Resultado do Assistente 2 (lauda-1.json)
{
  "email_layout": {
    "modules": [
      {
        "module_position": 5,
        "module_name": "1C_icon_res-flu",
        "module_purpose": "Destaque para benefício de aumento de limite proporcional", 
        "content_mapping": {
          "icon": "icone-beneficio-1", // ← GENÉRICO
          "title": "Para cada R$ 1,00 reservado, você tem R$ 1,00 de aumento de limite"
        }
      }
    ]
  }
}

// PROCESSO DE ANÁLISE:
// 1. Contexto: cartão de crédito + limite + proporcionalidade
// 2. Busca: credit_*, card_*, bank_* relacionados a crescimento/aumento
// 3. Palavras-chave: limite, crédito, aumento, automático
// 4. Seleção: "credit_auto_base" (crédito automático)

// OUTPUT: Resultado com ícone real
{
  "email_layout": {
    "modules": [
      {
        "module_position": 5,
        "module_name": "1C_icon_res-flu",
        "module_purpose": "Destaque para benefício de aumento de limite proporcional",
        "content_mapping": {
          "icon": "credit_auto_base", // ← REAL
          "title": "Para cada R$ 1,00 reservado, você tem R$ 1,00 de aumento de limite"
        }
      }
    ]
  },
  "icon_selections": {
    "replacements_made": 1,
    "selection_notes": "Selecionado credit_auto_base para representar aumento automático de limite de crédito proporcional ao valor aplicado."
  }
}