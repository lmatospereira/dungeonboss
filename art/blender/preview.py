"""Renderiza uma prévia de um .glb (frente 3/4) para conferência.
   blender -b -P art/blender/preview.py -- entrada.glb saida.png [Acao] [quadro]"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out = argv[0], argv[1]
act = argv[2] if len(argv) > 2 else None
frame = int(argv[3]) if len(argv) > 3 else 1
view = argv[4] if len(argv) > 4 else "front"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
rig = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
if rig and act and rig.animation_data:
    a = bpy.data.actions.get(act)
    if a:
        for t in rig.animation_data.nla_tracks: t.mute = True
        rig.animation_data.action = a
bpy.context.scene.frame_set(frame)
# calibração: pose=osso:graus_x,osso:graus_x (euler X direto no osso, sem animação)
pose = next((a[5:] for a in argv if a.startswith("pose=")), None)
if rig and pose:
    if rig.animation_data:
        for t in rig.animation_data.nla_tracks: t.mute = True
        rig.animation_data.action = None
    for item in pose.split(","):
        b, deg = item.split(":")
        pb = rig.pose.bones[b]; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(float(deg)), 0, 0)
    bpy.context.view_layer.update()

# enquadramento a partir da caixa de todos os objetos com malha
pts = []
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
center = (mn + mx) / 2
size = max((mx - mn).length, 1.0)

cam_data = bpy.data.cameras.new("cam"); cam_data.lens = 50
cam = bpy.data.objects.new("cam", cam_data); bpy.context.collection.objects.link(cam)
d = size * 1.55
cam.location = center + (Vector((-d, 0, d * 0.1)) if view == 'side' else Vector((d * 0.55, -d * 0.9, d * 0.35)))
cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
for (rx, rz, e) in ((50, 30, 3.0), (60, 200, 1.5)):
    ld = bpy.data.lights.new("sol", 'SUN'); ld.energy = e
    lo = bpy.data.objects.new("sol", ld); lo.rotation_euler = (math.radians(rx), 0, math.radians(rz)); bpy.context.collection.objects.link(lo)

s = bpy.context.scene
s.render.engine = 'BLENDER_WORKBENCH'
s.display.shading.light = 'STUDIO'
s.display.shading.color_type = 'MATERIAL'
s.display.shading.show_cavity = True
s.display.shading.show_object_outline = True
s.display.shading.show_shadows = True
s.render.resolution_x = s.render.resolution_y = 640
s.render.film_transparent = False
s.world = bpy.data.worlds.new("w"); s.world.color = (0.12, 0.09, 0.16)
s.render.filepath = out
bpy.ops.render.render(write_still=True)
print("prévia:", out)
