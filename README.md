# Fenix Forge

Fenix Forge es una aplicación web de uso local diseñada para unir archivos MP3 y generar videos MP4 personalizados. Está desarrollada con **Next.js 16** y **Tailwind CSS**, y realiza todo el procesamiento multimedia utilizando **FFmpeg nativo** de forma directa en tu computadora.

## Funcionalidades principales

* **Combinador de audio**: Permite seleccionar múltiples MP3, reordenarlos mediante *drag & drop*, preescuchar cualquier track antes de procesar, seguir la lectura con barras de progreso individuales y visualizar la línea de tiempo con tiempos acumulados. Incluye detección automática de compatibilidad para concatenar audio en segundos sin reencodear (con *fallback* seguro si los formatos difieren).
* **Generador de video**: Permite asignar una imagen de fondo por canción o utilizar una global para todo el proyecto. Incluye texto centrado personalizable (con color de fuente y borde configurables, o bien la opción de exportar sin texto) y vista previa en vivo antes del render.
* **Tema Gruvbox**: Soporte nativo para modo claro y oscuro.
* **Notificaciones**: Feedback sonoro y *toast* emergente al completar el renderizado, junto con el tiempo total de conversión en formato legible.
* **Diseño responsive**: Adaptable a móviles, tablets y escritorio, con un panel de vista previa fijo en pantallas grandes.

## Capturas de pantalla

![screenshot]()

## Desarrollo local

### 1. Requisitos previos

* **Node.js** 18 o superior.
* **FFmpeg** instalado y disponible en el `PATH` del sistema (`ffmpeg -version`).
* Una fuente TrueType (`.ttf`) disponible para superponer texto en los videos (ej. `fonts-dejavu-core`).

En sistemas Debian/Ubuntu podés instalar las dependencias con:

```bash
sudo apt install ffmpeg fonts-dejavu-core
```

### 2. Instalación

Cloná el repositorio e instalá las dependencias:

```bash
git clone https://github.com/IsmaelHeredia/fenix-forge-nextjs.git
cd fenix-forge-nextjs
npm install
```

### 3. Configuración

Creá el archivo de variables de entorno:

```bash
cp .env.example .env.local
```

Si ffmpeg no está en el PATH global o tu fuente se encuentra en una ruta personalizada, definí las variables en .env.local:

```
FFMPEG_PATH=/usr/bin/ffmpeg
FFMPEG_FONT_PATH=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
```

### 4. Ejecución

Iniciá el servidor de desarrollo:

```bash
npm run dev
```

Accedé a la aplicación en `http://localhost:3000`.