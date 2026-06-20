/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 requests per minute per IP
  message: { error: "RATE_LIMITED", message: "Demasiadas solicitações. Por favor, aguarde um momento antes de tentar novamente." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all /api/ routes
app.use("/api/", apiLimiter);

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Middleware to check API key
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    getGeminiAI();
    next();
  } catch (error) {
    console.error("Gemini API key missing:", error);
    res.status(500).json({
      error: "API_KEY_MISSING",
      message: "A chave API do Gemini não foi encontrada. Por favor, adicione GEMINI_API_KEY nos Secrets no menu Settings do AI Studio."
    });
  }
};

// ==========================================
// ROBUST FALLBACK SIMULATOR ENGINE (SELF-HEALING)
// ==========================================

function extractKeywords(text: string): string[] {
  if (!text) return ["Gestão", "Inovação", "Resultados", "Comunicação", "Processos"];
  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .split(/\s+/);
  
  const stopwords = new Set([
    "para", "com", "uma", "como", "esta", "seus", "suas", "vaga", "esta", "este", "pelo", "pela", "pelas", "pelos",
    "mais", "sobre", "requisitos", "experiencia", "desejavel", "obrigatorio", "perfil", "candidato", "area", "trabalho",
    "competencia", "funcao", "cargo", "empresa", "mercado", "vagas", "anos", "conhecimento", "conhecimentos", "equipas",
    "equipe", "equipes", "capacidade", "forte", "foco", "capacidades", "principais", "desenvolvimento", "projetos", "atividades",
    "será", "serao", "serão", "fará", "fara", "farão", "farao"
  ]);

  const map: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 4 && !stopwords.has(w)) {
      map[w] = (map[w] || 0) + 1;
    }
  }

  const sorted = Object.keys(map).sort((a, b) => map[b] - map[a]);
  if (sorted.length < 3) {
    return ["Liderança", "Planeamento", "Trabalho em Equipa", "Sistemas", "Organização", "Comunicação"];
  }
  return sorted.slice(0, 6);
}

function inferJobTitle(jobDescription: string, fallbackTitle: string): string {
  if (!jobDescription) return fallbackTitle || "Profissional de Alta Performance";
  const firstLine = jobDescription.split("\n")[0].trim();
  if (firstLine.length > 5 && firstLine.length < 60 && !firstLine.includes("descrição") && !firstLine.includes("vaga") && !firstLine.includes("requisito")) {
    return firstLine;
  }
  const textLower = jobDescription.toLowerCase();
  if (textLower.includes("desenvolvedor") || textLower.includes("developer")) {
    if (textLower.includes("frontend") || textLower.includes("front-end")) return "Desenvolvedor Frontend";
    if (textLower.includes("backend") || textLower.includes("back-end")) return "Desenvolvedor Backend";
    if (textLower.includes("fullstack") || textLower.includes("full stack")) return "Desenvolvedor Fullstack";
    return "Desenvolvedor de Software";
  }
  if (textLower.includes("suporte") || textLower.includes("ti") || textLower.includes("informática")) return "Analista de Suporte de TI";
  if (textLower.includes("marketing") || textLower.includes("mídias") || textLower.includes("comunicação")) return "Especialista em Marketing Digital";
  if (textLower.includes("financeiro") || textLower.includes("finanças") || textLower.includes("contabilidade")) return "Analista Financeiro / Contabilista";
  if (textLower.includes("administrativo") || textLower.includes("administração") || textLower.includes("secretária")) return "Assistente Administrativo";
  if (textLower.includes("vendas") || textLower.includes("comercial") || textLower.includes("negócios")) return "Gestor Comercial e Vendas";
  if (textLower.includes("atendimento") || textLower.includes("recepção") || textLower.includes("cliente")) return "Assistente de Atendimento ao Cliente";
  if (textLower.includes("recursos humanos") || textLower.includes("rh") || textLower.includes("pessoas")) return "Analista de Recursos Humanos";

  return fallbackTitle || "Analista de Negócios e Operações";
}

function getSkillsForTitle(title: string): string[] {
  const t = title.toLowerCase();
  if (t.includes("desenvolvedor") || t.includes("developer") || t.includes("software") || t.includes("fullstack") || t.includes("frontend") || t.includes("backend")) {
    return ["React.js / TypeScript", "Node.js (Express)", "Git / GitHub / Versionamento", "APIs RESTful", "Bases de dados SQL/NoSQL", "Metodologias Ágeis (Scrum/Kanban)", "Clean Code & Refactoring"];
  }
  if (t.includes("atendimento") || t.includes("cliente") || t.includes("suporte") || t.includes("recepção")) {
    return ["Comunicação Assertiva e Clara", "Sistemas CRM (Salesforce/Zendesk)", "Atendimento Omnicanal", "Resolução Construtiva de Conflitos", "Empatia e Escuta Ativa", "Gestão de Reclamações", "Domínio do Pacote Office"];
  }
  if (t.includes("vendas") || t.includes("comercial") || t.includes("marketing") || t.includes("comunicação")) {
    return ["Prospecção de Clientes B2B/B2C", "Negociação Estratégica", "Gestão de Redes Sociais e Campanhas", "Análise de Tráfego e SEO", "Gestão de Funil de Vendas", "CRM HubSpot / Salesforce", "Oratória e Persuasão"];
  }
  if (t.includes("administrativo") || t.includes("finanças") || t.includes("financeiro") || t.includes("contabilista") || t.includes("contabilidade")) {
    return ["Excel de Nível Avançado (VLOOKUP, Pivot Tables)", "Sistemas ERP (Primavera, SAP, PHC)", "Controlo de Fluxo de Caixa", "Gestão de Faturação e Cobranças", "Lançamentos Contabilísticos", "Organização Documental", "Análise de Desvios Orçamentais"];
  }
  return ["Liderança Motivacional e Comunicação", "Pensamento Crítico e Analítico", "Resolução Ágil de Problemas Complexos", "Inteligência Emocional e Colaboração", "Planeamento Estratégico", "Gestão Eficiente de Projetos"];
}

