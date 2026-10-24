"""Retrato (rosto e ombros, fundo transparente) de um personagem para a interface do jogo.
   blender -b -P art/blender/portrait.py -- entrada.glb saida.png [tamanho]
   Todos: art/blender/portraits.sh → game/assets/portraits/<chave>.png"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out = argv[0], argv[1]
res = int(argv[2]) if len(argv) > 2 else 256

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
rig = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
if rig and rig.animation_data:
    for t in rig.animation_data.nla_tracks: t.mute = True
    a = bpy.data.actions.get("Idle")
    rig.animation_data.action = a
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

# cabeça: osso "head" do esqueleto; sem ele, o terço de cima da caixa
pts = []
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        dg = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
        pts += [o.matrix_world @ Vector(c) for c in dg.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
height = mx.z - mn.z
if rig and "head" in rig.pose.bones:
    hb = rig.pose.bones["head"]
    focus = rig.matrix_world @ ((hb.head + hb.tail) / 2)
    focus.z += 0.05 * height
else:
    focus = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mx.z - height * 0.25))
span = height * 0.54     # altura enquadrada (cabeça grande do estilo chibi + ombros)
focus.z = min(focus.z - span * 0.06, mx.z - span * 0.44)

cam_data = bpy.data.cameras.new("cam"); cam_data.type = 'ORTHO'; cam_data.ortho_scale = span
cam = bpy.data.objects.new("cam", cam_data); bpy.context.collection.objects.link(cam)
cam.location = focus + Vector((span * 0.8, -span * 3.2, span * 0.3))
cam.rotation_euler = (focus - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
for (rx, rz, e) in ((45, 25, 4.0), (70, 210, 1.2), (100, 150, 2.5)):
    ld = bpy.data.lights.new("sol", 'SUN'); ld.energy = e
    lo = bpy.data.objects.new("sol", ld); lo.rotation_euler = (math.radians(rx), 0, math.radians(rz)); bpy.context.collection.objects.link(lo)

s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = s.render.resolution_y = res
s.render.film_transparent = True
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGBA'
s.view_settings.view_transform = 'Standard'
s.world = bpy.data.worlds.new("w"); s.world.color = (0.35, 0.33, 0.4)
s.render.filepath = out
bpy.ops.render.render(write_still=True)
print("retrato:", out)
