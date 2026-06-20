/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CVData, WorkExperience, Education } from "../types";
import { DEV_MOCK_CV, ADM_MOCK_CV } from "../mockData";
import { Plus, Trash2, Edit2, Check, User, Briefcase, GraduationCap, Code, Languages, FileText, Sparkles, RefreshCw, UploadCloud, Download, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "./Toast";

interface ResumeFormProps {
  cvData: CVData;
  onChange: (data: CVData) => void;
}

export default function ResumeForm({ cvData, onChange }: ResumeFormProps) {
  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  // File upload states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // File drag & drop actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      // 1. Read file as base64 using FileReader
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const dataUrl = event.target.result as string;
            const base64Data = dataUrl.split(",")[1];
            resolve(base64Data);
          } else {
            reject(new Error("Erro ao converter ficheiro para Base64"));
          }
        };
        reader.onerror = () => reject(new Error("Erro de leitura do ficheiro"));
        reader.readAsDataURL(file);
      });

      const fileBase64 = await base64Promise;

      // 2. Call parse endpoint
      const response = await fetch("/api/parse-cv-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: fileBase64,
          mimeType: file.type || "application/pdf",
          fileName: file.name
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro de processamento no servidor.");
      }

      if (data.error === "API_KEY_MISSING") {
        throw new Error("A chave API do Gemini é necessária nos Secrets (Settings) para realizar o preenchimento automático.");
      }

      onChange(data);
      toast("success", "O seu currículo foi lido e todos os campos foram preenchidos de forma automática!");
    } catch (err: any) {
      console.error("Erro no processamento do ficheiro:", err);
      setUploadError(err.message || "Não foi possível processar o currículo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Convert CV to Markdown for downloading
  const convertCVToMarkdown = (cv: CVData): string => {
    let md = `# CURRÍCULO PROFISSIONAL: ${cv.fullName || "Candidato"}\n\n`;
    if (cv.email || cv.phone || cv.location || cv.website) {
      const contactInfo = [];
      if (cv.email) contactInfo.push(`**Email:** ${cv.email}`);
      if (cv.phone) contactInfo.push(`**Telefone:** ${cv.phone}`);
      if (cv.location) contactInfo.push(`**Localização:** ${cv.location}`);
      if (cv.website) contactInfo.push(`**LinkedIn/Website:** ${cv.website}`);
      md += contactInfo.join("  |  ") + "\n\n";
    }
    
    md += `---\n\n`;
    
    if (cv.summary) {
      md += `## PERFIL PROFISSIONAL\n\n${cv.summary}\n\n`;
      md += `---\n\n`;
    }
    
    if (cv.experience && cv.experience.length > 0) {
      md += `## EXPERIÊNCIA PROFISSIONAL\n\n`;
      cv.experience.forEach(exp => {
        md += `### ${exp.role} — ${exp.company}\n`;
        md += `*${exp.startDate} – ${exp.endDate || "Presente"}*  |  *${exp.location || "Cabo Verde"}*\n\n`;
        if (exp.description) {
          md += `${exp.description}\n\n`;
        }
      });
      md += `---\n\n`;
    }
    
    if (cv.education && cv.education.length > 0) {
      md += `## EDUCAÇÃO & FORMAÇÃO\n\n`;
      cv.education.forEach(edu => {
        md += `### ${edu.degree} — ${edu.fieldOfStudy}\n`;
        md += `*${edu.school}*  |  *${edu.startDate} – ${edu.endDate || ""}*  |  *${edu.location || ""}*\n\n`;
      });
      md += `---\n\n`;
    }
    
    if (cv.skills && cv.skills.length > 0) {
      md += `## COMPETÊNCIAS & FERRAMENTAS\n\n`;
      md += cv.skills.map(s => `- ${s}`).join("\n") + "\n\n";
    }
    
    if (cv.languages && cv.languages.length > 0) {
      md += `## IDIOMAS\n\n`;
      md += cv.languages.map(l => `- ${l}`).join("\n") + "\n\n";
    }
    
    return md;
  };

  const handleDownloadMarkdown = () => {
    const mdContent = convertCVToMarkdown(cvData);
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanName = (cvData.fullName || "Curriculo_Otimizado").toLowerCase().replace(/\s+/g, "_");
    link.setAttribute("download", `${cleanName}_completo.md`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({
      ...cvData,
      [e.target.name]: e.target.value
    });
  };

  const handleImport = (type: "dev" | "adm") => {
    if (type === "dev") {
      onChange(DEV_MOCK_CV);
    } else {
      onChange(ADM_MOCK_CV);
    }
  };

  // Work Experience Operations
  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: "exp_" + Date.now(),
      role: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    onChange({
      ...cvData,
      experience: [...cvData.experience, newExp]
    });
  };

  const handleUpdateExperience = (id: string, field: keyof WorkExperience, value: string) => {
    onChange({
      ...cvData,
      experience: cvData.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    });
  };

  const handleRemoveExperience = (id: string) => {
    onChange({
      ...cvData,
      experience: cvData.experience.filter(exp => exp.id !== id)
    });
  };

  // Education Operations
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: "edu_" + Date.now(),
      degree: "",
      fieldOfStudy: "",
      school: "",
      location: "",
      startDate: "",
      endDate: ""
    };
    onChange({
      ...cvData,
      education: [...cvData.education, newEdu]
    });
  };

  const handleUpdateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...cvData,
      education: cvData.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    });
  };

  const handleRemoveEducation = (id: string) => {
    onChange({
      ...cvData,
      education: cvData.education.filter(edu => edu.id !== id)
    });
  };

  // Skills & Languages
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !cvData.skills.includes(newSkill.trim())) {
      onChange({
        ...cvData,
        skills: [...cvData.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    onChange({
      ...cvData,
      skills: cvData.skills.filter(s => s !== skill)
    });
  };

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLang.trim() && !cvData.languages.includes(newLang.trim())) {
      onChange({
        ...cvData,
        languages: [...cvData.languages, newLang.trim()]
      });
      setNewLang("");
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    onChange({
      ...cvData,
      languages: cvData.languages.filter(l => l !== lang)
    });
  };

  return (
    <div id="resume-form-container" className="space-y-8 animate-fade-in">
      {/* Consolidado: Importação de Dados, Download e Upload com IA */}
      <div id="import-upload-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload de arquivo de Currículo Inteligente (Esquerda) */}
        <div id="resume-upload-card" className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between whitespace-normal text-left">
          <div className="space-y-1 mb-4">
            <h3 id="upload-card-title" className="text-slate-800 font-display font-semibold text-sm flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Preenchimento Automático via Upload 🤖
            </h3>
            <p id="upload-card-desc" className="text-slate-505 text-xs">
              Deixe que a Inteligência Artificial faça o trabalho pesado de preencher todos os seus dados pessoais, experiências e competências de uma só vez!
            </p>
          </div>

          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition duration-200 flex flex-col items-center justify-center relative cursor-pointer min-h-[140px] ${
              dragActive
                ? "border-emerald-600 bg-emerald-50/20"
                : "border-slate-200 hover:border-emerald-500 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              id="cv-file-picker"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.doc,image/png,image/jpeg"
              disabled={uploading}
            />

            {uploading ? (
              <div className="space-y-2 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-700">Preenchendo currículo com IA do Gemini...</p>
                <p className="text-[10px] text-slate-400">Extraindo nome, contatos, competências e descrições...</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <UploadCloud className="w-4 h-4 text-slate-550" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  <span className="text-emerald-600 font-bold">Arraste seu currículo aqui</span> ou clique para selecionar
                </p>
                <p className="text-[10px] text-slate-400">PDF, TXT, DOCX ou Imagens de até 5MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-900 flex items-start gap-2 animate-fade-in text-[11px]">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Perfis Base e Download do Currículo Pró (Direita) */}
        <div id="quick-presets-downloads-card" className="lg:col-span-6 bg-gradient-to-r from-emerald-50/70 to-teal-50/30 border border-emerald-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between text-left">
          <div className="space-y-1 mb-4">
            <h3 id="downloads-card-title" className="text-emerald-950 font-display font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Presets Exemplo & Exportação
            </h3>
            <p id="downloads-card-desc" className="text-emerald-800 text-xs">
              Simule currículos modelos para testar a plataforma, ou faça o download das notas modificadas.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="import-dev-btn"
                type="button"
                onClick={() => handleImport("dev")}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-semibold text-xs rounded-xl transition duration-150 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perfil Informático (Dev)
              </button>
              <button
                id="import-adm-btn"
                type="button"
                onClick={() => handleImport("adm")}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition duration-150 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perfil Administrativo
              </button>
            </div>

            {/* Campo e Botão para Baixar */}
            <div id="export-actions-section" className="pt-3 border-t border-emerald-100 border-dashed space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Exportar do AceleraCV</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">Formato .MD / .TXT</span>
              </div>
              <button
                id="download-resume-btn"
                type="button"
                onClick={handleDownloadMarkdown}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Meu Currículo Preenchido
              </button>
              <p className="text-[10px] text-emerald-850 text-center leading-normal">
                Baixa um arquivo de texto Markdown optimizado para Gupy, LinkedIn e outros motores ATS estruturais.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Personal Info */}
      <div id="personal-info-card" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 id="personal-info-header" className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2 border-b border-slate-50 pb-3">
          <User className="w-5 h-5 text-emerald-600" />
          Dados Pessoais
        </h2>
        <div id="personal-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo</label>
            <input
              type="text"
              name="fullName"
              value={cvData.fullName}
              onChange={handlePersonalChange}
              placeholder="ex: Carlos Jorge Silva"
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email de Contacto</label>
            <input
              type="email"
              name="email"
              value={cvData.email}
              onChange={handlePersonalChange}
              placeholder="ex: carlos@mail.cv"
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telemóvel / Telefone</label>
            <input
              type="text"
              name="phone"
              value={cvData.phone}
              onChange={handlePersonalChange}
              placeholder="ex: +238 991 22 33"
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Localização (Cidade, Ilha)</label>
            <input
              type="text"
              name="location"
              value={cvData.location}
              onChange={handlePersonalChange}
              placeholder="ex: Praia, Santiago, Cabo Verde"
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Website / LinkedIn</label>
            <input
              type="text"
              name="website"
              value={cvData.website || ""}
              onChange={handlePersonalChange}
              placeholder="ex: linkedin.com/in/perfil"
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Perfil Profissional / Resumo Curto</label>
            <textarea
              name="summary"
              rows={3}
              value={cvData.summary}
              onChange={handlePersonalChange}
              placeholder="Breve resumo sobre suas aspirações, principais domínios e conquistas que o definem estrategicamente..."
              className="w-full text-sm text-slate-800 bg-white px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* Experience History */}
      <div id="experience-history-card" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h2 id="experience-header" className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Experiência Profissional
          </h2>
          <button
            id="add-exp-btn"
            type="button"
            onClick={handleAddExperience}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 transition rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Adicionar Cargo
          </button>
        </div>

        {cvData.experience.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">Nenhuma experiência de trabalho listada. Clique em "Adicionar Cargo" ou acima em Importar.</p>
        ) : (
          <div className="space-y-6">
            {cvData.experience.map((exp, idx) => (
              <div key={exp.id} className="relative border border-slate-100 rounded-xl p-5 bg-slate-50/40 space-y-4 pt-12">
                <span className="absolute top-4 left-5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-100/50">
                  Cargo / Experiência #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(exp.id)}
                  title="remover experiência"
                  className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Título do Cargo</label>
                    <input
                      type="text"
                      value={exp.role || ""}
                      onChange={(e) => handleUpdateExperience(exp.id, "role", e.target.value)}
                      placeholder="ex: Diretor Comercial, Designer, Programador"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Nome da Empresa</label>
                    <input
                      type="text"
                      value={exp.company || ""}
                      onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                      placeholder="ex: CV Telecom, Banco de Cabo Verde"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Início - Fim (Datas)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={exp.startDate || ""}
                        onChange={(e) => handleUpdateExperience(exp.id, "startDate", e.target.value)}
                        placeholder="ex: Ago 2021"
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={exp.endDate || ""}
                        onChange={(e) => handleUpdateExperience(exp.id, "endDate", e.target.value)}
                        placeholder="ex: Presente"
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Localização</label>
                    <input
                      type="text"
                      value={exp.location || ""}
                      onChange={(e) => handleUpdateExperience(exp.id, "location", e.target.value)}
                      placeholder="ex: Praia, Santiago"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Descrição de Atribuições e Conquistas</label>
                    <textarea
                      rows={3}
                      value={exp.description || ""}
                      onChange={(e) => handleUpdateExperience(exp.id, "description", e.target.value)}
                      placeholder="Detalhes sobre suas rotinas principais, projetos relevantes ou reduções de custos/erros que efetuou..."
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom action dashed card to easily add more experiences */}
            <button
              type="button"
              onClick={handleAddExperience}
              className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-slate-500 hover:text-emerald-700 rounded-xl text-center text-xs font-semibold transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              Adicionar Nova Experiência Profissional (Sem Limites)
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div id="education-card" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h2 id="education-header" className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Educação & Formação
          </h2>
          <button
            id="add-edu-btn"
            type="button"
            onClick={handleAddEducation}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 transition rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Adicionar Educação
          </button>
        </div>

        {cvData.education.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">Nenhuma educação ou curso listado. Clique em "Adicionar Educação".</p>
        ) : (
          <div className="space-y-6">
            {cvData.education.map((edu, idx) => (
              <div key={edu.id} className="relative border border-slate-100 rounded-xl p-5 bg-slate-50/40 space-y-4 pt-12">
                <span className="absolute top-4 left-5 bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-teal-100/50">
                  Formação / Curso #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(edu.id)}
                  title="remover educação"
                  className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Título do Curso / Licenciatura</label>
                    <input
                      type="text"
                      value={edu.degree || ""}
                      onChange={(e) => handleUpdateEducation(edu.id, "degree", e.target.value)}
                      placeholder="ex: Licenciatura, Tecnólogo, Mestrado"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Área de Estudo</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy || ""}
                      onChange={(e) => handleUpdateEducation(edu.id, "fieldOfStudy", e.target.value)}
                      placeholder="ex: Gestão de Empresas, Informática de Redes"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Instituição / Escola</label>
                    <input
                      type="text"
                      value={edu.school || ""}
                      onChange={(e) => handleUpdateEducation(edu.id, "school", e.target.value)}
                      placeholder="ex: Universidade de Cabo Verde (Uni-CV)"
                      className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">Datas (Início - Fim)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.startDate || ""}
                        onChange={(e) => handleUpdateEducation(edu.id, "startDate", e.target.value)}
                        placeholder="ex: 2019"
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={edu.endDate || ""}
                        onChange={(e) => handleUpdateEducation(edu.id, "endDate", e.target.value)}
                        placeholder="ex: 2023"
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom action dashed card to easily add more education */}
            <button
              type="button"
              onClick={handleAddEducation}
              className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 text-slate-500 hover:text-emerald-700 rounded-xl text-center text-xs font-semibold transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              Adicionar Nova Educação ou Formação (Sem Limites)
            </button>
          </div>
        )}
      </div>

      {/* Skills and Languages */}
      <div id="skills-languages-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <div id="skills-subcard" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 id="skills-form-header" className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2 border-b border-slate-50 pb-3">
            <Code className="w-5 h-5 text-emerald-600" />
            Competências & Ferramentas
          </h2>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Adicionar competência (ex: SQL, Excel)..."
              className="flex-1 text-xs text-slate-800 bg-white px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
            >
              Adicionar
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {cvData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100/50"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-emerald-600 hover:text-emerald-900 font-bold ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
            {cvData.skills.length === 0 && (
              <p className="text-slate-400 text-xs py-2">Sem qualificações adicionadas de momento.</p>
            )}
          </div>
        </div>

        {/* Languages */}
        <div id="languages-subcard" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 id="languages-form-header" className="text-slate-800 font-display font-semibold text-lg flex items-center gap-2 border-b border-slate-50 pb-3">
            <Languages className="w-5 h-5 text-emerald-600" />
            Idiomas
          </h2>
          <form onSubmit={handleAddLanguage} className="flex gap-2">
            <input
              type="text"
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              placeholder="Adicionar língua (ex: Inglês, Crioulo)..."
              className="flex-1 text-xs text-slate-800 bg-white px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition"
            >
              Adicionar
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {cvData.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-100/50"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="text-teal-600 hover:text-teal-900 font-bold ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
            {cvData.languages.length === 0 && (
              <p className="text-slate-400 text-xs py-2">Nenhum idioma adicionado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
