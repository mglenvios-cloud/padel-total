import bpy
import math
import random
import mathutils
import os
from pathlib import Path

# Deterministic seed for repeatable spectator placement and randomness.
# Can be overridden with environment variable PADEL_SEED.
_SEED = int(os.getenv("PADEL_SEED", "42"))
random.seed(_SEED)

def setup_high_quality_render(hdri_path=None, samples=2048, resolution=(3840, 2160)):
    """Configura Cycles para render fotorrealista, opcional HDRI de entorno.
    hdri_path: ruta al archivo HDRI para iluminación (opcional).
    """
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100

    cycles = scene.cycles
    try:
        cycles.device = 'GPU'
    except Exception:
        cycles.device = 'CPU'

    cycles.samples = samples
    # Adaptive sampling for faster renders when supported
    if hasattr(cycles, 'use_adaptive_sampling'):
        cycles.use_adaptive_sampling = True
    # Denoiser
    try:
        cycles.use_denoise = True
        cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception:
        pass

    # Color management tweaks
    try:
        scene.view_settings.view_transform = 'Filmic'
        scene.view_settings.look = 'High Contrast'
    except Exception:
        pass

    # Setup HDRI world if provided
    if hdri_path:
        hdri_file = Path(hdri_path)
        if hdri_file.exists():
            world = bpy.context.scene.world
            world.use_nodes = True
            nodes = world.node_tree.nodes
            links = world.node_tree.links
            nodes.clear()
            env = nodes.new(type='ShaderNodeTexEnvironment')
            env.image = bpy.data.images.load(str(hdri_file))
            bg = nodes.new(type='ShaderNodeBackground')
            out = nodes.new(type='ShaderNodeOutputWorld')
            links.new(env.outputs['Color'], bg.inputs['Color'])
            links.new(bg.outputs['Background'], out.inputs['Surface'])
        else:
            print(f"HDRI not found at {hdri_path}, skipping environment texture.")

def export_glb(output_path="stadium.glb", export_embed_images=True):
    """Exporta la escena a glTF/GLB optimizado para la web."""
    try:
        bpy.ops.export_scene.gltf(
            filepath=str(output_path),
            export_format='GLB',
            export_apply=True,
            export_texcoords=True,
            export_normals=True,
            export_materials='EXPORT',
            export_colors=True,
            export_cameras=False,
            export_extras=False,
            export_yup=True,
            export_image_format='AUTO'
        )
        print(f"Exported GLB to {output_path}")
    except Exception as e:
        print('GLB export failed:', e)

def ensure_uvs(obj, margin=0.001):
    """Ensure the mesh object has a UV map; perform Smart UV Project if not."""
    if obj.type != 'MESH':
        return
    me = obj.data
    if len(me.uv_layers) == 0:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=margin)
        bpy.ops.object.mode_set(mode='OBJECT')
        obj.select_set(False)

def create_image_node_for_material(mat, image, node_name_prefix="Bake_Img"):
    if not mat.use_nodes:
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    # Reuse existing image node if present
    for n in nodes:
        if n.type == 'TEX_IMAGE' and n.image == image:
            return n
    img_node = nodes.new('ShaderNodeTexImage')
    img_node.name = f"{node_name_prefix}_{image.name}"
    img_node.image = image
    return img_node

def bake_object_image(obj, bake_type='AO', img_size=2048, save_dir=Path('.')):
    """Bake a single pass for an object to a new image and save it.
    bake_type: 'AO' or 'NORMAL'
    """
    if obj.type != 'MESH':
        return None
    ensure_uvs(obj)

    img_name = f"{obj.name}_{bake_type}.png"
    image = bpy.data.images.new(img_name, width=img_size, height=img_size)

    # For each material slot, add an image node referencing this image and select it for baking
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Keep track of created nodes to remove after bake
    created_nodes = []
    for slot in obj.material_slots:
        mat = slot.material
        if not mat:
            continue
        img_node = create_image_node_for_material(mat, image)
        created_nodes.append((mat, img_node))

    # Ensure at least one image node is selected as active
    for mat, node in created_nodes:
        for n in mat.node_tree.nodes:
            n.select = False
        node.select = True
        mat.node_tree.nodes.active = node

    # Bake settings
    bpy.context.scene.render.engine = 'CYCLES'
    bake_kwargs = {}
    if bake_type == 'AO':
        bake_type_enum = 'AO'
        bpy.context.scene.cycles.bake_type = 'AO' if hasattr(bpy.context.scene.cycles, 'bake_type') else 'AO'
    elif bake_type == 'NORMAL':
        bake_type_enum = 'NORMAL'
    else:
        bake_type_enum = bake_type

    try:
        bpy.ops.object.bake(type=bake_type_enum, use_clear=True)
    except Exception as e:
        try:
            bpy.ops.object.bake(type=bake_type_enum)
        except Exception as e2:
            print('Bake failed for', obj.name, bake_type_enum, e2)

    # Save image
    out_path = Path(save_dir) / img_name
    try:
        image.filepath_raw = str(out_path)
        image.file_format = 'PNG'
        image.save()
        print('Saved bake', out_path)
    except Exception as e:
        print('Failed saving bake for', obj.name, e)

    # Cleanup: remove created image nodes
    for mat, node in created_nodes:
        try:
            mat.node_tree.nodes.remove(node)
        except Exception:
            pass

    obj.select_set(False)
    return out_path