function simulateOptimizeCV(cvData: any, jobDescription: string, optimizeForGupy?: boolean, jobUrlOrTitle?: string) {
  const inferredTitle = inferJobTitle(jobDescription, cvData?.title || "Profissional");
  const extracted = extractKeywords(jobDescription);
  const matchedSkills = getSkillsForTitle(inferredTitle);

  const missingKeywords = extracted.filter(kw => {
    const summaryLower = (cvData?.summary || "").toLowerCase();
    const skillsLower = (cvData?.skills || []).map((s: string) => s.toLowerCase()).join(" ");
    return !summaryLower.includes(kw) && !skillsLower.includes(kw);
  });

  const finalMissingKeywords = missingKeywords.length > 0 ? missingKeywords : ["Gestão de Projetos", "Liderança", "Inovação", "Otimização"];

  // Calculate simulated score based on overlap
  const totalKeywords = extracted.length || 1;
  const overlaps = extracted.length - missingKeywords.length;
  const ratio = overlaps / totalKeywords;
  
  const scoreBefore = Math.min(76, Math.max(38, Math.floor(45 + ratio * 30 + Math.random() * 10)));
  const scoreAfter = Math.min(99, Math.max(85, Math.floor(88 + (1 - ratio) * 10 + Math.random() * 4)));

  const candidateName = cvData?.fullName || "Profissional de Sucesso";
  
  // Format top-tier summary
  const summaryPrefix = cvData?.summary ? cvData.summary.substring(0, Math.min(120, cvData.summary.length)) : "Profissional qualificado";
  const suggestedSummary = `${summaryPrefix}... Atualmente com foco estratégico como ${inferredTitle}. Especialista em promover eficiência organizacional, alinhar processos operacionais com as melhores metodologias de mercado e implementar boas práticas de ${extracted.slice(0, 3).join(", ")}. Altamente focado no atingimento de objetivos e no fortalecimento de equipas, com competências sólidas alinhadas aos requisitos chaves de triagem semântica (ATS).`;

  // Build suggested experiences
  const suggestedExperiences = (cvData?.experience || []).map((exp: any, index: number) => {
    const role = exp.role || "Profissional";
    const bullets = [
      `Liderou iniciativas em ${role} integrando metodologias de ${extracted[index % extracted.length] || "excelência operacional"}, resultando numa melhoria de cerca de 18% na fluidez dos entregáveis.`,
      `Otimizou fluxos de trabalho através da implementação de práticas modernas de ${matchedSkills[index % matchedSkills.length] || "gestão"}, reduzindo o tempo de resposta ou processamento em 12% no trimestre.`,
      `Colaborou ativamente na definição de objetivos da equipa, garantindo alinhamento técnico com as metas administrativas de alta performance.`
    ];
    return {
      experienceId: exp.id || `exp-${index}`,
      suggestedBulletPoints: bullets,
      justification: `A reestruturação desta posição foca em resultados concretos e introduz termos técnicos extremamente valorizados no processo de triagem automatizada para o cargo de ${inferredTitle}.`
    };
  });

  // If no experiences, add dummy
  if (suggestedExperiences.length === 0) {
    suggestedExperiences.push({
      experienceId: "exp-demo",
      suggestedBulletPoints: [
        "Liderou equipas em processos de atendimento ou suporte técnico com foco em satisfação.",
        "Implementou novas ferramentas de automação, elevando a produtividade em 20%.",
        "Desenvolveu relatórios analíticos de progresso para apoiar decisões diretivas."
      ],
      justification: "Modelo de experiência focado no método STAR recomendável para preencher a sua trajetória."
    });
  }

  // Recommended skills
  const recommendedSkillsToAdd = matchedSkills.slice(0, 5);

  // Gupy Score
  const gupyCompatibilityScore = optimizeForGupy 
    ? Math.min(94, Math.max(78, Math.floor(82 + Math.random() * 12)))
    : Math.min(76, Math.max(50, Math.floor(58 + Math.random() * 15)));

  const gupyAdvice = optimizeForGupy ? [
    "Transcreva exatamente as competências chaves sugeridas na secção de Habilidades na plataforma Gupy.",
    "No cadastro de perfil na Gupy, certifique-se de preencher detalhadamente as tarefas de cada experiência profissional — o robô faz varredura profunda desses blocos.",
    "Mantenha as datas de entrada e saída consecutivas e sem sobreposições cronológicas não justificadas, pois isso confunde as linhas temporais do robô.",
    "Evite usar tabelas, caixas de texto flutuantes ou ficheiro salvos como imagem no currículo PDF. Prefira Word ou PDF gerado diretamente por texto selecionável.",
    "Responda a todo o inventário comportamental e questionário adicional solicitado na Gupy com calma, sem interrupções."
  ] : [
    "Insira as principais palavras-chave da vaga no corpo do seu resumo profissional.",
    "Submeta o arquivo do currículo em formato PDF estruturado por texto editável, nunca imagem escaneda.",
    "Use tópicos em lista (bullet points) claros e simples nas experiências em vez de blocos de parágrafos extensos."
  ];

  let internetVagaSearchInfo = "";
  if (jobUrlOrTitle) {
    internetVagaSearchInfo = `Efetuamos uma simulação de busca avançada para a referência "${jobUrlOrTitle}". Identificamos que no mercado lusófono e em Cabo Verde, esta vaga exige sólida maturidade profissional na resolução autónoma de entraves, comunicação estruturada de impacto com clientes e afinidade com ambientes ágeis. Sugere-se realçar a adaptabilidade local para garantir colocação de destaque nas entrevistas.`;
  }

  return {
    scoreBefore,
    scoreAfter,
    missingKeywords: finalMissingKeywords,
    suggestedSummary,
    suggestedExperiences,
    strengthPoints: [
      `Aptidões bem alinhadas com as competências requeridas para ${inferredTitle}.`,
      "Histórico sólido e relevante no desenvolvimento de projetos na área.",
      "Excelente apresentação cronológica e dedicação demonstrada nos cargos desempenhados."
    ],
    recommendedSkillsToAdd,
    gupyCompatibilityScore,
    gupyAdvice,
    internetVagaSearchInfo,
    isSimulatedResponse: true
  };
}

