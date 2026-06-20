/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { InterviewQuestion, AnswerEvaluation } from "../types";
import { HelpCircle, Star, MessageSquare, Check, ArrowRight, CornerDownRight, Award, Trash2, ShieldAlert, Sparkles, AlertTriangle, RefreshCw, ChevronRight, Play } from "lucide-react";
import { useToast } from "./Toast";

interface InterviewSimulatorProps {
  jobTitle: string;
  jobDescription?: string;
}

export default function InterviewSimulator({ jobTitle: initialJobTitle, jobDescription: initialJobDescription }: InterviewSimulatorProps) {
  const [jobTitle, setJobTitle] = useState(initialJobTitle || "Programador Frontend / Assistente Administrativo");
  const [jobDescription, setJobDescription] = useState(initialJobDescription || "");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evaluatedList, setEvaluatedList] = useState<Record<string, { evaluation: AnswerEvaluation; answer: string }>>({});
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync state if initial values are updated from parental level
  React.useEffect(() => {
    if (initialJobTitle && initialJobTitle !== jobTitle) {
      setJobTitle(initialJobTitle);
    }
    if (initialJobDescription && initialJobDescription !== jobDescription) {
      setJobDescription(initialJobDescription);
    }
  }, [initialJobTitle, initialJobDescription]);

  const handleStartSimulation = async () => {
    if (!jobTitle.trim()) {
      setErrorHeader("Por favor, informe a designação do Cargo a ser simulado.");
      return;
    }

    setLoadingQuestions(true);
    setErrorHeader(null);
    setEvaluation(null);
    setEvaluatedList({});
    setCurrentIdx(0);
    setUserAnswer("");

    try {
      const response = await fetch("/api/interview-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, jobDescription })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao produzir simulação de entrevista.");
      }

      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Erro ao carregar simulador.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim()) {
      toast("warning", "Por favor, digite ou rascunhe a sua resposta antes de enviar para avaliação.");
      return;
    }

    const currentQuestion = questions[currentIdx];
    setEvaluatingAnswer(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/interview-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentQuestion.questionText,
          userAnswer: userAnswer,
          jobTitle: jobTitle
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao submeter resposta.");
      }

      setEvaluation(data);
      // Store in session tracker
      setEvaluatedList((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          evaluation: data,
          answer: userAnswer
        }
      }));
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Não foi possível avaliar a resposta. Verifique a chave de API.");
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const currentQuestion = questions[currentIdx];

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      // Check if already evaluated to reload context
      const previouslyEvaluated = evaluatedList[questions[currentIdx + 1].id];
      if (previouslyEvaluated) {
        setUserAnswer(previouslyEvaluated.answer);
        setEvaluation(previouslyEvaluated.evaluation);
      } else {
        setUserAnswer("");
        setEvaluation(null);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      const previouslyEvaluated = evaluatedList[questions[currentIdx - 1].id];
      if (previouslyEvaluated) {
        setUserAnswer(previouslyEvaluated.answer);
        setEvaluation(previouslyEvaluated.evaluation);
      } else {
        setUserAnswer("");
        setEvaluation(null);
      }
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "comportamental":
        return { bg: "bg-blue-50 text-blue-800 border-blue-100", label: "Comportamental (Método STAR)" };
      case "tecnica":
        return { bg: "bg-amber-50 text-amber-800 border-amber-100", label: "Técnica / Qualificações" };
      case "situacional":
        return { bg: "bg-purple-50 text-purple-800 border-purple-100", label: "Estudo de Caso / Situacional" };
      default:
        return { bg: "bg-slate-50 text-slate-800 border-slate-100", label: "Geral de Carreira" };
    }
  };

  const totalEvaluated = Object.keys(evaluatedList).length;
  const averageScore = totalEvaluated > 0 
    ? Math.round(Object.keys(evaluatedList).reduce((acc, key) => acc + evaluatedList[key].evaluation.score, 0) / totalEvaluated)
    : 0;

  return (
    <div id="simulator-root" className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Starting Setup view / Banner */}
      {questions.length === 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Award className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="text-slate-800 font-display font-bold text-xl">
              Simulador de Entrevista de Emprego (IA)
            </h2>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Prepara-se para as entrevistas mais concorridas do mercado caboverdiano de forma interativa. Nosso recrutador virtual prepara você com feedback minucioso de cada resposta.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qual o cargo que deseja simular?</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Gestor de Finanças, Frontend Developer..."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contexto adicional da vaga ou empresa (Opcional)</label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Cole o escopo para receber perguntas 100% calibradas para esta oportunidade..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
              />
            </div>
          </div>

          {errorHeader && (
            <p className="text-rose-600 text-xs bg-rose-50 border border-rose-100 rounded-lg p-2.5">{errorHeader}</p>
          )}

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={loadingQuestions}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loadingQuestions ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sintonizando perguntas de simulação...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Sessão de Treinamento Autônomo
              </>
            )}
          </button>
        </div>
      )}

      {/* Simulator active layout */}
      {questions.length > 0 && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Simulating Left Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              {/* Quick statistics / progress header */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-display">
                    Pergunta {currentIdx + 1} de {questions.length}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${getCategoryTheme(currentQuestion.category).bg}`}>
                    {getCategoryTheme(currentQuestion.category).label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Deseja mesmo redefinir o treinamento atual? Sua pontuação local será apagada.")) {
                      setQuestions([]);
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
                  title="Reiniciar Simulação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reiniciar
                </button>
              </div>

              {/* The Interview Question Card Box */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 relative">
                <span className="absolute top-2 left-3 font-serif text-slate-300 font-extrabold text-3xl">“</span>
                <p className="font-display font-medium text-slate-800 text-sm md:text-base leading-relaxed pl-3 pr-2 pt-2 italic">
                  {currentQuestion.questionText}
                </p>
                
                {/* Backdoor interviewer intents */}
                {currentQuestion.intent && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 pl-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">O que o entrevistador realmente quer saber:</span>
                    <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">{currentQuestion.intent}</span>
                  </div>
                )}
              </div>

              {/* Tips for STAR frame */}
              {currentQuestion.tips && (
                <div className="bg-emerald-50/20 border border-emerald-100/40 p-4 rounded-xl flex gap-2.5">
                  <span className="text-emerald-700 font-bold shrink-0 text-xs">Dica:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {currentQuestion.tips}
                  </p>
                </div>
              )}

              {/* Answer input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-700">Sua Resposta Escrita:</label>
                  <span className="text-[10px] text-slate-400 font-semibold">{userAnswer.length} caracteres</span>
                </div>
                <textarea
                  rows={7}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Redija aqui o rascunho de como responderia verbalmente a este questionamento. Use frases ativas e foque nos seus resultados operacionais obtidos em Cabo Verde..."
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans text-slate-700 resize-none leading-relaxed"
                />
              </div>

              {/* Submission actions */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevQuestion}
                    disabled={currentIdx === 0}
                    className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-xs font-semibold flex items-center transition"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={currentIdx === questions.length - 1}
                    className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-xs font-semibold flex items-center transition"
                  >
                    Próxima
                  </button>
                </div>

                <button
                  type="button"
                  disabled={evaluatingAnswer || !userAnswer.trim()}
                  onClick={handleEvaluateAnswer}
                  className={`py-2 px-5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition ${
                    evaluatingAnswer
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  {evaluatingAnswer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Avaliando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      Avaliar Minha Resposta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Evaluation Critique Right Panel */}
          <div className="lg:col-span-6">
            {!evaluation && !evaluatingAnswer && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center h-full min-h-[400px] flex flex-col justify-center items-center">
                {/* Score Summary if some evaluated */}
                {totalEvaluated > 0 ? (
                  <div className="space-y-4 w-full max-w-sm animate-fade-in">
                    <Award className="w-12 h-12 text-emerald-600 mx-auto stroke-[1.5]" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Seu Progresso de Desempenho</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Teve {totalEvaluated} de {questions.length} respostas avaliadas.</p>
                    </div>
                    
                    <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Aproveitamento Médio:</span>
                        <span className="text-emerald-800">{averageScore}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${averageScore}%` }} />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      Dica: Escreva sua resposta na caixa à esquerda para a pergunta atual e envie para avaliação para obter feedback preciso.
                    </p>
                  </div>
                ) : (
                  <>
                    <HelpCircle className="w-12 h-12 text-slate-350 stroke-[1.2] mb-3" />
                    <h4 className="text-slate-700 font-display font-medium text-sm">Aguardando Sua Resposta</h4>
                    <p className="text-slate-400 text-xs max-w-xs mt-1 leading-relaxed">
                      Sua avaliação detalhada de competências e inteligência emocional aparecerá aqui assim que rascunhar e avaliar a sua resposta técnica.
                    </p>
                  </>
                )}
              </div>
            )}

            {evaluatingAnswer && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center h-full min-h-[400px] flex flex-col justify-center items-center space-y-3">
                <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                <div>
                  <h4 className="text-slate-800 dark:text-white font-display font-semibold text-sm">O Consultor do AceleraCV está a analisar...</h4>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed mt-1">
                    Comparando sua sintaxe, clareza, alinhamento ao cargo de {jobTitle} e o uso eficaz da metodologia baseada em resultados reais...
                  </p>
                </div>
              </div>
            )}

            {evaluation && !evaluatingAnswer && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in text-slate-800">
                {/* Score metrics header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Desempenho Geral</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-display font-extrabold text-2xl text-slate-800">{evaluation.score}</span>
                      <span className="text-xs text-slate-400">/ 100 pontos</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    evaluation.rating === "Excelente" 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : evaluation.rating === "Bom"
                      ? "bg-blue-50 text-blue-800 border border-blue-100"
                      : "bg-rose-50 text-rose-800 border border-rose-100"
                  }`}>
                    {evaluation.rating}
                  </span>
                </div>

                {/* Positives list */}
                {evaluation.positives.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />
                      Pontos Fortes Identificados:
                    </h5>
                    <ul className="space-y-1">
                      {evaluation.positives.map((p, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5 pl-1 leading-relaxed">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements points list */}
                {evaluation.improvements.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <h5 className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      Sugestões de Ajuste & Red Flags:
                    </h5>
                    <ul className="space-y-1">
                      {evaluation.improvements.map((imp, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 pl-1 leading-relaxed">
                          <span className="text-rose-500 font-bold shrink-0 mt-0.5">-</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ideal Alternative Answer rewrite */}
                {evaluation.alternativeAnswer && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Alternativa Sugerida (Copie & Adapte!)
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(evaluation.alternativeAnswer);
                          toast("success", "Modelo de resposta da IA copiado com sucesso!");
                        }}
                        className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold flex items-center gap-0.5 transition cursor-pointer"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic font-serif">
                      "{evaluation.alternativeAnswer}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
