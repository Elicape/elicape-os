# REPORTE-DIAGNOSTICO.md — ELICAPE OS v0.3

**Fecha:** 8 Julio 2026, 22:30 CET  
**Auditor:** Sargento Meta AI  

## Bugs corregidos desde v0.2.0

| Bug | Archivo | Fix | Commit |
|---|---|---|---|
| Crash Wezterm (State not managed) | `src-tauri/src/wezterm.rs:5` | `pub struct` + `.manage()` en lib.rs | FASE 0 |
| llama-server no arrancaba | `src-tauri/src/lib.rs:108-134` | Función `start_llama_server()` en setup() de Tauri | `a8d4232` |
| Sin endpoint de chat | `src/lib/llm-client.ts` | `sendToQwen3()` apunta a 127.0.0.1:8080 | `57823cb` |
| Router INI mal formado | `.elicape/server.ini` | Secciones por modelo + `[*]` global | `fd43b80` |
| `--no-models-autoload` impedía carga | `src-tauri/src/lib.rs` | Flag eliminado, modelos cargan bajo demanda | `fd43b80` |

## Bugs aún abiertos (v0.3 → v1.0)

| Bug | Archivo | Impacto |
|---|---|---|
| Chat no conectado al router | `src/hooks/useChat.ts` | La UI no envía prompts al LLM |
| Tool execution no enlazada | `useAgentKernel.ts` + `toolRegistry.ts` | write_file no llega a disco |
| `system_prompt.txt` hardcode `/home/sia/...` | `system_prompt.txt:6` | Stale, debe leerse de config/ |
| Sin banner integridad en UI | `Workspace.tsx` + `ChatPanel.tsx` | Usuario no ve si LLM/repo/FS fallan |
| Session save sin directorio | `useChat.ts:298` | `.chat-sessions/` no se crea nunca |

## Código muerto aún presente

1. `src/lib/fs/memoryAdapter.ts` — 150 líneas, nunca importado
2. `@supabase/supabase-js` en package.json — 0 imports
3. `bin/lib*.so` — librerías GGML no cargadas desde Rust (se usan desde llama-server)
4. `src/hooks/Sin título` — archivo doc en español disfrazado de hook

## Veredicto

**v0.2.0 era cascarón con himno. v0.3 es kernel con router.**
El LLM existe, los 6 modelos cargan bajo demanda, el pipeline de tool calls está escrito. 
Falta engranar 3 piezas (useChat → prompt-builder → tool execution) para que el usuario sienta que la app hace algo.
