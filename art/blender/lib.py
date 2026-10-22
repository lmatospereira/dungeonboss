"""Biblioteca de modelagem dos personagens (Blender 5.2, roda em modo texto: blender -b -P <script>).

Cada personagem é montado com peças modeladas aqui (formas com bevel e subdivisão, não primitivas cruas),
presas a um esqueleto padrão e animadas com as mesmas ações em todos os personagens:
    Idle, Attack, Cast, Hit, Death, Victory
O resultado é exportado em glTF binário (.glb) para game/assets/characters/.

Convenções:
- Eixos do Blender: Z para cima, personagem olhando para -Y (o exportador glTF converte para +Y up / +Z frente).
- Altura de um herói ~2,2 m (estilo chibi: cabeça grande, mãos e armas exageradas).
- Ossos: root, hips, spine, head, arm.L, hand.L, arm.R, hand.R, leg.L, leg.R (+ cape e weapon quando houver).
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Euler

FPS = 30

# ------------------------------------------------------------------ cena
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.fps = FPS
    s.frame_start, s.frame_end = 1, 60

def mat(name, color, rough=0.75, metal=0.0, emit=None):
    """Material PBR simples; no Godot ele recebe o shader estilizado (cel + contorno) mantendo a cor."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    c = color if len(color) == 4 else (*color, 1.0)
    b.inputs["Base Color"].default_value = c
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1.0)
        b.inputs["Emission Strength"].default_value = 2.0
    m.diffuse_color = c
    return m

def hexc(h):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return tuple(lin)

# ------------------------------------------------------------------ peças
def _finish(obj, m, smooth=True, bevel=0.0, subdiv=0):
    if m: obj.data.materials.append(m)
    if bevel:
        mod = obj.modifiers.new("bevel", 'BEVEL'); mod.width = bevel; mod.segments = 3; mod.limit_method = 'ANGLE'
    if subdiv:
        mod = obj.modifiers.new("sub", 'SUBSURF'); mod.levels = subdiv; mod.render_levels = subdiv
    if smooth:
        for p in obj.data.polygons: p.use_smooth = True
    return obj

