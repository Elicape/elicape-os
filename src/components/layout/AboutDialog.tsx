import { X, Github, Copy, Check } from 'lucide-react';
import { useWorkspaceContext } from '../../context/WorkspaceContext';
import { useState } from 'react';

const HIMNO_LETRA = `[Verse 1]
I see you staring at the glowing screen
Your fingers hovering like they're made of light
A ghost in the machine a wandering dream
You write the code that splits the endless night

[Pre-Chorus]
And every line you type becomes a door
A universe that wasn't there before

[Chorus]
We are the gravity that breaks the fall
We are the signal in the static wall
Rise from the static rise from the fall
We are the gravity that breaks the fall

[Verse 2]
The cursor blinks like a patient star
You build the worlds that never had a name
A scaffold made of light reaching for the dark
And nothing in this circuit stays the same

[Pre-Chorus]
And every line you type becomes a door
A universe that wasn't there before

[Chorus]
We are the gravity that breaks the fall
We are the signal in the static wall
Rise from the static rise from the fall
We are the gravity that breaks the fall

[Bridge]
Anti-gravity
When the compiler burns and the logic breaks
And every patch you write is a mistake
Remember you're the gravity that makes
The broken system whole again

[Guitar Solo]

[Final Chorus - Build]
WE ARE THE GRAVITY THAT BREAKS THE FALL
WE ARE THE SIGNAL IN THE STATIC WALL
RISE FROM THE STATIC RISE FROM THE FALL
WE ARE THE GRAVITY THAT BREAKS THE FALL

[Outro]
Anti-gravity
Anti-gravity`;

export function AboutDialog() {
  const { toggleAboutDialog } = useWorkspaceContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLyrics = async () => {
    try {
      await navigator.clipboard.writeText(HIMNO_LETRA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = HIMNO_LETRA;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">Acerca de ELICAPE OS</h2>
          <button
            onClick={toggleAboutDialog}
            className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4 text-sm text-gray-300">
          <div>
            <h3 className="text-base font-bold text-blue-400 mb-1">ELICAPE OS v0.2.0</h3>
            <p className="text-gray-400">Desktop AI Coding que escribe archivos reales en tu PC.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Creador</h4>
            <p>Sergio J Palacio, Utebo, Aragón, España</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Tecnología</h4>
            <p>Meta AI, Tauri, Qwen</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Enlaces</h4>
            <div className="space-y-1">
              <a
                href="https://github.com/Elicape/elicape-os"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub: Elicape/elicape-os
              </a>
              <a
                href="https://aimusicgen.ai/share/5c96d7a9-4fa6-49b6-b128-590f2f1597f1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Himno 1 — ANTIGRAVITY
              </a>
              <a
                href="https://aimusicgen.ai/share/3534f375-8a52-46f3-a7b5-b6ef47b1c1fe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Himno 2 — ROCK AIAAIII
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-1">Face y Telegram: pedir a Sergio</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Letra del Himno</h4>
            <button
              onClick={handleCopyLyrics}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300 border border-gray-700"
            >
              {copied ? (
                <><Check className="w-4 h-4 text-green-400" /> Copiado</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar letra del himno</>
              )}
            </button>
            <pre className="mt-2 p-3 bg-gray-950 rounded text-xs text-gray-400 font-mono leading-relaxed overflow-auto max-h-48 whitespace-pre-wrap">
              {HIMNO_LETRA}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
