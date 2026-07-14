import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";
import type { Id, Doc } from "./_generated/dataModel";

/**
 * Query para obter a lista de todos os carregamentos realizados (vendas e patrocínios).
 * Resolve e hidrata os itens carregados da tabela de movimentações e os dados do veículo.
 */
export const listarCarregamentos = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const list = await ctx.db.query("carregamentos").collect();
    const perdas = await ctx.db
      .query("movimentacoes")
      .filter((q) => q.eq(q.field("tipo"), "perda"))
      .collect();

    const resultado = [];

    // Processar Carregamentos
    for (const c of list) {
      const movimentacoes = await ctx.db
        .query("movimentacoes")
        .filter((q) => q.eq(q.field("carregamento_id"), c._id))
        .filter((q) => q.lt(q.field("quantidade"), 0))
        .collect();

      const itens = [];
      let camaraNome = "Desconhecida";

      for (const m of movimentacoes) {
        const produto = await ctx.db.get(m.produto_id);
        const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
        const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;

        if (m.camara_id) {
          const camara = await ctx.db.get(m.camara_id);
          if (camara) camaraNome = camara.nome;
        }

        itens.push({
          produto_id: m.produto_id,
          produto_nome: produto?.nome || "Produto Removido",
          produto_unidade: produto?.unidade || "unidade",
          sabor_id: m.sabor_id,
          sabor_nome: sabor?.nome || null,
          formato_pacote_id: m.formato_pacote_id,
          formato_nome: formato?.nome || null,
          quantidade: Math.abs(m.quantidade),
          peso_total_kg: Math.abs(m.peso_total_kg),
        });
      }

      let veiculoPlaca = c.veiculo_placa || "";
      let veiculoDesc = c.veiculo_descricao || "";

      if (c.veiculo_id) {
        const veiculo = await ctx.db.get(c.veiculo_id);
        if (veiculo) {
          veiculoPlaca = veiculo.placa;
          veiculoDesc = veiculo.descricao;
        }
      }

      resultado.push({
        ...c,
        camara_nome: camaraNome,
        veiculo_placa: veiculoPlaca,
        veiculo_descricao: veiculoDesc,
        itens,
      });
    }

    // Processar Perdas como saídas para visualização unificada
    for (const m of perdas) {
      const produto = await ctx.db.get(m.produto_id);
      const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
      const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;
      const motivoPerda = m.motivo_perda_id ? await ctx.db.get(m.motivo_perda_id) : null;
      const camara = await ctx.db.get(m.camara_id);

      resultado.push({
        _id: m._id,
        tipo: "perda",
        responsavel_id: m.autor_id,
        data_hora: m.data_hora,
        status: "concluido",
        cliente_nome: motivoPerda ? `Perda: ${motivoPerda.descricao}` : "Descarte / Perda",
        camara_nome: camara?.nome || "Desconhecida",
        veiculo_placa: "—",
        veiculo_descricao: "",
        motorista: "—",
        itens: [{
          produto_id: m.produto_id,
          produto_nome: produto?.nome || "Produto Removido",
          produto_unidade: produto?.unidade || "unidade",
          sabor_id: m.sabor_id,
          sabor_nome: sabor?.nome || null,
          formato_pacote_id: m.formato_pacote_id,
          formato_nome: formato?.nome || null,
          quantidade: Math.abs(m.quantidade),
          peso_total_kg: Math.abs(m.peso_total_kg),
        }]
      });
    }

    // Ordenar por data decrescente
    resultado.sort((a, b) => b.data_hora - a.data_hora);
    return resultado;
  },
});

