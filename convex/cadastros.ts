import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

// Implementação pura de SHA-256 em JavaScript (compatível com o runtime V8 do Convex)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  const asciiLength = ascii.length * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let isPrime = new Uint8Array(313);
  let primeCounter = 0;
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isPrime[i] = 1;
      }
      hash[primeCounter] = (Math.pow(candidate, .5) * 4294967296) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * 4294967296) | 0;
    }
    isPrime[candidate] = 0;
  }
  
  let paddedAscii = ascii + '\x80';
  while (paddedAscii.length % 64 - 56) paddedAscii += '\x00';
  
  for (let i = 0; i < paddedAscii.length; i++) {
    const j = paddedAscii.charCodeAt(i);
    if (j >> 8) return ""; // Apenas caracteres ASCII
    words[i >> 2] |= j << (24 - (i % 4) * 8);
  }
  words[words.length] = ((asciiLength / 4294967296) | 0);
  words[words.length] = (asciiLength | 0);
  
  for (let j = 0; j < words.length; j += 16) {
    let w = words.slice(j, j + 16);
    let oldHash = hash.slice(0);
    hash = hash.slice(0);
    
    for (let i = 0; i < 64; i++) {
      let wItem = w[i];
      if (i >= 16) {
        let s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        let s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      let s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      let maj = (hash[0] & hash[1]) ^ (hash[1] & hash[2]) ^ (hash[2] & hash[0]);
      let t2 = s0 + maj;
      let s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      let t1 = hash[7] + s1 + ch + k[i] + wItem;
      
      hash = [
        (t1 + t2) | 0,
        hash[0],
        hash[1],
        hash[2],
        ((hash[3] + t1) | 0),
        hash[4],
        hash[5],
        hash[6]
      ];
    }
    
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  let output = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      let byte = (hash[i] >>> (j * 8)) & 255;
      output += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return output;
}

// Helper para validar e hashear PIN de 4 dígitos
function hashPin(pin: string): string {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("O PIN deve conter exatamente 4 dígitos numéricos.");
  }
  return sha256(pin);
}

/* ==========================================
   PRODUTOS
   ========================================== */

export const listarProdutos = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("produtos").collect();
  },
});

export const listarProdutosAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("produtos")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarProduto = mutation({
  args: {
    nome: v.string(),
    unidade: v.union(v.literal("pacote"), v.literal("kg")),
    minimo: v.float64(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    // Validar duplicado
    const existente = await ctx.db
      .query("produtos")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente) {
      throw new Error("Já existe um produto cadastrado com este nome.");
    }

    return await ctx.db.insert("produtos", {
      nome: args.nome,
      unidade: args.unidade,
      minimo: args.minimo,
      ativo: true,
    });
  },
});

export const toggleProdutoAtivo = mutation({
  args: { id: v.id("produtos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const produto = await ctx.db.get(args.id);
    if (!produto) throw new Error("Produto não encontrado.");
    await ctx.db.patch(args.id, { ativo: !produto.ativo });
  },
});


/* ==========================================
   SABORES
   ========================================== */

export const listarSabores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("sabores").collect();
  },
});

export const listarSaboresAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sabores")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarSabor = mutation({
  args: { nome: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("sabores")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente) {
      throw new Error("Já existe um sabor cadastrado com este nome.");
    }

    return await ctx.db.insert("sabores", {
      nome: args.nome,
      ativo: true,
    });
  },
});

export const toggleSaborAtivo = mutation({
  args: { id: v.id("sabores") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sabor = await ctx.db.get(args.id);
    if (!sabor) throw new Error("Sabor não encontrado.");
    await ctx.db.patch(args.id, { ativo: !sabor.ativo });
  },
});


/* ==========================================
   FORMATOS DE PACOTE
   ========================================== */

export const listarFormatosPacote = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("formatos_pacote").collect();
  },
});

export const listarFormatosPacoteAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("formatos_pacote")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarFormatoPacote = mutation({
  args: {
    nome: v.string(),
    peso_kg: v.float64(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("formatos_pacote")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente) {
      throw new Error("Já existe um formato de pacote cadastrado com este nome.");
    }

    return await ctx.db.insert("formatos_pacote", {
      nome: args.nome,
      peso_kg: args.peso_kg,
      ativo: true,
    });
  },
});

export const toggleFormatoPacoteAtivo = mutation({
  args: { id: v.id("formatos_pacote") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const formato = await ctx.db.get(args.id);
    if (!formato) throw new Error("Formato de pacote não encontrado.");
    await ctx.db.patch(args.id, { ativo: !formato.ativo });
  },
});


/* ==========================================
   CÂMARAS FRIAS
   ========================================== */

export const listarCamaras = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("camaras").collect();
  },
});

