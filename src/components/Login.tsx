import React, { useState } from "react";
import { Sparkles, Mail, Lock, ChevronRight } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-[#121215] rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/5">
        {/* Top gradient line mimicking the screenshot */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="flex flex-col items-center text-center space-y-6 mt-2">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Acesso Restrito</h1>
            <p className="text-sm text-slate-400">Faça login para utilizar a inteligência do AceleraCV.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 mt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-500" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu endereço de e-mail" 
                className="w-full pl-12 pr-4 py-3.5 bg-[#1a1a20] border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha de acesso" 
                className="w-full pl-12 pr-4 py-3.5 bg-[#1a1a20] border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-pink-700 hover:from-blue-600 hover:via-indigo-600 hover:to-pink-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              Entrar no Sistema
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* New requested fields: Esqueceu a senha & Cadastro */}
            <div className="flex items-center justify-between pt-5 px-1">
              <button type="button" className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
                Esqueceu a senha?
              </button>
              <button type="button" className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400 hover:from-blue-300 hover:to-pink-300 transition-colors font-bold">
                Criar Cadastro
              </button>
            </div>
          </form>

          <div className="pt-8 w-full mt-4">
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
              Uso exclusivo para clientes autorizados.<br/>
              AceleraCV © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
