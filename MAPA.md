# MAPA DEL ECOSISTEMA — ELICAPE OS v0.3

> Panorama completo del proyecto y sus alrededores.
> Todo lo que existe, dónde está y cómo se relaciona.

---

## 1. REPOSITORIO PRINCIPAL

**Ruta:** `/home/seroot/IA-APPS/drafts/desktop-ai-coding`  
**Remote:** `https://github.com/Elicape/elicape-os`  
**Branch:** `main`

### Árbol de archivos clave

```
desktop-ai-coding/
├── .elicape/                    ← Router config (v0.3)
│   ├── server.ini               ← 6 modelos Qwen3
│   └── active.repo              ← Repo activo (variable)
├── config/                      ← Capas de prompt (v0.3)
│   ├── constitution.sys.txt     ← CAPA 1: principios
│   ├── session.sys.j2           ← CAPA 2: jinja template
│   ├── skills/react.sys.txt     ← CAPA 3: skill opcional
│   └── dual_response.gbnf       ← Grammar chat mode
├── src/
│   ├── lib/
│   │   ├── llm-client.ts        ← streamChat() + sendToQwen3()
│   │   ├── integrity.ts         ← Healthcheck LLM+repo+FS (v0.3)
│   │   ├── streamParser.ts      ← Parsea <tool_call> XML
│   │   ├── prompt-context.ts    ← Contexto de archivos abiertos
│   │   ├── agent-kernel/        ← Tool registry + session + loop
│   │   │   ├── toolRegistry.ts  ← 5 tools registradas
│   │   │   ├── session.ts       ← Multi-turn state machine
│   │   │   ├── messageBuilders.ts
│   │   │   ├── configLoader.ts
│   │   │   └── types.ts
│   │   └── fs/                  ← Adaptadores de FS
│   │       ├── tauriFs.ts       ← Disco real (Tauri)
│   │       ├── webFs.ts         ← Memoria (browser)
│   │       └── memoryAdapter.ts ← Legacy, no usado
│   ├── hooks/
│   │   ├── useChat.ts           ← Loop agente (3 modos)
│   │   ├── useAgentKernel.ts    ← Ejecuta tools
│   │   ├── useFileSystem.ts     ← Carga árbol de archivos
│   │   ├── useSettings.ts       ← Settings de localStorage
│   │   └── useLlamaServer.ts    ← Control de llama-server
│   ├── context/
│   │   ├── SettingsContext.tsx
│   │   ├── WorkspaceContext.tsx
│   │   └── LlamaServerContext.tsx
│   └── components/
│       ├── layout/
│       │   ├── Workspace.tsx    ← Layout principal
│       │   ├── TopBar.tsx       ← Barra + botón server
│       │   ├── MenuBar.tsx      ← File/View/Chat/About
│       │   ├── AboutDialog.tsx  ← Info + himno
│       │   └── SystemLogs.tsx   ← Logs expandibles
│       ├── chat/
│       │   ├── ChatPanel.tsx
│       │   ├── ChatMessage.tsx  ← Tool calls con Approve/Deny
│       │   └── ChatInput.tsx
│       ├── editor/
│       ├── file-tree/
│       └── settings/
├── src-tauri/
│   └── src/
│       ├── lib.rs               ← 5 commands + start_llama_server()
│       ├── main.rs              ← entry point
│       └── wezterm.rs           ← launch_wezterm_cage (FIXED)
├── bin/
│   ├── llama-server             ← Copia (real en ~/llama.cpp/...)
│   ├── wezterm.AppImage
│   └── lib*.so                  ← GGML libs
├── grammar.gbnf                 ← Grammar para tools mode
├── system_prompt.txt            ← ⚠️ Stale (hardcode /home/sia/...)
└── qwen3-coder-template.jinja   ← ⚠️ Stale (templates reales en ~/models/)
```

---

## 2. RECURSOS EXTERNOS (no en repo)

| Recurso | Ruta | Tamaño | Propósito |
|---|---|---|---|
| **llama-server** | `~/llama.cpp/build/bin/llama-server` | 18K | Binario del router |
| **librerías GGML** | `~/llama.cpp/build/bin/lib*.so` | ~50MB | CPU inference |
| **Qwen3-coder-3.4b** | `~/models/Qwen3-coder-3.4b-20x-e32-q8_0.gguf` | 3.4G | BUILD por defecto |
| **Qwen3-Reason-6B** | `~/models/Qwen3-Code-Reasoning-Instruct-6B-Q8_0.gguf` | 5.9G | PLAN complejo |
| **Qwen3-VL-2B** | `~/models/Qwen3-VL-2B-Instruct-Q4_K_M.gguf` | 1.8G | Visión rápida |
| **Qwen3-VL-8B** | `~/models/Qwen3-VL-8B-Instruct-Q4_K_M.gguf` | 4.7G | Visión pesada |
| **Qwen3.5-4B** | `~/models/Qwen3.5-4B-Q4_K_M.gguf` | 2.6G | Chat genérico |
| **Qwen3-Reason-0.8B** | `~/models/Qwen3-Reason-V2-0.8B-NEO-F16.gguf` | 1.6G | Clasificador |
| **Gemma, Phi, Llama...** | `~/models/*.gguf` | varios | Backup |
| **Chat template Qwen3** | `~/models/chat_template-qwen3.jinja` | — | Template jinja |

