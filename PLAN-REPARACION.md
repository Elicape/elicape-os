# PLAN-REPARACION.md — DE v0.3 a v1.0

## ✅ Fases completadas

| Fase | Qué | Tiempo real |
|---|---|---|
| FASE 0 | Fix WeztermState crash | 5 min |
| FASE 1.1 | start_llama_server automático en setup() | 30 min |
| FASE 1.2 | sendToQwen3() + test de endpoint | 30 min |
| FASE 1.3 | Router INI corregido + 3 tests pasados | 1 h |

## 🎯 FASES PENDIENTES — ~6h para v1.0 funcional

### FASE 2.1 — Conectar useChat al router (2h)

**Objetivo:** El chat de la UI envía prompts al LLM y recibe respuestas.

```
useChat.ts → prompt-builder.ts → llama-server :8080 → respuesta en UI
```

**Archivos:**
- `src/hooks/useChat.ts`: reemplazar shell mode mock por llamada real a `sendToQwen3()`
- Crear `src/lib/prompt-builder.ts`: leer capas config/ + ensamblar mensajes
- `src/lib/prompt-context.ts`: ya existe, solo enganchar

**Criterio de éxito:** User escribe "hola" → Qwen3 responde en el chat.

### FASE 2.2 — Tool execution real (2h)

**Objetivo:** `write_file` del LLM escribe en disco real via Tauri.

```
LLM emite <tool_call>write_file → streamParser → executeTool → tauriFs.writeFile → disco
```

**Archivos:**
- `src/lib/agent-kernel/toolRegistry.ts`: verificar que `write_file` funciona con `TauriFileSystemAdapter`
- `src/lib/agent-kernel/session.ts`: que el loop multi-turno funciona con llama-server real
- `src/hooks/useAgentKernel.ts`: que executeTool() retorna resultados al LLM

**Criterio de éxito:** "crea prueba.txt" → el archivo aparece en disco.

### FASE 2.3 — Feedback en UI (1h)

**Objetivo:** El usuario ve el estado del sistema.

**Archivos:**
- `ChatPanel.tsx`: banner si `integrity.allOk === false`
- `Workspace.tsx`: indicador "IA conectada" / "IA caída"

### FASE 3 — Release (1h)

- `.AppImage` en GitHub Releases
- README con instrucciones 3 pasos
- Video demo

## Resumen deuda técnica

```
Completado: ~2h (FASE 0, 1.1, 1.2, 1.3)
Pendiente:  ~6h (2.1, 2.2, 2.3, 3)
Total:      ~8h para v1.0 funcional de verdad
```