export const listarCamarasAtivas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("camaras")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const obterCamaraPorSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const camara = await ctx.db
      .query("camaras")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!camara || !camara.ativo) {
      return null;
    }
    return camara;
  },
});

export const criarCamara = mutation({
  args: {
    nome: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slugLimpo = args.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    if (!slugLimpo) throw new Error("Slug inválido.");

    const existente = await ctx.db
      .query("camaras")
      .withIndex("by_slug", (q) => q.eq("slug", slugLimpo))
      .unique();
    if (existente) {
      throw new Error("Já existe uma câmara fria cadastrada com este slug/identificador.");
    }

    return await ctx.db.insert("camaras", {
      nome: args.nome,
      slug: slugLimpo,
      ativo: true,
    });
  },
});

export const toggleCamaraAtivo = mutation({
  args: { id: v.id("camaras") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const camara = await ctx.db.get(args.id);
    if (!camara) throw new Error("Câmara não encontrada.");
    await ctx.db.patch(args.id, { ativo: !camara.ativo });
  },
});


/* ==========================================
   COLABORADORES
   ========================================== */

export const listarColaboradores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("colaboradores").collect();
  },
});

export const criarColaborador = mutation({
  args: {
    nome: v.string(),
    pin: v.string(),
    permissao: v.union(v.literal("producao"), v.literal("saidas"), v.literal("ambas")),
    camaras_autorizadas: v.array(v.string()), // IDs das câmaras como string
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pinHash = hashPin(args.pin);

    return await ctx.db.insert("colaboradores", {
      nome: args.nome,
      pin_hash: pinHash,
      permissao: args.permissao,
      camaras_autorizadas: args.camaras_autorizadas,
      whatsapp: args.whatsapp,
      ativo: true,
      tentativas_pin: 0,
    });
  },
});

export const alterarPinColaborador = mutation({
  args: {
    id: v.id("colaboradores"),
    novoPin: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const colaborador = await ctx.db.get(args.id);
    if (!colaborador) throw new Error("Colaborador não encontrado.");

    const pinHash = hashPin(args.novoPin);
    await ctx.db.patch(args.id, {
      pin_hash: pinHash,
      tentativas_pin: 0,
      bloqueado_ate: undefined,
    });
  },
});

export const toggleColaboradorAtivo = mutation({
  args: { id: v.id("colaboradores") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const colaborador = await ctx.db.get(args.id);
    if (!colaborador) throw new Error("Colaborador não encontrado.");
    await ctx.db.patch(args.id, { ativo: !colaborador.ativo });
  },
});


/* ==========================================
   VEÍCULOS
   ========================================== */

export const listarVeiculos = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("veiculos").collect();
  },
});

export const listarVeiculosAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("veiculos")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarVeiculo = mutation({
  args: {
    placa: v.string(),
    descricao: v.string(),
    tipo: v.union(v.literal("proprio"), v.literal("terceiro")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const placaLimpa = args.placa.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    if (!placaLimpa) throw new Error("Placa inválida.");

    const existente = await ctx.db
      .query("veiculos")
      .withIndex("by_placa", (q) => q.eq("placa", placaLimpa))
      .unique();
    if (existente) {
      throw new Error("Já existe um veículo cadastrado com esta placa.");
    }

    return await ctx.db.insert("veiculos", {
      placa: placaLimpa,
      descricao: args.descricao,
      tipo: args.tipo,
      ativo: true,
    });
  },
});

export const toggleVeiculoAtivo = mutation({
  args: { id: v.id("veiculos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const veiculo = await ctx.db.get(args.id);
    if (!veiculo) throw new Error("Veículo não encontrado.");
    await ctx.db.patch(args.id, { ativo: !veiculo.ativo });
  },
});


/* ==========================================
   CLIENTES
   ========================================== */

export const listarClientes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("clientes").collect();
  },
});

export const listarClientesAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clientes")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarCliente = mutation({
  args: { 
    nome: v.string(),
    whatsapp: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("distribuidor"), v.literal("revendedor"), v.literal("final"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("clientes")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente) {
      throw new Error("Já existe um cliente cadastrado com este nome.");
    }

    return await ctx.db.insert("clientes", {
      nome: args.nome,
      whatsapp: args.whatsapp,
      tipo: args.tipo || "final",
      ativo: true,
    });
  },
});

export const toggleClienteAtivo = mutation({
  args: { id: v.id("clientes") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cliente = await ctx.db.get(args.id);
    if (!cliente) throw new Error("Cliente não encontrado.");
    await ctx.db.patch(args.id, { ativo: !cliente.ativo });
  },
});


/* ==========================================
   MOTIVOS DE PERDA
   ========================================== */

export const listarMotivosPerda = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("motivos_perda").collect();
  },
});

export const listarMotivosPerdaAtivos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("motivos_perda")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
  },
});

