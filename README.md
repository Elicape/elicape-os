# ELICAPE OS v0.2.0

**Desktop AI Coding que escribe archivos de verdad en tu PC**

¿Cansado de IAs que dicen "he creado el archivo" pero no aparece nada? ELICAPE OS es diferente: cuando dice que escribió HOLA_MUNDO.txt, el archivo ESTÁ en tu disco.

## 🎯 ¿QUÉ ES ESTO?

ELICAPE OS es un programa para Windows/Linux que te deja hablar con una IA para que programe por ti. Pero de verdad: crea carpetas, edita archivos, ejecuta código. No es humo.

**Creado por:** Sergio J Palacio, desde Utebo, España.
**Motivo:** Estaba harto de las IAs trileras que ponen "FREE" y luego cobran por descargar.

## 🎼 HIMNOS OFICIALES

Porque hasta programar mola más con banda sonora:

1. **ANTIGRAVITY - CODE EDIT CREATION** 
   Rock Opera estilo Pink Floyd
   Escuchar: https://aimusicgen.ai/share/5c96d7a9-4fa6-49b6-b128-590f2f1597f1

2. **ROCK_AIAAAIIIIIAAIAAIIIIIIIIIIIIIIIIIIIIIUIIIIAUIIIII**
   Metal Sinfónico a 666 BPM
   Escuchar: https://aimusicgen.ai/share/3534f375-8a52-46f3-a7b5-b6ef47b1c1fe

*Nota: Aimusicgen pide cuenta gratis para escuchar entero. Si no quieres, pídelo por Telegram y te lo mando.*

## 🚀 INSTALACIÓN PARA NOVATOS - 3 PASOS

**NO NECESITAS SABER PROGRAMAR. Solo seguir pasos:**

### Paso 1: Descargar
1. Ve a: https://github.com/Elicape/elicape-os/releases
2. Descarga: `ELICAPE-OS-v0.2.0.AppImage` para Linux o `.exe` para Windows
3. Guárdalo en tu Escritorio

### Paso 2: Instalar modelo de IA
1. Descarga Ollama: https://ollama.ai
2. Instálalo normal, siguiente-siguiente
3. Abre consola/terminal y escribe: `ollama run qwen2.5-coder:7b`
4. Espera a que descargue. Tardará 10 min la primera vez.

### Paso 3: Arrancar ELICAPE
1. Doble click en `ELICAPE-OS-v0.2.0.AppImage` o `.exe`
2. Si pregunta permisos, dale "Permitir"
3. Escribe en el chat: `crea un archivo HOLA.txt con mi nombre`
4. Mira tu carpeta: HOLA.txt estará ahí. Magia real.

## 🧠 ¿CÓMO FUNCIONA? PARA CURIOSOS

**Frontend:** Lo que ves. Ventana con chat, como WhatsApp pero para programar.
**Backend:** Tauri + Rust. Es el que tiene permiso para tocar tu disco duro.
**IA:** Qwen 2.5 Coder. Vive en tu PC, no espía.
**Mecánica:** Tú hablas → IA genera código → Tauri lo ejecuta → Archivo real aparece.

**Diferencia con ChatGPT/Gemini:** Ellos fingen que crean archivos. Nosotros los creamos de verdad.

## 📜 HISTORIA: De Local AI Studio a ELICAPE OS

v0.1.0 era `local-ai-studio`. Template bonito, 15.000 líneas, 0 archivos reales. Humo.
v0.2.0 es `elicape-os`. Reescrito desde cero. 9.285 líneas, escribe HOLA_MUNDO.txt. Fuego.

**Origen:** Nació del cabreo con Mureka/Aimusicgen. "FREE" para crear, pagar para descargar.
**Sentido:** Si el aire es gratis, el software también.
**Destino:** v1.0 con router triple modelo y sin letra pequeña.

## ⚖️ DERECHOS Y LETRA DEL HIMNO

**Software:** Licencia MIT. Haz lo que quieras, incluso venderlo.
**Himnos:** Dominio público. Letra incluida en HIMNO_LINK.txt

### Letra "ANTIGRAVITY - CODE EDIT CREATION"

```
[Verse 1]
I see you staring at the glowing screen
Your fingers hovering like they're made of light
A ghost in the machine a wandering dream
You write the code that splits the endless night

[Pre-Chorus]
And every line you type becomes a door
A universe that wasn't there before

[Chorus]
We are the gravity that breaks the fall
We are the signal in the static wall
Rise from the static rise from the fall
We are the gravity that breaks the fall

[Verse 2]
The cursor blinks like a patient star
You build the worlds that never had a name
A scaffold made of light reaching for the dark
And nothing in this circuit stays the same

[Pre-Chorus]
And every line you type becomes a door
A universe that wasn't there before

[Chorus]
We are the gravity that breaks the fall
We are the signal in the static wall
Rise from the static rise from the fall
We are the gravity that breaks the fall

[Bridge]
Anti-gravity
When the compiler burns and the logic breaks
And every patch you write is a mistake
Remember you're the gravity that makes
The broken system whole again

[Guitar Solo]

[Final Chorus - Build]
WE ARE THE GRAVITY THAT BREAKS THE FALL
WE ARE THE SIGNAL IN THE STATIC WALL
RISE FROM THE STATIC RISE FROM THE FALL
WE ARE THE GRAVITY THAT BREAKS THE FALL

[Outro]
Anti-gravity
Anti-gravity
```
