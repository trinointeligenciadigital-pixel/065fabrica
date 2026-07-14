import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireColaboradorForAction, requireAdmin } from "./helpers";
import type { Id } from "./_generated/dataModel";

/**
 * Helper interno para calcular o saldo disponível de um item na câmara fria.
 * Soma todas as movimentações daquele item (produto + sabor + formato) na câmara.
 */
export async function obterSaldoEstoque(
  ctx: QueryCtx | MutationCtx,
  camaraId: Id<"camaras">,
  produtoId: Id<"produtos">,
  saborId?: Id<"sabores"> | null,
  formatoPacoteId?: Id<"formatos_pacote"> | null
): Promise<number> {
  const movimentacoes = await ctx.db
    .query("movimentacoes")
    .withIndex("by_camara", (q) => q.eq("camara_id", camaraId))
    .collect();

  // Filtra as movimentações correspondentes ao produto, sabor e formato
  const filtradas = movimentacoes.filter((m) => {
    const matchProduto = m.produto_id === produtoId;
    const matchSabor = saborId ? m.sabor_id === saborId : !m.sabor_id;
    const matchFormato = formatoPacoteId ? m.formato_pacote_id === formatoPacoteId : !m.formato_pacote_id;
    return matchProduto && matchSabor && matchFormato;
  });

  // Soma as quantidades (entradas positivas, saídas negativas)
  return filtradas.reduce((total, m) => total + m.quantidade, 0);
}

/**
 * Query para expor o saldo atual de estoque de um item no frontend.
 */
export const consultarSaldoEstoque = query({
  args: {
    camaraId: v.id("camaras"),
    produtoId: v.id("produtos"),
    saborId: v.optional(v.id("sabores")),
    formatoPacoteId: v.optional(v.id("formatos_pacote")),
  },
  handler: async (ctx, args) => {
    return await obterSaldoEstoque(ctx, args.camaraId, args.produtoId, args.saborId, args.formatoPacoteId);
  },
});

/**
 * Mutation para lançar a Produção (entrada de estoque).
 * Aceita autenticação por Token de Colaborador (operador) ou Clerk (admin).
 */
export const lancarProducao = mutation({
  args: {
    token: v.optional(v.string()), // Token do colaborador
    camaraId: v.id("camaras"),
    produtoId: v.id("produtos"),
    saborId: v.optional(v.id("sabores")),
    formatoPacoteId: v.optional(v.id("formatos_pacote")),
    quantidade: v.float64(),
  },
  handler: async (ctx, args) => {
    let autorNome = "";

    // Determina a autorização
    if (args.token) {
      const colab = await requireColaboradorForAction(ctx, args.token, args.camaraId, "producao");
      autorNome = colab.nome;
    } else {
      const admin = await requireAdmin(ctx);
      autorNome = admin.name || admin.email;
    }

    if (args.quantidade <= 0) {
      throw new Error("A quantidade produzida deve ser maior que zero.");
    }

    const produto = await ctx.db.get(args.produtoId);
    if (!produto || !produto.ativo) throw new Error("Produto inválido ou inativo.");

    // Cálculo do peso total em kg
    let pesoTotalKg = args.quantidade;
    if (produto.unidade === "pacote" && args.formatoPacoteId) {
      const formato = await ctx.db.get(args.formatoPacoteId);
      if (!formato || !formato.ativo) throw new Error("Formato de pacote inválido ou inativo.");
      pesoTotalKg = formato.peso_kg * args.quantidade;
    }

    // Insere movimentação de entrada (positiva)
    return await ctx.db.insert("movimentacoes", {
      tipo: "producao",
      camara_id: args.camaraId,
      produto_id: args.produtoId,
      sabor_id: args.saborId || undefined,
      formato_pacote_id: args.formatoPacoteId || undefined,
      quantidade: args.quantidade,
      peso_total_kg: pesoTotalKg,
      autor_id: autorNome,
      data_hora: Date.now(),
    });
  },
});

/**
 * Mutation para lançar Perda (saída de estoque).
 * Impede que o estoque fique negativo.
 */
