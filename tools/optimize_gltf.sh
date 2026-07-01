#!/usr/bin/env bash
# Optimize a GLB/GLTF for web delivery using available tools.
# Usage: ./optimize_gltf.sh input.glb output.glb

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 input.glb output.glb"
  exit 1
fi

IN="$1"
OUT="$2"

if command -v gltfpack >/dev/null 2>&1; then
  echo "Using gltfpack to optimize $IN -> $OUT"
  # -cc create compressed vertex data, -sm generate meshopt, -tc generate tangent space
  gltfpack -i "$IN" -o "$OUT" -cc -sm -tc
  exit $?
fi

if command -v gltf-pipeline >/dev/null 2>&1; then
  echo "Using gltf-pipeline to optimize $IN -> $OUT (draco compression if available)"
  # gltf-pipeline -i input -o output -d applies draco
  gltf-pipeline -i "$IN" -o "$OUT" -d
  exit $?
fi

echo "No optimization tool found. Install gltfpack (recommended) or gltf-pipeline." 
exit 2