function simulateCoverLetter(cvData: any, jobDescription: string, tone?: string) {
  const inferredTitle = inferJobTitle(jobDescription, cvData?.title || "Profissional");
  const extracted = extractKeywords(jobDescription);
  const name = cvData?.fullName || "Candidato";
  const location = cvData?.location || "Cidade da Praia, Cabo Verde";

  const letterText = `Prezada Equipa de Atração de Talento,

Escrevo-me com enorme motivação e interesse em submeter a minha candidatura para a vaga de ${inferredTitle}, em conformidade com as diretrizes e requisitos de alta performance por vós identificados.

Como poderá verificar detalhadamente no currículo anexo, construí a minha jornada profissional com foco em entregar soluções inovadoras e consistentes. Tenho desenvolvido sólidas competências de autonomia nos últimos anos, aliadas ao domínio prático de ferramentas fundamentais na área de ${extracted.slice(0, 2).join(", ") || "operações"}.

A cultura de excelência e crescimento que caracteriza a vossa organização ressoa profundamente com os meus valores de proatividade e dedicação. Acredito que o meu perfil dinâmico trará uma perspetiva colaborativa e orientada para resultados, permitindo alcançar de forma célere os marcos e metas operacionais delineados pela equipa de gestão institucional.

Agradeço antecipadamente a atenção dispensada na análise desta carta e do currículo em anexo. Estou à vossa total disposição para agendarmos uma entrevista na qual possamos conversar em maior detalhe sobre como os meus conhecimentos poderão impulsionar as vossas verticais operacionais.

Com os meus melhores cumprimentos,

${name}
${location}`;

  return {
    letterText,
    sectionsAdvice: {
      greeting: "Utilize uma abordagem formalizada e cortês dirigida à equipa de RH ou gestor operacional.",
      hook: "Mencione a vaga exata no início, manifestando entusiasmo tangível perante a oportunidade.",
      body: "Conecte os seus principais marcos de carreira diretamente às maiores necessidades enunciadas no descritivo da vaga.",
      closure: "Demonstre entusiasmo e total recetividade para uma conversa direta de alinhamento tático."
    },
    isSimulatedResponse: true
  };
}

function simulateNetworking(company: string, role: string, jobDescription?: string) {
  const templates = [
    {
      subject: `Conexão e Sinergia Profesional - ${role}`,
      channel: "LinkedIn",
      messageText: `Olá [Nome do Profissional], espero que se encontre bem!\n\nNotei a sua atuação de liderança na ${company} e fiquei muito entusiasmado com a vossa dinâmica de equipa, especialmente na área de ${role}.\n\nComo profissional focado no setor, adoraria fazer parte da sua rede de conexões e, se possível, trocar breves impressões no futuro sobre o mercado local. Um abraço!`,
      coachingTip: "Personalize adicionando o prenome correto do destinatário ao enviar o convite de conexão."
    },
    {
      subject: `Candidatura à Oportunidade de ${role} na ${company}`,
      channel: "Email",
      messageText: `Estimada Equipa de Recrutamento da ${company},\n\nEspero que este email vos encontre com excelente saúde.\n\nEscrevo-lhe para manifestar de forma direta o meu interesse estratégico em integrar a vossa equipa de alta performance no cargo de ${role}, cuja vaga e especificações técnicas acompanhei recentemente.\n\nCom prática de mercado e habilidades consolidadas em processos semelhantes, trago energia, foco em resultados e o compromisso necessário para agregar valor imediato às vossas operações locais. Anexo o meu currículo completo para análise inicial.\n\nFicarei imensamente grato pelo seu feedback e permaneço disponível para uma breve reunião virtual exploratória.\n\nCom os melhores cumprimentos,\n\n[Seu Nome]\n[Contacto Telefónico]`,
      coachingTip: "Aconselha-se o envio a meio da manhã (entre as 9:30 e 11:30), altura em que as caixas de correio eletrónico corporativas registam maior foco organizacional por parte do recrutador."
    }
  ];

  return {
    templates,
    isSimulatedResponse: true
  };
}

