import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

// Pure JS SHA-256 implementation
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
    if (j >> 8) return "";
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

/**
 * Retorna todos os colaboradores ativos autorizados para uma câmara fria específica.
 * Usado para popular a lista de nomes na tela de PIN do operador.
 */
export const obterColaboradoresPorCamara = query({
  args: { camaraId: v.id("camaras") },
  handler: async (ctx, args) => {
    const todosColaboradores = await ctx.db
      .query("colaboradores")
      .filter((q) => q.eq(q.field("ativo"), true))
      .collect();
    
    // Filtra colaboradores que contêm o ID da câmara na lista de autorizações
    return todosColaboradores.filter((c) => c.camaras_autorizadas.includes(args.camaraId));
  },
});

/**
 * Valida a sessão de um operador na câmara ativa.
 * Retorna a sessão e os dados do operador se o token for válido e não expirado.
 */
export const validarSessao = query({
  args: {
    token: v.string(),
    camaraId: v.id("camaras"),
  },
  handler: async (ctx, args) => {
    const sessao = await ctx.db
      .query("sessoes_operador")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!sessao) return null;
    if (sessao.camara_id !== args.camaraId) return null;
    if (sessao.expira_em < Date.now()) return null;

    const colaborador = await ctx.db.get(sessao.colaborador_id);
    if (!colaborador || !colaborador.ativo) return null;

    return {
      sessao,
      colaborador,
    };
  },
});

/**
 * Autentica o operador a partir do ID do colaborador e da câmara usando seu PIN de 4 dígitos.
 * Registra erros de tentativas e bloqueia por 15 min caso erre 5 vezes.
 */
export const loginOperador = mutation({
  args: {
    colaboradorId: v.id("colaboradores"),
    camaraId: v.id("camaras"),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const colaborador = await ctx.db.get(args.colaboradorId);
    if (!colaborador) {
      throw new Error("Colaborador não encontrado.");
    }
    if (!colaborador.ativo) {
      throw new Error("Operador inativo. Acesso bloqueado.");
    }

    // Verifica se ele tem autorização para esta câmara
    if (!colaborador.camaras_autorizadas.includes(args.camaraId)) {
      throw new Error("Não autorizado: Você não tem permissão para acessar esta câmara.");
    }

    // Verifica bloqueio de 15 minutos
    if (colaborador.bloqueado_ate && colaborador.bloqueado_ate > Date.now()) {
      const restam = Math.ceil((colaborador.bloqueado_ate - Date.now()) / 1000 / 60);
      throw new Error(
        `Acesso bloqueado por tentativas excessivas. Tente novamente em ${restam} minutos.`
      );
    }

    const pinHash = sha256(args.pin);

    // Se o PIN estiver correto
    if (colaborador.pin_hash === pinHash) {
      // Reseta contadores de erro
      await ctx.db.patch(colaborador._id, {
        tentativas_pin: 0,
        bloqueado_ate: undefined,
      });

      // Limpa sessões antigas deste operador nesta câmara
      const sessoesAntigas = await ctx.db
        .query("sessoes_operador")
        .withIndex("by_colaborador", (q) => q.eq("colaborador_id", colaborador._id))
        .collect();
      
      for (const s of sessoesAntigas) {
        if (s.camara_id === args.camaraId) {
          await ctx.db.delete(s._id);
        }
      }

      // Gera um novo token aleatório utilizando o crypto nativo do Convex (UUID)
      const token = crypto.randomUUID();
      const expiraEm = Date.now() + 12 * 60 * 60 * 1000; // 12 horas

      await ctx.db.insert("sessoes_operador", {
        colaborador_id: colaborador._id,
        camara_id: args.camaraId,
        token,
        expira_em: expiraEm,
      });

      return {
        token,
        expiraEm,
        colaboradorName: colaborador.nome,
      };
    } else {
      // Se errar, incrementa tentativas
      const novasTentativas = colaborador.tentativas_pin + 1;
      const patchData: Partial<Doc<"colaboradores">> = {
        tentativas_pin: novasTentativas,
      };

      if (novasTentativas >= 5) {
        patchData.bloqueado_ate = Date.now() + 15 * 60 * 1000; // Bloqueio de 15 minutos
        await ctx.db.patch(colaborador._id, patchData);
        throw new Error(
          "PIN incorreto. Limite de 5 tentativas excedido. Acesso bloqueado por 15 minutos."
        );
      } else {
        await ctx.db.patch(colaborador._id, patchData);
        throw new Error(
          `PIN incorreto. Você possui mais ${5 - novasTentativas} tentativas antes do bloqueio.`
        );
      }
    }
  },
});
