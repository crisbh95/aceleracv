/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CVData } from "./types";
import { DEV_MOCK_CV } from "./mockData";
import ResumeForm from "./components/ResumeForm";
import CVOptimizer from "./components/CVOptimizer";
import CoverLetter from "./components/CoverLetter";
import NetworkingGenerator from "./components/NetworkingGenerator";
import InterviewSimulator from "./components/InterviewSimulator";
import CompanyDossier from "./components/CompanyDossier";
import { ThemeToggle } from "./components/ThemeProvider";

import {
  Sparkles,
  FileText,
  User,
  Briefcase,
  Compass,
  Layers,
  Send,
  HelpCircle,
  Globe,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  Menu,
  X,
  Target,
  FileCheck
} from "lucide-react";

export default function App() {
  const [cvData, setCvData] = useState<CVData>(DEV_MOCK_CV);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sharedJobDescription, setSharedJobDescription] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Load from local storage if available
  useEffect(() => {
    const cached = localStorage.getItem("aceleracv_data");
    if (cached) {
      try {
        setCvData(JSON.parse(cached));
      } catch (err) {
        console.error("Erro ao restaurar cache local de dados CV:", err);
      }
    }
    const cachedJob = localStorage.getItem("aceleracv_job_description");
    if (cachedJob) setSharedJobDescription(cachedJob);
  }, []);

  const handleUpdateCV = (updated: CVData) => {
    setCvData(updated);
    localStorage.setItem("aceleracv_data", JSON.stringify(updated));
  };

  const handleUpdateJobDescription = (jd: string) => {
    setSharedJobDescription(jd);
    localStorage.setItem("aceleracv_job_description", jd);
  };

  const navItems = [
    { path: "/perfil", label: "O Meu CV / Perfil", icon: User },
    { path: "/otimizar", label: "Otimizador ATS", icon: Target },
    { path: "/carta", label: "Carta Estruturada", icon: FileCheck },
    { path: "/networking", label: "Networking", icon: Send },
    { path: "/entrevista", label: "Simulador Entrevista", icon: HelpCircle },
    { path: "/dossie", label: "Dossiê Empresa", icon: Globe },
  ] as const;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-950 dark:selection:text-emerald-100">
      
      {/* Premium CV Header Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand CV */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            aria-label="Ir para página inicial"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-xs transition duration-300 group-hover:scale-105">
              A
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight block">
                Acelera<span className="text-emerald-600 dark:text-emerald-400">CV</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-widest block uppercase -mt-1 font-semibold">
                Cabo Verde AI
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    active
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400 dark:text-emerald-600" : "text-slate-400 dark:text-slate-500"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User status & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">{cvData.fullName || "Utilizador Acelera"}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md font-medium">CV Pronto a Alinhar</span>
            </div>
            <ThemeToggle />
            <button
              onClick={() => navigate("/perfil")}
              title="Visualizar perfil"
              aria-label="Visualizar perfil"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 cursor-pointer transition"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Alternar menu de navegação"
              aria-label="Alternar menu de navegação"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                    active
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400 dark:text-emerald-600" : "text-slate-400 dark:text-slate-500"}`} />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-slate-50 dark:border-slate-800 pt-3 flex items-center justify-between px-2">
              <div className="text-left">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">{cvData.fullName || "Utilizador Acelera"}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">Cadastro Anónimo Temporário</span>
              </div>
              <button
                onClick={() => {
                  navigate("/perfil");
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <Routes>
          <Route path="/" element={<HomePage navigate={navigate} />} />
          <Route path="/perfil" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Configuração de Perfil / Currículo</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Preencha as suas informações pessoais, experiências escolares e funções executadas. Seus dados são salvos localmente e usados pela Inteligência Artificial para gerar os materiais profissionais no menu superior.</p>
              </div>
              <ResumeForm cvData={cvData} onChange={handleUpdateCV} />
            </div>
          } />
          <Route path="/otimizar" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Alinhamento de Currículo &amp; Otimização ATS</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Insira os termos da oportunidade e a IA vai reconfigurar os seus bullets da carreira e analisar seu posicionamento estratégico, gerando palavras-chave para passar nos sistemas de RH.</p>
              </div>
              <CVOptimizer cvData={cvData} onUpdateCV={handleUpdateCV} sharedJobDescription={sharedJobDescription} onJobDescriptionChange={handleUpdateJobDescription} />
            </div>
          } />
          <Route path="/carta" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Carta de Apresentação Estruturada</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Obtenha rascunhos executivos polidos para as candidaturas por email e de candidatura espontânea a partir do seu histórico de competências profissionais.</p>
              </div>
              <CoverLetter cvData={cvData} sharedJobDescription={sharedJobDescription} onJobDescriptionChange={handleUpdateJobDescription} />
            </div>
          } />
          <Route path="/networking" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Networking Inteligente &amp; Ativo</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Selecione o cargo e a empresa e gere mensagens rápidas para enviar por LinkedIn ou Email Corporativo para demonstrar proatividade diretamente aos gestores de RH.</p>
              </div>
              <NetworkingGenerator currentRole={cvData.experience[0]?.role || ""} />
            </div>
          } />
          <Route path="/entrevista" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Simulador de Entrevista Pro</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Simule o processo de admissão com o entrevistador inteligente. Redija resumos das suas atribuições, receba notas detalhadas de 0 a 100 e saiba o que responder com rascunhos de alta qualidade.</p>
              </div>
              <InterviewSimulator
                jobTitle={cvData.experience[0]?.role || "Programador Frontend / Assistente Administrativo"}
                jobDescription={cvData.summary}
              />
            </div>
          } />
          <Route path="/dossie" element={
            <div className="space-y-6">
              <div className="text-left">
                <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Base de Informação de Empresas (Grounding-Search)</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Pesquise por qualquer organização activa em Cabo Verde ou no estrangeiro e obtenha detalhes cruciais sobre as operações institucionais da empresa e como se destacar na entrevista de admissão.</p>
              </div>
              <CompanyDossier currentRole={cvData.experience[0]?.role || ""} />
            </div>
          } />
          {/* Fallback: redirect unknown routes to home */}
          <Route path="*" element={<HomePage navigate={navigate} />} />
        </Routes>
      </main>

      {/* Modern CV Portal Footer layout */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 text-xs border-t border-slate-800 py-10 mt-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Logo Brand Footer */}
            <div className="flex items-center gap-2 group cursor-pointer text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-base">
                A
              </div>
              <div>
                <span className="font-display font-bold text-sm text-white tracking-tight block">
                  Acelera<span className="text-emerald-500">CV</span>
                </span>
                <span className="text-[8px] text-slate-400 font-mono tracking-widest block uppercase -mt-0.5">
                  Cabo Verde AI
                </span>
              </div>
            </div>

            {/* Quick footer navigation links */}
            <nav className="flex flex-wrap justify-center gap-6 text-[11px] font-medium text-slate-400" aria-label="Links do rodapé">
              <button onClick={() => navigate("/")} className="hover:text-white transition">Home</button>
              <button onClick={() => navigate("/perfil")} className="hover:text-white transition">Meu CV</button>
              <button onClick={() => navigate("/otimizar")} className="hover:text-white transition">Otimização ATS</button>
              <button onClick={() => navigate("/entrevista")} className="hover:text-white transition">Simulador</button>
              <button onClick={() => navigate("/dossie")} className="hover:text-white transition">Dossiê Empresa</button>
            </nav>
          </div>

          <p className="text-slate-500 border-t border-slate-800 pt-5 leading-relaxed text-[11px] text-center max-w-sm mx-auto">
            © {new Date().getFullYear()} AceleraCV. Desenvolvido para o mercado profissional de Cabo Verde no total respeito da transparência de IA algorítmica.
          </p>
        </div>
      </footer>

    </div>
  );
}