export const criarMotivoPerda = mutation({
  args: { descricao: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("motivos_perda")
      .filter((q) => q.eq(q.field("descricao"), args.descricao))
      .first();
    if (existente) {
      throw new Error("Já existe um motivo de perda com esta descrição.");
    }

    return await ctx.db.insert("motivos_perda", {
      descricao: args.descricao,
      ativo: true,
    });
  },
});

export const toggleMotivoPerdaAtivo = mutation({
  args: { id: v.id("motivos_perda") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const motivo = await ctx.db.get(args.id);
    if (!motivo) throw new Error("Motivo não encontrado.");
    await ctx.db.patch(args.id, { ativo: !motivo.ativo });
  },
});

/* ==========================================
   ATUALIZAÇÕES (EDITAR CADASTROS)
   ========================================== */

export const atualizarProduto = mutation({
  args: {
    id: v.id("produtos"),
    nome: v.string(),
    unidade: v.union(v.literal("pacote"), v.literal("kg")),
    minimo: v.float64(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    // Validar duplicado (outro registro com mesmo nome)
    const existente = await ctx.db
      .query("produtos")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um produto cadastrado com este nome.");
    }

    await ctx.db.patch(args.id, {
      nome: args.nome,
      unidade: args.unidade,
      minimo: args.minimo,
    });
  },
});

export const atualizarSabor = mutation({
  args: {
    id: v.id("sabores"),
    nome: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("sabores")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um sabor cadastrado com este nome.");
    }

    await ctx.db.patch(args.id, {
      nome: args.nome,
    });
  },
});

export const atualizarFormatoPacote = mutation({
  args: {
    id: v.id("formatos_pacote"),
    nome: v.string(),
    peso_kg: v.float64(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("formatos_pacote")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um formato de pacote cadastrado com este nome.");
    }

    await ctx.db.patch(args.id, {
      nome: args.nome,
      peso_kg: args.peso_kg,
    });
  },
});

export const atualizarCamara = mutation({
  args: {
    id: v.id("camaras"),
    nome: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slugLimpo = args.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    if (!slugLimpo) throw new Error("Slug inválido.");

    const existente = await ctx.db
      .query("camaras")
      .withIndex("by_slug", (q) => q.eq("slug", slugLimpo))
      .unique();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe uma câmara fria cadastrada com este slug/identificador.");
    }

    await ctx.db.patch(args.id, {
      nome: args.nome,
      slug: slugLimpo,
    });
  },
});

export const atualizarColaborador = mutation({
  args: {
    id: v.id("colaboradores"),
    nome: v.string(),
    permissao: v.union(v.literal("producao"), v.literal("saidas"), v.literal("ambas")),
    camaras_autorizadas: v.array(v.string()),
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.id, {
      nome: args.nome,
      permissao: args.permissao,
      camaras_autorizadas: args.camaras_autorizadas,
      whatsapp: args.whatsapp,
    });
  },
});

export const atualizarVeiculo = mutation({
  args: {
    id: v.id("veiculos"),
    placa: v.string(),
    descricao: v.string(),
    tipo: v.union(v.literal("proprio"), v.literal("terceiro")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const placaLimpa = args.placa.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    if (!placaLimpa) throw new Error("Placa inválida.");

    const existente = await ctx.db
      .query("veiculos")
      .withIndex("by_placa", (q) => q.eq("placa", placaLimpa))
      .unique();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um veículo cadastrado com esta placa.");
    }

    await ctx.db.patch(args.id, {
      placa: placaLimpa,
      descricao: args.descricao,
      tipo: args.tipo,
    });
  },
});

export const atualizarCliente = mutation({
  args: {
    id: v.id("clientes"),
    nome: v.string(),
    whatsapp: v.optional(v.string()),
    tipo: v.optional(v.union(v.literal("distribuidor"), v.literal("revendedor"), v.literal("final"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("clientes")
      .filter((q) => q.eq(q.field("nome"), args.nome))
      .first();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um cliente cadastrado com este nome.");
    }

    await ctx.db.patch(args.id, {
      nome: args.nome,
      whatsapp: args.whatsapp,
      tipo: args.tipo,
    });
  },
});

export const atualizarMotivoPerda = mutation({
  args: {
    id: v.id("motivos_perda"),
    descricao: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existente = await ctx.db
      .query("motivos_perda")
      .filter((q) => q.eq(q.field("descricao"), args.descricao))
      .first();
    if (existente && existente._id !== args.id) {
      throw new Error("Já existe um motivo de perda com esta descrição.");
    }

    await ctx.db.patch(args.id, {
      descricao: args.descricao,
    });
  },
});

/**
 * Mutation para alternar a permissão de acesso de um colaborador a uma câmara fria (real-time toggle).
 */
export const alternarCamaraAutorizadaColaborador = mutation({
  args: {
    colaboradorId: v.id("colaboradores"),
    camaraId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const colab = await ctx.db.get(args.colaboradorId);
    if (!colab) throw new Error("Colaborador não encontrado.");

    let novasCamaras = [...colab.camaras_autorizadas];
    if (novasCamaras.includes(args.camaraId)) {
      novasCamaras = novasCamaras.filter((id) => id !== args.camaraId);
    } else {
      novasCamaras.push(args.camaraId);
    }

    await ctx.db.patch(args.colaboradorId, {
      camaras_autorizadas: novasCamaras,
    });
  },
});

export const verificarAutorizacaoAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) return { autorizado: false };

    // Se não há nenhum administrador cadastrado ainda, consideramos autorizado (auto-registro fundador)
    const admins = await ctx.db.query("administradores").collect();
    if (admins.length === 0) return { autorizado: true };

    const autorizado = await ctx.db
      .query("administradores")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    return { autorizado: !!autorizado };
  },
});

