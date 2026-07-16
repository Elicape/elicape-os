# ELICAPE OS — Desktop AI Coding

> PLAN piensa, APPLY crea, SHELL ve.  
> ¡RELAX! ¡SIMPLEZA!

**Doble click. Sin nube. Tu c&oacute;digo se queda en tu disco.**

---

## 1. ¿Qu&eacute; es esto?

Una aplicaci&oacute;n de escritorio que trae su propio cerebro IA local. No necesita internet para funcionar, sin coste por mensaje, y vive en tu PC. Abres la app, haces doble click, y empiezas a pedirle cosas: &laquo;lista los archivos&raquo;, &laquo;escribe un componente React&raquo;, &laquo;explica este c&oacute;digo&raquo;.

El agente entiende el contexto de tu proyecto, razona, y antes de tocar un archivo te pide permiso (Approve / Deny). Todo lo que hace pasa por tu supervisi&oacute;n. Sin sorpresas.

## 2. ¿C&oacute;mo funciona?

### Arquitectura

```
Frontend Tauri (Vite + TypeScript)
  ⇅ Tauri Commands (Rust)
Backend Rust  ⇄  sidecar llama-server (binario 168 MB incluido)
  ⇄  modelo GGUF (~1.7 GB, se descarga aparte)
```

### Flujo real

1. **System Check** — verifica que el servidor LLM responda, que el repositorio est&eacute; definido, y que el sistema de archivos sea escribible.
2. **Iniciar Servidor** — auto-spawn del `llama-server` en `:8080`, espera hasta 10 segundos por el healthcheck.
3. **PLAN MODE** — el agente recibe tu petici&oacute;n, razona, y propone acciones.
4. **Tool Execution** — `list_dir`, `read_file`, etc. con estado `PENDING_APPROVAL`.
5. **Resultado** — el agente resume lo que hizo.

### Seguridad y aislamiento

- Los archivos temporales se guardan en `~/.cache/{app_name}/.tmp`, nunca en `/tmp` del sistema.
- La configuraci&oacute;n vive en `~/.config/{app_name}`.
- `APP_NAME` est&aacute; centralizado en `src-tauri/src/constants.rs` — sin hardcodes personales.
- Todas las herramientas requieren aprobaci&oacute;n expl&iacute;cita antes de escribir en disco.
- Grammar + tools: el LLM solo puede responder en formatos controlados.

## 3. Instalaci&oacute;n

### Opci&oacute;n A: Binario (recomendado)

