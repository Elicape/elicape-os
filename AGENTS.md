# AGENTS.md — ELICAPE OS v0.4 (Kernel Abierto)

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

## Architecture — v0.4 Kernel Abierto

### Orden de arranque

```
AppImage → App.tsx (AppShell)
  → integrity.ts (lee [boot.order] de graph.toml)
    → check_llm_health (GET /health)
    → check_active_repo (existe .elicape/active.repo?)
    → check_fs_write (/tmp/elicape_test)
    → check_models_exist (.elicape/server.ini?)
    → load_ui (todo ok?)
  → Hud.tsx (si allOk → 4 botones, si fail → rojo + solucion)
  → RepoPicker.tsx (primera vez: seleccionar carpeta)
  → ConfigGraph.tsx (opcional: editor de nodos)
  → Workspace.tsx (la app real)
```

### Archivos fundacionales (v0.4 — NUEVOS)

| Archivo | Propósito |
|---------|-----------|
| `.elicape/graph.toml` | **Grafo maestro** — modelos, skills, personas, boot order, rutas. TODO editable. |
| `.elicape/bridges/router.toml` | **Reglas de conexión** — condiciones `msg_contains` → `{model, persona, skill}` |
| `.elicape/compatibility.toml` | **Guardián de flags** — incompatibilidades entre flags de llama-server |
| `config/sys/constitution.txt` | **Departamento legal** — reglas fijas que el LLM debe obedecer |
| `.elicape/tareas.master.json` | **Plan maestro** — 22 tareas con dependencias, estados, orden de ejecución |

### Grafo editable (graph.toml)

`src/lib/GraphLoader.ts` parsea graph.toml y exporta:
- `loadGraph()` → `GraphConfig` (models, skills, personas)
- `runRouter(userMsg)` → evalúa reglas de `bridges/router.toml` →
- `getModelNode()`, `getSkillNode()`, `getPersonaNode()`
- `getBootChecks()` → devuelve checks para integrity.ts
- `saveGraphUpdate()` → escribe cambios al TOML

### Config Watcher (Rust)

`src-tauri/src/config_watcher.rs`: polling loop cada 2s que vigila:
- `.elicape/graph.toml`
- `.elicape/bridges/router.toml`
- `config/sys/constitution.txt`

Emite eventos `config_reloaded` y `config_error` a la UI.

### UI de Nodos (ConfigGraph.tsx)

Editor visual sin react-flow. 3 columnas: modelos | skills | personas.
- Nodos arrastrables con drag nativo
- Click abre editor JSON inline
- Guarda cambios a graph.toml
- Botón Recargar / Cerrar

### HUD de integridad (Hud.tsx)

Pantalla completa que se muestra al arrancar:
- **Verde**: todos los checks OK → 4 botones (Abrir Carpeta, Terminal, Config, Entrar)
- **Roja**: checks críticos fallan → muestra errores + soluciones
- Checks degradados (no críticos) permiten entrar con funciones limitadas

### Router TOML (bridges/router.toml)

6 reglas en orden de prioridad:
1. `msg_contains("screenshot", "imagen")` → vl_2b + vision
2. `msg_contains("plan", "arquitectura") + len > 200` → reason_6b + plan
3. `msg_contains("escribe", "codigo")` → coder_3b + build
4. `msg_contains("python")` → coder_3b + build + skill python
5. `msg_contains("react")` → coder_3b + build + skill react
6. `true` (fallback) → coder_3b + chat

### Context providers (src/App.tsx)
`SettingsProvider` → `WorkspaceProvider` → `LlamaServerProvider`

### Router LLM
- **1 solo proceso** `llama-server` con `--models-preset` desde graph.toml
- Rutas de binario, preset y template **desde graph.toml** (no hardcode)
- `read_toml_value()` en lib.rs extrae valores toplevel del TOML

### Capas de prompt
`config/` contiene capas concatenadas antes de enviar al LLM:
1. `config/sys/constitution.txt` — principios fijos (NUEVO)
2. `config/constitution.sys.txt` — principios fijos
3. `config/session.sys.j2` — jinja con `{{role}}`, `{{repo_path}}`, `{{model_alias}}`
4. `config/skills/react.sys.txt` — opcional, solo si keyword matchea

### LLM integration
- `src/lib/llm-client.ts`: `streamChat()` (SSE streaming) + `sendToQwen3()` (no-stream directo)
- `src/lib/GraphLoader.ts`: `runRouter()` decide modelo/persona/skill desde TOML

### File system adapter
- Auto-detecta Tauri via `window.__TAURI__`
- Tauri: `TauriFileSystemAdapter` → disco real
- Web: `WebFileSystemAdapter` → en memoria

### Agent kernel
- 5 tools registradas: `read_file`, `write_file`, `create_file`, `list_dir`, `run_command`
- Parseo dual: `<tool_call>` XML en content + `delta.tool_calls` formato OpenAI
- Loop multi-turn con aprobación humana (`ask`/`allow`/`deny`)

## Tauri specifics

- Tauri 2.11, Rust backend en `src-tauri/`
- Commands: `start_server`, `stop_server`, `run_shell_command`, `test_fs_real`, `launch_wezterm_cage`, `read_config_file`, `write_config_file`
- Nuevo modulo: `config_watcher.rs` — polling loop de archivos toml
- `ServerState` y `WeztermState` registrados con `.manage()`
- Capabilities: FS scope `$HOME/**`, shell spawn solo `bin/llama-server`
- `llama-server` arranca en `setup()` con rutas desde `graph.toml` (no hardcode)

## TypeScript quirks

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `moduleResolution: "bundler"` — usar extensiones `.tsx` en imports
- ESLint flat config, `react-refresh/only-export-components`

## Pending (v0.4)

| Tarea | Qué | Archivos clave |
|-------|-----|---------------|
| 3.3 | Fallback Noob: respuestas útiles cuando falta capacidad | `src/lib/fallback.ts` |
| 4.1 | Boot Scripts: .elicape/boot.sh ejecutado por lib.rs | `.elicape/boot.sh` |
| 4.3 | Model Manager UI: listar modelos de graph.toml | `src/components/ModelManager.tsx` |
| 4.4 | Wizard: crear repo ejemplo con 1 click | `src/components/Wizard.tsx` |

**Estado actual: 18/22 tareas DONE. Siguiente prioridad: 4.2 Wezterm Launcher (reparar paths).**

## Wezterm Launcher — estado

| Archivo | Problema (resuelto) |
|---------|---------------------|
| `src-tauri/src/wezterm.rs:15` | ~~Config hardcoded a `~/.config/wezterm/elicape.lua`~~ → `{project_root}/config/wezterm/wezterm.lua` |
| `config/wezterm/wezterm.lua:7` | ~~`kernel_path` hardcoded~~ → Lee `PROJECT_ROOT` env var o `wezterm.config_dir` |
| `config/wezterm/bashrc.elicape:206,216,218` | ~~Paths a `AI-Kernel-v0.1`~~ → `desktop-ai-coding` |

**Objetivo cumplido**: `launch_wezterm_cage` usa `config/wezterm/wezterm.lua` como `--config-file`, pasa `--rcfile` con `config/wezterm/bashrc.elicape`, y recibe `project_root` como parámetro Tauri.  
**Lanzador único**: `./elicape` (Linux, +x) y `./elicape.bat` (Windows) ejecutan `npm run tauri dev` directamente, sin wezterm. Wezterm es jaula interna de la app, no lanzador.