export const lancarPerda = mutation({
  args: {
    token: v.optional(v.string()),
    camaraId: v.id("camaras"),
    produtoId: v.id("produtos"),
    saborId: v.optional(v.id("sabores")),
    formatoPacoteId: v.optional(v.id("formatos_pacote")),
    quantidade: v.float64(),
    motivoPerdaId: v.id("motivos_perda"),
    observacao: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let autorNome = "";

    if (args.token) {
      const colab = await requireColaboradorForAction(ctx, args.token, args.camaraId, "saida");
      autorNome = colab.nome;
    } else {
      const admin = await requireAdmin(ctx);
      autorNome = admin.name || admin.email;
    }

    if (args.quantidade <= 0) {
      throw new Error("A quantidade de perda deve ser maior que zero.");
    }

    const produto = await ctx.db.get(args.produtoId);
    if (!produto || !produto.ativo) throw new Error("Produto inválido ou inativo.");

    const motivo = await ctx.db.get(args.motivoPerdaId);
    if (!motivo || !motivo.ativo) throw new Error("Motivo de perda inválido ou inativo.");

    // Cálculo do peso total
    let pesoTotalKg = args.quantidade;
    if (produto.unidade === "pacote" && args.formatoPacoteId) {
      const formato = await ctx.db.get(args.formatoPacoteId);
      if (!formato || !formato.ativo) throw new Error("Formato de pacote inválido ou inativo.");
      pesoTotalKg = formato.peso_kg * args.quantidade;
    }

    // Validação de saldo (Bloqueio antinegativo)
    const saldoAtual = await obterSaldoEstoque(
      ctx,
      args.camaraId,
      args.produtoId,
      args.saborId,
      args.formatoPacoteId
    );

    if (saldoAtual < args.quantidade) {
      throw new Error(
        `Saldo insuficiente para lançamento de perda. Saldo disponível: ${saldoAtual} ${produto.unidade}s.`
      );
    }

    // Insere movimentação de saída (negativa)
    return await ctx.db.insert("movimentacoes", {
      tipo: "perda",
      camara_id: args.camaraId,
      produto_id: args.produtoId,
      sabor_id: args.saborId || undefined,
      formato_pacote_id: args.formatoPacoteId || undefined,
      quantidade: -args.quantidade,
      peso_total_kg: -pesoTotalKg,
      autor_id: autorNome,
      data_hora: Date.now(),
      motivo_perda_id: args.motivoPerdaId,
    });
  },
});

/**
 * Mutation para lançar um Carregamento (venda ou patrocínio).
 * Valida o saldo de todos os itens atomicamente antes de gravar qualquer saída.
 */