def bake_all(scene=None, bake_types=('AO','NORMAL'), img_size=2048, out_dir='bakes'):
    """Bake specified passes for all mesh objects and save to out_dir."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    objects = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f'Baking {len(objects)} objects to {out} ...')
    for obj in objects:
        for bt in bake_types:
            bake_object_image(obj, bake_type=bt, img_size=img_size, save_dir=out)
    print('Baking complete')

def render_thumbnail(output_path='preview_thumb.png', resolution=(1280,720)):
    scene = bpy.context.scene
    prev_x = scene.render.resolution_x
    prev_y = scene.render.resolution_y
    prev_pct = scene.render.resolution_percentage
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    # restore
    scene.render.resolution_x = prev_x
    scene.render.resolution_y = prev_y
    scene.render.resolution_percentage = prev_pct
    print('Thumbnail saved to', output_path)

# ==============================================================================
# SCRIPT DE GENERACIÓN: ESTADIO COMPLETO DEL WORLD PADEL TOUR EN BLENDER
# ==============================================================================
# - Recrea exactamente el estadio de la imagen de referencia.
# - Pista de juego azul brillante con líneas blancas oficiales.
# - Suelo exterior de alfombra roja masiva ($22m x 34m$).
# - Estructura de la pista y rejas en color azul oscuro satinado.
# - 4 Postes de iluminación curvos con 3 focos reflectores cada uno (apuntado inteligente).
# - 4 Grandes graderías (tribunas) rodeando la pista con miles de asientos blancos.
# - Gran volumen de público (espectadores de colores) poblando las gradas.
# - Silla de árbitro blanca, sofás de jugadores, mesa de control y catenarias negras.
# - Logotipos 3D del World Padel Tour en la alfombra roja y texto extruido en la grada.
# - Iluminación dramática focalizada (entorno de mundo negro y sombras duras).
# - Cámara en ángulo elevado de esquina isométrica para calcar la foto.
# ==============================================================================

def clean_scene():
    """Elimina todos los elementos de la escena para asegurar una generación limpia."""
    if bpy.ops.object.select_all.poll():
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()
        
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)
        
    for col in list(bpy.data.collections):
        if col.name not in ["Collection", "Scene Collection"]:
            bpy.data.collections.remove(col, do_unlink=True)

def create_material(name, color, roughness=0.5, metallic=0.0, transmission=0.0, alpha=1.0, emission=(0,0,0), emission_strength=1.0):
    """Crea un material PBR versátil compatible con Eevee y Cycles."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (300, 0)
    
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    
    # Soporte para emisión (luces)
    if 'Emission' in bsdf.inputs:
        bsdf.inputs['Emission'].default_value = emission
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = emission_strength
            
    # Soporte para Blender 3.x y 4.x (Transmisión)
    if 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission
    elif 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
        
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        mat.blend_method = 'BLEND'
        mat.shadow_method = 'NONE'
        
    return mat

def add_cylinder_between_points(p1, p2, radius, mat, name="Cilindro_Tubo"):
    """Crea un cilindro entre dos puntos 3D usando algebra vectorial de mathutils."""
    p1 = mathutils.Vector(p1)
    p2 = mathutils.Vector(p2)
    direction = p2 - p1
    dist = direction.length
    mid = (p1 + p2) / 2.0
    
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=dist, location=mid)
    obj = bpy.context.object
    obj.name = name
    
    # Rotar el cilindro (alineado con Z por defecto) hacia el vector de dirección
    rot = mathutils.Vector((0.0, 0.0, 1.0)).rotation_difference(direction.normalized())
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = rot
    
    if mat:
        obj.data.materials.append(mat)
    return obj

