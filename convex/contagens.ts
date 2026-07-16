import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";
import { obterSaldoEstoque } from "./estoque";

/**
 * Query para obter a contagem física ativa (em andamento) de uma câmara.
 * Retorna null se não houver nenhuma aberta.
 */
export const obterContagemAtiva = query({
  args: { camaraId: v.id("camaras") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const ativa = await ctx.db
      .query("contagens_fisicas")
      .withIndex("by_camara_status", (q) =>
        q.eq("camara_id", args.camaraId).eq("status", "aberta")
      )
      .first();

    if (!ativa) return null;

    // Resolver detalhes e nomes dos itens
    const itensResolvidos = [];
    for (const item of ativa.itens) {
      const produto = await ctx.db.get(item.produto_id);
      const sabor = item.sabor_id ? await ctx.db.get(item.sabor_id) : null;
      const formato = item.formato_pacote_id ? await ctx.db.get(item.formato_pacote_id) : null;

      itensResolvidos.push({
        ...item,
        produto_nome: produto?.nome || "Produto Removido",
        produto_unidade: produto?.unidade || "unidade",
        sabor_nome: sabor?.nome || null,
        formato_nome: formato?.nome || null,
      });
    }

    return {
      ...ativa,
      itens: itensResolvidos,
    };
  },
});

/**
 * Mutation para abrir um novo inventário/contagem para uma câmara fria.
 * Lista todos os produtos, sabores e formatos ativos e calcula seus saldos de sistema.
 */
export const abrirContagem = mutation({
  args: { camaraId: v.id("camaras") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // 1. Validar se já existe uma contagem aberta para a câmara
    const ativa = await ctx.db
      .query("contagens_fisicas")
      .withIndex("by_camara_status", (q) =>
        q.eq("camara_id", args.camaraId).eq("status", "aberta")
      )
      .first();
    if (ativa) {
      throw new Error("Já existe uma contagem em andamento para esta câmara.");
    }

    // 2. Obter autor
    const admin = await requireAdmin(ctx);
    const autorNome = admin.name || admin.email;

    const camara = await ctx.db.get(args.camaraId);
    if (!camara) throw new Error("Câmara não encontrada.");

    // 3. Buscar todas as entidades ativas para compor o checklist
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

    // Filtra produtos vinculados a esta câmara fria
    const produtosFiltrados = produtos.filter((prod) => {
      if (!camara.produtos_ids || camara.produtos_ids.length === 0) {
        return true;
      }
      return camara.produtos_ids.includes(prod._id);
    });

    // 4. Montar a lista de itens com seus saldos de estoque atuais
    const itens = [];
    for (const prod of produtosFiltrados) {
      if (prod.nome.toLowerCase().includes("saborizado")) {
        // Produtos saborizados combinam com todos os sabores ativos
        for (const sab of sabores) {
          const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, sab._id, null);
          itens.push({
            produto_id: prod._id,
            sabor_id: sab._id,
            quantidade_sistema: saldo,
            quantidade_contada: saldo, // Pré-preenche com o estoque do sistema
            ajuste_gerado: 0,
          });
        }
      } else if (prod.unidade === "pacote") {
        // Pacotes não saborizados combinam com formatos ativos
        for (const form of formatos) {
          const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, null, form._id);
          itens.push({
            produto_id: prod._id,
            formato_pacote_id: form._id,
            quantidade_sistema: saldo,
            quantidade_contada: saldo,
            ajuste_gerado: 0,
          });
        }
      } else {
        // Produtos por kg sem formato ou sabor
        const saldo = await obterSaldoEstoque(ctx, args.camaraId, prod._id, null, null);
        itens.push({
          produto_id: prod._id,
          quantidade_sistema: saldo,
          quantidade_contada: saldo,
          ajuste_gerado: 0,
        });
      }
    }

    // 5. Salvar a nova auditoria no banco
    return await ctx.db.insert("contagens_fisicas", {
      camara_id: args.camaraId,
      aberta_por_id: autorNome,
      aberta_em: Date.now(),
      status: "aberta",
      itens,
    });
  },
});

/**
 * Mutation para salvar o rascunho de digitação da contagem.
 */
