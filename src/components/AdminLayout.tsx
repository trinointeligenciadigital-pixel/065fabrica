import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  History,
  Calculator,
  Truck,
  Snowflake,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(newVal));
      return newVal;
    });
  };

  interface MenuItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    placeholder?: boolean;
  }

  const menuItems: MenuItem[] = [
    { href: "/admin/dashboard", label: "Visão Geral", icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { href: "/admin/cadastros", label: "Cadastros", icon: <ClipboardList className="w-4 h-4 shrink-0" /> },
    { href: "/admin/movimentacoes", label: "Movimentações", icon: <History className="w-4 h-4 shrink-0" /> },
    { href: "/admin/contagens", label: "Inventário", icon: <Calculator className="w-4 h-4 shrink-0" /> },
    { href: "/admin/carregamentos", label: "Carregamentos", icon: <Truck className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-glacial font-sans flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex md:flex-col bg-gradient-sidebar text-white border-r border-white/5 justify-between py-6 shrink-0 transition-all duration-300 ${
        isSidebarCollapsed ? "md:w-20 px-3" : "md:w-64 px-4"
      }`}>
        <div>
          {/* Logo Boxed with Glass effect */}
          <div className={`flex items-center mb-8 px-2.5 ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 text-white select-none shrink-0">
                <Snowflake className="w-4 h-4" />
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-fade-in whitespace-nowrap">
                  <h1 className="text-sm font-bold text-white tracking-tight leading-none">Estoque 065</h1>
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">Painel Admin</p>
                </div>
              )}
            </div>
            
            {/* Collapse Button - Desktop only */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer items-center justify-center shrink-0"
              title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation - Polished with left border highlights */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.placeholder ? "#" : item.href}>
                  <a
                    className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                      isActive
                        ? "bg-white/10 text-white font-semibold border-l-2 border-brand-primary pl-3 rounded-l-none"
                        : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                    } ${item.placeholder ? "opacity-40 cursor-not-allowed" : ""} ${
                      isSidebarCollapsed ? "justify-center px-1 space-x-0" : "space-x-3"
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                    onClick={(e) => {
                      if (item.placeholder) {
                        e.preventDefault();
                        alert(`${item.label} será implementado nas próximas fases!`);
                      }
                    }}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && (
                      <span className="animate-fade-in whitespace-nowrap">{item.label}</span>
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className={`border-t border-white/5 pt-4 mt-6 flex items-center px-2.5 ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="border border-white/10 rounded-full p-0.5 bg-white/5 flex items-center justify-center shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden animate-fade-in whitespace-nowrap text-left">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || "Administrador"}
                </p>
                <p className="text-[10px] text-white/40 truncate">
                  {user?.primaryEmailAddress?.emailAddress || "admin@065gelo.com.br"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-ink-primary/30 backdrop-blur-[1.5px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer sheet container */}
          <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-gradient-sidebar text-white p-5 py-6 shadow-2xl animate-slide-in-left justify-between shrink-0">
            <div>
              {/* Header with Close */}
              <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 text-white select-none">
                    <Snowflake className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white tracking-tight leading-none">Estoque 065</h1>
                    <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">Painel Admin</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.placeholder ? "#" : item.href}>
                      <a
                        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                          isActive
                            ? "bg-white/10 text-white font-semibold border-l-2 border-brand-primary pl-3 rounded-l-none"
                            : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                        } ${item.placeholder ? "opacity-40 cursor-not-allowed" : ""}`}
                        onClick={(e) => {
                          if (item.placeholder) {
                            e.preventDefault();
                            alert(`${item.label} será implementado nas próximas fases!`);
                          } else {
                            setIsMobileMenuOpen(false);
                          }
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile Mobile Footer */}
            <div className="border-t border-white/5 pt-4 flex items-center justify-between px-1">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="border border-white/10 rounded-full p-0.5 bg-white/5 flex items-center justify-center shrink-0">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.fullName || "Administrador"}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {user?.primaryEmailAddress?.emailAddress || "admin@065gelo.com.br"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        {/* Mobile Header with Hamburger Menu Toggle */}
        <header className="md:hidden bg-surface-card border-b border-[rgba(91,112,120,0.15)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-[rgba(91,112,120,0.15)] text-ink-secondary hover:text-ink-primary hover:bg-bg-glacial transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-ink-primary text-sm tracking-tight">Estoque 065</span>
            </div>
          </div>
          <div className="border border-[rgba(91,112,120,0.1)] rounded-full p-0.5 bg-bg-glacial flex items-center justify-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