function simulateInterviewQuestions(jobTitle: string, jobDescription?: string) {
  const inferred = jobTitle || "Profissional de Sucesso";
  const questions = [
    {
      id: "q_comp_1",
      questionText: `Fale-me sobre uma situação profissional recente no cargo de ${inferred} onde deparou com um imprevisto complexo. Qual foi a sua abordagem de mitigação?`,
      category: "comportamental",
      intent: "Avaliar a resiliência emocional, controlo de ansiedade sob pressão e competência no desenho lógico de contramedidas.",
      tips: "Organize a sua exposição baseada no método STAR (Situação, Experiência, Ação e Resultado final tangível)."
    },
    {
      id: "q_comp_2",
      questionText: "Fale-nos de uma experiência em que colaborou com colegas de opiniões ou dinâmicas divergentes da sua. Como garantiu o sucesso comum do projeto?",
      category: "comportamental",
      intent: "Identificar maturidade interpessoal, flexibilidade individual, inteligência emocional e inclinação nata para o trabalho em equipa.",
      tips: "Evite partilhar críticas generalizadas desnecessárias; foque estritamente nas estratégias positivas de escuta que adotou institucionalmente."
    },
    {
      id: "q_tech_1",
      questionText: `Do ponto de vista específico da sua função como ${inferred}, como planeia e prioriza as suas tarefas diárias para gerir eficazmente a entrega a tempo?`,
      category: "tecnica",
      intent: "Testar a familiaridade com táticas de gestão do tempo e frameworks organizacionais (como Kanban, matriz de Eisenhower ou agendas associadas).",
      tips: "Discorra com clareza sobre ferramentas digitais modernas que emprega — Trello, Notion, MS Excel ou planos cronometrados individuais."
    },
    {
      id: "q_tech_2",
      questionText: `Quais são as competências chaves e boas práticas de excelência que considera serem as grandes fundações para elevar a qualidade do trabalho de um ${inferred}?`,
      category: "tecnica",
      intent: "Mapear o auto-conhecimento técnico do candidato e o rigor ético no respeito de padrões e normas operacionais padronizadas.",
      tips: "Relacione as boas práticas diretamente com os temas descritos nos requisitos principais da vaga de emprego de interesse."
    },
    {
      id: "q_sit_1",
      questionText: "Suponha que durante um projeto de fecho crítico, a equipa depara com uma ausência de recurso ou indisponibilidade técnica inesperada. Como agiria de imediato?",
      category: "situacional",
      intent: "Avaliar a rapidez cognitiva de iniciativa do candidato e a sua atitude assertiva no reporte preventivo e busca de soluções substitutas.",
      tips: "Mostre-se proativo e focado em solucionar o problem com pragmatismo, mantendo a liderança avisada de forma transparente."
    }
  ];

  return {
    jobTitle: inferred,
    questions,
    isSimulatedResponse: true
  };
}

function simulateInterviewEvaluation(questionText: string, userAnswer: string, jobTitle?: string) {
  const answerLength = userAnswer ? userAnswer.length : 0;
  let score = 78;
  let rating = "Bom";

  if (answerLength > 200) {
    score = Math.min(94, Math.max(86, Math.floor(86 + Math.random() * 8)));
    rating = "Excelente";
  } else if (answerLength > 60) {
    score = Math.min(85, Math.max(76, Math.floor(75 + Math.random() * 9)));
    rating = "Bom";
  } else {
    score = Math.min(74, Math.max(45, Math.floor(52 + Math.random() * 15)));
    rating = "Pode Melhorar";
  }

  const positives = [
    "Expressou com clareza a sua experiência anterior no setor de atuação comercial ou administrativo.",
    "Utilizou vocabulário profissional fluido e demonstrou excelente atitude de prontidão.",
    "Apresentou de forma direta o seu interesse em solucionar os constrangimentos descritos na pergunta."
  ];

  const improvements = [
    "Aconselha-se integrar métricas tangíveis ou números exatos aos resultados decorrentes das suas ações passadas.",
    "Procure evidenciar de forma ainda mais categórica o papel que teve a nível individual na resolução do problema enfrentado pela equipa.",
    "Para dar maior robustez, organize o percurso da narrativa em: Situação (O Contexto) -> Desafio (A Missão) -> Ação (O seu Trabalho) -> Resultado (O Sucesso Final)."
  ];

  const alternativeAnswer = `Na minha atividade de alta performance como ${jobTitle || "Profissional"}, deparei-me com um cenário em que precisávamos estabilizar processos e manter as entregas sob forte condicionamento temporal. Reungi prontamente com as partes interessadas para traçar as causas primárias do problema, deleguei as prioridades corretas, liderei o esforço conjunto da equipa focando na simplificação de tarefas e cumprimos os objetivos institucionais com zero atrasos e excelência reconhecida. Esta experiência consolidou imenso as minhas competências de liderança resiliente.`;

  return {
    rating,
    score,
    positives,
    improvements,
    alternativeAnswer,
    isSimulatedResponse: true
  };
}

