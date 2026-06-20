/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CompanyDossierResult } from "../types";
import { Search, Globe, Bookmark, FileText, ExternalLink, Lightbulb, TrendingUp, Sparkles, AlertTriangle, RefreshCw, Layers, Terminal } from "lucide-react";

interface CompanyDossierProps {
  currentRole: string;
}

export default function CompanyDossier({ currentRole }: CompanyDossierProps) {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState(currentRole || "");
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [dossier, setDossier] = useState<CompanyDossierResult | null>(null);

  React.useEffect(() => {
    if (currentRole && !role) {
      setRole(currentRole);
    }
  }, [currentRole]);

  const handleQuickSearch = (name: string) => {
    setCompanyName(name);
  };

  const handleFetchDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorDetails("Por favor, indique o nome do empregador ou empresa a pesquisar.");
      return;
    }

    setLoading(true);
    setErrorDetails(null);
    try {
      const response = await fetch("/api/company-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao consultar informações estratégicas.");
      }

      setDossier(data);
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err.message || "Não foi possível resgatar o dossiê da empresa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="company-dossier-root" className="space-y-8 animate-fade-in text-slate-800">
      {/* Search Header layout */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="max-w-2xl">
          <h2 className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Dossiê Preparatório da Empresa (Search Grounding)
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Obtenha inteligência empresarial em tempo real. Nossa IA utiliza pesquisas web activas para mapear culturas de escritórios, tendências do mercado e preparar o seu plano táctico.
          </p>
        </div>

        <form onSubmit={handleFetchDossier} className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-5">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Pesquisar por: CV Telecom, NOSi, Banco Mundial, Unitel..."
              className="w-full text-xs pl-9 pr-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <div className="md:col-span-4">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Seu Cargo Ex (Desenvolvedor de Software)..."
              className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className={`w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                loading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-950 hover:bg-slate-850 text-white shadow-xs cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Buscando Web...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  Mapear Empresa
                </>
              )}
            </button>
          </div>
        </form>

        {/* Local Popular Queries */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-50 text-[10px]">
          <span className="text-slate-400 font-bold block uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">Atalhos Comuns:</span>
          {["CV Telecom", "NOSi Cabo Verde", "Unitel T+", "EMPROFAC", "Banco de Cabo Verde"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleQuickSearch(name)}
              className="text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded-lg transition"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-50 border-t-emerald-600 animate-spin mx-auto" />
          <div>
            <h4 className="font-display font-medium text-slate-800 text-sm">Consultando Bases Globais...</h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto mt-1">
              Ativamos o Google Search Grounding para resgatar notícias recentes de 2026, relatórios e lançamentos de produtos para {companyName}...
            </p>
          </div>
        </div>
      )}

      {errorDetails && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-rose-900 flex items-start gap-3 mt-2 max-w-xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Não foi possível gerar dossiê</h4>
            <p className="text-xs text-rose-600 mt-0.5">{errorDetails}</p>
          </div>
        </div>
      )}

      {dossier && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in text-slate-800">
          {/* Main profile card */}
          <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider font-mono">Dossiê de Carregamento Ativo</span>
              <h3 className="font-display font-extrabold text-2xl tracking-tight mt-1">{dossier.companyName}</h3>
              <p className="text-slate-300 text-xs mt-1.5 flex items-center gap-1.5 max-w-xl leading-relaxed">
                <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <strong>Atuação:</strong> {dossier.industry}
              </p>
            </div>
            
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center md:text-right shrink-0">
              <span className="text-[10px] text-slate-350 uppercase tracking-widest block">Status da Pesquisa</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" /> Concluído
              </span>
            </div>
          </div>

          {/* Business culture */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md inline-block">Cultura & Tom</span>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {dossier.cultureDescription}
              </p>
            </div>
          </div>

          {/* Products & Highlights */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md inline-block mb-3.5">Produtos & Conquistas</span>
            <ul className="space-y-2">
              {dossier.majorProductsServices.map((p, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Grounding News */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md inline-block mb-3.5 flex items-center gap-1 w-fit">
              <TrendingUp className="w-3 h-3 text-teal-600" /> Notícias & Focos Recentes
            </span>
            <ul className="space-y-2">
              {dossier.recentNewsOrTrends.map((news, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-1.5" />
                  {news}
                </li>
              ))}
            </ul>
          </div>

          {/* Custom Questions */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs md:col-span-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md inline-block mb-4">Prováveis Questões no Processo</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dossier.likelyQuestionsAsked.map((q, i) => (
                <div key={i} className="bg-slate-50/60 border border-slate-100/50 p-3.5 rounded-xl leading-relaxed text-xs text-slate-700 flex gap-1.5">
                  <span className="text-slate-400 font-bold font-mono">Q{i+1}.</span>
                  <span>"{q}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Blueprint */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md inline-block">Plano Tático Recomendado</span>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {dossier.interviewStrategy}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