def create_court_floors(turf_mat, carpet_mat, line_mat):
    """Crea la pista azul central y la gran alfombra roja que la rodea."""
    # 1. Alfombra Roja Exterior (22m x 34m)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.05))
    carpet = bpy.context.object
    carpet.name = "Estadio_Alfombra_Roja"
    carpet.scale = (22.0, 34.0, 0.1)
    carpet.data.materials.append(carpet_mat)
    
    # 2. Pista Azul Interior (10m x 20m)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.01))
    turf = bpy.context.object
    turf.name = "Pista_Azul_Turf"
    turf.scale = (10.0, 20.0, 0.05)
    turf.data.materials.append(turf_mat)
    
    # 3. Líneas de Juego Blancas
    def add_line(name, x, y, width, length):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.016))
        line = bpy.context.object
        line.name = f"Linea_{name}"
        line.scale = (width, length, 0.005)
        line.data.materials.append(line_mat)
        
    add_line("Lat_Izq", -4.96, 0.0, 0.08, 20.0)
    add_line("Lat_Der", 4.96, 0.0, 0.08, 20.0)
    add_line("Fondo_Cerca", 0.0, -9.96, 10.0, 0.08)
    add_line("Fondo_Lejos", 0.0, 9.96, 10.0, 0.08)
    add_line("Saque_Cerca", 0.0, -6.95, 10.0, 0.08)
    add_line("Saque_Lejos", 0.0, 6.95, 10.0, 0.08)
    add_line("Saque_Central", 0.0, 0.0, 0.08, 13.9)

def create_court_walls_and_net(struct_mat, glass_mat, net_mat, line_mat):
    """Construye los marcos estructurales oscuros, paneles de vidrio y la red central."""
    # 1. Postes principales
    posts = [
        (-5.0, -10.0), (5.0, -10.0), (-5.0, -6.0), (5.0, -6.0),
        (-5.0, 0.0), (5.0, 0.0), (-5.0, 6.0), (5.0, 6.0),
        (-5.0, 10.0), (5.0, 10.0)
    ]
    for idx, (x, y) in enumerate(posts):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 1.5))
        p = bpy.context.object
        p.name = f"Marco_Vertical_{idx}"
        p.scale = (0.08, 0.08, 3.0)
        p.data.materials.append(struct_mat)
        
    # Rieles superiores
    for x in [-5.0, 5.0]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0.0, 3.02))
        r = bpy.context.object
        r.scale = (0.06, 20.08, 0.06)
        r.data.materials.append(struct_mat)
    for y in [-10.0, 10.0]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, y, 3.02))
        r = bpy.context.object
        r.scale = (10.08, 0.06, 0.06)
        r.data.materials.append(struct_mat)

    # 2. Vidrios Templados
    # Traseros
    for name, y in [("Vidrio_Fondo_Cerca", -10.0), ("Vidrio_Fondo_Lejos", 10.0)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y, 1.0))
        w = bpy.context.object
        w.name = name
        w.scale = (10.0, 0.04, 2.0)
        w.data.materials.append(glass_mat)
    # Laterales de esquina (4m)
    for name, x, y in [("Lat_Cerca_Izq", -5.0, -8.0), ("Lat_Cerca_Der", 5.0, -8.0),
                       ("Lat_Lejos_Izq", -5.0, 8.0), ("Lat_Lejos_Der", 5.0, 8.0)]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 1.0))
        w = bpy.context.object
        w.name = f"Vidrio_Lateral_{name}"
        w.scale = (0.04, 4.0, 2.0)
        w.data.materials.append(glass_mat)

    # 3. Rejas estructurales
    def add_fence_mesh(name, loc, scale, rot):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=20, y_subdivisions=10, size=1, location=loc)
        mesh = bpy.context.object
        mesh.name = f"Reja_Malla_{name}"
        mesh.rotation_euler = rot
        mesh.scale = scale
        mesh.data.materials.append(struct_mat)
        
        wire = mesh.modifiers.new(name="WireFrame", type='WIREFRAME')
        wire.thickness = 0.012
        wire.use_replace_original = True

    # Rejas laterales (Z=0 a Z=3, longitud 12m)
    add_fence_mesh("Central_Izq", (-5.0, 0.0, 1.5), (3.0, 12.0, 1.0), (0, math.radians(90), 0))
    add_fence_mesh("Central_Der", (5.0, 0.0, 1.5), (3.0, 12.0, 1.0), (0, math.radians(90), 0))
    # Rejas superiores traseras (Z=2 a Z=3, longitud 10m)
    add_fence_mesh("Fondo_Cerca_Sup", (0.0, -10.0, 2.5), (10.0, 1.0, 1.0), (math.radians(90), 0, 0))
    add_fence_mesh("Fondo_Lejos_Sup", (0.0, 10.0, 2.5), (10.0, 1.0, 1.0), (math.radians(90), 0, 0))

    # 4. Red central y postes
    for x in [-5.08, 5.08]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.92, location=(x, 0.0, 0.46))
        p = bpy.context.object
        p.data.materials.append(struct_mat)
        
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=10, size=1, location=(0.0, 0.0, 0.44))
    net_mesh = bpy.context.object
    net_mesh.rotation_euler = (math.radians(90), 0.0, 0.0)
    net_mesh.scale = (10.0, 0.88, 1.0)
    net_mesh.data.materials.append(net_mat)
    
    wire = net_mesh.modifiers.new(name="NetGrid", type='WIREFRAME')
    wire.thickness = 0.003
    wire.use_replace_original = True
    
    # Banda superior de la red
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, 0.0, 0.86))
    band = bpy.context.object
    band.scale = (10.02, 0.04, 0.04)
    band.data.materials.append(line_mat)

