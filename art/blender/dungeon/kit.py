"""Kit modular da masmorra: piso, paredes, arco com grade, pilares, tochas, braseiro, estandarte,
correntes, urna, baú, moedas, ossos, cristais, barril, caixote e trono.

    blender -b -P art/blender/dungeon/kit.py                 → todas as peças
    blender -b -P art/blender/dungeon/kit.py -- tocha bau    → só as peças pedidas

Cada peça vira um .glb com uma malha só em game/assets/dungeon/<nome>.glb.
Convenções (as mesmas dos personagens): Z para cima, frente da peça para -Y, origem no chão.
Peças de parede (tocha, estandarte, corrente) têm a origem na face da parede, saindo para -Y.

Os materiais com prefixo piso*, parede*, estandarte*, brasa* e cristal* são tingidos no Godot
conforme o tema da masmorra (dungeon_room.gd), por isso são modelados em tons neutros.
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import bpy, bmesh
from mathutils import Matrix, Euler
from lib import reset, mat, hexc, blob, block, tube, ring, dome, export, out_path

R = random.Random(7)
PI = math.pi

def mats():
    """Paleta do kit (recriada a cada peça, depois do reset)."""
    return {
        "piso": [mat("piso_a", hexc("9a9296")), mat("piso_b", hexc("8a8388")), mat("piso_c", hexc("a59ea0"))],
        "parede": [mat("parede_a", hexc("8f878c")), mat("parede_b", hexc("7f787e")), mat("parede_c", hexc("9b9497"))],
        "borda": mat("parede_borda", hexc("6f686e")),
        "rejunte": mat("rejunte", hexc("1d1820"), rough=1.0),
        "vazio": mat("vazio", hexc("050307"), rough=1.0),
        "ferro": mat("ferro", hexc("4a4d55"), rough=0.45, metal=0.8),
        "ouro": mat("ouro", hexc("d9a339"), rough=0.3, metal=0.9),
        "madeira": mat("madeira", hexc("7a4f2c"), rough=0.85),
        "madeira_esc": mat("madeira_escura", hexc("4f321c"), rough=0.9),
        "osso": mat("osso", hexc("ddd4bd"), rough=0.7),
        "barro": mat("barro", hexc("a0583a"), rough=0.8),
        "estandarte": mat("estandarte", hexc("b9b2b0"), rough=0.9),
        "brasa": mat("brasa", hexc("ff8a3a"), rough=0.9, emit=hexc("ff7a2a")),
        "cristal": mat("cristal", hexc("cfe8ff"), rough=0.15, emit=hexc("9fd4ff")),
        "almofada": mat("estandarte_almofada", hexc("8f8886"), rough=0.95),
    }

def jit(a):
    return R.uniform(-a, a)

def stone(name, m, loc, size, rot=(0, 0, 0), bevel=0.05):
    """Pedra talhada: bloco com chanfro simples (leve para o navegador)."""
    return block(name, m, loc, (size[0] / 2, size[1] / 2, size[2] / 2), rot=rot, bevel=bevel, segs=1)

def cut(target, cutter):
    """Subtrai `cutter` de `target` (boolean) e apaga o cortador."""
    mod = target.modifiers.new("corte", 'BOOLEAN'); mod.operation = 'DIFFERENCE'; mod.object = cutter; mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

def finish(name):
    """Aplica os modificadores, junta tudo numa malha com origem em (0,0,0) e exporta."""
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print(f"peça {name}: {tris} triângulos, {len(o.data.materials)} materiais")
    export(out_path(f"dungeon/{name}.glb"))

# ------------------------------------------------------------------ piso
def _slab(M, cx, cy, s=0.97, h=0.3, name="laje"):
    stone(f"{name}{cx:.1f}_{cy:.1f}", R.choice(M["piso"]), (cx + jit(0.01), cy + jit(0.01), -h / 2 + jit(0.015)),
          (s, s, h), rot=(jit(0.012), jit(0.012), jit(0.03)), bevel=0.06)

def piso(variant="liso"):
    """Trecho de 2 x 2 m: quatro lajes sobre o rejunte escuro."""
    M = mats()
    stone("rejunte", M["rejunte"], (0, 0, -0.2), (2.0, 2.0, 0.3), bevel=0)
    for i, (cx, cy) in enumerate(((-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5))):
        if variant == "rachado" and i == 1:
            # laje quebrada em três pedaços, um levemente afundado
            for j, (dx, dy, w, d) in enumerate(((-0.24, -0.2, 0.46, 0.54), (0.25, -0.21, 0.44, 0.52), (0.0, 0.26, 0.94, 0.42))):
                stone(f"caco{j}", R.choice(M["piso"]), (cx + dx, cy + dy, -0.15 - 0.02 * j), (w, d, 0.3),
                      rot=(jit(0.04), jit(0.04), jit(0.08)), bevel=0.05)
        else:
            _slab(M, cx, cy)
    if variant == "pedras":
        for k in range(4):
            blob(f"pedrisco{k}", R.choice(M["piso"]), (jit(0.8), jit(0.8), 0.02),
                 (R.uniform(0.05, 0.11), R.uniform(0.05, 0.1), 0.05), rot=(0, 0, jit(PI)), segs=6)

# ------------------------------------------------------------------ paredes
WALL_W, WALL_H, WALL_D, ROW = 4.0, 3.6, 0.8, 0.6

def _bricks(M, skip=None):
    """Fiadas de tijolos de pedra desencontradas, com profundidade e tamanho variados."""
    rows = int(WALL_H / ROW)
    for r in range(rows):
        x = -WALL_W / 2 - (0.5 if r % 2 else 0.0)
        while x < WALL_W / 2:
            w = R.uniform(0.9, 1.3)
            x0, x1 = max(x, -WALL_W / 2), min(x + w, WALL_W / 2)
            x += w
            if x1 - x0 < 0.25: continue
            z0 = r * ROW
            if skip and skip(x0, x1, z0, z0 + ROW): continue
            bw, bh = x1 - x0 - 0.04, ROW - 0.05
            out = R.uniform(0.0, 0.05) if R.random() > 0.15 else 0.1   # alguns tijolos saltados
            stone(f"tijolo{r}_{x0:.2f}", R.choice(M["parede"]), ((x0 + x1) / 2, -WALL_D / 2 + 0.3 - out / 2, z0 + ROW / 2),
                  (bw, 0.6 + out, bh), rot=(jit(0.01), 0, jit(0.015)), bevel=0.05)
    stone("cimalha", M["borda"], (0, -0.02, WALL_H + 0.12), (WALL_W + 0.02, WALL_D + 0.16, 0.24), bevel=0.05)
    stone("rodape", M["borda"], (0, -0.04, 0.12), (WALL_W + 0.02, WALL_D + 0.1, 0.24), bevel=0.04)

def parede():
    """Segmento de parede de 4 m de largura e 3,6 m de altura."""
    M = mats()
    stone("massa", M["rejunte"], (0, 0.08, WALL_H / 2), (WALL_W, WALL_D - 0.2, WALL_H), bevel=0)
    _bricks(M)

ARCH_R, ARCH_Z = 1.25, 1.75   # raio do vão e altura onde começa a curva

def _arch_top(x):
    return ARCH_Z + math.sqrt(max(0.0, ARCH_R ** 2 - x ** 2)) if abs(x) < ARCH_R else 0.0

def parede_arco():
    """Parede com um arco de pedra e uma grade de ferro na passagem escura."""
    M = mats()
    back = stone("massa", M["rejunte"], (0, 0.08, WALL_H / 2), (WALL_W, WALL_D - 0.2, WALL_H), bevel=0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=ARCH_R, depth=2, location=(0, 0, ARCH_Z), rotation=(PI / 2, 0, 0))
    c1 = bpy.context.object
    cut(back, c1)
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, ARCH_Z / 2 - 0.05), scale=(ARCH_R, 1, ARCH_Z / 2 + 0.05))
    cut(back, bpy.context.object)
    stone("passagem", M["vazio"], (0, 0.42, 1.6), (2.8, 0.1, 3.2), bevel=0)
    R2 = ARCH_R + 0.45
    def skip(x0, x1, z0, z1):
        return any(z0 < _arch_top_outer(x0 + (x1 - x0) * t / 6, R2) for t in range(7))
    _bricks(M, skip)
    # aduelas do arco e ombreiras
    n = 9
    for i in range(n):
        a = PI * (i + 0.5) / n
        rm = (ARCH_R + R2) / 2
        stone(f"aduela{i}", M["borda"] if i == n // 2 else R.choice(M["parede"]),
              (math.cos(a) * rm, -0.04, ARCH_Z + math.sin(a) * rm), (0.42, WALL_D + 0.08, PI * rm / n - 0.04),
              rot=(0, -(a - PI / 2) + PI / 2, 0), bevel=0.04)
    for sx in (1, -1):
        for k in range(3):
            stone(f"ombreira{sx}{k}", R.choice(M["parede"]), (sx * (ARCH_R + 0.225), -0.04, 0.3 + k * 0.58),
                  (0.43, WALL_D + 0.08, 0.54), bevel=0.04)
    # parte de cima e de baixo: preenche a cimalha e o rodapé que os tijolos pularam
    stone("cimalha_arco", M["borda"], (0, -0.02, WALL_H + 0.12), (WALL_W + 0.02, WALL_D + 0.16, 0.24), bevel=0.05)
    # grade: barras verticais até a curva e duas travessas
    for i in range(7):
        x = -0.96 + i * 0.32
        top = _arch_top(x) - 0.05
        tube(f"barra{i}", M["ferro"], (x, 0.05, top / 2), 0.04, top, verts=8)
        tube(f"ponta{i}", M["ferro"], (x, 0.05, 0.06), 0.06, 0.12, verts=8, r2=0.03)
    for z in (0.9, 1.9):
        half = ARCH_R if z <= ARCH_Z else math.sqrt(ARCH_R ** 2 - (z - ARCH_Z) ** 2)
        stone(f"travessa{z}", M["ferro"], (0, 0.05, z), (2 * half - 0.04, 0.08, 0.1), bevel=0.02)

def _arch_top_outer(x, r):
    return ARCH_Z + math.sqrt(max(0.0, r ** 2 - x ** 2)) if abs(x) < r else -1.0

# ------------------------------------------------------------------ pilares
def _drum(M, name, z, h, r, rot=(0, 0, 0), x=0.0, y=0.0):
    tube(name, R.choice(M["parede"]), (x, y, z + h / 2), r, h, rot=rot, verts=12, bevel=0.03)

def pilar():
    """Coluna de 6,4 m: base, três tambores, anéis e capitel."""
    M = mats()
    stone("base", M["borda"], (0, 0, 0.2), (1.35, 1.35, 0.4), bevel=0.06)
    stone("base2", M["parede"][0], (0, 0, 0.5), (1.1, 1.1, 0.2), bevel=0.05)
    z = 0.6
    for k, h in enumerate((1.8, 1.8, 1.6)):
        _drum(M, f"tambor{k}", z, h - 0.04, 0.48 - 0.015 * k, rot=(0, 0, jit(0.3)))
        z += h
        if k < 2: ring(f"anel{k}", M["borda"], (0, 0, z - 0.02), 0.48, 0.05)
    stone("capitel", M["parede"][2], (0, 0, z + 0.1), (1.1, 1.1, 0.2), bevel=0.05)
    stone("abaco", M["borda"], (0, 0, z + 0.33), (1.35, 1.35, 0.26), bevel=0.06)

def coluna_quebrada():
    """Toco de coluna com o pedaço caído ao lado e entulho."""
    M = mats()
    stone("base", M["borda"], (0, 0, 0.2), (1.35, 1.35, 0.4), bevel=0.06)
    _drum(M, "toco", 0.4, 1.3, 0.48)
    # topo partido: cone baixo inclinado
    tube("quebra", R.choice(M["parede"]), (0.05, 0.02, 1.86), 0.47, 0.32, rot=(0.25, -0.2, 0), verts=12, r2=0.18)
    tube("caido", R.choice(M["parede"]), (1.25, -0.6, 0.44), 0.44, 1.5, rot=(PI / 2, 0, 1.1), verts=12, bevel=0.03)
    for k in range(7):
        blob(f"entulho{k}", R.choice(M["parede"]), (R.uniform(-1, 1.8), R.uniform(-1.3, 0.6), 0.07),
             (R.uniform(0.08, 0.2), R.uniform(0.08, 0.18), R.uniform(0.06, 0.12)), rot=(0, 0, jit(PI)), segs=6)

# ------------------------------------------------------------------ fogo (a chama é do Godot)
def tocha():
    """Suporte de tocha na parede. Chama no Godot em (0, 0.42, 0.42) em coordenadas Godot."""
    M = mats()
    stone("placa", M["ferro"], (0, -0.03, 0), (0.22, 0.06, 0.55), bevel=0.02)
    for z in (0.18, -0.18):
        blob(f"cravo{z}", M["ferro"], (0, -0.07, z), (0.04, 0.03, 0.04), segs=8)
    tube("braco", M["ferro"], (0, -0.2, 0.05), 0.035, 0.36, rot=(PI / 2 - 0.5, 0, 0), verts=8)
    tube("haste", M["madeira_esc"], (0, -0.42, 0.15), 0.06, 0.4, verts=10)
    tube("copa", M["ferro"], (0, -0.42, 0.33), 0.16, 0.2, verts=14, r2=0.08, rot=(PI, 0, 0))
    ring("aro", M["ouro"], (0, -0.42, 0.42), 0.15, 0.025)
    blob("pano", M["brasa"], (0, -0.42, 0.42), (0.1, 0.1, 0.06), segs=10)

def braseiro():
    """Braseiro de pedra com cuba de ferro e brasas. Chama no Godot em (0, 1.12, 0)."""
    M = mats()
    tube("pe", M["borda"], (0, 0, 0.12), 0.48, 0.24, verts=8, bevel=0.03)
    tube("coluna", R.choice(M["parede"]), (0, 0, 0.6), 0.28, 0.75, verts=8, bevel=0.03)
    tube("cuba", M["ferro"], (0, 0, 1.0), 0.62, 0.3, verts=16, r2=0.36, rot=(PI, 0, 0))
    ring("borda_cuba", M["ouro"], (0, 0, 1.15), 0.6, 0.04)
    for k in range(3):
        a = k / 3 * 2 * PI
        tube(f"garra{k}", M["ferro"], (math.cos(a) * 0.5, math.sin(a) * 0.5, 1.1), 0.04, 0.28,
             rot=(math.sin(a) * 0.5, -math.cos(a) * 0.5, 0), verts=6, r2=0.0)
    for k in range(9):
        a, d = R.uniform(0, 2 * PI), R.uniform(0, 0.4)
        blob(f"brasa{k}", M["brasa"], (math.cos(a) * d, math.sin(a) * d, 1.12), (0.12, 0.11, 0.07), rot=(0, 0, a), segs=6)

# ------------------------------------------------------------------ decoração de parede
def estandarte():
    """Estandarte na parede: barra de ferro, pano com ponta em V e emblema de coroa."""
    M = mats()
    tube("barra", M["ferro"], (0, -0.12, 2.65), 0.035, 1.55, rot=(0, PI / 2, 0), verts=8)
    for sx in (1, -1):
        blob(f"pomo{sx}", M["ouro"], (0.8 * sx, -0.12, 2.65), (0.07, 0.07, 0.07), segs=10)
        tube(f"suporte{sx}", M["ferro"], (0.62 * sx, -0.06, 2.65), 0.025, 0.12, rot=(PI / 2, 0, 0), verts=6)
    bm = bmesh.new()
    cols, rows, w, top, bot = 8, 12, 1.2, 2.6, 0.55
    grid = []
    for r in range(rows + 1):
        t = r / rows
        z = top - (top - bot) * t
        row = []
        for c in range(cols + 1):
            u = c / cols
            x = (u - 0.5) * w
            z_c = z - 0.38 * (1 - abs(u - 0.5) * 2) * (t - 0.8) / 0.2 if t > 0.8 else z   # ponta em V
            y = -0.14 - 0.035 * math.sin(u * PI * 2 + t * 2.5) * t
            row.append(bm.verts.new((x, y, z_c)))
        grid.append(row)
    for r in range(rows):
        for c in range(cols):
            bm.faces.new((grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]))
    me = bpy.data.meshes.new("pano"); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("pano", me); bpy.context.collection.objects.link(o)
    o.modifiers.new("solid", 'SOLIDIFY').thickness = 0.025
    o.data.materials.append(M["estandarte"])
    for p in o.data.polygons: p.use_smooth = True
    for sx in (1, -1):
        stone(f"faixa{sx}", M["ouro"], (0.52 * sx, -0.165, 1.75), (0.06, 0.02, 1.55), bevel=0.005)
    ring("emblema", M["ouro"], (0, -0.18, 1.95), 0.24, 0.035, rot=(PI / 2, 0, 0))
    tube("disco", M["almofada"], (0, -0.17, 1.95), 0.22, 0.02, rot=(PI / 2, 0, 0), verts=24)
    stone("coroa", M["ouro"], (0, -0.2, 1.88), (0.26, 0.03, 0.08), bevel=0.01)
    for k in (-1, 0, 1):
        tube(f"pico{k}", M["ouro"], (k * 0.1, -0.2, 2.0 + (0.03 if k == 0 else 0)), 0.035, 0.16, verts=6, r2=0.0)

def corrente():
    """Corrente pendurada na parede, com argola e grilhão."""
    M = mats()
    stone("placa", M["ferro"], (0, -0.03, 3.0), (0.26, 0.06, 0.26), bevel=0.02)
    ring("argola", M["ferro"], (0, -0.12, 2.86), 0.1, 0.025, rot=(0, PI / 2, 0))
    z = 2.72
    for k in range(13):
        ring(f"elo{k}", M["ferro"], (0, -0.12 - 0.012 * k, z), 0.07, 0.02, rot=(0, PI / 2, 0) if k % 2 else (PI / 2, 0, PI / 2), segs=(12, 6))
        z -= 0.11
    ring("grilhao", M["ferro"], (0, -0.28, z - 0.08), 0.13, 0.035, rot=(PI / 2, 0, 0))
    tube("trava", M["ferro"], (0, -0.28, z - 0.2), 0.05, 0.08, verts=8)

# ------------------------------------------------------------------ objetos soltos
def urna():
    """Urna de barro com alças, para a cripta e os depósitos."""
    M = mats()
    tube("pe", M["barro"], (0, 0, 0.06), 0.2, 0.12, verts=16, r2=0.24)
    blob("bojo", M["barro"], (0, 0, 0.42), (0.36, 0.36, 0.34), segs=18)
    tube("gargalo", M["barro"], (0, 0, 0.8), 0.15, 0.2, verts=16, r2=0.13)
    ring("boca", M["barro"], (0, 0, 0.9), 0.15, 0.04)
    ring("faixa", M["ouro"], (0, 0, 0.52), 0.355, 0.02)
    for sx in (1, -1):
        ring(f"alca{sx}", M["barro"], (0.3 * sx, 0, 0.66), 0.09, 0.025, rot=(PI / 2, 0, 0))

def bau():
    """Baú de madeira com cintas de ferro, cantoneiras e fechadura de ouro."""
    M = mats()
    stone("caixa", M["madeira"], (0, 0, 0.3), (1.0, 0.64, 0.6), bevel=0.03)
    # tampa abaulada e cintas: cilindros deitados cortados ao meio (só a metade de cima fica)
    lid = [tube("tampa", M["madeira"], (0, 0, 0.6), 0.32, 1.0, rot=(0, PI / 2, 0), verts=16)]
    for x in (-0.32, 0.32):
        stone(f"cinta{x}", M["ferro"], (x, 0, 0.3), (0.08, 0.68, 0.62), bevel=0.01)
        lid.append(tube(f"cinta_tampa{x}", M["ferro"], (x, 0, 0.6), 0.335, 0.08, rot=(0, PI / 2, 0), verts=16))
    for o in lid:
        bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.3), scale=(0.7, 0.5, 0.3))
        cut(o, bpy.context.object)
    for sx in (1, -1):
        for sy in (1, -1):
            stone(f"canto{sx}{sy}", M["ouro"], (0.49 * sx, 0.31 * sy, 0.06), (0.06, 0.06, 0.12), bevel=0.01)
    stone("fechadura", M["ouro"], (0, -0.33, 0.55), (0.16, 0.04, 0.2), bevel=0.015)
    blob("buraco", M["vazio"], (0, -0.355, 0.54), (0.02, 0.01, 0.04), segs=8)

def moedas():
    """Montinho de moedas brilhantes (item do cenário que dá ouro)."""
    M = mats()
    dome("monte", M["ouro"], (0, 0, 0), (0.42, 0.36, 0.2))
    for k in range(16):
        a, d = R.uniform(0, 2 * PI), R.uniform(0.05, 0.5)
        z = max(0.012, 0.2 * (1 - (d / 0.45) ** 2)) if d < 0.45 else 0.012
        tube(f"moeda{k}", M["ouro"], (math.cos(a) * d, math.sin(a) * d, z), 0.07, 0.02,
             rot=(jit(0.5), jit(0.5), 0), verts=12)

def ossos():
    """Caveira e ossos espalhados."""
    M = mats()
    blob("cranio", M["osso"], (0, 0, 0.17), (0.17, 0.19, 0.16), segs=14)
    blob("queixo", M["osso"], (0, -0.1, 0.07), (0.1, 0.08, 0.06), segs=10)
    for sx in (1, -1):
        blob(f"orbita{sx}", M["vazio"], (0.065 * sx, -0.165, 0.18), (0.045, 0.03, 0.05), segs=8)
    for k in range(5):
        a = R.uniform(0, 2 * PI)
        x, y, L = R.uniform(-0.6, 0.6), R.uniform(-0.5, 0.5), R.uniform(0.35, 0.6)
        if abs(x) < 0.25 and abs(y) < 0.25: x += 0.4
        rot = (PI / 2, 0, a)
        tube(f"osso{k}", M["osso"], (x, y, 0.05), 0.035, L, rot=rot, verts=8)
        for e in (1, -1):
            blob(f"ponta{k}{e}", M["osso"], (x + math.sin(a) * -L / 2 * e, y + math.cos(a) * L / 2 * e, 0.05),
                 (0.06, 0.06, 0.05), segs=8)

def cristal():
    """Aglomerado de cristais luminosos sobre uma rocha."""
    M = mats()
    blob("rocha", M["parede"][1], (0, 0, 0.05), (0.5, 0.42, 0.2), segs=8)
    for k, (x, y, h, tx, ty) in enumerate(((0, 0, 1.1, 0, 0), (0.25, 0.08, 0.7, 0, 0.4), (-0.22, 0.05, 0.8, 0, -0.35),
                                           (0.05, -0.22, 0.55, 0.4, 0), (-0.05, 0.24, 0.6, -0.35, 0.1))):
        r = 0.12 if k == 0 else 0.085
        # prisma de seis lados com ponta, montado de pé na origem e depois inclinado a partir da base
        place = Matrix.Translation((x, y, 0.05)) @ Euler((tx, ty, jit(PI))).to_matrix().to_4x4()
        prism = tube(f"prisma{k}", M["cristal"], (0, 0, h / 2), r, h, verts=6)
        tip = tube(f"ponta{k}", M["cristal"], (0, 0, h + r * 1.1), r, r * 2.2, verts=6, r2=0.0)
        for o in (prism, tip):
            for p in o.data.polygons: p.use_smooth = False
            o.matrix_world = place @ o.matrix_world

def barril():
    """Barril de madeira com aros de ferro."""
    M = mats()
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.42, depth=1.0, location=(0, 0, 0.5))
    o = bpy.context.object; o.name = "barril"
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.5], cuts=3)
    for v in bm.verts:
        bulge = 1 + 0.12 * (1 - (v.co.z / 0.5) ** 2)
        v.co.x *= bulge; v.co.y *= bulge
    bm.to_mesh(o.data); bm.free()
    o.data.materials.append(M["madeira"])
    for p in o.data.polygons: p.use_smooth = True
    for z, r in ((0.1, 0.43), (0.3, 0.47), (0.7, 0.47), (0.9, 0.43)):
        ring(f"aro{z}", M["ferro"], (0, 0, z), r, 0.025)
    tube("tampo", M["madeira_esc"], (0, 0, 0.99), 0.4, 0.03, verts=16)

def caixote():
    """Caixote de tábuas com quadro e travessa diagonal."""
    M = mats()
    s = 0.9
    stone("miolo", M["madeira"], (0, 0, s / 2), (s - 0.04, s - 0.04, s - 0.04), bevel=0.01)
    for sx in (1, -1):
        for sy in (1, -1):
            stone(f"poste{sx}{sy}", M["madeira_esc"], (sx * (s / 2 - 0.03), sy * (s / 2 - 0.03), s / 2), (0.09, 0.09, s), bevel=0.01)
    for z in (0.04, s - 0.04):
        for sy in (1, -1):
            stone(f"trave{z}{sy}", M["madeira_esc"], (0, sy * (s / 2 - 0.01), z), (s, 0.06, 0.09), bevel=0.01)
        for sx in (1, -1):
            stone(f"travex{z}{sx}", M["madeira_esc"], (sx * (s / 2 - 0.01), 0, z), (0.06, s, 0.09), bevel=0.01)
    stone("diagonal", M["madeira_esc"], (0, -s / 2 - 0.005, s / 2), (s * 1.25, 0.05, 0.08), rot=(0, PI / 4, 0), bevel=0.01)

def trono():
    """Trono do chefe: degraus, assento, encosto alto com picos de ouro e caveiras."""
    M = mats()
    stone("degrau1", M["borda"], (0, 0.1, 0.15), (4.6, 2.4, 0.3), bevel=0.05)
    stone("degrau2", M["parede"][0], (0, 0.25, 0.45), (3.6, 1.9, 0.3), bevel=0.05)
    stone("assento", M["parede"][2], (0, 0.3, 0.95), (2.2, 1.3, 0.7), bevel=0.06)
    stone("almofada", M["almofada"], (0, 0.25, 1.36), (1.7, 1.0, 0.14), bevel=0.05)
    stone("encosto", M["parede"][1], (0, 0.85, 2.45), (2.4, 0.45, 3.3), bevel=0.06)
    stone("encosto_pano", M["almofada"], (0, 0.6, 2.3), (1.6, 0.06, 2.3), bevel=0.02)
    stone("topo", M["ouro"], (0, 0.85, 4.15), (2.7, 0.55, 0.2), bevel=0.03)
    for k in range(-2, 3):
        tube(f"pico{k}", M["ouro"], (k * 0.55, 0.85, 4.55 + (0.2 if k == 0 else 0)), 0.11, 0.6 + (0.4 if k == 0 else 0), verts=8, r2=0.0)
    blob("joia", M["brasa"], (0, 0.56, 3.75), (0.14, 0.06, 0.18), segs=10)
    for sx in (1, -1):
        stone(f"braco{sx}", M["parede"][0], (1.25 * sx, 0.2, 1.55), (0.38, 1.4, 0.32), bevel=0.05)
        blob(f"caveira{sx}", M["osso"], (1.25 * sx, -0.5, 1.85), (0.2, 0.2, 0.18), segs=12)
        for ex in (1, -1):
            blob(f"olho{sx}{ex}", M["vazio"], (1.25 * sx + 0.07 * ex, -0.68, 1.88), (0.05, 0.03, 0.05), segs=8)
        tube(f"chifre{sx}", M["osso"], (1.25 * sx + 0.18 * sx, -0.45, 2.05), 0.06, 0.3, rot=(0, 0.6 * sx, 0), verts=8, r2=0.0)

PIECES = {
    "piso": lambda: piso("liso"), "piso_rachado": lambda: piso("rachado"), "piso_pedras": lambda: piso("pedras"),
    "parede": parede, "parede_arco": parede_arco, "pilar": pilar, "coluna_quebrada": coluna_quebrada,
    "tocha": tocha, "braseiro": braseiro, "estandarte": estandarte, "corrente": corrente,
    "urna": urna, "bau": bau, "moedas": moedas, "ossos": ossos, "cristal": cristal,
    "barril": barril, "caixote": caixote, "trono": trono,
}

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for name in (argv or PIECES):
        R.seed(sum(map(ord, name)))   # cada peça sai sempre igual
        reset()
        PIECES[name]()
        finish(name)
