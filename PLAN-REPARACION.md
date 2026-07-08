# PLAN DE REPARACIÓN — ELICAPE OS v0.2.0 → v0.3.0

> De cascarón decorativo a Desktop AI que escribe archivos reales
> Orden de ejecución: crítico → funcional → cosmético

---

## FASE 0: MVP ABSOLUTO (sin IA, pero funcional)

### 0.1 — Arreglar el crash de Wezterm
**Archivo:** `src-tauri/src/lib.rs:119`
**Qué hacer:** Agregar `.manage(WeztermState(Mutex::new(None)))` después de `.manage(ServerState(...))`
**Impacto:** Elimina el panic "State not managed" — la terminal deja de crashear.
**Líneas a tocar:** 1

---

## FASE 1: QUE EL CHAT RESPONDA

### 1.1 — Decidir backend de IA
Elegir UNA de estas rutas:

| Ruta | Esfuerzo | Pros | Contras |
|---|---|---|---|
| **A) Ollama** | Mínimo | Ya hay endpoint configurable, solo apuntar a `localhost:11434/v1` | Requiere que el usuario instale Ollama |
| **B) llama-server** | Medio | Ya hay código para arrancarlo (useLlamaServer.ts, start_server) | El código de integración está en la UI pero no conectado al chat |
| **C) Modo demo sin LLM** | Mínimo | Chat responde con respuestas fijas, la app se ve funcional | No es IA real |

**Recomendación:** Ruta A + C simultánea. Que intente Ollama, y si no hay, caiga a modo demo con respuestas pregrabadas.

### 1.2 — Manejar error de conexión en el chat
**Archivo:** `useChat.ts:33-110` (shell mode) y `useChat.ts:112-218` (plan/apply)
**Qué hacer:** Detectar `fetch()` fallido y mostrar mensaje claro: *"No hay IA conectada. Instala Ollama o activa modo demo."*
**Impacto:** El usuario no se queda viendo un spinner infinito.

### 1.3 — Añadir modo "demo" con respuestas fijas
**Dónde:** `useChat.ts` o nuevo hook `useDemoChat.ts`
**Qué hace:** Cuando `endpoint` está unreachable, el chat responde con texto simulado que incluye `<tool_call>` demo que escribe un archivo real. Así se demuestra el pipeline completo sin depender de IA.

---

## FASE 2: PIPELINE LLM → TOOL → DISCO REAL

### 2.1 — Integrar llama-server con el flujo de chat
**Archivos:** `useLlamaServer.ts`, `useChat.ts`, `llm-client.ts`
**Qué hacer:** Cuando el usuario arranca el servidor desde la UI (botón Online/Offline), el endpoint del chat debe apuntar automáticamente al puerto del servidor (settings.serverPort).

### 2.2 — Probar tool calls end-to-end en Tauri real
**Qué probar:**
1. Iniciar Tauri (`npm run tauri dev`)
2. Escribir "crea un archivo HOLA.txt con el texto Hola Mundo"
3. Verificar que el LLM emite `<tool_call>` con `write_file`
4. Verificar que `TauriFileSystemAdapter.writeFile()` escribe en disco
5. Verificar que la UI muestra el resultado

### 2.3 — Arreglar el envío de gramática al LLM
**Archivo:** `llm-client.ts:30-31`
**Qué hacer:** En lugar de enviar string vacío, cargar `grammar.gbnf` desde el FS y enviarlo. Esto hace que el LLM genere JSON válido en los tool calls.

---

## FASE 3: ROBUSTEZ

### 3.1 — Arreglar `writePermissionMode === 'deny'`
**Archivo:** `useChat.ts:191-198`
**Qué hacer:** En `deny` mode, auto-denegar todas las tool calls y seguir el loop. Actualmente se queda colgado.

### 3.2 — Arreglar Session save
**Archivo:** `useChat.ts:298`
**Qué hacer:** Antes de escribir, verificar que el directorio `.chat-sessions/` existe, si no crearlo.

### 3.3 — Añadir timeout a `run_command`
**Archivo:** `useAgentKernel.ts:72`
**Qué hacer:** Pasar un timeout de 30s a `invoke('run_shell_command', ...)`. En el Rust, usar `.timeout(Duration::from_secs(30))`.

### 3.4 — Añadir indicador de "LLM pensando" entre turnos
**Archivo:** `useChat.ts` y `ChatMessage.tsx`
**Qué hacer:** Cuando el loop envía tool results y espera la siguiente respuesta del LLM, mostrar un mensaje "Procesando..." o un spinner.