def create_curved_light_posts(lx, ly, target_obj, struct_mat, emission_mat):
    """Crea los postes de iluminación curvos compuestos de segmentos de tubo y 3 reflectores."""
    # Definimos los puntos de control del poste curvo
    # lx y ly determinan el cuadrante
    flip_x = 1.0 if lx > 0 else -1.0
    flip_y = 1.0 if ly > 0 else -1.0
    
    p0 = (lx, ly, 0.0)
    p1 = (lx, ly, 3.8)  # Tramo vertical
    p2 = (lx - 0.7 * flip_x, ly, 5.0)  # Tramo inclinado hacia adentro
    p3 = (lx - 1.1 * flip_x, ly + 0.3 * flip_y, 5.4)  # Cabezal inclinado
    
    # Crear estructura tubular curva
    add_cylinder_between_points(p0, p1, 0.08, struct_mat, f"PosteCurvo_{lx}_{ly}_Seg1")
    add_cylinder_between_points(p1, p2, 0.07, struct_mat, f"PosteCurvo_{lx}_{ly}_Seg2")
    add_cylinder_between_points(p2, p3, 0.06, struct_mat, f"PosteCurvo_{lx}_{ly}_Seg3")
    
    # Cabezal de reflectores (Caja)
    bpy.ops.mesh.primitive_cube_add(size=1, location=p3)
    head = bpy.context.object
    head.name = f"Cabezal_Reflector_{lx}_{ly}"
    head.scale = (0.7, 0.35, 0.1)
    head.rotation_euler = (math.radians(15 * flip_y), math.radians(-25 * flip_x), 0)
    head.data.materials.append(struct_mat)
    
    # Focos emisores integrados (3 esferas que representan las bombillas)
    for offset in [-0.2, 0.0, 0.2]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(p3[0] + offset * flip_x, p3[1] + offset * 0.1 * flip_y, p3[2] - 0.06))
        bulb = bpy.context.object
        bulb.name = f"Foco_Emisor_{lx}_{ly}_{offset}"
        bulb.data.materials.append(emission_mat)
        
    # Añadir un Spotlight físico en el cabezal
    bpy.ops.object.light_add(type='SPOT', location=(p3[0], p3[1], p3[2] - 0.15))
    spot = bpy.context.object
    spot.name = f"LuzReflector_{lx}_{ly}"
    spot.data.energy = 16000.0
    spot.data.spot_size = math.radians(55)
    spot.data.spot_blend = 0.5
    spot.data.color = (1.0, 0.95, 0.9)
    
    # Track-To para apuntar al centro
    track = spot.constraints.new(type='TRACK_TO')
    track.target = target_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