---

## 3. REPOS HERMANOS (experimentos previos)

Todos en `~/IA-APPS/drafts/`. 30 repos. Los más relevantes:

| Repo | Relevancia | Qué tiene |
|---|---|---|
| `AI-Kernel-v0.1/` | 🔴 Alta | `dual_response.gbnf` (usado en config/) |
| `local-ai-studio-main/` | 🟡 Media | Template Vite anterior, `grammar.gbnf` |
| `agentico_optimizado/` | 🟡 Media | `templates/dual_response.gbnf` |
| `ANTIGRAVITY...SAN-OS/` | 🟢 Baja | Nombre, posible branding |
| `rpca-ai-chatbot-platform/` | 🟢 Baja | Otro chat con IA |
| `llm_desktop/` | 🟢 Baja | Otro intento de escritorio+LLM |

---

## 4. FLUJO DE DATOS COMPLETO

```
Usuario escribe en ChatInput
  │
  ▼
useChat.ts
  ├── Modo PLAN  → prompt → llama-server reason_6b → texto plano
  ├── Modo APPLY → prompt → llama-server coder_3b → tool_calls
  └── Modo SHELL → prompt → llama-server chat_4b → texto
  │
  ▼
prompt-builder.ts (PENDIENTE — FASE 2.1)
  ├── 1. Lee config/constitution.sys.txt (CAPA 1)
  ├── 2. Renderiza config/session.sys.j2 con {role, repo_path} (CAPA 2)
  ├── 3. Si keyword → config/skills/react.sys.txt (CAPA 3)
  └── 4. Mensaje del user (CAPA 4)
  │
  ▼
llama-server :8080
  ├── GET  /health            → integrity.ts
  ├── GET  /v1/models         → lista 6 modelos
  └── POST /v1/chat/completions
      ├── {"model":"coder_3b", "messages":[...], "grammar_file":"grammar.gbnf"}
      ├── carga modelo en RAM (--models-max 1)
      ├── descarga el anterior
      └── responde con <tool_call> o texto
  │
  ▼
streamParser.ts
  ├── <tool_call>{"name":"write_file","arguments":{...}}
  └── <think>razonamiento</think>
  │
  ▼
AgentSessionManager
  ├── trackea estado del turno
  ├── pending_approval → executing → succeeded/failed/denied
  └── loop multi-turno (ReAct)
  │
  ▼
executeTool() (useAgentKernel.ts)
  ├── read_file  → tauriFs.readFile()
  ├── write_file → tauriFs.writeFile()
  ├── create_file → tauriFs.writeFile()
  ├── list_dir    → tauriFs.readDirectory()
  └── run_command → invoke('run_shell_command')
  │
  ▼
Disco real
```

---

## 5. DEPENDENCIAS DEL SISTEMA

```
Hardware:
  CPU: AMD Ryzen 7 7730U (8 cores, 16 threads)
  RAM: 16GB + 16GB swap
  GPU: AMD Radeon Graphics (512MB VRAM) — no se usa, -ngl 0

Software:
  OS: Linux
  llama.cpp: commit b9780 (1191758c5) — compilado con Vulkan
  Tauri: 2.11
  Node/React: 18/18

Modelos:
  6 modelos Qwen3 registrados en router
  Todos en ~/models/
  Carga bajo demanda, 1 en RAM a la vez
```

---

## 6. GIT WORKFLOW

```bash
# Estado actual
git status                     # Ver archivos modificados/sin seguimiento
git log --oneline -10          # Últimos commits

# Commit estándar
git add <archivos>
git commit -m "tipo: mensaje corto"
# Tipos: feat, fix, docs, refactor, test

# Push a GitHub
git remote -v                  # Verificar remote
git push -u origin main        # Primer push
git push                       # Siguientes pushes

# Si no hay remote:
git remote add origin https://github.com/Elicape/elicape-os.git
git branch -M main
git push -u origin main
```

---

## 7. PRÓXIMOS PASOS (orden de ejecución)

```
HOY:
├── ✅ FASE 0: Wezterm fix
├── ✅ FASE 1.1: start_llama_server en setup()
├── ✅ FASE 1.2: sendToQwen3()
├── ✅ FASE 1.3: Router INI + 3 tests
├── ✅ Docs: README, AGENTS, MAPA, reports actualizados
└── 🔲 Git push (cuando tengas token válido)

MAÑANA:
├── 🔲 FASE 2.1: prompt-builder.ts + conectar useChat
├── 🔲 FASE 2.2: tool execution end-to-end
├── 🔲 FASE 2.3: Banner integridad en UI
└── 🔲 FASE 3: Release
```