export const obterDetalhesCarregamento = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const c = (await ctx.db.get(args.id as Id<"carregamentos">)) as Doc<"carregamentos"> | null;
    if (c) {
      const movimentacoes = await ctx.db
        .query("movimentacoes")
        .filter((q) => q.eq(q.field("carregamento_id"), c._id))
        .filter((q) => q.lt(q.field("quantidade"), 0))
        .collect();

      const itens = [];
      let camaraNome = "Desconhecida";

      for (const m of movimentacoes) {
        const produto = await ctx.db.get(m.produto_id);
        const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
        const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;

        if (m.camara_id) {
          const camara = await ctx.db.get(m.camara_id);
          if (camara) camaraNome = camara.nome;
        }

        itens.push({
          produto_id: m.produto_id,
          produto_nome: produto?.nome || "Produto Removido",
          produto_unidade: produto?.unidade || "unidade",
          sabor_id: m.sabor_id,
          sabor_nome: sabor?.nome || null,
          formato_pacote_id: m.formato_pacote_id,
          formato_nome: formato?.nome || null,
          quantidade: Math.abs(m.quantidade),
          peso_total_kg: Math.abs(m.peso_total_kg),
        });
      }

      let veiculoPlaca = c.veiculo_placa || "";
      let veiculoDesc = c.veiculo_descricao || "";

      if (c.veiculo_id) {
        const veiculo = await ctx.db.get(c.veiculo_id);
        if (veiculo) {
          veiculoPlaca = veiculo.placa;
          veiculoDesc = veiculo.descricao;
        }
      }

      const retornoItensResolvidos = [];
      if (c.retorno_itens) {
        for (const item of c.retorno_itens) {
          const produto = await ctx.db.get(item.produto_id);
          const sabor = item.sabor_id ? await ctx.db.get(item.sabor_id) : null;
          const formato = item.formato_pacote_id ? await ctx.db.get(item.formato_pacote_id) : null;

          retornoItensResolvidos.push({
            produto_id: item.produto_id,
            produto_nome: produto?.nome || "Produto Removido",
            produto_unidade: produto?.unidade || "unidade",
            sabor_id: item.sabor_id,
            sabor_nome: sabor?.nome || null,
            formato_pacote_id: item.formato_pacote_id,
            formato_nome: formato?.nome || null,
            quantidade: item.quantidade,
          });
        }
      }

      return {
        ...c,
        camara_nome: camaraNome,
        veiculo_placa: veiculoPlaca,
        veiculo_descricao: veiculoDesc,
        itens,
        retorno_itens: c.retorno_itens ? retornoItensResolvidos : null,
      };
    }

    const m = (await ctx.db.get(args.id as Id<"movimentacoes">)) as Doc<"movimentacoes"> | null;
    if (m && m.tipo === "perda") {
      const produto = await ctx.db.get(m.produto_id);
      const sabor = m.sabor_id ? await ctx.db.get(m.sabor_id) : null;
      const formato = m.formato_pacote_id ? await ctx.db.get(m.formato_pacote_id) : null;
      const motivoPerda = m.motivo_perda_id ? await ctx.db.get(m.motivo_perda_id) : null;

      let camaraNome = "Desconhecida";
      if (m.camara_id) {
        const camara = await ctx.db.get(m.camara_id);
        if (camara) camaraNome = camara.nome;
      }

      return {
        _id: m._id,
        tipo: "perda",
        responsavel_id: m.autor_id,
        data_hora: m.data_hora,
        status: "concluido",
        cliente_nome: motivoPerda ? `Perda: ${motivoPerda.descricao}` : "Descarte / Perda",
        camara_nome: camaraNome,
        veiculo_placa: "—",
        veiculo_descricao: "",
        motorista: "—",
        itens: [{
          produto_id: m.produto_id,
          produto_nome: produto?.nome || "Produto Removido",
          produto_unidade: produto?.unidade || "unidade",
          sabor_id: m.sabor_id,
          sabor_nome: sabor?.nome || null,
          formato_pacote_id: m.formato_pacote_id,
          formato_nome: formato?.nome || null,
          quantidade: Math.abs(m.quantidade),
          peso_total_kg: Math.abs(m.peso_total_kg),
        }],
        retorno_itens: null,
      };
    }

    return null;
  },
});