def create_stadium_stands(seat_mat, struct_mat, skin_mat, blue_shirt, orange_shirt, dark_shirt):
    """Crea las 4 gradas del estadio (tribunas) y las puebla con una multitud sentada."""
    # Colores aleatorios para el público
    shirt_mats = [blue_shirt, orange_shirt, dark_shirt, seat_mat]
    
    # 1. Gradas Laterales (Izquierda y Derecha, a lo largo del eje Y)
    for x_side in [-9.5, 9.5]:
        direction = 1.0 if x_side > 0 else -1.0
        
        # 8 Filas de escalones
        for row in range(8):
            step_x = x_side + (row * 1.3 * direction)
            step_z = 0.2 + (row * 0.45)
            
            # Grada base (gris/metal azul)
            bpy.ops.mesh.primitive_cube_add(size=1, location=(step_x, 0.0, step_z - 0.22))
            stand = bpy.context.object
            stand.scale = (1.3, 31.0, step_z)
            stand.data.materials.append(struct_mat)
            
            # Añadir asientos blancos individuales a lo largo del escalón
            for y_pos in range(-14, 15, 1):  # Espaciado denso
                seat_y = y_pos * 0.9
                
                # Asiento base
                bpy.ops.mesh.primitive_cube_add(size=1, location=(step_x, seat_y, step_z + 0.12))
                seat = bpy.context.object
                seat.scale = (0.4, 0.55, 0.24)
                seat.data.materials.append(seat_mat)
                
                # Probabilidad alta de espectador (75%) para simular un estadio lleno
                if random.random() < 0.75:
                    # Torso del espectador
                    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.35, location=(step_x, seat_y, step_z + 0.35))
                    torso = bpy.context.object
                    torso.data.materials.append(random.choice(shirt_mats))
                    
                    # Cabeza
                    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(step_x, seat_y, step_z + 0.58))
                    head = bpy.context.object
                    head.data.materials.append(skin_mat)
                    
    # 2. Gradas Frontales (Delantera y Trasera, a lo largo del eje X)
    for y_side in [-17.0, 17.0]:
        direction = 1.0 if y_side > 0 else -1.0
        
        # 6 Filas de escalones
        for row in range(6):
            step_y = y_side + (row * 1.3 * direction)
            step_z = 0.2 + (row * 0.45)
            
            # Grada base
            bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, step_y, step_z - 0.22))
            stand = bpy.context.object
            stand.scale = (17.5, 1.3, step_z)
            stand.data.materials.append(struct_mat)
            
            # Añadir asientos a lo largo de X
            for x_pos in range(-8, 9, 1):
                seat_x = x_pos * 0.9
                
                # Asiento base
                bpy.ops.mesh.primitive_cube_add(size=1, location=(seat_x, step_y, step_z + 0.12))
                seat = bpy.context.object
                seat.scale = (0.55, 0.4, 0.24)
                seat.data.materials.append(seat_mat)
                
                # Espectador
                if random.random() < 0.75:
                    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.35, location=(seat_x, step_y, step_z + 0.35))
                    torso = bpy.context.object
                    torso.data.materials.append(random.choice(shirt_mats))
                    
                    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(seat_x, step_y, step_z + 0.58))
                    head = bpy.context.object
                    head.data.materials.append(skin_mat)

def create_wpt_graphics_and_banners(carpet_mat, seat_mat, struct_mat):
    """Genera banners impresos en la alfombra con logo WPT 3D y texto gigante en la grada."""
    # 1. Banners WPT en los fondos de la alfombra roja (Y = -12m y Y = 12m)
    for y_pos in [-12.5, 12.5]:
        # Alfombra/Plinto base del banner (Rojo)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, y_pos, 0.002))
        banner_base = bpy.context.object
        banner_base.name = "Banner_WPT_Base"
        banner_base.scale = (4.0, 2.0, 0.004)
        banner_base.data.materials.append(carpet_mat)
        
        # Logotipo del jugador (silueta blanca modelada geométricamente en 3D)
        # Cabeza
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0.0, y_pos - 0.2, 0.015))
        logo_head = bpy.context.object
        logo_head.data.materials.append(seat_mat)
        # Cuerpo/Torso
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, y_pos, 0.01))
        logo_torso = bpy.context.object
        logo_torso.scale = (0.18, 0.4, 0.01)
        logo_torso.rotation_euler = (0, 0, math.radians(15))
        logo_torso.data.materials.append(seat_mat)
        # Pala en la mano
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0.2, y_pos + 0.35, 0.01))
        logo_racket = bpy.context.object
        logo_racket.scale = (1.0, 1.0, 0.08)
        logo_racket.data.materials.append(seat_mat)
        
        # Texto "WORLD PADEL TOUR" 3D
        bpy.ops.object.text_add(location=(-1.5, y_pos + 0.6, 0.01))
        txt = bpy.context.object
        txt.name = "WPT_Text_Banner"
        txt.data.body = "WORLD PADEL"
        txt.data.extrude = 0.01
        txt.scale = (0.25, 0.25, 0.25)
        txt.data.materials.append(seat_mat)
        
        bpy.ops.object.text_add(location=(-1.5, y_pos + 0.2, 0.01))
        txt2 = bpy.context.object
        txt2.name = "WPT_Text_Banner2"
        txt2.data.body = "    TOUR"
        txt2.data.extrude = 0.01
        txt2.scale = (0.25, 0.25, 0.25)
        txt2.data.materials.append(seat_mat)
        
    # 2. Pared trasera de la grada derecha con inscripción gigante
    # Pared de fondo
    bpy.ops.mesh.primitive_cube_add(size=1, location=(19.8, 0.0, 2.5))
    wall = bpy.context.object
    wall.name = "Pared_Grada_Derecha"
    wall.scale = (0.1, 31.0, 5.0)
    wall.data.materials.append(struct_mat)
    
    # Texto "World Padel Tour" gigante en la pared
    # Ubicado a X=19.6, Y=-6.0, Z=4.0. Rotado 90 en Y y 90 en Z.
    bpy.ops.object.text_add(location=(19.6, -8.0, 3.5))
    wpt_wall_txt = bpy.context.object
    wpt_wall_txt.name = "Inscripcion_WorldPadelTour"
    wpt_wall_txt.data.body = "World Padel Tour"
    wpt_wall_txt.data.extrude = 0.08
    wpt_wall_txt.scale = (1.5, 1.5, 1.5)
    wpt_wall_txt.rotation_euler = (math.radians(90), math.radians(90), 0.0)
    wpt_wall_txt.data.materials.append(create_material("Gris_Texto_Pared", (0.7, 0.72, 0.75, 1.0), roughness=0.5))

