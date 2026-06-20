/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CVData, OptimizationResult } from "../types";
import { Sparkles, ArrowRight, Check, Copy, AlertTriangle, ChevronRight, RefreshCw, BarChart2, CheckCircle2, Bookmark, Download, FileText } from "lucide-react";
import { useToast } from "./Toast";

interface CVOptimizerProps {
  cvData: CVData;
  onUpdateCV: (updatedData: CVData) => void;
  sharedJobDescription?: string;
  onJobDescriptionChange?: (jd: string) => void;
}

export default function CVOptimizer({ cvData, onUpdateCV, sharedJobDescription, onJobDescriptionChange }: CVOptimizerProps) {
  const [jobDescription, setJobDescription] = useState(sharedJobDescription || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [optimizeForGupy, setOptimizeForGupy] = useState(false);
  const [jobUrlOrTitle, setJobUrlOrTitle] = useState("");
  const { toast } = useToast();

  // Sync shared job description
  React.useEffect(() => {
    if (sharedJobDescription && !jobDescription) {
      setJobDescription(sharedJobDescription);
    }
  }, [sharedJobDescription]);

  const handleJobDescChange = (value: string) => {
    setJobDescription(value);
    onJobDescriptionChange?.(value);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    toast("success", "Texto copiado para a área de transferência!");
    setTimeout(() => {
      setCopiedTextId(null);
    }, 2000);
  };

  const handleApplySummary = () => {
    if (results && results.suggestedSummary) {
      onUpdateCV({
        ...cvData,
        summary: results.suggestedSummary
      });
      toast("success", "Seu resumo oficial no perfil foi atualizado com sucesso!");
    }
  };

  const handleDownloadOptimized = () => {
    if (!results) return;
    
    const optSummary = results.suggestedSummary || cvData.summary;
    
    let md = `# CURRÍCULO ALTAMENTE OTIMIZADO ATS\n`;
    md += `## Candidato: ${cvData.fullName || "Utilizador"}\n\n`;
    
    if (cvData.email || cvData.phone || cvData.location || cvData.website) {
      const contactInfo = [];
      if (cvData.email) contactInfo.push(`**Email:** ${cvData.email}`);
      if (cvData.phone) contactInfo.push(`**Telefone:** ${cvData.phone}`);
      if (cvData.location) contactInfo.push(`**Localização:** ${cvData.location}`);
      if (cvData.website) contactInfo.push(`**LinkedIn/Website:** ${cvData.website}`);
      md += contactInfo.join("  |  ") + "\n\n";
    }
    
    md += `---\n\n`;
    md += `## PERFIL PROFISSIONAL (OTIMIZADO POR IA)\n\n${optSummary}\n\n`;
    md += `---\n\n`;
    
    md += `## EXPERIÊNCIA PROFISSIONAL (ALINHADA ATS)\n\n`;
    cvData.experience.forEach(exp => {
      md += `### ${exp.role} — ${exp.company}\n`;
      md += `*${exp.startDate} – ${exp.endDate || "Presente"}*  |  *${exp.location || "Cabo Verde"}*\n\n`;
      
      const sugExp = results.suggestedExperiences?.find(se => se.experienceId === exp.id);
      if (sugExp && sugExp.suggestedBulletPoints && sugExp.suggestedBulletPoints.length > 0) {
        md += `**Resultados e Responsabilidades Otimizados (Estratégia STAR):**\n`;
        sugExp.suggestedBulletPoints.forEach(bp => {
          md += `- ${bp}\n`;
        });
        if (sugExp.justification) {
          md += `\n*Justificação Estratégica: ${sugExp.justification}*\n`;
        }
        md += `\n`;
      } else if (exp.description) {
        md += `${exp.description}\n\n`;
      }
    });
    
    md += `---\n\n`;
    
    if (cvData.education && cvData.education.length > 0) {
      md += `## EDUCAÇÃO & FORMAÇÃO\n\n`;
      cvData.education.forEach(edu => {
        md += `### ${edu.degree} — ${edu.fieldOfStudy}\n`;
        md += `*${edu.school}*  |  *${edu.startDate} – ${edu.endDate || ""}*  |  *${edu.location || ""}*\n\n`;
      });
      md += `---\n\n`;
    }
    
    const combinedSkills = [...cvData.skills];
    if (results.recommendedSkillsToAdd) {
      results.recommendedSkillsToAdd.forEach(sk => {
        if (!combinedSkills.map(s => s.toLowerCase()).includes(sk.toLowerCase())) {
          combinedSkills.push(sk);
        }
      });
    }
    
    if (combinedSkills.length > 0) {
      md += `## COMPETÊNCIAS & WORDMARKS CORE (ATS COMPATÍVEL)\n\n`;
      md += combinedSkills.map(s => `- ${s}`).join("\n") + "\n\n";
    }
    
    if (cvData.languages && cvData.languages.length > 0) {
      md += `## IDIOMAS\n\n`;
      md += cvData.languages.map(l => `- ${l}`).join("\n") + "\n\n";
    }
    
    md += `---\n`;
    md += `### RELATÓRIO DO ALINHAMENTO ATS\n`;
    md += `* **Afinidade Estimada:** Inicial ${results.scoreBefore}%  => Potencial ${results.scoreAfter}%\n`;
    if (results.gupyCompatibilityScore) {
      md += `* **Compatibilidade algoritmos Gupy:** ${results.gupyCompatibilityScore}%\n`;
    }
    md += `* **Palavras-chave incorporadas:** ${results.missingKeywords.join(", ") || "Nenhuma em falta"}\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanName = (cvData.fullName || "Curriculo_Otimizado").toLowerCase().replace(/\s+/g, "_");
    link.setAttribute("download", `${cleanName}_otimizado_vaga.md`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("success", "Currículo otimizado por IA descarregado com sucesso!");
  };

  const executeOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/optimize-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, jobDescription, optimizeForGupy, jobUrlOrTitle })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha na comunicação com o servidor.");
      }

      if (data.error === "API_KEY_MISSING") {
        throw new Error(data.message);
      }

      setResults(data);
      toast("success", "Análise de otimização ATS concluída!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="cv-optimizer-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Input Side */}
      <div id="optimizer-inputs-panel" className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 id="optimizer-input-title" className="text-slate-800 dark:text-white font-display font-semibold text-lg flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            1. Carregar Detalhes da Vaga Real
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Cole abaixo a vaga de trabalho real que encontrou no LinkedIn, Gupy, Netemprego ou noutro portal de admissões.
          </p>

          {/* Customized Paste Description */}
          <div id="custom-paste-div" className="space-y-1 pt-1">
            <label htmlFor="job-description-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Descrição da Vaga de Trabalho / Requisitos</label>
            <textarea
              id="job-description-input"
              rows={11}
              value={jobDescription}
              onChange={(e) => handleJobDescChange(e.target.value)}
              placeholder="Cole aqui as atribuições, requisitos técnicos e competências que a empresa divulgou para a vaga de emprego..."
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono resize-none"
            />
          </div>

          {/* Internet Job Search Box */}
          <div id="internet-search-field-div" className="space-y-1 pt-1 animate-fade-in">
            <label htmlFor="job-url-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-sky-500 rounded-full" />
              Link ou Nome da Vaga da Internet (Opcional)
            </label>
            <input
              id="job-url-input"
              type="text"
              value={jobUrlOrTitle}
              onChange={(e) => setJobUrlOrTitle(e.target.value)}
              placeholder="Ex: https://portal.gupy.io/jobs/12345 ou Desenvolvedor Fullstack"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              A IA pesquisará activamente os requisitos extras dessa URL ou do cargo no Google para enriquecer o seu currículo.
            </p>
          </div>

          {/* Gupy Robot Optimizer Toggle */}
          <div id="gupy-toggle-container" className="pt-2 animate-fade-in">
            <label className="relative flex items-start gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-slate-50 dark:hover:bg-slate-700 border border-indigo-100 dark:border-indigo-900 rounded-xl cursor-pointer select-none transition-all">
              <input
                type="checkbox"
                checked={optimizeForGupy}
                onChange={(e) => setOptimizeForGupy(e.target.checked)}
                className="mt-1 rounded border-indigo-300 dark:border-indigo-600 text-indigo-600 focus:ring-indigo-500/30 w-4 h-4 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  Ativar Otimização para Robôs Gupy 🤖
                </span>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-tight">
                  Analisa e formata o seu currículo para passar pelos robôs automáticos de classificação da Gupy, aumentando a nota de afinidade na vaga.
                </p>
              </div>
            </label>
          </div>

          <button
            id="optimize-submit-btn"
            type="button"
            disabled={loading || !jobDescription.trim()}
            onClick={executeOptimization}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition duration-200 ${
              loading
                ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                A analisar Currículo e Vaga com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                Alinhar Currículo à Vaga
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output / Results Side */}
      <div id="optimizer-results-panel" className="lg:col-span-7">
        {error && (
          <div id="error-card" className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 rounded-2xl p-5 text-rose-900 dark:text-rose-200 flex items-start gap-3.5 mb-6 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Não foi possível otimizar o seu CV</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
              {error.includes("GEMINI_API_KEY") && (
                <div className="bg-white/80 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 mt-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">Como configurar a chave:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 text-[11px]">
                    <li>Crie um ficheiro <strong>.env.local</strong> na raiz do projeto.</li>
                    <li>Adicione a variável <strong>GEMINI_API_KEY=sua_chave_aqui</strong>.</li>
                    <li>Reinicie o servidor de desenvolvimento.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {!results && !loading && !error && (
          <div id="pre-state" className="h-full min-h-[400px] border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-slate-800/30">
            <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5] mb-3" />
            <h3 className="font-display font-medium text-slate-700 dark:text-slate-300 text-base">Relatório de Otimização ATS</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
              O seu currículo ainda não foi analisado. Clique em <strong>"Alinhar Currículo ao Cargo"</strong> à esquerda para iniciar o diagnóstico de compatibilidade profissional.
            </p>
          </div>
        )}

        {loading && (
          <div id="loading-state" className="h-full min-h-[400px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 animate-spin" />
              <Sparkles className="w-5 h-5 text-emerald-500 absolute animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-medium text-slate-800 dark:text-white text-base">A analisar o alinhamento</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                A IA está a dissecar os requisitos técnicos da vaga, comparando as suas experiências passadas e reconfigurando os bullets com o método STAR...
              </p>
            </div>
          </div>
        )}

        {results && !loading && (
          <div id="results-content-div" className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
            {/* Score Comparison Header */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs">
              <h3 className="font-display font-semibold text-sm text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">Afinidade com a Vaga (ATS Score)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/80 dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block uppercase tracking-wider">Afinidade Inicial</span>
                  <span className="text-3xl font-display font-extrabold text-slate-500 dark:text-slate-400 block mt-1">{results.scoreBefore}%</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-slate-400/80 h-1.5 rounded-full" style={{ width: `${results.scoreBefore}%` }} />
                  </div>
                </div>

                <div className="bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl p-4 text-center border border-emerald-100/60 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Potencial com IA
                  </span>
                  <span className="text-3xl font-display font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">{results.scoreAfter}%</span>
                  <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-emerald-600 dark:bg-emerald-500 h-1.5 rounded-full" style={{ width: `${results.scoreAfter}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Download Optimized Resume Action Box */}
            <div id="download-opt-banner" className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xs space-y-4 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-extrabold font-mono tracking-wider uppercase">EXPORTAR SELEÇÃO</span>
                <h3 className="font-display font-bold text-base">Descarregar Currículo Alinhado por IA</h3>
                <p className="text-white/80 text-xs max-w-md leading-relaxed">
                  Tudo pronto! Juntámos os seus dados pessoais com o novo Resumo Profissional sugerido e as novas realizações formatadas no método STAR para a vaga.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadOptimized}
                className="w-full md:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 text-emerald-950 font-extrabold text-xs rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-center"
                aria-label="Descarregar currículo otimizado"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Baixar Currículo Otimizado (.MD)
              </button>
            </div>

            {/* Gupy Compatibility Shield */}
            {results.gupyCompatibilityScore !== undefined && (optimizeForGupy || (results.gupyAdvice && results.gupyAdvice.length > 0)) && (
              <div className="bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/30 to-indigo-100/10 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-extrabold font-mono tracking-wider">GUPY ATS</span>
                    <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-sm">Score de Compatibilidade Gupy</h3>
                  </div>
                  <span className="text-3xl font-display font-extrabold text-indigo-700 dark:text-indigo-400 block">{results.gupyCompatibilityScore}%</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  O algoritmo de triagem automatizada da Gupy avalia o alinhamento de palavras-chave, preenchimento detalhado do currículo e conformidade sintática das competências.
                </p>
                {results.gupyAdvice && results.gupyAdvice.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-indigo-100/60 dark:border-indigo-800">
                    <h4 className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Estratégias para Passar pelo Robô da Gupy:
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      {results.gupyAdvice.map((advice, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800 border border-indigo-50 dark:border-indigo-900 p-2 rounded-xl flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-2" />
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Internet Job Live Analysis Insights */}
            {jobUrlOrTitle && results.internetVagaSearchInfo && (
              <div className="bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 rounded-2xl p-6 shadow-xs space-y-3 animate-fade-in">
                <h3 className="font-display font-semibold text-sky-950 dark:text-sky-200 text-xs flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2 h-2 bg-sky-500 rounded-full animate-ping" />
                  Insights extraídos da vaga na Internet
                </h3>
                <div className="text-xs leading-relaxed text-sky-900 dark:text-sky-200 bg-white/60 dark:bg-slate-800 border border-sky-100/60 dark:border-sky-800 p-4 rounded-xl">
                  {results.internetVagaSearchInfo}
                </div>
              </div>
            )}

            {/* Missing Keywords & Additions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                <span className="w-1.5 h-3 bg-rose-500 rounded-full" />
                Palavras-chave em Falta no Seu CV Inicial
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Estes são termos cruciais que os robôs de recrutamento buscam neste cargo e que não identificámos na versão inicial do seu CV:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {results.missingKeywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center gap-1">
                    <span className="w-1 h-1 bg-rose-500 rounded-full" />
                    {kw}
                  </span>
                ))}
                {results.missingKeywords.length === 0 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Parabéns! Nenhuma palavra-chave importante está em falta.</span>
                )}
              </div>

              {results.recommendedSkillsToAdd.length > 0 && (
                <div className="pt-2 border-t border-slate-50 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Competências adicionais sugeridas para incluir:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {results.recommendedSkillsToAdd.map((skill, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-100/50 dark:border-emerald-800">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Summary Suggestion */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                  Novo Resumo Profissional Sugerido (IA)
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(results.suggestedSummary, "summary")}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 text-[11px] font-medium"
                  title="Copiar resumo"
                  aria-label="Copiar resumo sugerido"
                >
                  {copiedTextId === "summary" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-xl leading-relaxed italic">
                "{results.suggestedSummary}"
              </p>
              <button
                type="button"
                onClick={handleApplySummary}
                className="w-full text-center py-2 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100/75 dark:hover:bg-emerald-900 border border-emerald-200/50 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium transition"
              >
                Atualizar o meu CV Oficial com este novo resumo!
              </button>
            </div>

            {/* Experiences Suggestions */}
            {results.suggestedExperiences.map((item) => {
              const originalExp = cvData.experience.find(exp => exp.id === item.experienceId);
              if (!originalExp) return null;
              return (
                <div key={item.experienceId} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">CARGO</span>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-white leading-tight mt-0.5">{originalExp.role} @ {originalExp.company}</h4>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Marcadores de Sucesso Sugeridos (Cole no seu CV):</p>
                    <ul className="space-y-2.5">
                      {item.suggestedBulletPoints.map((bullet, bIdx) => {
                        const copyId = `${item.experienceId}_${bIdx}`;
                        return (
                          <li key={bIdx} className="text-xs p-3 bg-slate-50/60 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-start justify-between gap-4 border border-slate-100/40 dark:border-slate-700">
                            <span className="leading-relaxed text-slate-700 dark:text-slate-300">{bullet}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(bullet, copyId)}
                              title="Copiar marcador"
                              aria-label="Copiar marcador"
                              className="text-slate-400 hover:text-emerald-600 shrink-0 mt-0.5 transition"
                            >
                              {copiedTextId === copyId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {item.justification && (
                      <div className="bg-emerald-50/30 dark:bg-emerald-950/30 border border-emerald-100/40 dark:border-emerald-800 p-3.5 rounded-xl mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 flex gap-2">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400 shrink-0">Estratégia ATS:</span>
                        <span>{item.justification}</span>
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