export const salvarRascunhoContagem = mutation({
  args: {
    id: v.id("contagens_fisicas"),
    itens: v.array(
      v.object({
        produto_id: v.id("produtos"),
        sabor_id: v.optional(v.id("sabores")),
        formato_pacote_id: v.optional(v.id("formatos_pacote")),
        quantidade_sistema: v.float64(),
        quantidade_contada: v.float64(),
        ajuste_gerado: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const contagem = await ctx.db.get(args.id);
    if (!contagem) throw new Error("Inventário não encontrado.");
    if (contagem.status !== "aberta") throw new Error("Este inventário já foi finalizado.");

    await ctx.db.patch(args.id, {
      itens: args.itens,
    });
  },
});

/**
 * Mutation para finalizar o inventário e gerar transações automáticas de ajuste de estoque.
 */
export const finalizarContagem = mutation({
  args: {
    id: v.id("contagens_fisicas"),
    itens: v.array(
      v.object({
        produto_id: v.id("produtos"),
        sabor_id: v.optional(v.id("sabores")),
        formato_pacote_id: v.optional(v.id("formatos_pacote")),
        quantidade_sistema: v.float64(),
        quantidade_contada: v.float64(),
        ajuste_gerado: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const autorNome = admin.name || admin.email;

    const contagem = await ctx.db.get(args.id);
    if (!contagem) throw new Error("Inventário não encontrado.");
    if (contagem.status !== "aberta") throw new Error("Este inventário já foi finalizado.");

    // 1. Gravar no ledger as movimentações de ajuste de estoque para itens com discrepância
    for (const item of args.itens) {
      const ajuste = item.quantidade_contada - item.quantidade_sistema;

      if (ajuste !== 0) {
        const produto = await ctx.db.get(item.produto_id);
        if (!produto) continue;

        // Calcular peso equivalente
        let pesoTotalKg = ajuste;
        if (produto.unidade === "pacote" && item.formato_pacote_id) {
          const formato = await ctx.db.get(item.formato_pacote_id);
          if (formato) {
            pesoTotalKg = ajuste * formato.peso_kg;
          }
        }

        // Lançar movimentação de Ajuste
        await ctx.db.insert("movimentacoes", {
          tipo: "ajuste",
          camara_id: contagem.camara_id,
          produto_id: item.produto_id,
          sabor_id: item.sabor_id || undefined,
          formato_pacote_id: item.formato_pacote_id || undefined,
          quantidade: ajuste,
          peso_total_kg: pesoTotalKg,
          autor_id: autorNome,
          data_hora: Date.now(),
          contagem_id: contagem._id,
        });
      }
    }

    // 2. Atualizar o status do inventário para finalizado
    await ctx.db.patch(args.id, {
      status: "fechada",
      fechada_por_id: autorNome,
      fechada_em: Date.now(),
      itens: args.itens,
    });

    return contagem.camara_id;
  },
});

/**
 * Mutation para cancelar e descartar um inventário em andamento sem gerar ajustes.
 */
export const cancelarContagem = mutation({
  args: { id: v.id("contagens_fisicas") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const contagem = await ctx.db.get(args.id);
    if (!contagem) throw new Error("Inventário não encontrado.");
    if (contagem.status !== "aberta") throw new Error("Este inventário já foi finalizado.");

    // Deleta o registro de contagem física aberta
    await ctx.db.delete(args.id);
  },
});

/**
 * Query para listar todas as auditorias físicas de estoque finalizadas.
 */
export const listarHistoricoContagens = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const contagens = await ctx.db
      .query("contagens_fisicas")
      .filter((q) => q.eq(q.field("status"), "fechada"))
      .collect();

    const resultado = [];
    for (const c of contagens) {
      const camara = await ctx.db.get(c.camara_id);
      const divergencias = c.itens.filter((i) => i.ajuste_gerado !== 0).length;

      resultado.push({
        _id: c._id,
        camara_nome: camara?.nome || "Câmara Removida",
        aberta_por_id: c.aberta_por_id,
        aberta_em: c.aberta_em,
        fechada_por_id: c.fechada_por_id || "",
        fechada_em: c.fechada_em || 0,
        total_divergencias: divergencias,
      });
    }

    // Ordenar de forma decrescente pela data de fechamento
    return resultado.sort((a, b) => b.fechada_em - a.fechada_em);
  },
});

/**
 * Query para obter os detalhes comparativos de uma auditoria específica.
 */
export const obterDetalhesContagem = query({
  args: { id: v.id("contagens_fisicas") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const contagem = await ctx.db.get(args.id);
    if (!contagem) return null;

    const camara = await ctx.db.get(contagem.camara_id);

    const itensResolvidos = [];
    for (const item of contagem.itens) {
      const produto = await ctx.db.get(item.produto_id);
      const sabor = item.sabor_id ? await ctx.db.get(item.sabor_id) : null;
      const formato = item.formato_pacote_id ? await ctx.db.get(item.formato_pacote_id) : null;

      itensResolvidos.push({
        ...item,
        produto_nome: produto?.nome || "Produto Removido",
        produto_unidade: produto?.unidade || "unidade",
        sabor_nome: sabor?.nome || null,
        formato_nome: formato?.nome || null,
      });
    }

    return {
      _id: contagem._id,
      camara_nome: camara?.nome || "Câmara Removida",
      aberta_por_id: contagem.aberta_por_id,
      aberta_em: contagem.aberta_em,
      fechada_por_id: contagem.fechada_por_id || "",
      fechada_em: contagem.fechada_em || 0,
      itens: itensResolvidos,
    };
  },
});

/**
 * Query para listar todas as contagens físicas abertas.
 * Otimiza a verificação de status das câmaras no dashboard.
 */
export const listarContagensAtivas = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("contagens_fisicas")
      .filter((q) => q.eq(q.field("status"), "aberta"))
      .collect();
  },
});

