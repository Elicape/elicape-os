import { X, Github, Copy, Check, Bug, Info } from 'lucide-react';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { useState } from 'react';

const APP_VERSION = '0.3.0';
const HIMNO_CORTO = `PLAN piensa, APPLY crea, SHELL ve
¡RELAX! ¡SIMPLEZA!`;

function getSystemInfo() {
  return [
    `App: ELICAPE OS v${APP_VERSION}`,
    `Platform: ${navigator.platform}`,
    `User Agent: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Screen: ${window.screen.width}x${window.screen.height}`,
    `Tauri: ${typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined ? 'yes' : 'no'}`,
  ].join('\n');
}

export function AboutDialog() {
  const { toggleAboutDialog } = useWorkspaceContext();
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(HIMNO_CORTO);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = HIMNO_CORTO;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    }
  };

  const handleCopyInfo = async () => {
    const info = getSystemInfo();
    try {
      await navigator.clipboard.writeText(info);
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = info;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">Acerca de ELICAPE OS</h2>
          <button
            onClick={toggleAboutDialog}
            className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5 text-sm text-gray-300">
          <div>
            <h3 className="text-base font-bold text-blue-400 mb-1">ELICAPE OS v{APP_VERSION} &mdash; Desktop AI Coding</h3>
            <p className="text-gray-400">Entorno de coding con agente local offline, LLM propio, sin nube.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Historia</h4>
            <p className="text-gray-400 leading-relaxed">
              Naci&oacute; como experimento en Lovable y creci&oacute; en GitHub. Pas&oacute; por una fase &laquo;Local AI Studio&raquo;
              probando de todo (GPT online, Gemini local, Antigravity). Tras un simp&aacute;tico &laquo;fallo&raquo; de sincronizaci&oacute;n
              donde una versi&oacute;n se nos hizo invisible a s&iacute; misma, decidimos hacerlo a prueba de sustos:
              motor local, FS aislado y con bot&oacute;n de Approve. De ah&iacute; sali&oacute; nuestro himno interno de laboratorio.
              Nada personal, es folklore dev.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Stack</h4>
            <p className="text-gray-400">Tauri + Rust + TypeScript + llama.cpp + Qwen3-Coder-3B</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Himno de laboratorio</h4>
            <blockquote className="border-l-4 border-blue-500 pl-3 py-1 my-2 text-sm text-blue-300 italic font-mono">
              {HIMNO_CORTO.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            </blockquote>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyLyrics}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300 border border-gray-700"
              >
                {copiedLyrics ? (
                  <><Check className="w-4 h-4 text-green-400" /> Copiado</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar himno</>
                )}
              </button>
              <a
                href="https://aimusicgen.ai/share/5c96d7a9-4fa6-49b6-b128-590f2f1597f1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-blue-400 border border-gray-700"
              >
                Escuchar himno
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Cr&eacute;ditos / Agradecimientos</h4>
            <ul className="space-y-1 text-gray-400 list-disc list-inside">
              <li><span className="text-gray-200">Concepto, Direcci&oacute;n y Acabado Final:</span> Elicape</li>
              <li><span className="text-gray-200">Base inicial y boilerplate:</span> Lovable.dev</li>
              <li><span className="text-gray-200">Motor:</span> llama.cpp por Georgi Gerganov y comunidad</li>
              <li><span className="text-gray-200">Modelo:</span> Qwen3-Coder-3B por Qwen Team / Alibaba Cloud, distribuido v&iacute;a Hugging Face</li>
              <li><span className="text-gray-200">Stack:</span> Tauri, Rust, Vite, TypeScript</li>
              <li><span className="text-gray-200">Inspiraci&oacute;n y pruebas previas:</span> OpenAI, Google, Antigravity</li>
              <li><span className="text-gray-200">Asistencia t&eacute;cnica:</span> Meta AI (Sargento Meta)</li>
              <li><span className="text-gray-200">Y a todo el open source</span> que usamos.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Licencia</h4>
            <p className="text-gray-400">MIT &mdash; ver archivo <code className="text-blue-400">LICENSE</code> en la ra&iacute;z del proyecto.</p>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Build: llama-server v9780 + Qwen3-Coder-3.4B Q8_0 — Ver README -> Build: v0.3.0 - llama-server v9780 + Qwen3-Coder-3.4B Q8_0 &mdash;
            Ver <a href="https://github.com/Elicape/elicape-os" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">README</a> para flags y compatibilidad
          </p>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-700">
            <a
              href="https://github.com/Elicape/elicape-os"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-blue-400 border border-gray-700"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://github.com/Elicape/elicape-os/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-blue-400 border border-gray-700"
            >
              <Bug className="w-4 h-4" />
              Reportar Bug
            </a>
            <button
              onClick={handleCopyInfo}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300 border border-gray-700"
            >
              {copiedInfo ? (
                <><Check className="w-4 h-4 text-green-400" /> Copiado</>
              ) : (
                <><Info className="w-4 h-4" /> Copiar info sistema</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
