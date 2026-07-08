# ELICAPE OS v0.3 — Kernel de Guerra

**Desktop AI Coding con router de modelos Qwen3. Sin Ollama. Sin humo.**

## Estado actual — 8 julio 2026

| Componente | Estado |
|---|---|
| Tauri app (UI) | ✅ Arranca sin crash |
| Router llama-server | ✅ 6 modelos Qwen3, 1 en RAM, carga bajo demanda |
| `src/lib/llm-client.ts` | ✅ `streamChat()` + `sendToQwen3()` |
| `src/lib/integrity.ts` | ✅ Healthcheck (LLM, repo, FS) |
| `config/` capas prompt | ✅ Constitución + Sesión + Skills |
| `.elicape/` router config | ✅ `server.ini` con 6 modelos, `active.repo` |
| Chat conectado a IA | ❌ No enlazado aún (FASE 2.1) |
| Tool execution → disco | ❌ No conectado aún (FASE 2.2) |

## ⚡ Arranque rápido

```bash
# 1. Dependencias
npm install

# 2. Tauri dev (compila Rust + arranca UI + llama-server)
npm run tauri dev
# llama-server se inicia automáticamente en setup() con router de 6 modelos
# Escucha en http://127.0.0.1:8080

# 3. Verificar que el router vive
curl http://127.0.0.1:8080/v1/models
# → 6 modelos, status "unloaded"

# 4. Probar carga bajo demanda
curl -X POST http://127.0.0.1:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"coder_3b","messages":[{"role":"user","content":"Hola"}],"stream":false}'
# → Carga 3.4B, responde, descarga al siguiente request
```

## 📦 Router de modelos — 6 Qwen3

Definido en `.elicape/server.ini`. Todos en `~/models/`.

| Alias | Modelo | Tamaño | Uso |
|---|---|---|---|
| `coder_3b` | Qwen3-coder-3.4b Q8_0 | 3.4G | **BUILD por defecto** |
| `reason_6b` | Qwen3-Code-Reasoning-6B Q8_0 | 5.9G | PLAN complejo |
| `vl_2b` | Qwen3-VL-2B Q4_K_M | 1.8G | Visión rápida |
| `vl_8b` | Qwen3-VL-8B Q4_K_M | 4.7G | Visión pesada |
| `chat_4b` | Qwen3.5-4B Q4_K_M | 2.6G | Chat genérico |
| `micro_08b` | Qwen3-Reason-V2-0.8B | 1.6G | Clasificador/Skill-router |

**Reglas:**
- `--models-max 1`: solo 1 modelo en RAM a la vez
- Se descarga automáticamente al cambiar de modelo via `"model"` en JSON
- `-ngl 0`: CPU only (512MB VRAM no renta para ≤7B)
- Sin Ollama. Sin Qwen2.5. Zero humo.

## 🧠 Arquitectura

```
User prompt
  │
  ▼
prompt-builder.ts  ←  decide modelo + grammar por request
  │
  ├── CAPA 1: constitution.sys.txt
  ├── CAPA 2: session.sys.j2  (jinja, renderiza con {role, repo_path})
  ├── CAPA 3: skills/*.sys.txt  (solo si keyword matchea)
  └── CAPA 4: mensaje del usuario
  │
  ▼
llama-server :8080  ← router con 6 modelos
  │
  ├── coder_3b   → grammar.gbnf (tools)
  ├── reason_6b  → grammar.gbnf (tools)
  ├── vl_2b      → dual_response.gbnf (chat)
  └── ...
  │
  ▼
Tauri executeTool → fs.writeFile → disco real
```

### Capas de prompt (`config/`)

| Archivo | Capa | Propósito |
|---|---|---|
| `constitution.sys.txt` | 1 | Principios universales (fijo) |
| `session.sys.j2` | 2 | Rol + repo + modelo (jinja) |
| `skills/react.sys.txt` | 3 | Skill opcional si keyword matchea |

### Sistema de integridad (`src/lib/integrity.ts`)

Si `messages=[]` no se llama al LLM. Se ejecutan 3 checks:
1. `GET /health` → LLM vivo?
2. `fs.stat(.elicape/active.repo)` → Repo definido?
3. `fs.writeFile(/tmp/elicape_test)` → Permisos OK?

## 🔮 Lo que falta (v0.3 → v1.0)

| Fase | Qué | Archivos |
|---|---|---|
| 2.1 | Conectar `useChat.ts` al router via `prompt-builder.ts` | `useChat.ts`, `prompt-builder.ts` |
| 2.2 | Tool execution real: `write_file` → `fs.writeFile` + `fs.stat` | `toolRegistry.ts`, `useAgentKernel.ts` |
| 2.3 | Banner de integridad en UI cuando `allOk=false` | `Workspace.tsx`, `integrity.ts` |
| 3 | Release .AppImage + instrucciones 3 pasos | GitHub Releases |

## 📜 Changelog reciente

```
fd43b80 router funcional + 3 tests pasados + placeholders rellenados
acdf649 v0.3 router Qwen3 - .elicape/server.ini + integrity.ts + config capas
57823cb sendToQwen3() no-stream a puerto 8080
a8d4232 start_llama_server automático en setup de Tauri
```

---

**Creador:** Sergio J Palacio, Utebo, Aragón, España  
**Tecnología:** Tauri 2.11, llama.cpp (b9780), Qwen3, React 18  
**Repo:** https://github.com/Elicape/elicape-os  
**Himno:** https://aimusicgen.ai/share/5c96d7a9-4fa6-49b6-b128-590f2f1597f1