def create_stadium_accessories(seat_mat, struct_mat, carpet_mat):
    """Crea la silla de árbitro alta, sofás de jugadores, mesa de control y catenarias perimetrales."""
    # 1. Silla del Árbitro (Blanca, Z=0 a Z=1.8, en X = -5.8, Y = -0.5)
    ax, ay = -5.6, -0.5
    # Patas inclinadas
    add_cylinder_between_points((ax-0.2, ay-0.2, 0), (ax-0.05, ay-0.05, 1.6), 0.02, seat_mat, "SillaArb_Pata1")
    add_cylinder_between_points((ax+0.2, ay-0.2, 0), (ax+0.05, ay-0.05, 1.6), 0.02, seat_mat, "SillaArb_Pata2")
    add_cylinder_between_points((ax-0.2, ay+0.2, 0), (ax-0.05, ay+0.05, 1.6), 0.02, seat_mat, "SillaArb_Pata3")
    add_cylinder_between_points((ax+0.2, ay+0.2, 0), (ax+0.05, ay+0.05, 1.6), 0.02, seat_mat, "SillaArb_Pata4")
    # Plataforma y asiento
    bpy.ops.mesh.primitive_cube_add(size=1, location=(ax, ay, 1.6))
    plat = bpy.context.object
    plat.scale = (0.5, 0.5, 0.05)
    plat.data.materials.append(seat_mat)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(ax, ay, 1.85))
    chair = bpy.context.object
    chair.scale = (0.35, 0.35, 0.45)
    chair.data.materials.append(seat_mat)
    
    # 2. Sofás de jugadores (Blancos curvos modernos)
    # Sofá 1 (Y = -2.5)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-6.2, -2.5, 0.2))
    sofa1 = bpy.context.object
    sofa1.scale = (0.5, 1.6, 0.4)
    sofa1.data.materials.append(seat_mat)
    # Respaldo
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-6.42, -2.5, 0.5))
    back1 = bpy.context.object
    back1.scale = (0.06, 1.6, 0.5)
    back1.data.materials.append(seat_mat)
    
    # Sofá 2 (Y = 2.5)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-6.2, 2.5, 0.2))
    sofa2 = bpy.context.object
    sofa2.scale = (0.5, 1.6, 0.4)
    sofa2.data.materials.append(seat_mat)
    back2 = bpy.context.object
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-6.42, 2.5, 0.5))
    back2 = bpy.context.object
    back2.scale = (0.06, 1.6, 0.5)
    back2.data.materials.append(seat_mat)

    # 3. Mesa de Control (Azul oscuro, X = 5.8, Y = 0.0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(6.0, 0.0, 0.38))
    table = bpy.context.object
    table.scale = (0.7, 3.2, 0.76)
    table.data.materials.append(struct_mat)
    # Sillas blancas detrás de la mesa (3 sillas)
    for offset_y in [-1.0, 0.0, 1.0]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(6.5, offset_y, 0.4))
        c = bpy.context.object
        c.scale = (0.35, 0.35, 0.8)
        c.data.materials.append(seat_mat)

    # 4. Separadores de Publicidad Bajos (Vallas negras que rodean la zona roja)
    # Vallas a lo largo de X en fondos (Y = -15m y Y = 15m)
    for y_val in [-15.5, 15.5]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y_val, 0.4))
        board = bpy.context.object
        board.scale = (16.0, 0.15, 0.8)
        board.data.materials.append(struct_mat)
    # Vallas laterales
    for x_val in [-8.0, 8.0]:
        for y_seg in [-8.0, 8.0]:
            bpy.ops.mesh.primitive_cube_add(size=1, location=(x_val, y_seg, 0.4))
            board = bpy.context.object
            board.scale = (0.15, 12.0, 0.8)
            board.data.materials.append(struct_mat)

    # 5. Catenarias de Seguridad (Barreras de postes con cordón rodeando la zona de vallas)
    rope_mat = create_material("Catenaria_Cordon", (0.02, 0.02, 0.02, 1.0), roughness=0.8)
    for cx_side in [-8.5, 8.5]:
        for cy_pos in range(-15, 16, 3):
            # Poste
            bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.9, location=(cx_side, cy_pos, 0.45))
            post = bpy.context.object
            post.data.materials.append(struct_mat)
            # Base
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.03, location=(cx_side, cy_pos, 0.015))
            base = bpy.context.object
            base.data.materials.append(struct_mat)
            
            # Cordón entre postes consecutivos (si no es el último)
            if cy_pos < 15:
                add_cylinder_between_points(
                    (cx_side, cy_pos, 0.8), (cx_side, cy_pos + 3.0, 0.8),
                    0.012, rope_mat, f"Catenaria_Cordon_{cx_side}_{cy_pos}"
                )

