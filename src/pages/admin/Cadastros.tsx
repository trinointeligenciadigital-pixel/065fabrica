import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import QRGenerator from "../../components/QRGenerator";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import {
  Package,
  Sparkles,
  Scale,
  Snowflake,
  Users,
  Truck,
  Handshake,
  AlertTriangle,
  Search,
  X,
  Edit2,
  Key,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Building,
  Upload,
  Loader2,
  Share2
} from "lucide-react";

type TabKey = "produtos" | "sabores" | "formatos" | "camaras" | "colaboradores" | "veiculos" | "clientes" | "perdas" | "administradores" | "empresa";

export default function Cadastros() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const produtos = useQuery(api.cadastros.listarProdutos);
  const sabores = useQuery(api.cadastros.listarSabores);
  const formatos = useQuery(api.cadastros.listarFormatosPacote);
  const camaras = useQuery(api.cadastros.listarCamaras);
  const colaboradores = useQuery(api.cadastros.listarColaboradores);
  const veiculos = useQuery(api.cadastros.listarVeiculos);
  const clientes = useQuery(api.cadastros.listarClientes);
  const motivosPerda = useQuery(api.cadastros.listarMotivosPerda);
  const administradores = useQuery(api.cadastros.listarAdministradores);

  // Mutations (Criar e Toggle)
  const criarProduto = useMutation(api.cadastros.criarProduto);
  const toggleProduto = useMutation(api.cadastros.toggleProdutoAtivo);
  const atualizarProduto = useMutation(api.cadastros.atualizarProduto);
  const criarAdminMutation = useMutation(api.cadastros.criarAdministrador);
  const deletarAdminMutation = useMutation(api.cadastros.deletarAdministrador);
  const atualizarAdminMutation = useMutation(api.cadastros.atualizarAdministrador);

  const criarSabor = useMutation(api.cadastros.criarSabor);
  const toggleSabor = useMutation(api.cadastros.toggleSaborAtivo);
  const atualizarSabor = useMutation(api.cadastros.atualizarSabor);

  const criarFormato = useMutation(api.cadastros.criarFormatoPacote);
  const toggleFormato = useMutation(api.cadastros.toggleFormatoPacoteAtivo);
  const atualizarFormato = useMutation(api.cadastros.atualizarFormatoPacote);

  const criarCamara = useMutation(api.cadastros.criarCamara);
  const toggleCamara = useMutation(api.cadastros.toggleCamaraAtivo);
  const atualizarCamara = useMutation(api.cadastros.atualizarCamara);

  const criarColaborador = useMutation(api.cadastros.criarColaborador);
  const toggleColaborador = useMutation(api.cadastros.toggleColaboradorAtivo);
  const atualizarColaborador = useMutation(api.cadastros.atualizarColaborador);
  const alterarPin = useMutation(api.cadastros.alterarPinColaborador);
  const alternarCamaraAutorizadaColaborador = useMutation(api.cadastros.alternarCamaraAutorizadaColaborador);

  const criarVeiculo = useMutation(api.cadastros.criarVeiculo);
  const toggleVeiculo = useMutation(api.cadastros.toggleVeiculoAtivo);
  const atualizarVeiculo = useMutation(api.cadastros.atualizarVeiculo);

  const criarCliente = useMutation(api.cadastros.criarCliente);
  const toggleCliente = useMutation(api.cadastros.toggleClienteAtivo);
  const atualizarCliente = useMutation(api.cadastros.atualizarCliente);

  const criarMotivoPerda = useMutation(api.cadastros.criarMotivoPerda);
  const toggleMotivoPerda = useMutation(api.cadastros.toggleMotivoPerdaAtivo);
  const atualizarMotivoPerda = useMutation(api.cadastros.atualizarMotivoPerda);

  // Queries e Mutations de Empresa
  const empresaPerfil = useQuery(api.cadastros.obterPerfilEmpresa);
  const atualizarPerfilEmpresa = useMutation(api.cadastros.atualizarPerfilEmpresa);
  const gerarUploadUrlLogo = useMutation(api.cadastros.gerarUploadUrlLogo);

  // Form & UI states
  const [formData, setFormData] = useState<any>({});
  const [selectedCamaras, setSelectedCamaras] = useState<string[]>([]);
  const [pinResetId, setPinResetId] = useState<Id<"colaboradores"> | null>(null);
  const [newPin, setNewPin] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Perfil Empresa Form State
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaCnpj, setEmpresaCnpj] = useState("");
  const [empresaEndereco, setEmpresaEndereco] = useState("");
  const [empresaTelefone, setEmpresaTelefone] = useState("");
  const [empresaWhatsapp, setEmpresaWhatsapp] = useState("");
  const [empresaLogoStorageId, setEmpresaLogoStorageId] = useState<string | undefined>(undefined);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [empresaSaving, setEmpresaSaving] = useState(false);
  const [empresaError, setEmpresaError] = useState<string | null>(null);
  const [empresaSuccess, setEmpresaSuccess] = useState(false);

  // Inicializar dados da empresa
  useEffect(() => {
    if (empresaPerfil) {
      setEmpresaNome(empresaPerfil.nome || "");
      setEmpresaCnpj(empresaPerfil.cnpj || "");
      setEmpresaEndereco(empresaPerfil.endereco || "");
      setEmpresaTelefone(empresaPerfil.telefone || "");
      setEmpresaWhatsapp(empresaPerfil.whatsapp || "");
      setEmpresaLogoStorageId(empresaPerfil.logo_storage_id);
    }
  }, [empresaPerfil]);

  const tabs = [
    { key: "produtos", label: "Produtos", singular: "Produto", icon: <Package className="w-4 h-4" /> },
    { key: "sabores", label: "Sabores", singular: "Sabor", icon: <Sparkles className="w-4 h-4" /> },
    { key: "formatos", label: "Formatos", singular: "Formato", icon: <Scale className="w-4 h-4" /> },
    { key: "camaras", label: "Câmaras", singular: "Câmara Fria", icon: <Snowflake className="w-4 h-4" /> },
    { key: "colaboradores", label: "Colaboradores", singular: "Colaborador", icon: <Users className="w-4 h-4" /> },
    { key: "veiculos", label: "Veículos", singular: "Veículo", icon: <Truck className="w-4 h-4" /> },
    { key: "clientes", label: "Clientes", singular: "Cliente", icon: <Handshake className="w-4 h-4" /> },
    { key: "perdas", label: "Perdas", singular: "Motivo de Perda", icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "administradores", label: "Administradores", singular: "Administrador", icon: <ShieldCheck className="w-4 h-4" /> },
    { key: "empresa", label: "Empresa", singular: "Dados da Empresa", icon: <Building className="w-4 h-4" /> },
  ] as const;

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setError(null);
    setFormData({});
    setSelectedCamaras([]);
    setEditingId(null);
    setSearchTerm("");
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({});
    setSelectedCamaras([]);
    setError(null);
    setModalOpen(true);
  };

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return cleaned.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").substring(0, 15);
  };

  const formatCNPJ = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    return cleaned
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      let val = value;
      if (name === "whatsapp") {
        val = formatPhone(value);
      }
      const updated = { ...prev, [name]: val };
      // Auto-gerar slug para câmara
      if (name === "nome" && activeTab === "camaras") {
        updated.slug = value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim();
      }
      // Formatar placa em maiúsculo
      if (name === "placa" && activeTab === "veiculos") {
        updated.placa = value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
      }
      return updated;
    });
  };

  const handleCheckboxChange = (camaraId: string) => {
    setSelectedCamaras((prev) =>
      prev.includes(camaraId) ? prev.filter((id) => id !== camaraId) : [...prev, camaraId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        // Modo Edição
        if (activeTab === "produtos") {
          await atualizarProduto({
            id: editingId as Id<"produtos">,
            nome: formData.nome,
            unidade: formData.unidade || "pacote",
            minimo: parseFloat(formData.minimo) || 0,
          });
        } else if (activeTab === "sabores") {
          await atualizarSabor({
            id: editingId as Id<"sabores">,
            nome: formData.nome,
          });
        } else if (activeTab === "formatos") {
          await atualizarFormato({
            id: editingId as Id<"formatos_pacote">,
            nome: formData.nome,
            peso_kg: parseFloat(formData.peso_kg) || 0,
          });
        } else if (activeTab === "camaras") {
          await atualizarCamara({
            id: editingId as Id<"camaras">,
            nome: formData.nome,
            slug: formData.slug,
            produtosIds: selectedCamaras,
          });
        } else if (activeTab === "colaboradores") {
          await atualizarColaborador({
            id: editingId as Id<"colaboradores">,
            nome: formData.nome,
            permissao: formData.permissao || "ambas",
            camaras_autorizadas: selectedCamaras,
            whatsapp: formData.whatsapp || undefined,
          });
        } else if (activeTab === "veiculos") {
          await atualizarVeiculo({
            id: editingId as Id<"veiculos">,
            placa: formData.placa,
            descricao: formData.descricao,
            tipo: formData.tipo || "proprio",
          });
        } else if (activeTab === "clientes") {
          await atualizarCliente({
            id: editingId as Id<"clientes">,
            nome: formData.nome,
            whatsapp: formData.whatsapp || undefined,
            tipo: formData.tipo || "final",
          });
        } else if (activeTab === "perdas") {
          await atualizarMotivoPerda({
            id: editingId as Id<"motivos_perda">,
            descricao: formData.descricao,
          });
        } else if (activeTab === "administradores") {
          await atualizarAdminMutation({
            id: editingId as Id<"administradores">,
            email: formData.email,
            nome: formData.nome || undefined,
          });
        }
      } else {
        // Modo Criação
        if (activeTab === "produtos") {
          await criarProduto({
            nome: formData.nome,
            unidade: formData.unidade || "pacote",
            minimo: parseFloat(formData.minimo) || 0,
          });
        } else if (activeTab === "sabores") {
          await criarSabor({ nome: formData.nome });
        } else if (activeTab === "formatos") {
          await criarFormato({
            nome: formData.nome,
            peso_kg: parseFloat(formData.peso_kg) || 0,
          });
        } else if (activeTab === "camaras") {
          await criarCamara({
            nome: formData.nome,
            slug: formData.slug,
            produtosIds: selectedCamaras,
          });
        } else if (activeTab === "colaboradores") {
          if (!/^\d{4}$/.test(formData.pin)) {
            throw new Error("O PIN deve conter exatamente 4 dígitos numéricos.");
          }
          await criarColaborador({
            nome: formData.nome,
            pin: formData.pin,
            permissao: formData.permissao || "ambas",
            camaras_autorizadas: selectedCamaras,
            whatsapp: formData.whatsapp || undefined,
          });
        } else if (activeTab === "veiculos") {
          await criarVeiculo({
            placa: formData.placa,
            descricao: formData.descricao,
            tipo: formData.tipo || "proprio",
          });
        } else if (activeTab === "clientes") {
          await criarCliente({ 
            nome: formData.nome,
            whatsapp: formData.whatsapp || undefined,
            tipo: formData.tipo || "final",
          });
        } else if (activeTab === "perdas") {
          await criarMotivoPerda({ descricao: formData.descricao });
        } else if (activeTab === "administradores") {
          await criarAdminMutation({
            email: formData.email,
            nome: formData.nome || undefined,
          });
        }
      }
      setModalOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o registro.");
    }
  };

  const handleEditProduto = (prod: Doc<"produtos">) => {
    setEditingId(prod._id);
    setFormData({
      nome: prod.nome,
      unidade: prod.unidade,
      minimo: prod.minimo,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleEditSabor = (sab: Doc<"sabores">) => {
    setEditingId(sab._id);
    setFormData({ nome: sab.nome });
    setError(null);
    setModalOpen(true);
  };

  const handleEditFormato = (f: Doc<"formatos_pacote">) => {
    setEditingId(f._id);
    setFormData({ nome: f.nome, peso_kg: f.peso_kg });
    setError(null);
    setModalOpen(true);
  };

  const handleEditCamara = (cam: Doc<"camaras">) => {
    setEditingId(cam._id);
    setFormData({ nome: cam.nome, slug: cam.slug });
    setSelectedCamaras(cam.produtos_ids || []);
    setError(null);
    setModalOpen(true);
  };

  const handleEditColaborador = (colab: Doc<"colaboradores">) => {
    setEditingId(colab._id);
    setFormData({
      nome: colab.nome,
      permissao: colab.permissao,
      whatsapp: colab.whatsapp || "",
    });
    setSelectedCamaras(colab.camaras_autorizadas);
    setError(null);
    setModalOpen(true);
  };

  const handleEditVeiculo = (veic: Doc<"veiculos">) => {
    setEditingId(veic._id);
    setFormData({
      placa: veic.placa,
      descricao: veic.descricao,
      tipo: veic.tipo,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleEditCliente = (cli: Doc<"clientes">) => {
    setEditingId(cli._id);
    setFormData({ 
      nome: cli.nome,
      whatsapp: cli.whatsapp || "",
      tipo: cli.tipo || "final",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleEditAdministrador = (admin: Doc<"administradores">) => {
    setEditingId(admin._id);
    setFormData({
      email: admin.email,
      nome: admin.nome || "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleEditMotivoPerda = (mot: Doc<"motivos_perda">) => {
    setEditingId(mot._id);
    setFormData({ descricao: mot.descricao });
    setError(null);
    setModalOpen(true);
  };

  const filterData = <T extends Record<string, any>>(
    data: T[] | undefined,
    searchFields: (keyof T)[]
  ): T[] | undefined => {
    if (!data) return undefined;
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(term);
        }
        if (typeof value === "number") {
          return value.toString().includes(term);
        }
        return false;
      })
    );
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetId) return;
    setError(null);
    try {
      if (!/^\d{4}$/.test(newPin)) {
        throw new Error("O PIN deve conter exatamente 4 dígitos numéricos.");
      }
      await alterarPin({ id: pinResetId, novoPin: newPin });
      setPinResetId(null);
      setNewPin("");
    } catch (err: any) {
      setError(err.message || "Erro ao alterar o PIN.");
    }
  };

  const handleSendColaboradorCredentials = (colab: Doc<"colaboradores">) => {
    // Obter as câmaras autorizadas com nome e link
    const camarasAutorizadasText = colab.camaras_autorizadas
      .map((cid) => {
        const cam = camaras?.find((c) => c._id === cid);
        if (!cam) return null;
        const link = `${window.location.origin}/colaborador/login?camara=${cam.slug}`;
        return `- *${cam.nome}*:\n  ${link}`;
      })
      .filter(Boolean)
      .join("\n");

    const messageText = 
      `*🧊 DADOS DE ACESSO - 065 GELO*\n` +
      `----------------------------------------\n` +
      `Olá, *${colab.nome}*!\n\n` +
      `Seguem os seus links de acesso ao sistema de estoque da fábrica para as câmaras autorizadas:\n\n` +
      `${camarasAutorizadasText || "_Nenhuma câmara vinculada ainda._"}\n\n` +
      `*Seu PIN de Acesso:* Utilize o PIN de 4 dígitos configurado pelo administrador.\n` +
      `----------------------------------------\n` +
      `Estoque 065 - Registro de Expedição`;

    if (colab.whatsapp) {
      const message = encodeURIComponent(messageText);
      const phone = colab.whatsapp.replace(/\D/g, "");
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${phone}&text=${message}`;
      window.open(whatsappUrl, "_blank");
    } else {
      // Copiar para a área de transferência caso não possua WhatsApp
      navigator.clipboard.writeText(messageText);
      alert(`O colaborador ${colab.nome} não possui WhatsApp cadastrado.\n\nOs dados de acesso foram copiados para a sua área de transferência para você colar onde desejar!`);
    }
  };

  // Render Table content dynamically
  const renderTable = () => {
    const emptyState = (singularName: string) => (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <span className="text-3xl mb-3">🔍</span>
        <p className="text-sm font-medium text-ink-primary">Nenhum registro encontrado</p>
        <p className="text-xs text-ink-secondary mt-1">
          Tente ajustar o termo de busca ou adicione um novo {singularName.toLowerCase()}.
        </p>
      </div>
    );

    const renderStatusBadge = (ativo: boolean) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
        ativo 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
          : "bg-rose-50 text-rose-700 border-rose-200/60"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ativo ? "bg-emerald-500" : "bg-rose-500"}`}></span>
        {ativo ? "Ativo" : "Inativo"}
      </span>
    );

    if (activeTab === "produtos") {
      const filtered = filterData(produtos, ["nome", "unidade"]);
      if (!produtos) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando produtos...</div>;
      if (filtered && filtered.length === 0) return emptyState("Produto");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">Unidade Base</th>
              <th className="py-3 px-4 font-semibold">Estoque Mínimo</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((prod: Doc<"produtos">) => (
              <tr key={prod._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{prod.nome}</td>
                <td className="py-3 px-4 capitalize text-ink-secondary">{prod.unidade}</td>
                <td className="py-3 px-4 font-mono text-ink-primary tabular-nums">{prod.minimo}</td>
                <td className="py-3 px-4">{renderStatusBadge(prod.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditProduto(prod)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleProduto({ id: prod._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      prod.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={prod.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        prod.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "sabores") {
      const filtered = filterData(sabores, ["nome"]);
      if (!sabores) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando sabores...</div>;
      if (filtered && filtered.length === 0) return emptyState("Sabor");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Sabor</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((sab: Doc<"sabores">) => (
              <tr key={sab._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{sab.nome}</td>
                <td className="py-3 px-4">{renderStatusBadge(sab.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditSabor(sab)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleSabor({ id: sab._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      sab.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={sab.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        sab.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "formatos") {
      const filtered = filterData(formatos, ["nome"]);
      if (!formatos) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando formatos...</div>;
      if (filtered && filtered.length === 0) return emptyState("Formato");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">Peso (kg)</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((f: Doc<"formatos_pacote">) => (
              <tr key={f._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{f.nome}</td>
                <td className="py-3 px-4 font-mono text-ink-primary tabular-nums">{f.peso_kg} kg</td>
                <td className="py-3 px-4">{renderStatusBadge(f.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditFormato(f)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleFormato({ id: f._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      f.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={f.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        f.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "camaras") {
      const filtered = filterData(camaras, ["nome", "slug"]);
      if (!camaras) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando câmaras...</div>;
      if (filtered && filtered.length === 0) return emptyState("Câmara Fria");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">Slug (Identificador)</th>
              <th className="py-3 px-4 font-semibold">Produtos Armazenados</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Etiqueta QR</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((cam: Doc<"camaras">) => (
              <tr key={cam._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{cam.nome}</td>
                <td className="py-3 px-4 font-mono text-ink-secondary text-xs">{cam.slug}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {cam.produtos_ids && cam.produtos_ids.length > 0 ? (
                      cam.produtos_ids.map((pid) => {
                        const prod = produtos?.find(p => p._id === pid);
                        return prod ? (
                          <span key={pid} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {prod.nome}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-xs text-ink-secondary italic">Todos os produtos</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">{renderStatusBadge(cam.ativo)}</td>
                <td className="py-3 px-4">
                  {cam.ativo && <QRGenerator nome={cam.nome} slug={cam.slug} />}
                </td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditCamara(cam)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleCamara({ id: cam._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      cam.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={cam.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        cam.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "colaboradores") {
      const filtered = filterData(colaboradores, ["nome"]);
      if (!colaboradores) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando colaboradores...</div>;
      if (filtered && filtered.length === 0) return emptyState("Colaborador");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">WhatsApp</th>
              <th className="py-3 px-4 font-semibold">Permissão</th>
              <th className="py-3 px-4 font-semibold">Câmaras Autorizadas</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((colab: Doc<"colaboradores">) => {
              return (
                <tr key={colab._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                  <td className="py-3 px-4 font-medium text-ink-primary">{colab.nome}</td>
                  <td className="py-3 px-4 font-mono text-xs text-ink-primary">
                    {colab.whatsapp ? (
                      <a
                        href={`https://wa.me/55${colab.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center space-x-1"
                      >
                        <span>💬</span>
                        <span>{colab.whatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-ink-secondary/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize text-ink-secondary">
                    {colab.permissao === "ambas" ? "Produção e Saídas" : colab.permissao}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {camaras && camaras.length > 0 ? (
                        camaras.map((c: Doc<"camaras">) => {
                          const isAuthorized = colab.camaras_autorizadas.includes(c._id);
                          return (
                            <button
                              key={c._id}
                              disabled={!colab.ativo || !c.ativo}
                              onClick={async () => {
                                try {
                                  await alternarCamaraAutorizadaColaborador({
                                    colaboradorId: colab._id,
                                    camaraId: c._id,
                                  });
                                } catch (err: any) {
                                  alert(err.message || "Erro ao alterar permissão.");
                                }
                              }}
                              title={
                                !colab.ativo || !c.ativo
                                  ? "Inativo"
                                  : isAuthorized
                                  ? `Revogar acesso à câmara ${c.nome}`
                                  : `Conceder acesso à câmara ${c.nome}`
                              }
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all select-none ${
                                !colab.ativo || !c.ativo
                                  ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                                  : isAuthorized
                                  ? "bg-brand-primary/15 border-brand-primary/25 text-brand-primary cursor-pointer hover:bg-brand-primary/20 hover:scale-105 active:scale-95"
                                  : "bg-slate-50 border-slate-200 text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300 hover:scale-105 active:scale-95"
                              }`}
                            >
                              <span className="w-1 h-1 rounded-full shrink-0 bg-current" />
                              <span>{c.nome}</span>
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-xs italic text-ink-secondary">Nenhuma câmara cadastrada</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{renderStatusBadge(colab.ativo)}</td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      onClick={() => handleSendColaboradorCredentials(colab)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer align-middle"
                      title="Compartilhar Dados de Acesso"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEditColaborador(colab)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPinResetId(colab._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                      title="Alterar PIN"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleColaborador({ id: colab._id })}
                      className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                        colab.ativo ? "bg-brand-success" : "bg-slate-300"
                      }`}
                      title={colab.ativo ? "Inativar" : "Ativar"}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                          colab.ativo ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === "veiculos") {
      const filtered = filterData(veiculos, ["placa", "descricao"]);
      if (!veiculos) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando veículos...</div>;
      if (filtered && filtered.length === 0) return emptyState("Veículo");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Placa</th>
              <th className="py-3 px-4 font-semibold">Descrição</th>
              <th className="py-3 px-4 font-semibold">Tipo</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((veic: Doc<"veiculos">) => (
              <tr key={veic._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-mono font-bold text-ink-primary tabular-nums">{veic.placa}</td>
                <td className="py-3 px-4 text-ink-secondary">{veic.descricao}</td>
                <td className="py-3 px-4 capitalize text-ink-secondary">{veic.tipo}</td>
                <td className="py-3 px-4">{renderStatusBadge(veic.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditVeiculo(veic)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleVeiculo({ id: veic._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      veic.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={veic.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        veic.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "clientes") {
      const filtered = filterData(clientes, ["nome"]);
      if (!clientes) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando clientes...</div>;
      if (filtered && filtered.length === 0) return emptyState("Cliente");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">WhatsApp</th>
              <th className="py-3 px-4 font-semibold">Tipo</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((cli: Doc<"clientes">) => (
              <tr key={cli._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{cli.nome}</td>
                <td className="py-3 px-4 font-mono text-xs text-ink-primary">
                  {cli.whatsapp ? (
                    <a
                      href={`https://wa.me/55${cli.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center space-x-1"
                    >
                      <span>💬</span>
                      <span>{cli.whatsapp}</span>
                    </a>
                  ) : (
                    <span className="text-ink-secondary/40">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {cli.tipo === "distribuidor" ? (
                    <span className="inline-flex items-center text-xs text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full font-semibold">
                      Distribuidor
                    </span>
                  ) : cli.tipo === "revendedor" ? (
                    <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-0.5 rounded-full font-semibold">
                      Revendedor
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-slate-700 bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full font-semibold">
                      Cliente Final
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">{renderStatusBadge(cli.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditCliente(cli)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleCliente({ id: cli._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      cli.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={cli.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        cli.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "perdas") {
      const filtered = filterData(motivosPerda, ["descricao"]);
      if (!motivosPerda) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando motivos...</div>;
      if (filtered && filtered.length === 0) return emptyState("Motivo de Perda");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Descrição do Motivo</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((mot: Doc<"motivos_perda">) => (
              <tr key={mot._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{mot.descricao}</td>
                <td className="py-3 px-4">{renderStatusBadge(mot.ativo)}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditMotivoPerda(mot)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleMotivoPerda({ id: mot._id })}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 relative shrink-0 align-middle ${
                      mot.ativo ? "bg-brand-success" : "bg-slate-300"
                    }`}
                    title={mot.ativo ? "Inativar" : "Ativar"}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        mot.ativo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "administradores") {
      const filtered = filterData(administradores, ["email", "nome"]);
      if (!administradores) return <div className="text-center py-8 text-ink-secondary text-sm">Carregando administradores...</div>;
      if (filtered && filtered.length === 0) return emptyState("Administrador");

      return (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Nome</th>
              <th className="py-3 px-4 font-semibold">Email</th>
              <th className="py-3 px-4 font-semibold">Adicionado Por</th>
              <th className="py-3 px-4 font-semibold">Data de Adição</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
            {filtered?.map((adm) => (
              <tr key={adm._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                <td className="py-3 px-4 font-medium text-ink-primary">{adm.nome || "—"}</td>
                <td className="py-3 px-4 text-ink-primary font-mono text-xs">{adm.email}</td>
                <td className="py-3 px-4 text-ink-secondary text-xs">{adm.adicionado_por || "Fundador"}</td>
                <td className="py-3 px-4 text-ink-secondary text-xs">
                  {new Date(adm.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    onClick={() => handleEditAdministrador(adm)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-glacial hover:bg-[rgba(91,112,120,0.08)] text-ink-secondary hover:text-ink-primary transition-all cursor-pointer align-middle"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja remover o acesso do administrador ${adm.email}?`)) {
                        try {
                          await deletarAdminMutation({ id: adm._id });
                        } catch (err: any) {
                          alert(err.message || "Erro ao remover administrador.");
                        }
                      }
                    }}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-glacial transition-all cursor-pointer text-ink-secondary hover:text-brand-error hover:bg-brand-error-bg/30 align-middle ${
                      adm.email === user?.primaryEmailAddress?.emailAddress?.toLowerCase() ? "opacity-30 cursor-not-allowed pointer-events-none" : ""
                    }`}
                    title="Remover Acesso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  const tabDescriptions: Record<TabKey, string> = {
    produtos: "Tipos de gelos produzidos, unidades e limites de estoque mínimo.",
    sabores: "Cardápio de sabores ativos para gelo saborizado (coco, melancia, etc).",
    formatos: "Pesos e capacidades de pacotes de gelo comercializados.",
    camaras: "Câmaras frias ativas, slugs de acesso QR code e status.",
    colaboradores: "Colaboradores cadastrados, níveis de permissão e PINs.",
    veiculos: "Frota própria e de terceiros para controle de cargas.",
    clientes: "Parceiros comerciais cadastrados para vendas.",
    perdas: "Motivos padronizados de quebras/descartes de estoque.",
    administradores: "Gerenciar administradores autorizados e convites de acesso ao sistema.",
    empresa: "Configurações institucionais da empresa e upload de logomarca.",
  };

  const getTabCount = (key: TabKey) => {
    switch (key) {
      case "produtos": return produtos?.length || 0;
      case "sabores": return sabores?.length || 0;
      case "formatos": return formatos?.length || 0;
      case "camaras": return camaras?.length || 0;
      case "colaboradores": return colaboradores?.length || 0;
      case "veiculos": return veiculos?.length || 0;
      case "clientes": return clientes?.length || 0;
      case "perdas": return motivosPerda?.length || 0;
      case "administradores": return administradores?.length || 0;
      case "empresa": return empresaPerfil ? 1 : 0;
      default: return 0;
    }
  };

  const renderEmpresaForm = () => {
    if (empresaPerfil === undefined) {
      return <div className="text-center py-8 text-ink-secondary text-sm">Carregando dados da empresa...</div>;
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingLogo(true);
      setEmpresaError(null);
      try {
        const uploadUrl = await gerarUploadUrlLogo();

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error("Falha ao fazer upload da imagem.");

        const { storageId } = await result.json();
        setEmpresaLogoStorageId(storageId);
      } catch (err: any) {
        setEmpresaError(err.message || "Erro ao fazer upload da logomarca.");
      } finally {
        setUploadingLogo(false);
      }
    };

    const handleSalvarEmpresa = async (e: React.FormEvent) => {
      e.preventDefault();
      setEmpresaSaving(true);
      setEmpresaError(null);
      setEmpresaSuccess(false);

      try {
        await atualizarPerfilEmpresa({
          nome: empresaNome,
          cnpj: empresaCnpj || undefined,
          endereco: empresaEndereco || undefined,
          telefone: empresaTelefone || undefined,
          whatsapp: empresaWhatsapp || undefined,
          logo_storage_id: empresaLogoStorageId,
        });
        setEmpresaSuccess(true);
        setTimeout(() => setEmpresaSuccess(false), 3000);
      } catch (err: any) {
        setEmpresaError(err.message || "Erro ao salvar perfil da empresa.");
      } finally {
        setEmpresaSaving(false);
      }
    };

    return (
      <form onSubmit={handleSalvarEmpresa} className="space-y-6 max-w-xl">
        {empresaError && (
          <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded-glacial text-xs font-semibold flex items-center space-x-2">
            <span>⚠️</span>
            <span>{empresaError}</span>
          </div>
        )}

        {empresaSuccess && (
          <div className="p-3 bg-brand-success-bg text-brand-success border border-[rgba(31,138,91,0.2)] rounded-glacial text-xs font-semibold flex items-center space-x-2">
            <span>✅</span>
            <span>Dados da empresa atualizados com sucesso!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-ink-primary block mb-1">Nome Fantasia / Razão Social</label>
            <input
              required
              type="text"
              value={empresaNome}
              onChange={(e) => setEmpresaNome(e.target.value)}
              placeholder="Ex: 065 Gelo"
              className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-primary block mb-1">CNPJ</label>
            <input
              type="text"
              value={empresaCnpj}
              onChange={(e) => setEmpresaCnpj(formatCNPJ(e.target.value))}
              placeholder="Ex: 00.000.000/0001-00"
              className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-primary block mb-1">Telefone Comercial</label>
            <input
              type="text"
              value={empresaTelefone}
              onChange={(e) => setEmpresaTelefone(formatPhone(e.target.value))}
              placeholder="Ex: (65) 3000-0000"
              className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-primary block mb-1">WhatsApp da Empresa</label>
            <input
              type="text"
              value={empresaWhatsapp}
              onChange={(e) => setEmpresaWhatsapp(formatPhone(e.target.value))}
              placeholder="Ex: (65) 99999-9999"
              className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-ink-primary block mb-1">Endereço Completo</label>
            <input
              type="text"
              value={empresaEndereco}
              onChange={(e) => setEmpresaEndereco(e.target.value)}
              placeholder="Ex: Av. Historiador Rubens de Mendonça, 1000 - Cuiabá - MT"
              className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Logomarca upload */}
        <div className="border-t border-[rgba(91,112,120,0.1)] pt-4">
          <label className="text-xs font-bold text-ink-primary block mb-2">Logomarca da Empresa</label>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-glacial border border-[rgba(91,112,120,0.15)] bg-bg-glacial flex items-center justify-center overflow-hidden shrink-0 relative">
              {empresaPerfil?.logoUrl || (empresaLogoStorageId && !uploadingLogo) ? (
                <img
                  src={empresaPerfil?.logoUrl || undefined} 
                  alt="Logomarca" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl text-ink-secondary/40">🧊</span>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center space-x-1.5 bg-white border border-[rgba(91,112,120,0.15)] hover:bg-bg-glacial transition-all text-xs font-bold py-2 px-4 rounded-glacial cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 text-ink-secondary" />
                <span>Escolher Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
              <p className="text-[10px] text-ink-secondary">Selecione uma imagem quadrada (PNG, JPG ou SVG) de até 2MB.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(91,112,120,0.1)] pt-4 flex justify-end">
          <button
            type="submit"
            disabled={empresaSaving || uploadingLogo}
            className="bg-brand-primary text-white text-xs font-bold py-2.5 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
          >
            {empresaSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>
    );
  };

  const activeTabSingular = tabs.find((t) => t.key === activeTab)?.singular || "";

  return (
    <div className="animate-fade-in">
      {activeTab === null ? (
        // --- CENTRAL DE CADASTROS (GRID HUB) ---
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Central de Cadastros</h2>
            <p className="text-sm text-ink-secondary">Selecione uma categoria para visualizar, editar ou parametrizar os registros do sistema.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tabs.map((tab) => {
              const count = getTabCount(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className="glass-card interactive-card rounded-glacial p-5 text-left flex flex-col justify-between h-44 cursor-pointer w-full"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-glacial bg-brand-primary/10 border border-brand-primary/10 flex items-center justify-center text-brand-primary">
                      {tab.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary">{tab.label}</h3>
                      <p className="text-[11px] text-ink-secondary mt-1 leading-normal">
                        {tabDescriptions[tab.key]}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-ink-secondary/70 font-semibold border-t border-[rgba(91,112,120,0.08)] pt-2.5 flex items-center justify-between">
                    <span>Acessar cadastro</span>
                    <span className="bg-bg-glacial text-ink-primary font-mono px-2 py-0.5 rounded-full text-[9px] font-bold">
                      {count} {count === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        // --- DETALHES DO CADASTRO SELECIONADO ---
        <>
          {/* Botão de Voltar */}
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-primary hover:underline cursor-pointer mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Central de Cadastros</span>
          </button>

          {/* Title & Add Action */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-ink-primary tracking-tight">
                {tabs.find((t) => t.key === activeTab)?.label}
              </h2>
              <p className="text-sm text-ink-secondary">
                {activeTab === "empresa" 
                  ? "Configurações institucionais da fábrica de gelo." 
                  : `Visualização e controle de ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} no estoque.`}
              </p>
            </div>
            {activeTab !== "empresa" && (
              <button
                onClick={handleOpenModal}
                className="bg-brand-primary text-white text-sm font-semibold py-2 px-5 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer self-start flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar {activeTabSingular}</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          {activeTab !== "empresa" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-secondary" />
                <input
                  type="text"
                  placeholder={`Buscar por ${activeTabSingular.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-sm pl-9 pr-9 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial overflow-x-auto p-4 sm:p-6 transition-all">
            {activeTab === "empresa" ? renderEmpresaForm() : renderTable()}
          </div>
        </>
      )}

      {/* Modal - Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] transition-all animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-ink-primary">
                {editingId ? "Editar" : "Novo"} Cadastro: {activeTabSingular}
              </h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingId(null);
                }}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer text-lg font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded-glacial text-xs font-semibold flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Formulários Específicos de cada aba */}
              {activeTab === "produtos" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome do Produto</label>
                    <input
                      required
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Gelo Saborizado Melancia"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Unidade Base</label>
                    <select
                      name="unidade"
                      value={formData.unidade || "pacote"}
                      onChange={handleInputChange}
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="pacote">Pacote</option>
                      <option value="kg">Quilo (kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Quantidade de Estoque Mínimo</label>
                    <input
                      required
                      type="number"
                      step="any"
                      name="minimo"
                      value={formData.minimo ?? ""}
                      onChange={handleInputChange}
                      placeholder="Ex: 50"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </>
              )}

              {activeTab === "sabores" && (
                <div>
                  <label className="text-xs font-bold text-ink-primary block mb-1">Nome do Sabor</label>
                  <input
                    required
                    type="text"
                    name="nome"
                    value={formData.nome || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Melancia"
                    className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              )}

              {activeTab === "formatos" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome do Formato</label>
                    <input
                      required
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Pacote de 4kg"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Peso Equivalente (kg)</label>
                    <input
                      required
                      type="number"
                      step="any"
                      name="peso_kg"
                      value={formData.peso_kg ?? ""}
                      onChange={handleInputChange}
                      placeholder="Ex: 4"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </>
              )}

              {activeTab === "camaras" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome da Câmara Fria</label>
                    <input
                      required
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Câmara de Cubos"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Identificador Slug (Gerado Automático)</label>
                    <input
                      required
                      type="text"
                      name="slug"
                      value={formData.slug || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: camara-de-cubos"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-2">Produtos Armazenados nesta Câmara</label>
                    {produtos && produtos.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)]">
                        {produtos.map((p: Doc<"produtos">) => (
                          <label key={p._id} className="flex items-center space-x-2 text-xs text-ink-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCamaras.includes(p._id)}
                              onChange={() => handleCheckboxChange(p._id)}
                              className="rounded border-[rgba(91,112,120,0.15)] text-brand-primary focus:ring-brand-primary"
                            />
                            <span>{p.nome} ({p.unidade})</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-error italic">Nenhum produto cadastrado.</p>
                    )}
                  </div>
                </>
              )}

              {activeTab === "colaboradores" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome Completo</label>
                    <input
                      required
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Roberto Silva"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">WhatsApp (Apenas números com DDD)</label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: 65999999999"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  {!editingId && (
                    <div>
                      <label className="text-xs font-bold text-ink-primary block mb-1">PIN de Acesso (Exatamente 4 dígitos)</label>
                      <div className="flex space-x-2">
                        <input
                          required
                          type="text"
                          pattern="[0-9]{4}"
                          maxLength={4}
                          inputMode="numeric"
                          name="pin"
                          value={formData.pin || ""}
                          onChange={handleInputChange}
                          placeholder="Ex: 1234"
                          className="flex-1 bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                            setFormData((prev: any) => ({ ...prev, pin: randomPin }));
                          }}
                          className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold rounded-glacial hover:bg-brand-primary/20 transition-all cursor-pointer whitespace-nowrap align-middle"
                        >
                          Gerar PIN
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Tipo de Permissão</label>
                    <select
                      name="permissao"
                      value={formData.permissao || "ambas"}
                      onChange={handleInputChange}
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="ambas">Ambas (Produção e Saídas)</option>
                      <option value="producao">Apenas Produção</option>
                      <option value="saidas">Apenas Saídas/Venda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-2">Câmaras Frias Autorizadas</label>
                    {camaras && camaras.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)]">
                        {camaras.map((c: Doc<"camaras">) => (
                          <label key={c._id} className="flex items-center space-x-2 text-xs text-ink-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCamaras.includes(c._id)}
                              onChange={() => handleCheckboxChange(c._id)}
                              className="rounded border-[rgba(91,112,120,0.15)] text-brand-primary focus:ring-brand-primary"
                            />
                            <span>{c.nome}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-error italic">Cadastre uma câmara fria primeiro.</p>
                    )}
                  </div>
                </>
              )}

              {activeTab === "veiculos" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Placa do Veículo</label>
                    <input
                      required
                      type="text"
                      name="placa"
                      value={formData.placa || ""}
                      maxLength={7}
                      onChange={handleInputChange}
                      placeholder="Ex: ABC1D23"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Descrição / Modelo</label>
                    <input
                      required
                      type="text"
                      name="descricao"
                      value={formData.descricao || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Fiorino Branca Refrigerada"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Tipo de Vínculo</label>
                    <select
                      name="tipo"
                      value={formData.tipo || "proprio"}
                      onChange={handleInputChange}
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="proprio">Próprio (Frota 065 Gelo)</option>
                      <option value="terceiro">Terceiro / Cliente / Freteiro</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "clientes" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome do Cliente</label>
                    <input
                      required
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Supermercado Central"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">WhatsApp (Apenas números com DDD)</label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: 65999999999"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Tipo de Cliente</label>
                    <select
                      name="tipo"
                      value={formData.tipo || "final"}
                      onChange={handleInputChange}
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                    >
                      <option value="final">Cliente Final</option>
                      <option value="revendedor">Revendedor</option>
                      <option value="distribuidor">Distribuidor</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "perdas" && (
                <div>
                  <label className="text-xs font-bold text-ink-primary block mb-1">Descrição do Motivo de Perda</label>
                  <input
                    required
                    type="text"
                    name="descricao"
                    value={formData.descricao || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Embalagem danificada / Rasgada"
                    className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              )}

              {activeTab === "administradores" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">E-mail do Administrador</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      disabled={editingId !== null && formData.email === user?.primaryEmailAddress?.emailAddress?.toLowerCase()}
                      placeholder="Ex: joao@empresa.com.br"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1">Nome Completo (Opcional)</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: João Silva"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </>
              )}

              {/* Botões do Modal */}
              <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-[rgba(91,112,120,0.1)]">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs bg-brand-primary text-white font-semibold py-2 px-4 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Reset PIN */}
      {pinResetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] transition-all animate-fade-in">
          <div className="w-full max-w-sm bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-ink-primary">Alterar PIN do Operador</h3>
              <button
                onClick={() => setPinResetId(null)}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer text-lg font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded-glacial text-xs font-semibold flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-ink-primary block mb-1">Novo PIN (Exatamente 4 dígitos)</label>
                <div className="flex space-x-2">
                  <input
                    required
                    type="text"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Ex: 9876"
                    className="flex-1 bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                      setNewPin(randomPin);
                    }}
                    className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold rounded-glacial hover:bg-brand-primary/20 transition-all cursor-pointer whitespace-nowrap align-middle"
                  >
                    Gerar PIN
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-[rgba(91,112,120,0.1)]">
                <button
                  type="button"
                  onClick={() => {
                    setPinResetId(null);
                    setNewPin("");
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs bg-brand-primary text-white font-semibold py-2 px-4 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