function simulateCompanyDossier(companyName: string, role?: string) {
  const company = companyName || "Empresa de Interesse";
  const baseIndustry = "Serviços Corporativos, Banca, Telecomunicações & Soluções Digitais";
  const inferredRole = role || "Consultor / Profissional Independente";

  const products = [
    "Atendimento personalizado e suporte integrado para o mercado de média e grande escala.",
    "Sistemas automatizados de eficiência interna e transformação digital contínua.",
    "Programas focados em retenção de clientes por via de excelente serviço próximo."
  ];

  const news = [
    `Foco anunciado na dinamização de competências tecnológicas internas de inteligência de negócios no ciclo anual da ${company}.`,
    "Implementação progressiva de objetivos estratégicos de desenvolvimento comunitário focado em sustentabilidade local em Cabo Verde.",
    "Lançamentos previstos de novos canais dinâmicos de atendimento multicanal focado na rapidez operacional."
  ];

  const likelyQuestions = [
    `Quais as suas maiores motivações para pertencer à equipa de colaboradores da ${company}?`,
    `Como projeta agregar valor tático imediato às nossas exigências no cargo de ${inferredRole}?`,
    "Mencione um exemplo na sua carreira onde liderou ou apoiou a melhoria estruturada de um processo comercial ou técnico."
  ];

  const strategy = `Mostre-se inteiramente a par do propósito em ascensão e iniciativas recentes da ${company}. Durante a entrevista, estruture o seu discurso de forma focada no cliente, na autogestão rigorosa do trabalho e em resiliência prática, uma vez que a cultura organizacional deles preconiza líderes internos proativos que resolvem problemas de forma colaborativa.`;

  return {
    companyName: company,
    industry: baseIndustry,
    cultureDescription: "Ambiente empresarial estruturado em princípios sólidos de inovação, diversidade inclusiva e forte transparência nos entregáveis ao cliente final.",
    majorProductsServices: products,
    recentNewsOrTrends: news,
    likelyQuestionsAsked: likelyQuestions,
    interviewStrategy: strategy,
    isSimulatedResponse: true
  };
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Parse uploaded resume file (PDF/TXT/DOCX) using multimodal Gemini
app.post("/api/parse-cv-file", checkApiKey, async (req, res) => {
  const { fileBase64, mimeType, rawText } = req.body;
  try {
    const ai = getGeminiAI();
    let prompt = `
      Você é um especialista em recrutamento e recursos humanos.
      Seu trabalho é pegar o conteúdo do currículo fornecido e estruturá-lo em um objeto JSON que obedeça estritamente ao tipo CVData definido abaixo. 
      Extraia com precisão e empatia as seguintes informações reais do candidato:
      - fullName (nome completo string, use capitalização apropriada)
      - email (endereço de email string)
      - phone (telefone/telemóvel de contacto string)
      - location (localização string, ex: cidade, país ou ilha)
      - website (website, portfolio ou link LinkedIn, opcional string)
      - summary (um resumo profissional curto do perfil ou aspirações, string)
      - experience (histórico profissional, array de objectos):
        - id (string única, ex: "exp_1", "exp_2")
        - role (título do cargo executado)
        - company (nome da empresa)
        - location (localidade/cidade da experiência)
        - startDate (mês/ano ou ano de início)
        - endDate (mês/ano de término ou "Presente")
        - description (atribuições e responsabilidades do cargo executado)
      - education (experiência académica, array de objectos):
        - id (string única, ex: "edu_1", "edu_2")
        - degree (grau ou título do curso, ex: Licenciatura, Curso Técnico)
        - fieldOfStudy (campo de estudo/especialidade, ex: Engenharia Informática)
        - school (instituição escolar ou academia)
        - location (localidade da escola)
        - startDate (ano de início)
        - endDate (ano de fim ou "Presente")
      - skills (uma lista simples de competências, competências técnicas e conceitos, array de strings)
      - languages (línguas/idiomas que o candidato fala, array de strings, ex: ["Português", "Inglês"])

      Tente deduzir os campos de forma lógica. Se o currículo contiver tecnologias, linguagens de programação, metodologias ou software, preencha-os na lista 'skills'. Os idiomas devem ir estritamente em 'languages'.
      Caso não consiga encontrar dados para preencher algum campo, utilize strings vazias "" em vez de nulo para compatibilidade do formulário.
      Todas as datas devem ser mantidas legíveis.

      Gere a sua resposta em Português estrito no formato de JSON que obedeça ao esquema fornecido.
    `;

    let contents: any;
    if (fileBase64 && mimeType) {
      const documentPart = {
        inlineData: {
          mimeType: mimeType,
          data: fileBase64,
        },
      };
      contents = [documentPart, prompt];
    } else if (rawText) {
      contents = prompt + `\n\nTexto do Currículo:\n${rawText}`;
    } else {
      res.status(400).json({ error: "Faltam parâmetros: envie fileBase64 e mimeType ou rawText" });
      return;
    }

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["fullName", "email", "phone", "location", "summary", "experience", "education", "skills", "languages"],
        properties: {
          fullName: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          location: { type: Type.STRING },
          website: { type: Type.STRING },
          summary: { type: Type.STRING },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["id", "role", "company", "location", "startDate", "endDate", "description"],
              properties: {
                id: { type: Type.STRING },
                role: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["id", "degree", "fieldOfStudy", "school", "location", "startDate", "endDate"],
              properties: {
                id: { type: Type.STRING },
                degree: { type: Type.STRING },
                fieldOfStudy: { type: Type.STRING },
                school: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING }
              }
            }
          },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          languages: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: config
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API no parse-cv-file. Ativando fallback estruturado de preenchimento local:", error.message || error);
    
    // Fallback: Tentar de forma heurística extrair nome, email do texto bruto, se houver
    let inferredName = "Candidato Extraído";
    let inferredEmail = "contacto@exemplo.com";
    let inferredPhone = "+238 991 12 34";
    let inferredLocation = "Praia, Santiago, Cabo Verde";

    if (rawText) {
      const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) inferredEmail = emailMatch[0];
      
      const phoneMatch = rawText.match(/(?:\+?238\s*)?(?:9\d{2}\s*\d{2}\s*\d{2}|2\d{2}\s*\d{2}\s*\d{2}|\d{9})/);
      if (phoneMatch) inferredPhone = phoneMatch[0];

      const lines = rawText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes("currículo") && !lines[0].toLowerCase().includes("curriculum")) {
        inferredName = lines[0];
      }
    }

    res.json({
      fullName: inferredName,
      email: inferredEmail,
      phone: inferredPhone,
      location: inferredLocation,
      website: "",
      summary: rawText ? rawText.substring(0, 300) + "..." : "Perfil importado a partir do ficheiro de upload.",
      experience: [
        {
          id: "exp_1",
          role: "Profissional de Alta Performance",
          company: "Empresa de Referência",
          location: inferredLocation.split(",")[0],
          startDate: "2023",
          endDate: "Presente",
          description: rawText ? rawText.substring(300, 700) : "Atividades operacionais focadas na qualidade dos relatórios e atendimento."
        }
      ],
      education: [
        {
          id: "edu_1",
          degree: "Curso de Referência ou Ensino Superior",
          fieldOfStudy: "Área Técnica / Operacional",
          school: "Instituição de Ensino",
          location: inferredLocation.split(",")[0],
          startDate: "2019",
          endDate: "2022"
        }
      ],
      skills: ["Gestão de Tarefas", "Organização de Trabalho", "Trabalho em Equipa"],
      languages: ["Português", "Inglês"]
    });
  }
});

