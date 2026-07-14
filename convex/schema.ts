import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  produtos: defineTable({
    nome: v.string(),
    unidade: v.union(v.literal("pacote"), v.literal("kg")),
    minimo: v.float64(), // Limite para alerta de estoque mínimo
    ativo: v.boolean(),
  }),

  sabores: defineTable({
    nome: v.string(),
    ativo: v.boolean(),
  }),

  formatos_pacote: defineTable({
    nome: v.string(), // ex: "Pacote de 2kg", "Pacote de 4kg"
    peso_kg: v.float64(),
    ativo: v.boolean(),
  }),

  camaras: defineTable({
    nome: v.string(),
    slug: v.string(), // Utilizado no link do QR Code
    ativo: v.boolean(),
  }).index("by_slug", ["slug"]),

  colaboradores: defineTable({
    nome: v.string(),
    pin_hash: v.string(), // Hash do PIN de 4 ou 6 dígitos
    permissao: v.union(v.literal("producao"), v.literal("saidas"), v.literal("ambas")),
    camaras_autorizadas: v.array(v.string()), // IDs de câmaras autorizadas
    ativo: v.boolean(),
    tentativas_pin: v.float64(), // Contador de tentativas incorretas
    bloqueado_ate: v.optional(v.float64()), // Timestamp de até quando o PIN está bloqueado
    whatsapp: v.optional(v.string()),
  }),

  sessoes_operador: defineTable({
    colaborador_id: v.id("colaboradores"),
    camara_id: v.id("camaras"),
    token: v.string(), // Token de sessão de 12 horas
    expira_em: v.float64(), // Timestamp de expiração
  })
    .index("by_token", ["token"])
    .index("by_colaborador", ["colaborador_id"]),

  veiculos: defineTable({
    placa: v.string(),
    descricao: v.string(),
    tipo: v.union(v.literal("proprio"), v.literal("terceiro")),
    ativo: v.boolean(),
  }).index("by_placa", ["placa"]),

  clientes: defineTable({
    nome: v.string(),
    ativo: v.boolean(),
    whatsapp: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("distribuidor"), v.literal("revendedor"), v.literal("final"))),
  }),

  motivos_perda: defineTable({
    descricao: v.string(),
    ativo: v.boolean(),
  }),

  carregamentos: defineTable({
    tipo: v.union(v.literal("venda"), v.literal("patrocinio")),
    evento: v.optional(v.string()), // Obrigatório em patrocínio
    veiculo_id: v.optional(v.id("veiculos")),
    veiculo_placa: v.optional(v.string()), // Para veículos terceiros
    veiculo_descricao: v.optional(v.string()), // Para veículos terceiros
    motorista: v.string(),
    responsavel_id: v.string(), // ID do colaborador ou email do Admin (Clerk)
    data_hora: v.float64(),
    status: v.union(v.literal("concluido"), v.literal("retorno_pendente"), v.literal("retorno_concluido")),
    retorno_itens: v.optional(
      v.array(
        v.object({
          produto_id: v.id("produtos"),
          sabor_id: v.optional(v.id("sabores")),
          formato_pacote_id: v.optional(v.id("formatos_pacote")),
          quantidade: v.float64(),
        })
      )
    ),
    cliente_id: v.optional(v.id("clientes")),
    cliente_nome: v.optional(v.string()),
  }).index("by_status", ["status"]),

  movimentacoes: defineTable({
    tipo: v.union(
      v.literal("producao"),
      v.literal("venda"),
      v.literal("patrocinio"),
      v.literal("perda"),
      v.literal("ajuste"),
      v.literal("retorno_patrocinio")
    ),
    camara_id: v.id("camaras"),
    produto_id: v.id("produtos"),
    sabor_id: v.optional(v.id("sabores")), // Opcional para gelos não saborizados
    formato_pacote_id: v.optional(v.id("formatos_pacote")), // Opcional se for controlado em kg direto
    quantidade: v.float64(), // Positivo para entradas, negativo para saídas
    peso_total_kg: v.float64(), // Peso convertido para kg (facilita somas consolidáveis)
    autor_id: v.string(), // ID do colaborador (Convex) ou email do admin (Clerk)
    data_hora: v.float64(),
    carregamento_id: v.optional(v.id("carregamentos")), // Vínculo para saídas/retornos
    motivo_perda_id: v.optional(v.id("motivos_perda")), // Vínculo para perdas
    contagem_id: v.optional(v.id("contagens_fisicas")), // Vínculo para ajustes gerados por contagem
  })
    .index("by_camara", ["camara_id"])
    .index("by_produto", ["produto_id"])
    .index("by_data", ["data_hora"]),

  contagens_fisicas: defineTable({
    camara_id: v.id("camaras"),
    aberta_por_id: v.string(),
    aberta_em: v.float64(),
    status: v.union(v.literal("aberta"), v.literal("fechada")),
    fechada_por_id: v.optional(v.string()),
    fechada_em: v.optional(v.float64()),
    itens: v.array(
      v.object({
        produto_id: v.id("produtos"),
        sabor_id: v.optional(v.id("sabores")),
        formato_pacote_id: v.optional(v.id("formatos_pacote")),
        quantidade_contada: v.float64(),
        quantidade_sistema: v.float64(),
        ajuste_gerado: v.float64(),
      })
    ),
  }).index("by_camara_status", ["camara_id", "status"]),

  administradores: defineTable({
    email: v.string(),
    nome: v.optional(v.string()),
    adicionado_por: v.optional(v.string()),
    data_hora: v.float64(),
  }).index("by_email", ["email"]),

  perfil_empresa: defineTable({
    nome: v.string(),
    cnpj: v.optional(v.string()),
    endereco: v.optional(v.string()),
    telefone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    logo_storage_id: v.optional(v.string()),
  }),
});
