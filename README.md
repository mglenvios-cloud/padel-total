# PADEL — Proyecto

Este repositorio contiene el frontend del simulador "Padel Champions" y un script de generación de estadio para Blender.

## Generar el estadio en Blender
El script `create_court.py` está diseñado para ejecutarse dentro de Blender (usa `bpy`).

Recomendación: usar Blender 3.x o 4.x con soporte de Python integrado.

Ejemplos de ejecución (Linux / macOS):

```bash
# Ejecutar con semilla por defecto (42)
blender --background --python create_court.py

# Ejecutar con semilla personalizada
PADEL_SEED=123 blender --background --python create_court.py
```

En Windows (PowerShell):

```powershell
$env:PADEL_SEED = "123"
blender --background --python create_court.py
```

```

### Pipeline en CI (GitHub Actions)

Se incluye un workflow para ejecutar Blender en un runner y generar los artefactos (renders, GLB, bakes). Disparalo desde la pestaña "Actions" → "Blender Render & Export".

- Parámetros expuestos: `render_mode`, `hdri_path`, `render_output`, `export_glb`, `export_path`, `bake`, `bake_dir`, `bake_size`, `thumbnail`, `thumb_path`.
- Al finalizar el job los archivos quedan disponibles como artifact llamado `blender-artifacts`.

Ejemplo: ir a Actions → seleccionar el workflow → Run workflow → ajustar inputs → Run.

## Ejecutar el workflow desde tu máquina (gh CLI)

Si tienes instalado el GitHub CLI (`gh`) puedes disparar el workflow directamente desde tu equipo.

Linux / macOS:

```bash
# dispatch with defaults
./tools/dispatch_workflow.sh blender-render.yml

# dispatch and specify repo (owner/repo)
./tools/dispatch_workflow.sh blender-render.yml owner/repo
```

Windows (PowerShell):

```powershell
.
	ools\dispatch_workflow.ps1 -WorkflowFile 'blender-render.yml' -Repo 'owner/repo'
```

Notas:
- El script usa `gh workflow run` y asume la rama `main` como ref. Cambia el script si tu rama principal tiene otro nombre.
- Tras dispatchar, usa `gh run list` y `gh run watch <id>` para seguir la ejecución.
### Notas
- `PADEL_SEED` controla la aleatoriedad del público y otros elementos para reproducción.
- No es necesario instalar paquetes pip; el script depende de `bpy` interno de Blender.

## Frontend
- Abre `index.html` en un servidor local para probar la UI (recomendado `npx http-server` o similar).
- Los scripts se cargan con `defer` para mejorar la carga.

## Contribuir
- Añade issues para bugs o mejoras.
- Si añades dependencias pip, actualiza `requirements.txt`.

## Render fotorrealista y exportar glTF/GLB
El script `create_court.py` ahora soporta un modo de render fotorrealista y exportación a glTF.

- `PADEL_RENDER_MODE=high` activa ajustes de Cycles orientados a calidad (más muestras, denoising, Filmic).
- `PADEL_HDRI_PATH` (opcional) apunta a un archivo HDRI (.hdr/.exr) que se usará como iluminación de entorno.
- `PADEL_RENDER_OUTPUT` (opcional) ruta donde se guardará la imagen renderizada.
- `PADEL_EXPORT_GLTF=1` exportará `stadium.glb` al finalizar.

Ejemplo de uso (Linux/macOS):

```bash
PADEL_RENDER_MODE=high PADEL_HDRI_PATH=/path/to/hdri.hdr \
	PADEL_RENDER_OUTPUT=render.png PADEL_EXPORT_GLTF=1 \
	blender --background --python create_court.py
```

En Windows (PowerShell):

```powershell
$env:PADEL_RENDER_MODE = "high"
$env:PADEL_HDRI_PATH = "C:\path\to\hdri.hdr"
$env:PADEL_RENDER_OUTPUT = "render.png"
$env:PADEL_EXPORT_GLTF = "1"
blender --background --python create_court.py
```
