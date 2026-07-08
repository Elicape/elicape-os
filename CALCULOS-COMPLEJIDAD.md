# CÁLCULOS DE COMPLEJIDAD — ELICAPE OS v0.2.0

> Análisis cuantitativo del código: ciclomaticidad, acoplamiento, deuda técnica
> Todas las métricas son aproximadas, calculadas por inspección estática

---

## 1. COMPLEJIDAD CICLOMÁTICA POR ARCHIVO

Mide cuántos caminos independientes tiene cada función (≥10 = complejo, ≥20 = peligroso).

| Archivo | Función | Caminos | Riesgo |
|---|---|---|---|
| `useChat.ts` | `sendMessage()` | ~18 | 🔴 Alto — maneja 3 modos, streaming, tool loop, approvals |
| `llm-client.ts` | `streamChat()` | ~12 | 🟡 Medio — SSE parsing, multi-formato tool calls, edge cases |
| `streamParser.ts` | `parseChunk()` | ~10 | 🟡 Medio — 4 estados diferentes (text/think/tool_call/error) |
| `useAgentKernel.ts` | `executeTool()` | ~8 | 🟢 Bajo — switch con 5 cases |
| `MenuBar.tsx` | render | ~7 | 🟢 Bajo — menús anidados, estados disabled |
| `Ta ifs.ts` | `getFileTree()` | ~6 | 🟢 Bajo — recursión con async |
| `useChat.ts` | `performExecution()` | ~5 | 🟢 Bajo — loop simple sobre tool calls |
| `AboutDialog.tsx` | `handleCopyLyrics()` | ~3 | 🟢 Bajo — try/catch |

**Total puntos de complejidad:** ~69 caminos distintos

---

## 2. ACOPLAMIENTO ENTRE MÓDULOS

Mide cuántos otros módulos importa cada archivo (≥5 = acoplado).

| Módulo | Importa de | Acoplamiento |
|---|---|---|
| `Workspace.tsx` | 9 módulos (TopBar, ResizablePanel, FileTree, FileViewer, ChatPanel, SettingsPanel, SystemLogs, AboutDialog, + hooks y contexts) | 🔴 Muy alto (orquestador) |
| `useChat.ts` | 8 módulos (loadKernelConfig, AgentSessionManager, streamChat, StreamParser, assembleConversation, executeTool, getFileSystemAdapter, generateId) | 🔴 Alto (contiene toda la lógica del agente) |
| `MenuBar.tsx` | 3 módulos | 🟢 Bajo |
| `AboutDialog.tsx` | 1 módulo (solo WorkspaceContext) | 🟢 Bajo (bien aislado) |
| `llm-client.ts` | 0 módulos internos | 🟢 Bajo (autocontenido) |
| `streamParser.ts` | 0 módulos internos | 🟢 Bajo (autocontenido) |
| `tauriFs.ts` | 2 plugins de Tauri | 🟢 Bajo |

**Conclusión:** `useChat.ts` es el cuello de botella. Concentra streaming, parsing, ejecución de tools, y lógica de UI. Habría que partirlo en 2-3 archivos.

---

## 3. DEUDA TÉCNICA ESTIMADA

| Categoría | Ítems | Impacto | Esfuerzo estimado |
|---|---|---|---|
| Bugs críticos | 2 (Wezterm crash, deny mode hang) | App se cuelga | 30 min |
| Bugs funcionales | 4 (session save, tool call dual, path obsoleta, timeout) | Features rotas | 2 h |
| Código muerto | ~270 líneas (memoryAdapter, Sin título, Supabase dep) | Ruido, confusión | 30 min |
| Testing | 0 tests | No hay red de seguridad | 3 h (setup + tests básicos) |
| Arquitectura | useChat.ts monolítico | Difícil de mantener | 2 h (refactor en 3 archivos) |
| Type safety | 2 usos de `any` | Posibles bugs en runtime | 10 min |

**Deuda total estimada:** ~8 horas de trabajo

---

## 4. ÁRBOL DE DEPENDENCIAS (SIMPLIFICADO)

```
App.tsx
├── SettingsProvider
│   └── useSettings (storage.ts → localStorage)
├── WorkspaceProvider
│   └── useLogger
└── LlamaServerProvider
    └── useLlamaServer (invoke → Rust: start_server/stop_server)
        └── (Rust) llama-server subprocess

Workspace.tsx
├── TopBar → MenuBar
├── FileTree → FileNode (adaptador FS)
├── FileViewer → EditorTabs + EditorToolbar (react-simple-code-editor)
├── ChatPanel
│   ├── ChatMessage (tool call cards con Approve/Deny)
│   └── ChatInput
├── SettingsPanel → SettingsForm
├── AboutDialog (autocontenido)
└── SystemLogs
    └── useWorkspaceContext

sendMessage() en useChat.ts
├── loadKernelConfig()  ← lee system_prompt.txt, grammar.gbnf
├── AgentSessionManager ← trackea el turno
├── streamChat()        ← fetch() a LLM endpoint
├── StreamParser        ← parsea <tool_call> / <think>
├── assembleConversation ← construye mensajes para la API
└── executeTool()       ← llama al adaptador FS
    ├── read_file → adapter.readFile()
    ├── write_file → adapter.writeFile()
    ├── create_file → adapter.writeFile()
    ├── list_dir → adapter.readDirectory()
    └── run_command → invoke('run_shell_command')
```

---

## 5. COMPLEJIDAD COGNITIVA (para un humano)

| Tarea | Dificultad | Por qué |
|---|---|---|
| Arreglar WeztermState | ⭐ Fácil (1 línea) | Solo falta `app.manage(...)` |
| Añadir modo demo | ⭐⭐ Media (50 líneas) | Nuevo hook, pero simple |
| Arreglar deny mode | ⭐ Fácil (5 líneas) | Falta un else-if |
| Conectar LLM real | ⭐⭐⭐ Difícil (depende del LLM) | Hay que elegir backend, configurarlo, debuggear streaming |
| Refactor useChat.ts | ⭐⭐⭐⭐ Muy difícil | Tocar el corazón de la app sin romper nada |
| Escribir tests | ⭐⭐⭐⭐ Muy difícil (no hay setup) | Elegir runner, configurar, mockear Tauri, mockear LLM |

**Tiempo estimado total para v0.3 funcional (con IA real): 16-24h**

---

## 6. MÉTRICAS DE CÓDIGO RUST

| Métrica | Valor |
|---|---|
| Líneas totales (src-tauri/) | ~280 |
| Funciones Tauri | 5 (4 en lib.rs, 1 en wezterm.rs) |
| Bugs en Rust | 1 (WeztermState no registrado) |
| Llamadas a `unsafe` | 0 ✅ |
| Clippy warnings potenciales | ~3 (unwrap(), let _ = ) |
| Tests en Rust | 0 |

---

## 7. RESUMEN EJECUTIVO

```
Deuda técnica total:    ~8 horas
Para v0.3 funcional:    ~20 horas
Líneas de código total: ~5.500
Bugs conocidos:         6
Tests:                  0
Código que sobra:       ~5% del total
```

Lo que separa a ELICAPE OS de ser real es:
1. **1 línea** en Rust (WeztermState)
2. **Un LLM corriendo** (Ollama + `ollama run qwen2.5-coder:7b`)
3. **~50 líneas** de manejo de errores en el chat para que no se quede en blanco
4. **Tests** (setup + casos básicos = ~3h)

El cascarón está. El esqueleto, también. Falta el cerebro y los reflejos.