export const lancarCarregamento = mutation({
  args: {
    token: v.optional(v.string()),
    camaraId: v.id("camaras"),
    tipo: v.union(v.literal("venda"), v.literal("patrocinio")),
    evento: v.optional(v.string()),
    veiculoId: v.optional(v.id("veiculos")),
    veiculoPlaca: v.optional(v.string()),
    veiculoDescricao: v.optional(v.string()),
    motorista: v.string(),
    clienteId: v.optional(v.id("clientes")),
    clienteNome: v.optional(v.string()),
    itens: v.array(
      v.object({
        produtoId: v.id("produtos"),
        saborId: v.optional(v.id("sabores")),
        formatoPacoteId: v.optional(v.id("formatos_pacote")),
        quantidade: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let autorNome = "";

    if (args.token) {
      const colab = await requireColaboradorForAction(ctx, args.token, args.camaraId, "saida");
      autorNome = colab.nome;
    } else {
      const admin = await requireAdmin(ctx);
      autorNome = admin.name || admin.email;
    }

    if (args.tipo === "patrocinio" && !args.evento) {
      throw new Error("O nome do evento é obrigatório para saídas do tipo Patrocínio.");
    }

    if (args.itens.length === 0) {
      throw new Error("O carregamento precisa conter pelo menos um item.");
    }

    // Primeira passada: Validar dados dos produtos e saldo de estoque de cada item atomicamente
    const itensValidados = [];
    for (const item of args.itens) {
      if (item.quantidade <= 0) {
        throw new Error("A quantidade de cada item deve ser maior que zero.");
      }

      const produto = await ctx.db.get(item.produtoId);
      if (!produto || !produto.ativo) throw new Error(`Produto inválido ou inativo: ${item.produtoId}`);

      // Calcular peso
      let pesoTotalKg = item.quantidade;
      if (produto.unidade === "pacote" && item.formatoPacoteId) {
        const formato = await ctx.db.get(item.formatoPacoteId);
        if (!formato || !formato.ativo) throw new Error("Formato de pacote inválido ou inativo.");
        pesoTotalKg = formato.peso_kg * item.quantidade;
      }

      // Validar saldo
      const saldoAtual = await obterSaldoEstoque(
        ctx,
        args.camaraId,
        item.produtoId,
        item.saborId,
        item.formatoPacoteId
      );

      if (saldoAtual < item.quantidade) {
        let descritivoSabor = "";
        if (item.saborId) {
          const sab = await ctx.db.get(item.saborId);
          descritivoSabor = ` (${sab?.nome})`;
        }
        throw new Error(
          `Saldo insuficiente para ${produto.nome}${descritivoSabor}. Saldo disponível na câmara: ${saldoAtual} ${produto.unidade}s. Lançado: ${item.quantidade}.`
        );
      }

      itensValidados.push({
        ...item,
        pesoTotalKg,
      });
    }

    // Segunda passada: Gravar o carregamento principal
    // Para patrocínio, o status inicial é "retorno_pendente", para venda é "concluido"
    const statusCarregamento = args.tipo === "patrocinio" ? "retorno_pendente" : "concluido";

    const carregamentoId = await ctx.db.insert("carregamentos", {
      tipo: args.tipo,
      evento: args.evento,
      veiculo_id: args.veiculoId,
      veiculo_placa: args.veiculoPlaca,
      veiculo_descricao: args.veiculoDescricao,
      motorista: args.motorista,
      responsavel_id: autorNome,
      data_hora: Date.now(),
      status: statusCarregamento,
      cliente_id: args.clienteId,
      cliente_nome: args.clienteNome,
    });

    // Terceira passada: Gravar as saídas no ledger vinculadas ao carregamento
    for (const item of itensValidados) {
      await ctx.db.insert("movimentacoes", {
        tipo: args.tipo,
        camara_id: args.camaraId,
        produto_id: item.produtoId,
        sabor_id: item.saborId || undefined,
        formato_pacote_id: item.formatoPacoteId || undefined,
        quantidade: -item.quantidade, // Saída (negativa)
        peso_total_kg: -item.pesoTotalKg, // Peso negativo
        autor_id: autorNome,
        data_hora: Date.now(),
        carregamento_id: carregamentoId,
      });
    }

    return carregamentoId;
  },
});

/**
 * Query para obter o histórico das últimas 200 movimentações de estoque.
 * Resolve os IDs de produtos, sabores, formatos, câmaras e motivos de perda.
 */
export const listarMovimentacoesHistorico = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const movimentacoes = await ctx.db
      .query("movimentacoes")
      .withIndex("by_data")
      .order("desc")
      .take(200);

    const resultado = [];
    for (const m of movimentacoes) {
      const produto = await ctx.db.get(m.produto_id);
      const camara = await ctx.db.get(m.camara_id);
      const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
      const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;
      const motivoPerda = m.motivo_perda_id ? await ctx.db.get(m.motivo_perda_id) : null;

      resultado.push({
        _id: m._id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        peso_total_kg: m.peso_total_kg,
        autor_id: m.autor_id,
        data_hora: m.data_hora,
        produto_nome: produto?.nome || "Produto Removido",
        produto_unidade: produto?.unidade || "unidade",
        camara_nome: camara?.nome || "Câmara Removida",
        sabor_nome: sabor?.nome || null,
        formato_nome: formato?.nome || null,
        motivo_perda_descricao: motivoPerda?.descricao || null,
        carregamento_id: m.carregamento_id || null,
      });
    }

    return resultado;
  },
});

/**
 * Query para consolidação de dados gerais do Dashboard Administrativo.
 * Retorna estoque total em kg, alertas de reposição, estoque por câmara e feed de atividades.
 */
