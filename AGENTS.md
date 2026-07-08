# AGENTS.md — ELICAPE OS v0.3 (Kernel de Guerra)

## Quick start

```bash
npm install
npm run tauri dev    # Build Rust + arranca UI + llama-server router
```

`cargo build` y `npm run dev` por separado. El setup de Tauri lanza `llama-server` automáticamente.

## Verification commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (sin Rust, sin LLM) |
| `npm run build` | Build to `dist/` |
| `npm run typecheck` | `tsc --noEmit -p tsconfig.app.json` |
| `npm run lint` | ESLint 9 flat config |
| `cd src-tauri && cargo build` | Solo Rust backend |

## Architecture

### Context providers (src/App.tsx)
`SettingsProvider` → `WorkspaceProvider` → `LlamaServerProvider`

### Router LLM (NUEVO — v0.3)
- **1 solo proceso** `llama-server` con `--models-preset .elicape/server.ini`
- **6 modelos Qwen3** registrados, 1 en RAM a la vez (`--models-max 1`)
- **Carga bajo demanda**: el modelo se carga via `"model"` en el JSON request
- **Swap automático**: al pedir otro modelo, el anterior se descarga de RAM
- Puerto 8080 (NO 11434 — sin Ollama)
- `-ngl 0` (CPU only, 512MB VRAM no renta)

### Capas de prompt (NUEVO — v0.3)
`config/` contiene 3 capas que se concatenan antes de enviar al LLM:
1. `constitution.sys.txt` — principios fijos
2. `session.sys.j2` — jinja con `{{role}}`, `{{repo_path}}`, `{{model_alias}}`
3. `skills/react.sys.txt` — opcional, solo si keyword matchea

### Integrity system (NUEVO — v0.3)
`src/lib/integrity.ts`: si `messages=[]` no se llama al LLM. 3 checks:
- `GET /health` → LLM vivo?
- `fs.stat(.elicape/active.repo)` → Repo definido?
- `fs.writeFile(/tmp/test)` → Permisos OK?

### LLM integration
- `src/lib/llm-client.ts`: `streamChat()` (SSE streaming) + `sendToQwen3()` (no-stream directo)
- Endpoint real: `http://127.0.0.1:8080/v1/chat/completions`
- `sendToQwen3()` se creó para pruebas rápidas (FASE 1.2)

### File system adapter
- Auto-detecta Tauri via `window.__TAURI__`
- Tauri: `TauriFileSystemAdapter` → disco real
- Web: `WebFileSystemAdapter` → en memoria

### Agent kernel (src/lib/agent-kernel/)
- 5 tools registradas: `read_file`, `write_file`, `create_file`, `list_dir`, `run_command`
- Parseo dual: `<tool_call>` XML en content + `delta.tool_calls` formato OpenAI
- Loop multi-turn con aprobación humana (`ask`/`allow`/`deny`)

## Config files en root

| File | Purpose |
|------|---------|
| `.elicape/server.ini` | Router: 6 modelos Qwen3 + defaults globales |
| `.elicape/active.repo` | Ruta del repo activo (variable, no hardcode) |
| `config/constitution.sys.txt` | CAPA 1 de prompt |
| `config/session.sys.j2` | CAPA 2 de prompt (jinja) |
| `config/skills/react.sys.txt` | CAPA 3 opcional |
| `config/dual_response.gbnf` | Grammar para chat (tool-call OR text) |
| `grammar.gbnf` | Grammar para tools (tool-call + think + cmd-call) |
| `system_prompt.txt` | ⚠️ Stale — ruta hardcode `/home/sia/...` |

## Tauri specifics

- Tauri 2.11, Rust backend en `src-tauri/`
- Commands: `start_server`, `stop_server`, `run_shell_command`, `test_fs_real`, `launch_wezterm_cage`
- **IMPORTANTE**: `WeztermState` ya está registrado con `.manage()` (FASE 0 fix)
- Capabilities: FS scope `$HOME/**`, shell spawn solo `bin/llama-server`
- `llama-server` arranca en `setup()` via `start_llama_server()` con router preset

## TypeScript quirks

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `moduleResolution: "bundler"` — usar extensiones `.tsx` en imports
- ESLint flat config, `react-refresh/only-export-components`

## Pending (FASES 2.1-2.3)

| Fase | Qué | Archivos clave |
|---|---|---|
| 2.1 | Conectar `useChat.ts` al router + `prompt-builder.ts` | `useChat.ts`, crear `prompt-builder.ts` |
| 2.2 | Tool execution: `write_file` → `fs.writeFile` + `fs.stat` | `toolRegistry.ts`, `useAgentKernel.ts` |
| 2.3 | Banner integridad en UI | `Workspace.tsx`, `ChatPanel.tsx` |