/**
 * Mutation para registrar o retorno físico de itens de patrocínio.
 * Reinsere os itens devolvidos no estoque e atualiza o status para retorno_concluido.
 */
export const registrarRetornoPatrocinio = mutation({
  args: {
    id: v.id("carregamentos"),
    itens: v.array(
      v.object({
        produto_id: v.id("produtos"),
        sabor_id: v.optional(v.id("sabores")),
        formato_pacote_id: v.optional(v.id("formatos_pacote")),
        quantidade_retornada: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const autorNome = admin.name || admin.email;

    // 1. Obter e validar o carregamento
    const c = await ctx.db.get(args.id);
    if (!c) throw new Error("Carregamento não encontrado.");
    if (c.tipo !== "patrocinio") throw new Error("Apenas patrocínios podem ter retornos registrados.");
    if (c.status !== "retorno_pendente") throw new Error("Este patrocínio já tem devoluções registradas.");

    // 2. Carregar as saídas originais para obter a câmara e validar tetos de devolução
    const movimentacoes = await ctx.db
      .query("movimentacoes")
      .filter((q) => q.eq(q.field("carregamento_id"), c._id))
      .filter((q) => q.lt(q.field("quantidade"), 0))
      .collect();

    if (movimentacoes.length === 0) {
      throw new Error("Não foi possível rastrear os itens originais deste carregamento.");
    }

    const camaraId = movimentacoes[0].camara_id;

    // 3. Processar devoluções e registrar no ledger
    const retornoItensSalvar = [];
    for (const rItem of args.itens) {
      if (rItem.quantidade_retornada < 0) {
        throw new Error("A quantidade devolvida não pode ser menor que zero.");
      }

      // Rastrear saída original correspondente
      const originalMov = movimentacoes.find((m) => {
        const matchProd = m.produto_id === rItem.produto_id;
        const matchSabor = rItem.sabor_id ? m.sabor_id === rItem.sabor_id : !m.sabor_id;
        const matchFormato = rItem.formato_pacote_id ? m.formato_pacote_id === rItem.formato_pacote_id : !m.formato_pacote_id;
        return matchProd && matchSabor && matchFormato;
      });

      const maxQtd = originalMov ? Math.abs(originalMov.quantidade) : 0;
      if (rItem.quantidade_retornada > maxQtd) {
        throw new Error(`Quantidade retornada excede a quantidade carregada original (${maxQtd}).`);
      }

      // Se devolveu alguma quantidade
      if (rItem.quantidade_retornada > 0) {
        const produto = await ctx.db.get(rItem.produto_id);
        if (!produto) continue;

        // Calcular peso devolvido
        let pesoTotalKg = rItem.quantidade_retornada;
        if (produto.unidade === "pacote" && rItem.formato_pacote_id) {
          const formato = await ctx.db.get(rItem.formato_pacote_id);
          if (formato) {
            pesoTotalKg = rItem.quantidade_retornada * formato.peso_kg;
          }
        }

        // Inserir transação de entrada de retorno de patrocínio no estoque
        await ctx.db.insert("movimentacoes", {
          tipo: "retorno_patrocinio",
          camara_id: camaraId,
          produto_id: rItem.produto_id,
          sabor_id: rItem.sabor_id || undefined,
          formato_pacote_id: rItem.formato_pacote_id || undefined,
          quantidade: rItem.quantidade_retornada, // Positivo (Entrada)
          peso_total_kg: pesoTotalKg,
          autor_id: autorNome,
          data_hora: Date.now(),
          carregamento_id: c._id,
        });

        retornoItensSalvar.push({
          produto_id: rItem.produto_id,
          sabor_id: rItem.sabor_id,
          formato_pacote_id: rItem.formato_pacote_id,
          quantidade: rItem.quantidade_retornada,
        });
      }
    }

    // 4. Fechar status do carregamento
    await ctx.db.patch(c._id, {
      status: "retorno_concluido",
      retorno_itens: retornoItensSalvar,
    });

    return c._id;
  },
});
