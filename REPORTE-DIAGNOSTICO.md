# REPORTE DE DIAGNÓSTICO — ELICAPE OS v0.2.0

> Fecha: julio 2026
> Autor: Análisis automatizado del código fuente
> Propósito: Determinar dónde el código NO cumple lo que promete

---

## 1. LO QUE PROMETE vs LO QUE HACE

### ✅ LO QUE SÍ FUNCIONA (probado)

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Ventana con chat | ✅ Funciona | Workspace.tsx renderiza ChatPanel, ChatInput captura texto |
| Editor de archivos | ✅ Funciona | FileViewer.tsx con react-simple-code-editor |
| Botón About con himno | ✅ Funciona | AboutDialog.tsx, commit e27ad2a |
| Menú hamburguesa | ✅ Funciona | MenuBar.tsx con File/View/Chat desplegables |
| Tauri escribe disco real | ✅ Funciona | test_fs_real() escribe /tmp/ELICAPE_VIVO.txt al arrancar |
| Adaptador FS Tauri | ✅ Implementado | tauriFs.ts usa @tauri-apps/plugin-fs |

### ❌ LO QUE NO FUNCIONA (promete pero falla)

| Funcionalidad | Problema | Archivo |
|---|---|---|
| Chat conecta con IA | **No hay IA conectada.** El endpoint default apunta a `localhost:11434/v1` que nadie tiene corriendo. El chat manda peticiones que fallan en silencio o dan error. | useChat.ts:33-110, llm-client.ts:9-13 |
| Botón Wezterm | **CRASHEA.** `WeztermState` nunca se registró con `.manage()` en el builder de Tauri. `launch_wezterm_cage` tira "State not managed" en runtime. | wezterm.rs:10-32, lib.rs:119 |
| `write_permission === 'deny'` | **Cuelga el chat.** Las tool calls se quedan en `pending_approval` para siempre, el usuario no puede seguir. | useChat.ts:191-198 |
| Session save | **Falla en Tauri.** No se crea el directorio `.chat-sessions/`, `writeFile` tira error. | useChat.ts:298 |
| `run_command` tool | **Sin timeout ni límite.** Un comando que nunca termina cuelga la app para siempre. | useAgentKernel.ts:72 |
| Tool calls OpenAI format | **Frágil.** Si el LLM mezcla `delta.tool_calls` (formato OpenAI) con `<tool_call>` XML en content, el comportamiento es indefinido — aparecen duplicados o se pierden. | llm-client.ts:157-161 vs streamParser.ts |
| `system_prompt.txt` | **Path hardcodeada obsoleta.** Apunta a `/home/sia/...` cuando el usuario real es `/home/seroot/...`. | system_prompt.txt:6 |
| Loading states | **No hay indicador.** Cuando el loop manda tool results de vuelta al LLM, el usuario no ve nada hasta que llega la respuesta. | useChat.ts:169-207 |

### 🔴 CÓDIGO MUERTO O BASURA

| Archivo | Problema | Líneas |
|---|---|---|
| `src/hooks/Sin título` | Archivo de documentación en español metido en hooks. No es un hook, no tiene extensión .ts. Ruido. | 106 líneas |
| `src/lib/fs/memoryAdapter.ts` | 150 líneas de código **nunca importado** en ningún lado. Legacy/demo. | 150 líneas |
| `@supabase/supabase-js` en package.json | Dependencia **nunca importada** en ningún archivo .ts o .tsx. | 1 entrada |
| `grammar.gbnf` | Definido pero **enviado como string vacío** en muchos casos. El LLM nunca recibe la gramática real. | llm-client.ts:30-31 |

---

## 2. ESTADÍSTICAS VITALES

| Métrica | Valor |
|---|---|
| Archivos TypeScript/TSX | 39 |
| Archivos Rust | 3 |
| Líneas totales (src/) | ~5.200 |
| Líneas totales (src-tauri/) | ~280 |
| Dependencias npm | ~200 (incluyendo Supabase no usado) |
| Dependencias Cargo | ~15 |
| Tool calls registradas | 5 (read_file, write_file, create_file, list_dir, run_command) |
| Bugs críticos | 2 (Wezterm crash, deny mode hang) |
| Bugs funcionales | 4 (session save, timeout, path obsoleta, tool call dual) |
| Código muerto | ~270 líneas |
| Tests | 0 |

---

## 3. ¿POR QUÉ NO EJECUTA LO QUE PROMETE?

**Razón #1: No hay LLM conectado.** El loop agente está implementado completo (stream → parsear → ejecutar tools → loop), pero nunca se probó contra un LLM real. Cuando el usuario escribe en el chat, `streamChat()` intenta conectar a `http://localhost:11434/v1/chat/completions`, que no existe. La UI muestra error o se queda cargando.

**Razón #2: El Rust backend tiene un bug de principiante.** `launch_wezterm_cage` pide `State<WeztermState>` pero nadie llamó a `app.manage(WeztermState::default())`. Esto es un error de tan solo **1 línea olvidada** que tumba toda la feature de terminal.

**Razón #3: La demo de "escribió HOLA_MUNDO.txt" se hizo con el adaptador Web (memoria), no en disco real.** La prueba documentada en TEST_RESULTS_v0.2.0.md probablemente se ejecutó con el adaptador WebFileSystemAdapter, que escribe en un diccionario en RAM. En Tauri real con TauriFileSystemAdapter, el flujo completo tool_call → FS nunca se verificó end-to-end.

**Razón #4: No hay tests.** Cero. No hay manera de saber si un cambio rompe algo.
