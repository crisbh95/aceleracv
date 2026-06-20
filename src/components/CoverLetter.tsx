/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CVData, CoverLetterResult } from "../types";
import { Copy, Check, FileText, Sparkles, RefreshCw, AlertTriangle, Lightbulb } from "lucide-react";
import { useToast } from "./Toast";

interface CoverLetterProps {
  cvData: CVData;
  sharedJobDescription?: string;
  onJobDescriptionChange?: (jd: string) => void;
}

export default function CoverLetter({ cvData, sharedJobDescription, onJobDescriptionChange }: CoverLetterProps) {
  const [tone, setTone] = useState("Profissional e entusiasmado");
  const [jobDescription, setJobDescription] = useState(sharedJobDescription || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (sharedJobDescription && !jobDescription) {
      setJobDescription(sharedJobDescription);
    }
  }, [sharedJobDescription]);

  const TONES = [
    "Profissional e entusiasmado",
    "Altamente formal e respeitoso",
    "Criativo e inovador",
    "Focado puramente em números e resultados"
  ];

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.letterText);
      setCopied(true);
      toast("success", "Carta copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJobDescChange = (value: string) => {
    setJobDescription(value);
    onJobDescriptionChange?.(value);
  };

  const executeDraft = async () => {
    if (!jobDescription.trim()) {
      toast("warning", "Por favor, cole os requisitos ou detalhes da vaga primeiro.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData, jobDescription, tone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro de comunicação ao produzir rascunho.");
      }

      setResult(data);
      toast("success", "Carta de apresentação gerada com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Um erro inesperado ocorreu. Certifique-se de que a API Key está configurada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="cover-letter-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Settings Side */}
      <div id="letter-settings-panel" className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-slate-800 dark:text-white font-display font-semibold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Carta de Apresentação
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Escreva ou cole a proposta da vaga abaixo. O redator de IA gerará uma carta sob medida, destacando elementos do seu histórico oficial.
          </p>

          {/* Job Details Input */}
          <div className="space-y-1">
            <label htmlFor="cover-job-desc" className="block text-xs font-medium text-slate-600 dark:text-slate-400">Alvo da Vaga (Cole aqui ou use a anterior)</label>
            <textarea
              id="cover-job-desc"
              rows={6}
              value={jobDescription}
              onChange={(e) => handleJobDescChange(e.target.value)}
              placeholder="Ex: Procuramos assistente administrativo com facilidade de comunicação ou desenvolvedor web responsivo..."
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Tom da Carta</label>
            <div className="grid grid-cols-1 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`text-left text-xs px-3 py-2.5 rounded-lg border transition ${
                    tone === t
                      ? "bg-slate-800 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 font-medium"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={executeDraft}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition duration-200 ${
              loading
                ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                A redigir carta...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                Redigir Carta sob Medida
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Section Card */}
      <div id="letter-results-panel" className="lg:col-span-8">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800 rounded-2xl p-5 text-rose-900 dark:text-rose-200 flex items-start gap-3.5 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Não foi possível criar a carta</h4>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="h-full min-h-[420px] border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-slate-800/30">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5] mb-3" />
            <h3 className="font-display font-medium text-slate-700 dark:text-slate-300 text-base">Papel de Carta Inteligente</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
              Forneça os detalhes da vaga de destino à esquerda e clique em programar para redigir um rascunho de alto calibre estrutural.
            </p>
          </div>
        )}

        {loading && (
          <div className="h-full min-h-[420px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 animate-spin" />
              <FileText className="w-5 h-5 text-emerald-500 absolute animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-medium text-slate-800 dark:text-white text-base font-semibold">A tecer a proposta...</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                Consultando suas competências técnicas e ligando-as com sensibilidade estratégica aos desafios da empresa listada...
              </p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {/* Elegant Letter Sheet mockup */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden animate-fade-in relative">
              {/* Header block decoration */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-6 py-4 flex justify-between items-center">
                <span className="text-xs font-display font-semibold tracking-wider text-emerald-300 uppercase">AceleraCV - Carta Rascunho</span>
                <button
                  onClick={handleCopy}
                  className="bg-white/10 hover:bg-white/20 text-white py-1 px-3.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition flex items-center gap-1.5"
                  aria-label="Copiar carta"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Carta
                    </>
                  )}
                </button>
              </div>

              {/* The "Paper" container */}
              <div className="p-8 md:p-10 text-slate-800 dark:text-slate-200 leading-relaxed text-sm bg-white dark:bg-slate-800 font-serif max-h-[600px] overflow-y-auto whitespace-pre-wrap whitespace-pre-line border-b border-slate-100 dark:border-slate-700">
                {result.letterText}
              </div>

              {/* Coach Advisory Accordion details */}
              <div className="bg-slate-50/60 dark:bg-slate-900/60 p-6 space-y-4 font-sans text-xs">
                <h4 className="font-display font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  Conselho Estratégico do Coach de Carreira:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sectionsAdvice.greeting && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-0.5">Saudação:</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{result.sectionsAdvice.greeting}</span>
                    </div>
                  )}
                  {result.sectionsAdvice.hook && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-0.5">Sua Introdução:</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{result.sectionsAdvice.hook}</span>
                    </div>
                  )}
                  {result.sectionsAdvice.body && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-0.5">Corpo da Mensagem:</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{result.sectionsAdvice.body}</span>
                    </div>
                  )}
                  {result.sectionsAdvice.closure && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400 block mb-0.5">Encerramento:</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">{result.sectionsAdvice.closure}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