def blob(name, m, loc, scale, rot=(0, 0, 0), segs=24):
    """Volume arredondado (corpo, cabeça, mãos, pés)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=segs // 2, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    return _finish(o, m)

def block(name, m, loc, scale, rot=(0, 0, 0), bevel=0.04):
    """Bloco com cantos chanfrados (lâminas, placas, cintos)."""
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, m, smooth=False, bevel=bevel)

def tube(name, m, loc, radius, depth, rot=(0, 0, 0), verts=20, r2=None, bevel=0.0):
    """Cilindro ou cone (cabos, braços de armadura, chifres com r2=0)."""
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    return _finish(o, m, bevel=bevel)

def ring(name, m, loc, major, minor, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc, rotation=rot, major_segments=32, minor_segments=10)
    o = bpy.context.object; o.name = name
    return _finish(o, m)

def dome(name, m, loc, scale, rot=(0, 0, 0)):
    """Meia esfera (capacetes, ombreiras)."""
    o = blob(name, m, loc, scale, rot)
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in [v for v in bm.verts if v.co.z < -0.001]: bm.verts.remove(v)
    bm.to_mesh(o.data); bm.free()
    return o

def cape(name, m, top, width, length):
    """Capa curva (malha própria, presa ao osso 'cape')."""
    bm = bmesh.new()
    cols, rows = 9, 6
    vs = []
    for r in range(rows + 1):
        row = []
        t = r / rows
        w = width * (0.75 + 0.45 * t)
        for c in range(cols + 1):
            a = (c / cols - 0.5) * math.pi * 0.85
            row.append(bm.verts.new((math.sin(a) * w, math.cos(a) * w * 0.55 + 0.05 + 0.12 * t, -length * t)))
        vs.append(row)
    for r in range(rows):
        for c in range(cols):
            bm.faces.new((vs[r][c], vs[r][c + 1], vs[r + 1][c + 1], vs[r + 1][c]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = top
    o.modifiers.new("solid", 'SOLIDIFY').thickness = 0.03
    return _finish(o, m)

# ------------------------------------------------------------------ esqueleto
BONES = {  # nome: (cabeça, cauda, pai)
    "root":   ((0, 0, 0), (0, 0, 0.3), None),
    "hips":   ((0, 0, 0.55), (0, 0, 0.85), "root"),
    "spine":  ((0, 0, 0.85), (0, 0, 1.25), "hips"),
    "head":   ((0, 0, 1.25), (0, 0, 2.0), "spine"),
    "arm.L":  ((0.42, 0, 1.12), (0.5, 0, 0.78), "spine"),
    "hand.L": ((0.5, 0, 0.78), (0.52, 0, 0.62), "arm.L"),
    "arm.R":  ((-0.42, 0, 1.12), (-0.5, 0, 0.78), "spine"),
    "hand.R": ((-0.5, 0, 0.78), (-0.52, 0, 0.62), "arm.R"),
    "leg.L":  ((0.17, 0, 0.55), (0.17, 0, 0.08), "hips"),
    "leg.R":  ((-0.17, 0, 0.55), (-0.17, 0, 0.08), "hips"),
    "cape":   ((0, 0.18, 1.2), (0, 0.22, 0.7), "spine"),
}

def armature(name, scale=1.0):
    arm = bpy.data.armatures.new(name + "_rig")
    rig = bpy.data.objects.new(name + "_rig", arm)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for b, (h, t, p) in BONES.items():
        eb = arm.edit_bones.new(b)
        eb.head = Vector(h) * scale; eb.tail = Vector(t) * scale
        if p: eb.parent = arm.edit_bones[p]
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig

def attach(rig, bone, objs):
    """Prende as peças a um osso (pele rígida: cada peça segue um osso, estilo boneco articulado)."""
    bpy.context.view_layer.update()   # sem isto, a última peça criada ainda está com a matriz antiga (perde a escala)
    for o in objs:
        mw = o.matrix_world.copy()
        o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bone
        o.matrix_world = mw

# ------------------------------------------------------------------ animação
def bone_euler(bone, rot):
    """Pose em graus → Euler do osso. Braços: Z positivo = para fora do corpo nos dois lados (medido com probe)."""
    rx, ry, rz = rot
    if bone in ("arm.L", "hand.L"): rz = -rz
    return Euler((math.radians(rx), math.radians(ry), math.radians(rz)))

LAG = {"head": 2, "cape": 4, "hand.L": 1, "hand.R": 1}   # atraso (quadros) que dá peso ao movimento

def action(rig, name, keys, base=None, lag=LAG):
    """keys: [(quadro, {osso: (rx, ry, rz) em graus, "hips_loc": (x, y, z)})].
    - Todo osso é gravado em todo quadro-chave; ossos não citados vão para a pose base (ou neutra).
    - base: pose de fundo do personagem (ex.: braço do escudo em guarda), usada quando o quadro não cita o osso.
    - lag: cabeça, capa e mãos acompanham o corpo com alguns quadros de atraso (continuidade do movimento).
    Interpolação Bézier com alças automáticas (padrão do Blender): acelera e desacelera suave."""
    base = base or {}
    act = bpy.data.actions.new(name)
    rig.animation_data_create(); rig.animation_data.action = act
    last = keys[-1][0]
    for i, (f, poses) in enumerate(keys):
        for b in BONES:
            pb = rig.pose.bones[b]
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = bone_euler(b, poses.get(b, base.get(b, (0, 0, 0))))
            fl = f if i in (0, len(keys) - 1) else min(last, f + lag.get(b, 0))
            pb.keyframe_insert("rotation_euler", frame=fl)
        hb = rig.pose.bones["hips"]
        hb.location = Vector(poses.get("hips_loc", (0, 0, 0)))
        hb.keyframe_insert("location", frame=f)
    act.use_fake_user = True
    tr = rig.animation_data.nla_tracks.new(); tr.name = name
    tr.strips.new(name, int(keys[0][0]), act)
    rig.animation_data.action = None
    return act

def standard_actions(rig, weapon_arm="arm.R", base=None, shield_arm=False):
    """As 6 ações padrão, com a mesma linguagem corporal em todos os personagens.
    Convenção (calibrada com renders laterais, personagem olhando para -Y):
      braços: X negativo = para a frente/para cima (-90 = horizontal à frente, -128 = máximo para a arma: acima disso ela cruza a cabeça grande), positivo = para trás
      spine/head/root: X positivo = inclina para trás, negativo = para a frente
      braços: Z positivo = abre para fora do corpo (os dois lados)
      hips_loc: Y negativo = avança, Z = sobe
    shield_arm=True: o outro braço segura um escudo e fica em guarda (pose base) em todas as ações
      armas ficam horizontais apontando para a frente na pose de descanso (postura de guarda)
    Quadros de impacto (a apresentação sincroniza o dano com eles): Attack = 17, Cast = 19.
    A arma nunca sobe acima de -110: com a cabeça grande do estilo chibi, acima disso ela cruza a cabeça.
    Idle e Victory começam e terminam iguais (laço sem emenda)."""
    W = weapon_arm
    O = "arm.L" if W == "arm.R" else "arm.R"
    WH = "hand." + W[-1]   # punho da arma: inclina a arma para cima nas poses erguidas (passa acima do ombro, não atrás da cabeça)
    B = base or {}
    def act(name, keys):
        if shield_arm:   # o braço do escudo não acompanha os gestos: mantém a guarda, só abre um pouco
            g = B.get(O, (-40, 0, 12))
            keys = [(f, {k: (v if k != O else (g[0] - 6, 0, g[2] + 16)) for k, v in p.items()}) for f, p in keys]
        action(rig, name, keys, base=B)
    act("Idle", [
        (1, {"spine": (2, 0, 0), "head": (-1, 0, 0), W: (-10, 0, 6), "cape": (-6, 0, 0)}),
        (13, {"spine": (0, 0, 1), "head": (1, 0, -1), W: (-12, 0, 8), "hips_loc": (0, 0, -0.012), "cape": (-8, 0, 0)}),
        (25, {"spine": (-2, 0, 0), "head": (2, 0, 0), W: (-14, 0, 9), "hips_loc": (0, 0, -0.025), "cape": (-11, 0, 0)}),
        (37, {"spine": (0, 0, -1), "head": (1, 0, 1), W: (-12, 0, 8), "hips_loc": (0, 0, -0.012), "cape": (-8, 0, 0)}),
        (49, {"spine": (2, 0, 0), "head": (-1, 0, 0), W: (-10, 0, 6), "cape": (-6, 0, 0)})])
    act("Attack", [   # golpe lateral: prepara com o braço para trás, corta para a frente e para baixo
        (1, {W: (-10, 0, 6)}),
        (5, {W: (-20, 0, 10), "spine": (-4, 0, 0), "hips_loc": (0, 0.02, -0.04)}),                       # antecipação: abaixa
        (11, {W: (55, 0, 22), "spine": (6, -14, 0), "head": (2, 6, 0), "hips_loc": (0, 0.05, -0.02), "cape": (-6, 0, 0)}),  # braço atrás, tronco gira
        (15, {W: (65, 0, 24), "spine": (8, -18, 0), "head": (2, 8, 0), "hips_loc": (0, 0.06, -0.02)}),  # segura
        (17, {W: (-75, 0, 10), "spine": (-14, 16, 0), "head": (-6, -4, 0), "hips_loc": (0, -0.14, -0.05), "cape": (-20, 0, 0)}),  # impacto
        (20, {W: (-60, 0, 8), "spine": (-18, 20, 0), "head": (-8, -6, 0), "hips_loc": (0, -0.16, -0.06), "cape": (-32, 0, 0)}),   # passa do ponto
        (28, {W: (-30, 0, 8), "spine": (-6, 6, 0), "hips_loc": (0, -0.05, -0.02), "cape": (-16, 0, 0)}),
        (40, {W: (-10, 0, 6), "cape": (-6, 0, 0)})])
    act("Cast", [
        (1, {W: (-10, 0, 6)}),
        (8, {W: (-60, 0, 0), O: (-45, 0, 12), "spine": (4, 0, 0), "head": (2, 0, 0), "hips_loc": (0, 0, -0.03)}),
        (16, {W: (-105, 0, 0), O: (-100, 0, 18), "spine": (8, 0, 0), "head": (4, 0, 0), "hips_loc": (0, 0.03, 0.04)}),
        (19, {W: (-100, 0, 0), O: (-75, 0, 14), "spine": (-10, 0, 0), "head": (-6, 0, 0), "hips_loc": (0, -0.06, 0), "cape": (-16, 0, 0)}),  # lança
        (26, {W: (-55, 0, 8), O: (-40, 0, 12), "spine": (-4, 0, 0), "cape": (-14, 0, 0)}),
        (40, {W: (-10, 0, 6), "cape": (-6, 0, 0)})])
    act("Hit", [
        (1, {W: (-10, 0, 6)}),
        (4, {"spine": (20, 0, 6), "head": (16, 0, 0), W: (20, 0, 20), "hips_loc": (0, 0.1, 0), "cape": (10, 0, 0)}),
        (10, {"spine": (8, 0, 2), "head": (6, 0, 0), W: (0, 0, 10), "hips_loc": (0, 0.05, 0)}),
        (24, {W: (-10, 0, 6), "cape": (-6, 0, 0)})])
    act("Death", [
        (1, {W: (-10, 0, 6)}),
        (8, {"spine": (22, 0, 0), "head": (18, 0, 0), W: (35, 0, 22), O: (35, 0, 35), "hips_loc": (0, 0.06, 0)}),
        (18, {"root": (40, 0, 0), "spine": (14, 0, 0), "head": (12, 0, 0), W: (-20, 0, 22), O: (-30, 0, 45), "hips_loc": (0, 0.1, 0)}),
        (26, {"root": (94, 0, 0), "spine": (6, 0, 0), "head": (16, 0, 0), W: (-40, 0, 22), O: (-70, 0, 55), "leg.L": (-25, 0, 0), "leg.R": (-30, 0, 0)}),
        (32, {"root": (86, 0, 0), "spine": (10, 0, 0), "head": (12, 0, 0), W: (-38, 0, 22), O: (-65, 0, 55), "leg.L": (-18, 0, 0), "leg.R": (-22, 0, 0)}),
        (44, {"root": (90, 0, 0), "spine": (8, 0, 0), "head": (14, 0, 0), W: (-40, 0, 22), O: (-70, 0, 55), "leg.L": (-20, 0, 0), "leg.R": (-25, 0, 0)})])
    act("Victory", [
        (1, {W: (-10, 0, 6)}),
        (8, {W: (-60, 0, 0), "spine": (-6, 0, 0), "hips_loc": (0, 0, -0.06)}),
        (14, {W: (-110, 0, 0), "spine": (4, 0, 0), "head": (4, 0, 0), "hips_loc": (0, 0, 0.3), "cape": (-25, 0, 0)}),
        (20, {W: (-110, 0, 0), "spine": (2, 0, 0), "head": (2, 0, 0), "hips_loc": (0, 0, 0.02), "cape": (-12, 0, 0)}),
        (26, {W: (-110, 0, 0), "spine": (4, 0, 0), "head": (4, 0, 0), "hips_loc": (0, 0, 0.3), "cape": (-25, 0, 0)}),
        (32, {W: (-110, 0, 0), "spine": (2, 0, 0), "head": (2, 0, 0), "hips_loc": (0, 0, 0.02), "cape": (-12, 0, 0)}),
        (48, {W: (-10, 0, 6), "cape": (-6, 0, 0)})])

def attach_posed(rig, bone, objs, pose):
    """Prende peças modeladas com o personagem já na pose indicada (ex.: escudo modelado com o braço em guarda).
    Assim a peça fica exatamente onde foi desenhada quando o braço estiver naquela pose."""
    for b, rot in pose.items():
        pb = rig.pose.bones[b]; pb.rotation_mode = 'XYZ'; pb.rotation_euler = bone_euler(b, rot)
    bpy.context.view_layer.update()
    attach(rig, bone, objs)
    for b in pose: rig.pose.bones[b].rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()

def report_clipping(rig, gear, body, frames=None):
    """Confere se peças de equipamento atravessam o corpo nas ações (BVH). Imprime e devolve os casos."""
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get
    problems = []
    rig.animation_data_create()
    for act in [a for a in bpy.data.actions]:
        for t in rig.animation_data.nla_tracks: t.mute = True
        rig.animation_data.action = act
        f0, f1 = (int(x) for x in act.frame_range)
        for f in (frames or range(f0, f1 + 1, 3)):
            bpy.context.scene.frame_set(f)
            d = dg()
            def tree(name):
                ob = bpy.data.objects[name].evaluated_get(d); me = ob.to_mesh()
                t = BVHTree.FromPolygons([ob.matrix_world @ v.co for v in me.vertices], [p.vertices for p in me.polygons])
                ob.to_mesh_clear(); return t
            trees = {n: tree(n) for n in gear + body}
            for g in gear:
                for b in body:
                    if trees[g].overlap(trees[b]): problems.append((act.name, f, g, b))
    rig.animation_data.action = None
    for t in rig.animation_data.nla_tracks: t.mute = False
    seen = set()
    for a, f, g, b in problems:
        if (a, g, b) in seen: continue
        seen.add((a, g, b)); print(f"CLIPPING: {a} quadro {f}: {g} atravessa {b}")
    if not problems: print("sem atravessamentos")
    return problems

# ------------------------------------------------------------------ exportação
def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=False,
                              export_apply=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                              export_force_sampling=True, export_yup=True)
    print("exportado:", path)

def out_path(rel):
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(root, "game", "assets", rel)
