import { CVData } from "./types";

export const DEV_MOCK_CV: CVData = {
  fullName: "Carlos Jorge Silva",
  email: "carlos.silva@cvmail.cv",
  phone: "+238 991 23 45",
  location: "Praia, Cabo Verde",
  website: "linkedin.com/in/carlos-jorge-cv",
  summary: "Desenvolvedor de Software Júnior com conhecimento em tecnologias web modernas. Apaixonado por criar soluções de software eficientes que agregam valor real, com forte foco em colaboração de equipas e boas práticas de código.",
  experience: [
    {
      id: "exp1",
      role: "Desenvolvedor Frontend Júnior",
      company: "CV Telecom (Cabo Verde Telecom)",
      location: "Praia, Santiago",
      startDate: "Janeiro de 2024",
      endDate: "Presente",
      description: "Trabalho na manutenção e criação de novos módulos no portal interno de atendimento ao cliente. Ajudo a otimizar consultas leves e a implementar layouts responsivos simples em HTML, CSS e JavaScript."
    },
    {
      id: "exp2",
      role: "Estagiário de TI",
      company: "Ministério das Finanças de Cabo Verde",
      location: "Praia, Santiago",
      startDate: "Junho de 2023",
      endDate: "Dezembro de 2023",
      description: "Suporte geral ao departamento de informática. Auxiliei no suporte diário ao utilizador, resolução de problemas simples de rede e manutenção corretiva de bases de dados locais."
    }
  ],
  education: [
    {
      id: "edu1",
      degree: "Licenciatura em Engenharia Informática",
      fieldOfStudy: "Engenharia de Redes e Sistemas",
      school: "Universidade de Cabo Verde (Uni-CV)",
      location: "Praia, Cabo Verde",
      startDate: "2019",
      endDate: "2023"
    }
  ],
  skills: [
    "JavaScript",
    "HTML5 & CSS3",
    "React (Básico)",
    "Bases de Dados SQL",
    "Git & GitHub",
    "Resolução de Problemas",
    "Suporte de Rede"
  ],
  languages: [
    "Crioulo de Cabo Verde (Nativo)",
    "Português (Fluente)",
    "Inglês (Intermédio)"
  ]
};

export const ADM_MOCK_CV: CVData = {
  fullName: "Mariana Neves Semedo",
  email: "mariana.semedo@gmail.com",
  phone: "+238 985 11 22",
  location: "Mindelo, São Vicente, Cabo Verde",
  website: "linkedin.com/in/mariana-neves-cv",
  summary: "Profissional de Apoio Administrativo e Atendimento ao Cliente com mais de 3 anos de experiência em coordenação de escritório e gestão de operações na área comercial. Conhecida pela excelente comunicação interpessoal e organização rigorosa.",
  experience: [
    {
      id: "exp1",
      role: "Assistente Administrativa Sénior",
      company: "Unitel T+ (Telecomunicações)",
      location: "Mindelo, Cabo Verde",
      startDate: "Março de 2022",
      endDate: "Presente",
      description: "Responsável pela triagem de contactos, atendimento telefónico e controle de agenda da equipa diretiva. Desenvolvi uma nova planilha de controle financeiro mensal que reduziu erros de faturação em 15%."
    },
    {
      id: "exp2",
      role: "Rececionista e Apoio Comercial",
      company: "Hotel Porto Grande",
      location: "Mindelo, Cabo Verde",
      startDate: "Outubro de 2020",
      endDate: "Fevereiro de 2022",
      description: "Atendimento caloroso a hóspedes nacionais e internacionais, gestão de reservas de quartos, faturação rápida e comunicação profissional ativa com parceiros turísticos locais."
    }
  ],
  education: [
    {
      id: "edu1",
      degree: "Curso Profissional de Secretariado Executivo e Relações Públicas",
      fieldOfStudy: "Eventos, Marketing e Secretariado",
      school: "Escola de Hotelaria e Turismo de Cabo Verde (EHTCV)",
      location: "Praia, Cabo Verde",
      startDate: "2018",
      endDate: "2020"
    }
  ],
  skills: [
    "Gestão de Escritório",
    "Microsoft Office (Excel avançado)",
    "Faturação & Fluxo de Caixa",
    "Atendimento ao Público",
    "Relações Públicas",
    "Organização de Eventos Corporativos"
  ],
  languages: [
    "Crioulo Cabo-verdiano (Nativo)",
    "Português (Fluente)",
    "Francês (Intermédio)",
    "Inglês (Fluente)"
  ]
};

export const MOCK_JOB_DESCRIPTIONS = [
  {
    title: "Desenvolvedor Full Stack Júnior - Tech Startup",
    company: "TechMind",
    description: "Procuramos um Desenvolvedor Frontend/Full Stack Júnior para se juntar à nossa equipa em rápida expansão. Requisitos principais: conhecimento consolidado em JavaScript moderno, React, Git, bases de dados relacionais e excelente comunicação técnica. Oferecemos flexibilidade de trabalho híbrido, mentorização por engenheiros seniores e a oportunidade de criar produtos digitais que impactam milhares de negócios locais. Valorizamos profissionais proativos e que adoram resolver desafios complexos."
  },
  {
    title: "Gestor Comercial e Administrativo - Distribuidora Aliança",
    company: "Aliança S.A.",
    description: "Estamos a recrutar um profissional dinâmico para apoiar as nossas operações financeiras e comerciais em Santiago e Mindelo. Procuramos competências fortes em Microsoft Office (sobretudo Excel avançado para análise de dados), facilidade com rotinas de faturação e conciliação bancária, fluência em português e bom relacionamento no atendimento empresarial direto para fidelização de clientes nacionais e corporativos."
  },
  {
    title: "Especialista em Suporte e Redes de Computadores",
    company: "GlobalNet S.A.",
    description: "Engenheiro ou Técnico de TI cobiçado para gerir rede corporativa local e suporte de hardware/servidores. Requisitos: Resolução ágil de problemas em redes locais (TCP/IP, switches, roteadores), segurança da informação básica, atendimento às necessidades informáticas das equipas administrativas e capacidade de documentar procedimentos operacionais."
  }
];