export const listarAdministradores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("administradores").collect();
  },
});

export const criarAdministrador = mutation({
  args: {
    email: v.string(),
    nome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminLogado = await requireAdmin(ctx);

    const emailLimpo = args.email.trim().toLowerCase();
    if (!emailLimpo) {
      throw new Error("O email não pode ser vazio.");
    }

    const existente = await ctx.db
      .query("administradores")
      .withIndex("by_email", (q) => q.eq("email", emailLimpo))
      .unique();

    if (existente) {
      throw new Error("Este email já está na lista de administradores autorizados.");
    }

    await ctx.db.insert("administradores", {
      email: emailLimpo,
      nome: args.nome || undefined,
      adicionado_por: adminLogado.email,
      data_hora: Date.now(),
    });
  },
});

export const deletarAdministrador = mutation({
  args: {
    id: v.id("administradores"),
  },
  handler: async (ctx, args) => {
    const adminLogado = await requireAdmin(ctx);

    const adminParaDeletar = await ctx.db.get(args.id);
    if (!adminParaDeletar) {
      throw new Error("Administrador não encontrado.");
    }

    // Não permite que o administrador delete a si próprio
    if (adminParaDeletar.email === adminLogado.email.toLowerCase()) {
      throw new Error("Não é possível remover a si próprio da lista de administradores.");
    }

    await ctx.db.delete(args.id);
  },
});

export const atualizarAdministrador = mutation({
  args: {
    id: v.id("administradores"),
    email: v.string(),
    nome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminLogado = await requireAdmin(ctx);

    const emailLimpo = args.email.trim().toLowerCase();
    if (!emailLimpo) {
      throw new Error("O email não pode ser vazio.");
    }

    const adminParaEditar = await ctx.db.get(args.id);
    if (!adminParaEditar) {
      throw new Error("Administrador não encontrado.");
    }

    if (adminParaEditar.email !== emailLimpo) {
      const existente = await ctx.db
        .query("administradores")
        .withIndex("by_email", (q) => q.eq("email", emailLimpo))
        .unique();

      if (existente) {
        throw new Error("Este email já está cadastrado para outro administrador.");
      }

      if (adminParaEditar.email === adminLogado.email.toLowerCase()) {
        throw new Error("Não é permitido alterar seu próprio email por segurança.");
      }
    }

    await ctx.db.patch(args.id, {
      email: emailLimpo,
      nome: args.nome || undefined,
    });
  },
});

/* ==========================================
   PERFIL DA EMPRESA
   ========================================== */

export const obterPerfilEmpresa = query({
  args: {},
  handler: async (ctx) => {
    const perfil = await ctx.db.query("perfil_empresa").first();
    if (!perfil) {
      return {
        nome: "065 Gelo",
        cnpj: "",
        endereco: "",
        telefone: "",
        whatsapp: "",
        logo_storage_id: undefined,
        logoUrl: null,
      };
    }
    let logoUrl = null;
    if (perfil.logo_storage_id) {
      logoUrl = await ctx.storage.getUrl(perfil.logo_storage_id);
    }
    return {
      ...perfil,
      logoUrl,
    };
  },
});

export const atualizarPerfilEmpresa = mutation({
  args: {
    nome: v.string(),
    cnpj: v.optional(v.string()),
    endereco: v.optional(v.string()),
    telefone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    logo_storage_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existente = await ctx.db.query("perfil_empresa").first();
    if (existente) {
      // Deleta a logo anterior do storage caso tenha mudado
      if (existente.logo_storage_id && args.logo_storage_id && existente.logo_storage_id !== args.logo_storage_id) {
        try {
          await ctx.storage.delete(existente.logo_storage_id);
        } catch (e) {
          console.error("Erro ao deletar logo antiga:", e);
        }
      }
      await ctx.db.patch(existente._id, args);
    } else {
      await ctx.db.insert("perfil_empresa", args);
    }
  },
});

export const gerarUploadUrlLogo = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});