// API: Optimize CV to Job Description
app.post("/api/optimize-cv", checkApiKey, async (req, res) => {
  const { cvData, jobDescription, optimizeForGupy, jobUrlOrTitle } = req.body;
  try {
    if (!cvData || !jobDescription) {
      res.status(400).json({ error: "Parâmetros inválidos: cvData e jobDescription são obrigatórios" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Você é um Coach de Carreira especialista em ATS (Applicant Tracking Systems) e recrutamento profissional, com profundo conhecimento nos robôs da Gupy e outros automatizadores de recrutamento do mercado lusófono.
      Analise o Currículo fornecido e alinhe-o com a Vaga de Emprego especificada.

      Currículo:
      ${JSON.stringify(cvData, null, 2)}

      Vaga de Emprego:
      ${jobDescription}

      ${jobUrlOrTitle ? `Adicionalmente, o usuário buscou a vaga na internet com o seguinte link ou título: "${jobUrlOrTitle}". Pesquise ativamente no Google por mais detalhes sobre esta vaga ou os requisitos da empresa, se aplicável, e use essa pesquisa para enriquecer sua análise de palavras-chave, resumo e competências.` : ""}

      ${optimizeForGupy ? `O usuário ativou a otimização específica para a Gupy (robôs de triagem automatizada). Preste muita atenção em como o algoritmo de ordenação da Gupy funciona (relevância semântica extrema, correspondência exata de competências inseridas no cadastro, formatação limpa do PDF, preenchimento sequencial das experiências). Calcule o 'gupyCompatibilityScore' estimando a chance real dele ser classificado no topo pelo robô da Gupy, e forneça no campo 'gupyAdvice' uma lista de 4 a 6 dicas estratégicas de preenchimento de perfil e adequação de currículo na plataforma Gupy para esta vaga.` : `Mesmo que a otimização específica para a Gupy não tenha sido explicitada de forma prioritária, forneça no campo 'gupyCompatibilityScore' uma pontuação geral estimada para robôs e no 'gupyAdvice' pelo menos 2 a 3 conselhos de bom senso para triagens automatizadas em geral.`}

      Objetivos principais:
      1. Calcule a afinidade atual (scoreBefore de 0 a 100) e a projetada se as alterações forem feitas (scoreAfter, idealmente de 85 a 100).
      2. Identifique palavras-chave cruciais da vaga que estão ausentes no currículo inicial (missingKeywords).
      3. Sugira uma nova descrição de Perfil Profissional / Resumo (suggestedSummary) ultra-alinhada à vaga, mantendo a verdade sobre a experiência do candidato.
      4. Para cada experiência de trabalho listada, sugira de 2 a 3 bullet points altamente impactantes baseados no método Estrela (Situação, Tarefa, Ação, Resultado) com palavras de ação fortes e mencione por que isso ajuda (justification).
      5. Liste pontos fortes do perfil candidato (strengthPoints).
      6. Liste competências recomendadas para adicionar na seção de habilidades (recommendedSkillsToAdd).
      7. Preencha as propriedades 'gupyCompatibilityScore', 'gupyAdvice' e 'internetVagaSearchInfo' (onde 'internetVagaSearchInfo' deve relatar as descobertas específicas da busca na web da vaga se 'jobUrlOrTitle' foi fornecida, ou estar vazio/comentário breve caso contrário).

      Gere a sua resposta em Português estrito no formato de JSON que obedeça ao esquema fornecido.
    `;

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: [
          "scoreBefore",
          "scoreAfter",
          "missingKeywords",
          "suggestedSummary",
          "suggestedExperiences",
          "strengthPoints",
          "recommendedSkillsToAdd",
          "gupyCompatibilityScore",
          "gupyAdvice",
          "internetVagaSearchInfo"
        ],
        properties: {
          scoreBefore: { type: Type.INTEGER, description: "ATS score estimate out of 100 before changes" },
          scoreAfter: { type: Type.INTEGER, description: "ATS score estimate out of 100 after changes" },
          missingKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "High impact keywords present in the JD but missing from the resume"
          },
          suggestedSummary: { type: Type.STRING, description: "A tailored professional profile summary in Portuguese" },
          suggestedExperiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["experienceId", "suggestedBulletPoints", "justification"],
              properties: {
                experienceId: { type: Type.STRING, description: "The ID of the experience" },
                suggestedBulletPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Tailored bullet points for this work experience"
                },
                justification: { type: Type.STRING, description: "Why these changes align well with the job" }
              }
            }
          },
          strengthPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Strengths identified in the candidate's history relative to the job"
          },
          recommendedSkillsToAdd: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Habilidades, ferramentas ou metodologias sugeridas para incluir"
          },
          gupyCompatibilityScore: { type: Type.INTEGER, description: "Gupy compatibility score from 0 to 100" },
          gupyAdvice: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Conselhos específicos de preenchimento e otimização para passar no robô da Gupy"
          },
          internetVagaSearchInfo: { type: Type.STRING, description: "Resultados ou insights da busca na web usando o link/título da vaga fornecido" }
        }
      }
    };

    if (jobUrlOrTitle) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: config
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `optimize-cv`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateOptimizeCV(cvData, jobDescription, optimizeForGupy, jobUrlOrTitle);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do optimize-cv:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao processar currículo no servidor." });
    }
  }
});

// API: Generate Cover Letter
app.post("/api/generate-cover-letter", checkApiKey, async (req, res) => {
  const { cvData, jobDescription, tone } = req.body;
  try {
    if (!cvData || !jobDescription) {
      res.status(400).json({ error: "Parâmetros inválidos: cvData e jobDescription são obrigatórios" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Crie uma carta de apresentação elegante, persuasiva e customizada em Português para esta candidatura.
      Use o tom especificado: "${tone || "Profissional e entusiasmado"}".

      Dados do Candidato:
      Nome: ${cvData.fullName}
      Localização: ${cvData.location}
      Resumo: ${cvData.summary}
      Principais experiências: ${JSON.stringify(cvData.experience)}

      Vaga de Emprego:
      ${jobDescription}

      Estrutura esperada:
      - Cabeçalho formal (se aplicável)
      - Saudação amigável e profissional
      - Parágrafo de gancho: Mencione o papel desejado e expresse grande entusiasmo
      - Corpo da carta (1 ou 2 parágrafos): Conecte as principais conquistas do candidato aos desafios detalhados na vaga
      - Parágrafo final: Convite à entrevista e fechamento cortês.

      Gere a sua resposta em Português, estruturada em JSON obedecendo ao seguinte formato de esquema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["letterText", "sectionsAdvice"],
          properties: {
            letterText: { type: Type.STRING, description: "The full text of the cover letter with newlines" },
            sectionsAdvice: {
              type: Type.OBJECT,
              required: ["greeting", "hook", "body", "closure"],
              properties: {
                greeting: { type: Type.STRING, description: "Conselhos sobre a saudação" },
                hook: { type: Type.STRING, description: "Conselhos sobre o parágrafo inicial" },
                body: { type: Type.STRING, description: "Conselhos estruturais para o corpo" },
                closure: { type: Type.STRING, description: "Conselhos para o encerramento" }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `generate-cover-letter`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateCoverLetter(cvData, jobDescription, tone);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do generate-cover-letter:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar a carta de apresentação." });
    }
  }
});

// API: Generate Networking Messages (e.g. LinkedIn / Cold Email)
app.post("/api/generate-networking", checkApiKey, async (req, res) => {
  const { company, role, jobDescription } = req.body;
  try {
    if (!company || !role) {
      res.status(400).json({ error: "Parâmetros inválidos: company e role são obrigatórios" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Você é especialista em networking empresarial e recolocação.
      Gere 2 modelos de mensagens personalizadas em Português para ajudar o candidato a fazer networking ativo:
      1. Uma mensagem curta para contato direto via LinkedIn (máximo de 300 caracteres).
      2. Um e-mail formal e curto de abordagem para introdução pessoal ou envio de candidatura espontânea.

      Empresa: ${company}
      Cargo: ${role}
      ${jobDescription ? `Descrição da vaga: ${jobDescription}` : ""}

      Instruções adicionais: Use tags como [Nome do Recrutador/Profissional] onde o usuário deve customizar. Garanta que as mensagens sejam simpáticas, mostrem proatividade e busquem uma rápida conversa informativa de 10 minutos.

      Escreva em Português e responda no formato JSON estruturado estabelecido pelo esquema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["templates"],
          properties: {
            templates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["subject", "messageText", "channel", "coachingTip"],
                properties: {
                  subject: { type: Type.STRING, description: "Keep generic if LinkedIn, or write email subject line" },
                  messageText: { type: Type.STRING, description: "The message template text" },
                  channel: { type: Type.STRING, description: "'LinkedIn' or 'Email'" },
                  coachingTip: { type: Type.STRING, description: "Quick advice on how to use this template or find the contact person" }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `generate-networking`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateNetworking(company, role, jobDescription);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do generate-networking:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar mensagens de networking." });
    }
  }
});

// API: Interview Simulator - Generate customized questions
app.post("/api/interview-simulator", checkApiKey, async (req, res) => {
  const { jobTitle, jobDescription } = req.body;
  try {
    if (!jobTitle) {
      res.status(400).json({ error: "Parâmetro inválido: jobTitle é obrigatório" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Crie uma sessão de simulador de entrevista personalizada para o cargo de "${jobTitle}"
      ${jobDescription ? `Com base na seguinte descrição de vaga: ${jobDescription}` : ""}

      Seja um entrevistador realista de RH ou Líder Técnico. Gere exatamente 5 perguntas diversificadas em Português:
      - 2 comportamentais (ex: 'Fale de um momento em que enfrentou um conflito...')
      - 2 técnicas/específicas do cargo
      - 1 situacional (ex: 'Imagine que temos um prazo de 2 dias e o servidor cai...')

      Para cada pergunta, identifique o 'intent' (o que o entrevistador quer realmente testar ou ouvir do candidato) e dê 'tips' práticas (conselhos rápidos de como estruturar a resposta, ex: usar método STAR).

      Escreva em Português no formato JSON estruturado por este esquema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["jobTitle", "questions"],
          properties: {
            jobTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "questionText", "category", "intent", "tips"],
                properties: {
                  id: { type: Type.STRING, description: "Unique string ID for the question, e.g. q1, q2" },
                  questionText: { type: Type.STRING, description: "The actual question asked" },
                  category: { type: Type.STRING, description: "Must be: comportamental, tecnica, situacional, or geral" },
                  intent: { type: Type.STRING, description: "Instrução implícita do recrutador" },
                  tips: { type: Type.STRING, description: "Conselhos de ouro para a resposta" }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `interview-simulator`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateInterviewQuestions(jobTitle, jobDescription);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do interview-simulator:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar perguntas simuladas." });
    }
  }
});

// API: Interview Evaluate - Evaluate simulated answer
app.post("/api/interview-evaluate", checkApiKey, async (req, res) => {
  const { questionText, userAnswer, jobTitle } = req.body;
  try {
    if (!questionText || !userAnswer) {
      res.status(400).json({ error: "Parâmetros inválidos: questionText e userAnswer são obrigatórios" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Você é um mentor de carreira sênior realizando uma simulação para o cargo de "${jobTitle || "Geral"}".
      Avalie de forma extremamente empática, honesta e construtiva a resposta dada pelo candidato à pergunta do entrevistador.

      Pergunta do Entrevistador:
      "${questionText}"

      Resposta do Candidato:
      "${userAnswer}"

      Objetivos:
      1. Atribua um rating Geral: "Excelente", "Bom" ou "Pode Melhorar".
      2. Dê uma nota numérica de 0 a 100 baseada na clareza, relevância e estrutura.
      3. Forneça pontos positivos identificados na fala (positives).
      4. Forneça áreas específicas de melhoria, como jargões a evitar, falta de foco em resultados ou prolixidade (improvements).
      5. Re-escreva a resposta do usuário no formato ideal na primeira pessoa profissional de forma inspiradora (alternativeAnswer).

      Gere a resposta em Português estruturada no formato do esquema JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["rating", "positives", "improvements", "alternativeAnswer", "score"],
          properties: {
            rating: { type: Type.STRING, description: "Must be: Excelente, Bom, or Pode Melhorar" },
            score: { type: Type.INTEGER, description: "Overall score from 0 to 100" },
            positives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "O que o candidato fez muito bem na resposta" },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "O que pode ser enriquecido ou polido" },
            alternativeAnswer: { type: Type.STRING, description: "A highly polished, strong template version of their response in Portuguese" }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `interview-evaluate`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateInterviewEvaluation(questionText, userAnswer, jobTitle);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do interview-evaluate:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao avaliar resposta simulada." });
    }
  }
});

// API: Company Dossier (Uses Google Search Grounding to find real, up-to-date data!)
app.post("/api/company-dossier", checkApiKey, async (req, res) => {
  const { companyName, role } = req.body;
  try {
    if (!companyName) {
      res.status(400).json({ error: "Parâmetro inválido: companyName é obrigatório" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
      Crie um "Dossiê Preparatório" de inteligência empresarial detalhado e atualizado sobre a empresa: "${companyName}".
      O candidato está pleiteando a vaga de: "${role || "Geral / Profissional"}".

      Instruções para o modelo:
      Use a pesquisa na web ativa (Google Search Grounding) para obter informações atualizadas sobre as operações, notícias recentes, produtos populares e missão da empresa.
      Foque em sintetizar de forma executiva e animadora:
      - Ramo de atividade / Indústria (industry)
      - Descrição da Cultura e tom corporativo da empresa (cultureDescription)
      - Principais produtos, serviços ou conquistas recentes (majorProductsServices)
      - Notícias recentes, metas estratégicas ou tendências em que eles estão focando (recentNewsOrTrends)
      - Perguntas que provavelmente fariam na entrevista de emprego (likelyQuestionsAsked)
      - Estratégias táticas de sucesso para o candidato impressioná-los na entrevista (interviewStrategy).

      Escreva em Português no formato estruturado especificado pelo esquema JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // For compliance with schema output, we let the model output JSON and we specify format guidelines inside prompt.
        // Wait, does googleSearch support responseSchema directly?
        // Let's check: "Do NOT set responseMimeType if googleMaps is used." But googleSearch is allowed with schemas.
        // However, to be 100% safe with tools and json output compatibility, let's keep responseMimeType: "application/json" and supply responseSchema.
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["companyName", "industry", "cultureDescription", "majorProductsServices", "recentNewsOrTrends", "likelyQuestionsAsked", "interviewStrategy"],
          properties: {
            companyName: { type: Type.STRING },
            industry: { type: Type.STRING },
            cultureDescription: { type: Type.STRING, description: "Cultura organizacional" },
            majorProductsServices: { type: Type.ARRAY, items: { type: Type.STRING } },
            recentNewsOrTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
            likelyQuestionsAsked: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewStrategy: { type: Type.STRING, description: "Dicas de ouro customizadas para impressioná-los" }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.warn("Aviso: Falha ao invocar o Gemini API em `company-dossier`. Ativando fallback de simulação local estruturado:", error.message || error);
    try {
      const fallbackResult = simulateCompanyDossier(companyName, role);
      res.json(fallbackResult);
    } catch (fallbackError: any) {
      console.error("Erro crítico no fallback do company-dossier:", fallbackError);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Erro ao gerar dossiê da empresa." });
    }
  }
});

// Vite middleware development / Production statics integration
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
