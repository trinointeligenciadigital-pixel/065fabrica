import { Route, Switch, Redirect } from "wouter";
import { SignedIn, SignedOut, RedirectToSignIn, SignOutButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Cadastros from "./pages/admin/Cadastros";
import Movimentacoes from "./pages/admin/Movimentacoes";
import Contagens from "./pages/admin/Contagens";
import Carregamentos from "./pages/admin/Carregamentos";
import ColaboradorLogin from "./pages/colaborador/Login";
import ColaboradorPainel from "./pages/colaborador/Painel";
import ColaboradorLancamentos from "./pages/colaborador/Lancamentos";

function AdminRouteWrapper({ children }: { children: React.ReactNode }) {
  const authCheck = useQuery(api.cadastros.verificarAutorizacaoAdmin);

  if (authCheck === undefined) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6">
        <div className="text-sm text-ink-secondary">Verificando autorização de acesso...</div>
      </div>
    );
  }

  if (authCheck.autorizado === false) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-8 text-center flex flex-col items-center">
          <span className="text-5xl block mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">Acesso Restrito</h1>
          <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
            O e-mail da sua conta não está na lista de administradores autorizados deste sistema.
          </p>
          
          <div className="w-full pt-6 border-t border-[rgba(91,112,120,0.1)] flex flex-col space-y-3">
            <p className="text-xs text-ink-secondary leading-relaxed">
              Peça para o administrador principal cadastrar seu e-mail ou saia para entrar com outra conta.
            </p>
            <SignOutButton>
              <button className="bg-brand-primary text-white text-xs font-bold py-2.5 px-4 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer">
                Sair da Conta (Sign Out)
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <Switch>
      {/* Redirecionamento da raiz diretamente para o Painel administrativo */}
      <Route path="/">
        <Redirect to="/admin/dashboard" />
      </Route>

      {/* Rota do Admin - Protegida por Clerk */}
      <Route path="/admin/:subpath*">
        {() => (
          <>
            <SignedIn>
              <AdminRouteWrapper>
                <AdminLayout>
                  <Switch>
                    <Route path="/admin/dashboard" component={Dashboard} />
                    <Route path="/admin/cadastros" component={Cadastros} />
                    <Route path="/admin/movimentacoes" component={Movimentacoes} />
                    <Route path="/admin/contagens" component={Contagens} />
                    <Route path="/admin/carregamentos" component={Carregamentos} />
                    <Route>
                      <Redirect to="/admin/dashboard" />
                    </Route>
                  </Switch>
                </AdminLayout>
              </AdminRouteWrapper>
            </SignedIn>
            <SignedOut>
              <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-8 text-center flex flex-col items-center">
                  <span className="text-5xl block mb-4">🧊</span>
                  <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-2">Estoque 065</h1>
                  <p className="text-sm text-ink-secondary mb-8">Acesso restrito para administradores</p>
                  
                  {/* Redireciona para o portal seguro do Clerk */}
                  <div className="w-full py-4 text-xs text-ink-secondary border-t border-[rgba(91,112,120,0.1)]">
                    Carregando portal de acesso seguro...
                  </div>
                  <RedirectToSignIn />
                </div>
              </div>
            </SignedOut>
          </>
        )}
      </Route>

      {/* Rotas Operacionais do Colaborador (Chão de Fábrica) - Públicas/Autenticação Customizada */}
      <Route path="/colaborador/login" component={ColaboradorLogin} />
      <Route path="/colaborador/painel" component={ColaboradorPainel} />
      <Route path="/colaborador/lancar/:tipo" component={ColaboradorLancamentos} />

      {/* Fallback para rotas desconhecidas */}
      <Route>
        <Redirect to="/admin/cadastros" />
      </Route>
    </Switch>
  );
}

export default App;
