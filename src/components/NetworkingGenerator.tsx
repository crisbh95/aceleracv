/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { NetworkingResult, NetworkingTemplate } from "../types";
import { Send, Copy, Check, MessageSquare, Linkedin, Mail, Sparkles, AlertTriangle, RefreshCw, Eye } from "lucide-react";
import { useToast } from "./Toast";

interface NetworkingGeneratorProps {
  currentRole: string;
}

export default function NetworkingGenerator({ currentRole }: NetworkingGeneratorProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(currentRole || "");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NetworkingResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync role if currentRole changes
  React.useEffect(() => {
    if (currentRole && !role) {
      setRole(currentRole);
    }
  }, [currentRole]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPreset = (companyName: string, roleName: string) => {
    setCompany(companyName);
    setRole(roleName);
  };

  const executeGenerate = async () => {
    if (!company.trim() || !role.trim()) {
      setError("Por favor, preencha o Nome da Empresa e o Cargo pretendido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-networking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jobDescription })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao produzir mensagens de networking.");
      }

      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado ao gerar sugestões.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="networking-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Search & Config Column */}
      <div id="networking-config-panel" className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Send className="w-5 h-5 text-emerald-600" />
            <h2 className="text-slate-800 font-display font-semibold text-lg">
              Networking Inteligente
            </h2>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Descubra canais de contacto eficazes. Digite abaixo a empresa de interesse e a função desejada para produzir abordagens de alto impacto via LinkedIn ou Email.
          </p>

          {/* Quick Targets in Cape Verde */}
          <div className="space-y-1.5">
            <span className="block text-[11px] uppercase tracking-wider font-bold text-slate-400">Atalhos de Empresas Locais:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset("CV Telecom", "Engenheiro de Redes")}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200/50 px-2.5 py-1.5 rounded-lg text-slate-700 font-medium transition"
              >
                CV Telecom
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("NOSi (Núcleo Operacional da Sociedade de Informação)", "Desenvolvedor React")}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200/50 px-2.5 py-1.5 rounded-lg text-slate-700 font-medium transition"
              >
                NOSi
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("Banco de Cabo Verde (BCV)", "Analista Financeiro")}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200/50 px-2.5 py-1.5 rounded-lg text-slate-700 font-medium transition"
              >
                BCV
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("Unitel T+", "Assistente de Apoio")}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200/50 px-2.5 py-1.5 rounded-lg text-slate-700 font-medium transition"
              >
                Unitel T+
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="ex: CV Multimedia, Caixa Económica..."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cargo Desejado</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="ex: Gestor de Projectos, Auditor..."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contexto Opcional (Requisitos)</label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Insira detalhes adicionais sobre a vaga se houver..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={executeGenerate}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition duration-200 ${
              loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Criando Abordagem Perfeita...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Gerar Roteiro de Abordagem
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Column mockup */}
      <div id="networking-results-panel" className="lg:col-span-7">
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-rose-900 flex items-start gap-3.5 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Problema ao simular abordagens</h4>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!results && !loading && !error && (
          <div className="h-full min-h-[380px] border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/30">
            <MessageSquare className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
            <h3 className="font-display font-medium text-slate-700 text-base">Roteiros de Abordagem Inteligentes</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-1 leading-relaxed">
              Descubra abordagens com alta taxa de resposta no LinkedIn e no Email Corporativo para demonstrar proatividade às lideranças seniores.
            </p>
          </div>
        )}

        {loading && (
          <div className="h-full min-h-[380px] bg-white border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-250 border-t-emerald-600 animate-spin" />
              <Send className="w-5 h-5 text-emerald-500 absolute animate-pulse animate-bounce" />
            </div>
            <div>
              <h3 className="font-display font-medium text-slate-800 text-base">Moldando Mensagens Impactantes...</h3>
              <p className="text-slate-400 text-xs max-w-xs mt-1 leading-relaxed">
                Calculando abordagens simpáticas e focadas que capturam o interesse de recrutadores sem soar inconveniente...
              </p>
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-6">
            {results.templates.map((tmpl, index) => {
              const isLinkedIn = tmpl.channel === "LinkedIn";
              return (
                <div key={index} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs animate-fade-in">
                  {/* Visual Header simulating the Channel */}
                  <div className={`px-4.5 py-3 border-b flex justify-between items-center ${
                    isLinkedIn ? "bg-blue-50/50 border-blue-100" : "bg-teal-50/50 border-teal-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      {isLinkedIn ? (
                        <>
                          <Linkedin className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 font-display">Mensagem Direta de LinkedIn (Conexão Curta)</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-semibold text-teal-900 font-display">Correio / E-mail de Abordagem Profissional</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(tmpl.messageText, `tmpl_${index}`)}
                      className={`text-xs px-2.5 py-1 border rounded-lg transition-all flex items-center gap-1 cursor-pointer font-medium ${
                        copiedId === `tmpl_${index}`
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {copiedId === `tmpl_${index}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar Modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Subject for Email */}
                    {!isLinkedIn && tmpl.subject && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 flex gap-2">
                        <span className="font-semibold select-none text-slate-500">Assunto:</span>
                        <span>{tmpl.subject}</span>
                      </div>
                    )}

                    {/* Preview box styled as LinkedIn chat bubble or formal letter */}
                    <div className="p-4 rounded-xl text-xs leading-relaxed text-slate-700 border border-slate-50 font-mono whitespace-pre-line bg-radial from-slate-50/30 to-white">
                      {tmpl.messageText}
                    </div>

                    {/* Pro Recruiting tip */}
                    {tmpl.coachingTip && (
                      <div className="bg-amber-50/40 border border-amber-100/60 p-4 rounded-xl flex items-start gap-2.5">
                        <Eye className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">Dica de Sucesso do Recrutador</span>
                          <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5">
                            {tmpl.coachingTip}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