1. Descarga el archivo `.AppImage` (Linux) o `.exe` (Windows) desde [Releases](https://github.com/Elicape/elicape-os/releases).
2. Dale doble click.
3. Si el bot&oacute;n &laquo;Iniciar Servidor&raquo; aparece en amarillo, haz click. Espera a que se ponga verde &laquo;Sistema Listo&raquo;.
4. Click en &laquo;Entrar&raquo;. Escribe: *&laquo;lista los archivos&raquo;*.

### Opci&oacute;n B: Desde c&oacute;digo (desarrolladores)

```bash
git clone https://github.com/Elicape/elicape-os.git
cd elicape-os

# El modelo NO va en git (pesa ~1.7 GB)
mkdir -p models

# Descarga el modelo desde Hugging Face:
# https://huggingface.co/Qwen/Qwen3-Coder-3B-GGUF
# Coloca el archivo .gguf en ./models/

# El binario llama-server ya viene incluido en ./bin/llama-server (168 MB)
chmod +x ./bin/llama-server

# Dependencias
npm install

# Arrancar en modo desarrollo
npm run tauri dev
```

> El servidor se auto-spawnea al arrancar. Si no ocurre, usa el bot&oacute;n &laquo;Iniciar Servidor&raquo; en la interfaz.

## 4. Estructura del proyecto

```
├── bin/
│   └── llama-server          # Sidecar: motor de inferencia (168 MB, incluido en git)
├── models/
│   └── *.gguf                # Modelos cuantizados (ignorados por git, se bajan de HF)
├── src/
│   ├── App.tsx               # Punto de entrada de la UI
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AboutDialog.tsx    # Di&aacute;logo Acerca de / Cr&eacute;ditos
│   │   │   ├── Hud.tsx            # Pantalla de integridad al arranque
│   │   │   ├── MenuBar.tsx        # Barra de men&uacute; (Archivo, Ver, Chat)
│   │   │   ├── Workspace.tsx      # Layout principal
│   │   │   └── ...
│   │   └── ...
│   ├── context/
│   │   ├── WorkspaceContext.tsx    # Estado global del workspace
│   │   ├── SettingsContext.tsx     # Configuraci&oacute;n de usuario
│   │   └── LlamaServerContext.tsx  # Estado del servidor LLM
│   ├── lib/
│   │   ├── constants.ts           # APP_NAME y helpers
│   │   ├── integrity.ts           # System checks de arranque
│   │   ├── llm-client.ts          # Cliente de streaming para el LLM
│   │   └── ...
│   └── hooks/
│       └── ...
├── src-tauri/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       └── constants.rs           # APP_NAME centralizado (sin hardcodes)
├── config/
│   ├── sys/
│   │   └── constitution.txt       # Reglas fijas que el LLM debe obedecer
│   ├── wezterm/
│   │   ├── wezterm.lua            # Configuraci&oacute;n de terminal
│   │   └── bashrc.elicape         # Shell personalizado
│   └── ...
├── .elicape/
│   ├── graph.toml                 # Grafo maestro: modelos, skills, personas
│   ├── bridges/router.toml        # Reglas de enrutamiento de mensajes
│   └── compatibility.toml        # Flags compatibles de llama-server
├── AGENTS.md                      # Documentaci&oacute;n interna para asistentes
└── README.md                      # Este archivo
```

## 5. Stack verificado v0.3.0 (esta release)

Datos reales extra&iacute;dos del binario y configuraci&oacute;n incluidos en el repo:

| Componente | Versi&oacute;n / Detalle |
|------------|------------------------|
| **llama-server** | `v9780` (commit `1191758c5`, built with GNU 14.2.0 para Linux x86_64) |
| **libllama-common** | `0.0.9780` — 5.5 MB |
| **libllama-server-impl** | `0.0.9780` — 6.5 MB |
| **libggml-base** | `0.15.3` — 893 KB |
| **libggml-cpu** | `0.15.2` — m&uacute;ltiples microarquitecturas (Haswell, Skylake, Zen4, etc.) |
| **libggml-vulkan** | `0.15.2` — 47 MB (soporte GPU Vulkan, desactivado por defecto con `-ngl 0`) |
| **libllama** | `0.0.9780` — 3.6 MB |
| **libmtmd** | `0.0.9780` — 1.4 MB |
| **wezterm.AppImage** | Incluido en `bin/` para terminal embebido |
| **Template engine** | minijinja, `jinja=true`, sin `tojson` (fix aplicado) |
| **Modo servidor** | `--jinja --port 8080 --ctx-size 4096 --no-cache-prompt --no-mmap --no-ui --n-gpu-layers 0` |

> **Aviso:** Los flags de `llama-server` cambian entre versiones. Esta release usa los flags de la versi&oacute;n **9780**. Si actualizas `bin/llama-server`, revisa `./bin/llama-server --help` para ver los flags vigentes.

### Modelos

El modelo principal probado en esta release es:

- **Qwen3-Coder-3.4B** — `Qwen3-coder-3.4b-20x-e32-q8_0.gguf` (3.4 GB, cuantizado Q8_0)
- **Qwen3-VL-2B** — `Qwen3-VL-2B-Instruct-Q4_K_M.gguf` (1.8 GB, cuantizado Q4_K_M, visi&oacute;n)

El `server.ini` define 6 slots de modelo (coder_3b, reason_6b, vl_2b, vl_8b, chat_4b, micro_08b), pero solo los dos primeros est&aacute;n presentes en `./models/`. Los modelos se cargan bajo demanda (`--models-max 1` en futuras versiones).

**D&oacute;nde poner los modelos:**  
En `./models/` (ra&iacute;z del proyecto, ignorado por git) o en `~/.cache/elicape/models/`. El `server.ini` apunta a `~/models/` — puedes cambiar la ruta editando `.elicape/server.ini`.

> Esta app usa template, grammar y `server.ini` espec&iacute;ficos. No todos los `.gguf` funcionan igual.  
> Versi&oacute;n probada: **Qwen3-Coder-3.4B Q8_0**.  
> Si no tienes ese archivo en `./models/`, ponlo ah&iacute; o en `~/.cache/elicape/models/`.  
> En la pr&oacute;xima versi&oacute;n a&ntilde;adiremos descarga autom&aacute;tica desde Hugging Face si no est&aacute;.  
> Si alguien prueba otro modelo compatible y funciona, que abra un issue.

---

## 6. Roadmap

| Fase | Estado | Qu&eacute; incluye |
|------|--------|-------------------|
| v0.1 | ✅ | Prototipo funcional, chat conectado a LLM local |
| v0.2 | ✅ | AboutDialog, README humano, himno, tool approval |
| v0.3 | ✅ | Router de 6 modelos Qwen3, integridad al arranque, sistema de capas de prompt |
| v0.4 | 🚧 | Editor de grafo visual, config watcher, wizard de inicio, launcher wezterm |
| v1.0 | 📅 | Tool execution real (write_file, edit_file), .AppImage portable, release p&uacute;blico |

## 7. FAQ

**¿Puedo usar otro modelo?**  
S&iacute;. Los modelos se configuran en `.elicape/graph.toml`. El router soporta carga bajo demanda.

**¿Funciona sin GPU?**  
S&iacute;. Por defecto corre en CPU (`-ngl 0`). Los modelos ≤3B params responden r&aacute;pido incluso sin aceleraci&oacute;n gr&aacute;fica.

**¿Necesito internet?**  
Solo para la descarga inicial del modelo (~1.7 GB). Despu&eacute;s funciona 100% offline.

**¿Puedo contribuir?**  
S&iacute;. Haz fork, env&iacute;a PRs. Revisa `AGENTS.md` para entender la arquitectura interna.

## 8. Cr&eacute;ditos

Ver **Ayuda &gt; Acerca de** dentro de la aplicaci&oacute;n.

Agradecimientos a:
- **Lovable.dev** — base inicial y boilerplate
- **Hugging Face** — distribuci&oacute;n de modelos
- **llama.cpp** (Georgi Gerganov y comunidad) — motor de inferencia
- **Qwen Team / Alibaba Cloud** — modelo Qwen3-Coder-3B
- **Tauri, Rust, Vite, TypeScript** — stack tecnol&oacute;gico
- **OpenAI, Google, Antigravity** — inspiraci&oacute;n y pruebas previas
- **Meta AI (Sargento Meta)** — asistencia t&eacute;cnica
- **Todo el open source** que hace esto posible.

## Licencia

MIT. Ver archivo `LICENSE` en la ra&iacute;z del proyecto.
