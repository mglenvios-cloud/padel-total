# Flujo de producción: Assets Blender -> Web

Este documento resume pasos recomendados para convertir la escena Blender en assets web estéticos y optimizados.

1. Preparación en Blender
- Ejecuta `create_court.py` en Blender para generar la escena.
- Activa `PADEL_RENDER_MODE=high` si necesitas renders fotorrealistas.

2. UV / Baking
- Asegúrate que todos los objetos tengan UVs (el script aplica Smart UV Project automáticamente si faltan).
- Ejecuta bake para AO y normales:

```bash
PADEL_BAKE=1 PADEL_BAKE_DIR=bakes PADEL_BAKE_SIZE=2048 \
blender --background --python create_court.py
```

- Revisa las imágenes en `bakes/`, edita y limpia seams si es necesario.

3. Texturizado PBR
- Combina AO + basecolor en un atlas o en texturas por objeto.
- Usa herramientas como `Materialize`, `ArmorPaint` o Substance Painter para pulir PBR.

4. Exportar glTF/GLB
- Exporta con compresión mínima primero:

```bash
PADEL_EXPORT_GLTF=1 PADEL_EXPORT_PATH=stadium_raw.glb blender --background --python create_court.py
```

5. Optimización (fuera de Blender)
- Recomiendo `gltfpack` para optimizar mallas y empaquetar texturas.
- Si usas Basis Universal (`basisu`), convierte texturas a `.basis` para menores pesos.

Ejemplo con `tools/optimize_gltf.sh`:

```bash
./tools/optimize_gltf.sh stadium_raw.glb stadium_optimized.glb
```

6. Checks y testing
- Prueba el GLB resultante en https://gltf-viewer.donmccurdy.com/ y en tu escena Three.js.
- Comprueba que normales/AO se aplican correctamente y que la iluminación se vea natural.

7. Integración web
- Sirve las versiones optimizadas desde CDN/hosting (Vercel ya sirve estático).
- Usa `KHR_texture_basisu` o `EXT_texture_webp` si tu pipeline lo admite.

8. Renders finales y thumbnails
- Genera renders 4K para marketing con `PADEL_RENDER_MODE=high` y guarda en `renders/`.
- Genera thumbnails con `PADEL_THUMBNAIL=1`.

Herramientas útiles:
- Blender (bpy)
- gltfpack (https://github.com/zeux/meshoptimizer/tree/master/gltfpack)
- gltf-pipeline (Cesium)
- basisu/etcpak for GPU texture compression
- ImageMagick for batch image ops