export const obterDadosDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const produtos = await ctx.db
      .query("produtos")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    const camaras = await ctx.db
      .query("camaras")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    const sabores = await ctx.db
      .query("sabores")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    const formatos = await ctx.db
      .query("formatos_pacote")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();

    let pesoTotalEstoque = 0;
    const saldosPorProduto: Record<string, number> = {};
    const estoqueDetalhado = [];

    // 1. Calcular saldos e peso total por câmara
    for (const c of camaras) {
      const itensCamara = [];

      for (const prod of produtos) {
        if (prod.nome.toLowerCase().includes("saborizado")) {
          for (const sab of sabores) {
            const saldo = await obterSaldoEstoque(ctx, c._id, prod._id, sab._id, null);
            if (saldo !== 0) {
              // Saborizados sem formato usam quantidade como peso padrão no ledger original
              itensCamara.push({
                produto_nome: prod.nome,
                sabor_nome: sab.nome,
                quantidade: saldo,
                unidade: prod.unidade,
              });
              pesoTotalEstoque += saldo;
              saldosPorProduto[prod._id] = (saldosPorProduto[prod._id] || 0) + saldo;
            }
          }
        } else if (prod.unidade === "pacote") {
          for (const form of formatos) {
            const saldo = await obterSaldoEstoque(ctx, c._id, prod._id, null, form._id);
            if (saldo !== 0) {
              const peso = saldo * form.peso_kg;
              itensCamara.push({
                produto_nome: prod.nome,
                formato_nome: form.nome,
                quantidade: saldo,
                unidade: prod.unidade,
                peso_kg: peso,
              });
              pesoTotalEstoque += peso;
              saldosPorProduto[prod._id] = (saldosPorProduto[prod._id] || 0) + saldo;
            }
          }
        } else {
          const saldo = await obterSaldoEstoque(ctx, c._id, prod._id, null, null);
          if (saldo !== 0) {
            itensCamara.push({
              produto_nome: prod.nome,
              quantidade: saldo,
              unidade: prod.unidade,
            });
            pesoTotalEstoque += saldo;
            saldosPorProduto[prod._id] = (saldosPorProduto[prod._id] || 0) + saldo;
          }
        }
      }

      if (itensCamara.length > 0) {
        estoqueDetalhado.push({
          camara_nome: c.nome,
          itens: itensCamara,
        });
      }
    }

    // 2. Verificar alertas de estoque mínimo
    const alertasEstoqueMinimo = [];
    for (const prod of produtos) {
      const saldoConsolidado = saldosPorProduto[prod._id] || 0;
      if (saldoConsolidado < prod.minimo) {
        alertasEstoqueMinimo.push({
          produto_nome: prod.nome,
          saldo: saldoConsolidado,
          estoque_minimo: prod.minimo,
          unidade: prod.unidade === "pacote" ? "pct" : "kg",
          status: saldoConsolidado === 0 ? "Critico" : "Abaixo do Minimo",
        });
      }
    }

    // 3. Obter as últimas 5 movimentações
    const ultimasMovimentacoes = await ctx.db
      .query("movimentacoes")
      .withIndex("by_data")
      .order("desc")
      .take(5);

    const movsResolvidas = [];
    for (const m of ultimasMovimentacoes) {
      const produto = await ctx.db.get(m.produto_id);
      const camara = await ctx.db.get(m.camara_id);
      const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
      const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;

      movsResolvidas.push({
        _id: m._id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        peso_total_kg: m.peso_total_kg,
        autor_id: m.autor_id,
        data_hora: m.data_hora,
        produto_nome: produto?.nome || "Produto Removido",
        camara_nome: camara?.nome || "Câmara Removida",
        sabor_nome: sabor?.nome || null,
        formato_nome: formato?.nome || null,
      });
    }

    // 4. Agrupar movimentações dos últimos 7 dias (Produção vs Vendas/Patrocínios)
    const seteDiasAtras = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const movsPeriodo = await ctx.db
      .query("movimentacoes")
      .withIndex("by_data", (q) => q.gte("data_hora", seteDiasAtras))
      .collect();

    // Gerar as chaves de data dos últimos 7 dias para garantir consistência
    const diasGrafico: Record<string, { data: string; producao: number; vendas: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const data = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
      diasGrafico[key] = { data: key, producao: 0, vendas: 0 };
    }

    // Mapear movimentações no gráfico de 7 dias
    for (const m of movsPeriodo) {
      const data = new Date(m.data_hora);
      const key = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
      if (diasGrafico[key]) {
        const pesoVal = Math.abs(m.peso_total_kg);
        if (m.tipo === "producao") {
          diasGrafico[key].producao += pesoVal;
        } else if (m.tipo === "venda" || m.tipo === "patrocinio") {
          diasGrafico[key].vendas += pesoVal;
        }
      }
    }

    const dadosGrafico7Dias = Object.values(diasGrafico);

    // 5. Agrupar perdas históricas por motivo
    const perdas = await ctx.db
      .query("movimentacoes")
      .filter((q) => q.eq(q.field("tipo"), "perda"))
      .collect();

    const perdasPorMotivoRecord: Record<string, number> = {};
    let totalPerdido = 0;

    for (const p of perdas) {
      const motivoId = p.motivo_perda_id || "outros";
      const pesoVal = Math.abs(p.peso_total_kg);
      perdasPorMotivoRecord[motivoId] = (perdasPorMotivoRecord[motivoId] || 0) + pesoVal;
      totalPerdido += pesoVal;
    }

    const perdasPorMotivoList = [];
    for (const [motivoId, peso] of Object.entries(perdasPorMotivoRecord)) {
      let descricao = "Não especificado / Outros";
      if (motivoId !== "outros") {
        const mot = await ctx.db.get(motivoId as Id<"motivos_perda">);
        if (mot) descricao = mot.descricao;
      }
      perdasPorMotivoList.push({
        motivo: descricao,
        quantidade_kg: peso,
        porcentagem: totalPerdido > 0 ? Math.round((peso / totalPerdido) * 100) : 0,
      });
    }

    // Ordenar do maior desperdício para o menor
    perdasPorMotivoList.sort((a, b) => b.quantidade_kg - a.quantidade_kg);

    // 6. Consolidação de saídas por categoria (Venda, Patrocínio, Perda) nos últimos 30 dias
    let totalSaidaVendas = 0;
    let totalSaidaPatrocinios = 0;
    let totalSaidaPerdas = 0;

    const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const movsSaidas = await ctx.db
      .query("movimentacoes")
      .withIndex("by_data", (q) => q.gte("data_hora", trintaDiasAtras))
      .collect();

    for (const m of movsSaidas) {
      const pesoVal = Math.abs(m.peso_total_kg);
      if (m.tipo === "venda" && m.quantidade < 0) {
        totalSaidaVendas += pesoVal;
      } else if (m.tipo === "patrocinio" && m.quantidade < 0) {
        totalSaidaPatrocinios += pesoVal;
      } else if (m.tipo === "perda") {
        totalSaidaPerdas += pesoVal;
      }
    }

    const totalGeralSaidas = totalSaidaVendas + totalSaidaPatrocinios + totalSaidaPerdas;

    return {
      peso_total_estoque: pesoTotalEstoque,
      alertas_estoque_minimo: alertasEstoqueMinimo,
      estoque_detalhado: estoqueDetalhado,
      ultimas_movimentacoes: movsResolvidas,
      total_camaras: camaras.length,
      dados_grafico_7_dias: dadosGrafico7Dias,
      perdas_por_motivo: perdasPorMotivoList,
      consolidado_saidas: {
        vendas: totalSaidaVendas,
        patrocinios: totalSaidaPatrocinios,
        perdas: totalSaidaPerdas,
        total: totalGeralSaidas,
      },
    };
  },
});

/**
 * Query para obter todos os saldos de produtos ativos de uma câmara específica de uma só vez.
 */
export const obterSaldosCamara = query({
  args: {
    camaraId: v.id("camaras"),
  },
  handler: async (ctx, args) => {
    const produtos = await ctx.db
      .query("produtos")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    const sabores = await ctx.db
      .query("sabores")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    const formatos = await ctx.db
      .query("formatos_pacote")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();

    const saldos: Record<string, number> = {};

    for (const prod of produtos) {
      if (prod.nome.toLowerCase().includes("saborizado")) {
        for (const sab of sabores) {
          const key = `${prod._id}_${sab._id}`;
          const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, sab._id, null);
          saldos[key] = saldo;
        }
      } else if (prod.unidade === "pacote") {
        for (const form of formatos) {
          const key = `${prod._id}_${form._id}`;
          const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, null, form._id);
          saldos[key] = saldo;
        }
      } else {
        const key = `${prod._id}`;
        const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, null, null);
        saldos[key] = saldo;
      }
    }

    return saldos;
  },
});