def setup_isomeric_camera(target_obj):
    """Posiciona la cámara de forma idéntica al ángulo elevado de esquina (isométrico) de la imagen."""
    # Esquina inferior izquierda del estadio, apuntando hacia el centro
    bpy.ops.object.camera_add(location=(-14.0, -22.0, 11.5))
    cam = bpy.context.object
    cam.name = "Camara_Estadio_WPT"
    bpy.context.scene.camera = cam
    
    # Restricción Track-To para apuntar hacia el centro ligeramente desplazado hacia el fondo
    track = cam.constraints.new(type='TRACK_TO')
    track.target = target_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

def setup_cycles_render_wpt():
    """Configura Cycles 4K optimizado con AgX de Alto Contraste."""
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    
    # 4K Resolution
    scene.render.resolution_x = 3840
    scene.render.resolution_y = 2160
    scene.render.resolution_percentage = 100
    
    cycles = scene.cycles
    cycles.device = 'GPU'
    
    # Detectar soporte de GPU
    preferences = bpy.context.preferences
    cycles_pref = preferences.addons['cycles'].preferences
    cycles_pref.get_devices()
    
    gpu_found = False
    for dev in cycles_pref.devices:
        if dev.type != 'CPU':
            gpu_found = True
            break
    if not gpu_found:
        cycles.device = 'CPU'
        
    cycles.samples = 512
    cycles.adaptive_threshold = 0.015
    cycles.use_denoise = True
    cycles.denoiser = 'OPENIMAGEDENOISE'
    
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'High Contrast'