/* ========== HOME PAGE COMPONENT ========== */
function HomePage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* Elegant Call-Out Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-100/60 dark:border-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Alcance uma Taxa de Entrevistas de até 94%
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-900 dark:text-white leading-[1.125] tracking-tight">
            Seu currículo não está passando. <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">A gente resolve isso.</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
            Selecione, alinhe e otimize seu currículo para cada vaga de trabalho individual em segundos. Alimente seus rascunhos de LinkedIn, treine com o simulador virtual de RH e conquiste a vaga dos seus sonhos em Cabo Verde e no exterior.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate("/otimizar")}
              className="px-6 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Otimizar meu CV Agora
              <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </button>
            <button
              onClick={() => navigate("/perfil")}
              className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              Configurar Meu Perfil
            </button>
          </div>
        </div>

        {/* Graphic Mock card UI preview */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-radial from-emerald-200/20 dark:from-emerald-800/10 to-teal-200/25 dark:to-teal-900/10 blur-3xl opacity-60 rounded-full" />
          <div className="relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-4 max-w-sm mx-auto">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Afinidade de Vaga ATS</span>
              </div>
              <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">42% (Abaixo do Ideal)</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Principais lacunas de competências detectadas:</h4>
              <div className="flex flex-wrap gap-1">
                {["Excel Avançado", "Linguagem SQL", "Contabilidade", "Gestão de Equipas"].map(term => (
                  <span key={term} className="text-[10px] px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded border border-rose-100 dark:border-rose-800 font-medium">
                    {term}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1.5">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase tracking-wider">Nova Versão Orientada por STAR:</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "Utilizei Microsoft Excel Avançado e linguagem SQL para cruzar bases de atendimento da CV Telecom, cortando o tempo médio de resolução em 15%..."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-10 text-center">
        <div className="space-y-2">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest block font-mono">Simplicidade Extrema</span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-800 dark:text-white">Como funciona, em 4 passos</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mx-auto">Construído em torno de inteligência generativa para que nenhuma candidatura termine no vácuo.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            { step: "01", title: "Cole a Vaga de Trabalho", desc: "Indique o cargo que procura ou cole as exigências técnicas que a empresa divulgou publicamente.", color: "hover:border-emerald-200 dark:hover:border-emerald-800" },
            { step: "02", title: "Módulo IA Analisa", desc: "O motor do Google Gemini disseca o seu perfil contra a oportunidade, prevendo os índices de classificação ATS.", color: "hover:border-teal-200 dark:hover:border-teal-800" },
            { step: "03", title: "Desbloqueie o Kit Completo", desc: "Receba de imediato as novas redações baseadas em conquistas quantitativas, roteiro de LinkedIn e carta formal.", color: "hover:border-blue-200 dark:hover:border-blue-800" },
            { step: "04", title: "Candidate-se com Confiança", desc: "Treine no simulador de perguntas de RH antes do telefonema real da empresa e conquiste aprovações.", color: "hover:border-emerald-200 dark:hover:border-emerald-800" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 transition duration-200 shadow-2xs space-y-4 ${item.color}`}>
              <span className="text-3xl font-display font-extrabold text-emerald-100 dark:text-emerald-900 block">{item.step}</span>
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature lists deck */}
      <div className="bg-slate-900 dark:bg-black text-white rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-left">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">Kit de Ferramentas Tudo em Um</span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold leading-tight">Tudo Para Avançar na Sua Candidatura</h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Criámos um ecossistema com profundidade que vai muito além de um simples criador de PDF. Com o AceleraCV tem tudo para a sua carreira.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            {[
              "Networking Inteligente com Recrutador",
              "Ajuste Fino de Marcadores Individuais",
              "Carta de Apresentação sob Medida",
              "Simulador de Recursos Humanos Interativo",
              "Inteligência Empresarial com Dossiês",
              "Importação de Perfis de Cabo Verde",
              "Fórmula ATS validada por especialistas"
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
          <span className="text-[11px] text-emerald-300 uppercase tracking-widest font-bold">Inicie agora mesmo</span>
          <h4 className="font-display font-bold text-sm text-white">Pronto para transformar sua carreira em Cabo Verde?</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Importe seu perfil base a partir de predefinições e comece os alinhamentos a qualquer vaga. Todo o rascunho é persistido de forma anónima no seu navegador no total respeito pela privacidade.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/perfil")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              Aceder ao Meu Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
