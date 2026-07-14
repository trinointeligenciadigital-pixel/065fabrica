import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Verifica se o usuário atual autenticado via Clerk é um administrador.
 * Lança um erro se não estiver autenticado.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<{ email: string; name?: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Não autorizado: Autenticação de administrador necessária.");
  }

  if (!identity.email) {
    throw new Error("Não autorizado: Email do administrador não encontrado na sessão.");
  }

  // Se a tabela de administradores estiver vazia, adiciona o primeiro como administrador fundador (apenas se for Mutation)
  const admins = await ctx.db.query("administradores").collect();
  if (admins.length === 0) {
    if ("insert" in ctx.db) {
      await (ctx.db as any).insert("administradores", {
        email: identity.email,
        nome: identity.name || "Administrador Fundador",
        data_hora: Date.now(),
      });
    }
  } else {
    // Valida se o email atual está registrado como autorizado
    const autorizado = await ctx.db
      .query("administradores")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!autorizado) {
      throw new Error(`Acesso negado: O email ${identity.email} não está na lista de administradores autorizados.`);
    }
  }

  return {
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Valida a sessão de um colaborador na câmara fria específica usando o token de PIN.
 * Lança um erro se a sessão for inválida, expirada ou se o colaborador estiver inativo/não autorizado.
 */
export async function requireColaborador(
  ctx: QueryCtx | MutationCtx,
  token: string,
  camaraId: Id<"camaras">
): Promise<Doc<"colaboradores">> {
  const sessao = await ctx.db
    .query("sessoes_operador")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!sessao) {
    throw new Error("Sessão inválida: Operador não autenticado nesta câmara.");
  }

  // Verifica se a sessão pertence à câmara onde a operação está sendo realizada
  if (sessao.camara_id !== camaraId) {
    throw new Error("Não autorizado: Esta sessão pertence a outra câmara fria.");
  }

  // Verifica expiração (sessões operacionais expiram em 12 horas no PRD)
  if (sessao.expira_em < Date.now()) {
    throw new Error("Sessão expirada: Digite seu PIN novamente para reativar o acesso.");
  }

  const colaborador = await ctx.db.get(sessao.colaborador_id);
  if (!colaborador) {
    throw new Error("Operador não encontrado.");
  }

  if (!colaborador.ativo) {
    throw new Error("Operador inativo: Acesso bloqueado.");
  }

  // Valida se o colaborador tem autorização para esta câmara específica
  const camaraAutorizada = colaborador.camaras_autorizadas.includes(camaraId);
  if (!camaraAutorizada) {
    throw new Error("Não autorizado: Você não tem permissão para acessar esta câmara.");
  }

  return colaborador;
}

/**
 * Valida a sessão do colaborador e verifica se ele possui a permissão necessária para a ação.
 * Ações de entrada (produção, retorno) exigem permissão "producao" ou "ambas".
 * Ações de saída (venda, patrocínio, perda) exigem permissão "saidas" ou "ambas".
 */
export async function requireColaboradorForAction(
  ctx: QueryCtx | MutationCtx,
  token: string,
  camaraId: Id<"camaras">,
  tipoAcao: "producao" | "saida"
): Promise<Doc<"colaboradores">> {
  const colaborador = await requireColaborador(ctx, token, camaraId);

  const temPermissao =
    colaborador.permissao === "ambas" ||
    (tipoAcao === "producao" && colaborador.permissao === "producao") ||
    (tipoAcao === "saida" && colaborador.permissao === "saidas");

  if (!temPermissao) {
    throw new Error(
      `Não autorizado: Sua permissão de '${colaborador.permissao}' não permite lançamentos de '${tipoAcao}'.`
    );
  }

  return colaborador;
}