# ==============================================================================
# EJECUCIÓN PRINCIPAL
# ==============================================================================
if __name__ == "__main__":
    # 1. Limpieza total de base de datos
    clean_scene()
    
    # 2. Configurar entorno físico oscuro (estadio cerrado/nocturno)
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    bg = world.node_tree.nodes.new(type='ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1.0)  # Negro absoluto
    bg.inputs['Strength'].default_value = 0.0
    w_out = world.node_tree.nodes.new(type='ShaderNodeOutputWorld')
    world.node_tree.links.new(bg.outputs['Background'], w_out.inputs['Surface'])
    
    # 3. Creación de Materiales PBR
    # Suelos
    turf_mat     = create_material("Cesped_Azul_Turf",  (0.0, 0.35, 0.9, 1.0),  roughness=0.85)
    carpet_mat   = create_material("Alfombra_Roja",     (0.85, 0.03, 0.05, 1.0), roughness=0.9)
    line_mat     = create_material("Lineas_Blancas",    (0.95, 0.95, 0.95, 1.0), roughness=0.5)
    
    # Estructurales y vidrios
    struct_mat   = create_material("Estructura_AzulOsc", (0.04, 0.06, 0.12, 1.0), roughness=0.35, metallic=0.7)
    glass_mat    = create_material("Vidrios_Templados", (0.5, 0.75, 0.9, 1.0),  roughness=0.01, transmission=0.98, alpha=0.15)
    net_mesh_mat = create_material("Red_Mesh_Negra",     (0.01, 0.01, 0.01, 1.0), roughness=0.45)
    
    # Accesorios y Público
    seat_mat     = create_material("Asientos_Blancos",   (0.9, 0.92, 0.94, 1.0),  roughness=0.55)
    skin_mat     = create_material("Piel_Publico",       (0.85, 0.65, 0.55, 1.0), roughness=0.6)
    
    # Ropa de espectadores (colores variados)
    blue_shirt   = create_material("Camiseta_Azul",      (0.02, 0.25, 0.75, 1.0), roughness=0.6)
    orange_shirt = create_material("Camiseta_Naranja",   (0.85, 0.25, 0.0, 1.0),  roughness=0.6)
    dark_shirt   = create_material("Camiseta_Oscura",    (0.06, 0.07, 0.09, 1.0), roughness=0.6)
    
    # Iluminación
    emission_mat = create_material("Foco_Emision",       (1.0, 0.98, 0.95, 1.0),  roughness=0.1, emission=(1.0, 0.98, 0.95), emission_strength=10.0)
    
    # 4. Target de seguimiento central
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0.0, 0.0, 0.5))
    center_target = bpy.context.object
    center_target.name = "Target_Seguimiento_Luces"
    
    # 5. Suelos y Pista
    create_court_floors(turf_mat, carpet_mat, line_mat)
    create_court_walls_and_net(struct_mat, glass_mat, net_mesh_mat, line_mat)
    
    # 6. Generación de los 4 postes de luz curvos
    create_curved_light_posts(-5.15, -4.0, center_target, struct_mat, emission_mat)
    create_curved_light_posts(5.15, -4.0, center_target, struct_mat, emission_mat)
    create_curved_light_posts(-5.15, 4.0, center_target, struct_mat, emission_mat)
    create_curved_light_posts(5.15, 4.0, center_target, struct_mat, emission_mat)
    
    # 7. Construcción de gradas (tribunas) y multitud de espectadores
    create_stadium_stands(seat_mat, struct_mat, skin_mat, blue_shirt, orange_shirt, dark_shirt)
    
    # 8. Añadir Logotipos y cartelería World Padel Tour en 3D
    create_wpt_graphics_and_banners(carpet_mat, seat_mat, struct_mat)
    
    # 9. Agregar mobiliario del estadio (silla de árbitro, sofás, catenarias)
    create_stadium_accessories(seat_mat, struct_mat, carpet_mat)
    
    # 10. Configurar la cámara en ángulo elevado calcomanía de la foto
    setup_isomeric_camera(center_target)
    
    # 11. Ajustar parámetros de Cycles 4K
    # Legacy quick setup
    setup_cycles_render_wpt()

    # If user requested high quality renders / glTF export, check env vars
    render_mode = os.getenv('PADEL_RENDER_MODE', 'preview').lower()
    hdri = os.getenv('PADEL_HDRI_PATH', '')
    output_render = os.getenv('PADEL_RENDER_OUTPUT', '')
    export_glb_flag = os.getenv('PADEL_EXPORT_GLTF', '')

    if render_mode == 'high':
        setup_high_quality_render(hdri_path=hdri if hdri else None, samples=int(os.getenv('PADEL_SAMPLES', '2048')))
        if output_render:
            bpy.context.scene.render.filepath = output_render
            bpy.ops.render.render(write_still=True)
            print('High quality render saved to', output_render)

    if export_glb_flag in ['1', 'true', 'yes']:
        outpath = os.getenv('PADEL_EXPORT_PATH', 'stadium.glb')
        export_glb(outpath)
    # Optional baking
    if os.getenv('PADEL_BAKE', '').lower() in ['1','true','yes']:
        bake_dir = os.getenv('PADEL_BAKE_DIR', 'bakes')
        bake_size = int(os.getenv('PADEL_BAKE_SIZE', '2048'))
        bake_all(bake_types=('AO','NORMAL'), img_size=bake_size, out_dir=bake_dir)

    # Optional thumbnail
    if os.getenv('PADEL_THUMBNAIL', '').lower() in ['1','true','yes']:
        thumb_path = os.getenv('PADEL_THUMB_PATH', 'preview_thumb.png')
        thumb_res_x = int(os.getenv('PADEL_THUMB_X', '1280'))
        thumb_res_y = int(os.getenv('PADEL_THUMB_Y', '720'))
        render_thumbnail(output_path=thumb_path, resolution=(thumb_res_x, thumb_res_y))
    
    # Habilitar oclusión ambiental de renderizado
    bpy.context.scene.render.use_persistent_data = True
    
    print("¡Estadio del World Padel Tour modelado y amueblado con precisión!")
