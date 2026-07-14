import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const isConfigured = !!(CONVEX_URL && CLERK_PUBLISHABLE_KEY)

function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-glacial p-6 font-sans">
      <div className="w-full max-w-md bg-surface-card rounded-glacial p-8 border border-[rgba(91,112,120,0.15)] shadow-glacial text-left">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[rgba(14,124,156,0.1)] flex items-center justify-center text-brand-primary text-xl">
            🧊
          </div>
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">Estoque 065</h1>
        </div>

        <h2 className="text-base font-semibold text-ink-primary mb-2">Configuração Necessária</h2>
        <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
          Para iniciar o sistema, configure as variáveis de ambiente no arquivo <code className="text-xs bg-bg-glacial text-ink-primary px-1.5 py-0.5 rounded border border-[rgba(91,112,120,0.15)]">.env.local</code> na raiz do projeto.
        </p>

        <div className="space-y-4 mb-6">
          <div className="text-xs">
            <span className="font-semibold text-ink-primary block mb-1">VITE_CONVEX_URL</span>
            <span className="text-ink-secondary block font-mono bg-bg-glacial p-2 rounded truncate border border-[rgba(91,112,120,0.1)]">
              {CONVEX_URL ? '✅ Configurada' : '❌ Ausente (Obtenha no painel do Convex)'}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-semibold text-ink-primary block mb-1">VITE_CLERK_PUBLISHABLE_KEY</span>
            <span className="text-ink-secondary block font-mono bg-bg-glacial p-2 rounded truncate border border-[rgba(91,112,120,0.1)]">
              {CLERK_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Ausente (Obtenha no painel do Clerk)'}
            </span>
          </div>
        </div>

        <div className="text-xs text-ink-secondary border-t border-[rgba(91,112,120,0.1)] pt-4">
          Crie um arquivo <code className="text-xs bg-bg-glacial text-ink-primary px-1.5 py-0.5 rounded">.env.local</code> copiando de <code className="text-xs bg-bg-glacial text-ink-primary px-1.5 py-0.5 rounded">.env.example</code> e insira as credenciais.
        </div>
      </div>
    </div>
  )
}

if (!isConfigured) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SetupRequired />
    </StrictMode>
  )
} else {
  const convex = new ConvexReactClient(CONVEX_URL)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  )
}
