"""Brom, o Guardião (anão tanque, elemento Natureza).
   blender -b -P art/blender/heroes/brom.py  → game/assets/characters/heroes/brom.glb"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *

reset()
skin = mat("pele", hexc("f2b48c"))
tunic = mat("tunica", hexc("4d7a3a"))
tunic_dk = mat("tunica_escura", hexc("365a29"))
mail = mat("cota", hexc("6f7884"), rough=0.5, metal=0.7)
steel = mat("aco", hexc("8e99a6"), rough=0.35, metal=0.9)
gold = mat("ouro", hexc("e2ad35"), rough=0.35, metal=0.85)
leather = mat("couro", hexc("5a3a22"), rough=0.8)
wood = mat("madeira", hexc("8a5a2b"), rough=0.85)
horn = mat("chifre", hexc("ece3cc"), rough=0.6)
beard = mat("barba", hexc("c0612b"), rough=0.9)
eye = mat("olho", hexc("1b1222"), rough=0.2)
shine = mat("brilho", (1, 1, 1), rough=0.1, emit=(1, 1, 1))
red = mat("capa", hexc("a8322b"), rough=0.85)

rig = armature("brom")

# ---- pernas e botas (curtas e largas: anão)
for sx, bone in ((1, "leg.L"), (-1, "leg.R")):
    x = 0.17 * sx
    attach(rig, bone, [
        tube(f"calca{bone}", tunic_dk, (x, 0, 0.36), 0.13, 0.32),
        blob(f"bota{bone}", leather, (x, -0.06, 0.1), (0.16, 0.24, 0.12)),
        ring(f"dobra{bone}", leather, (x, 0, 0.22), 0.14, 0.035),
    ])

# ---- tronco: túnica, cota de malha, cinto e fivela
attach(rig, "hips", [
    blob("barriga", tunic, (0, 0, 0.72), (0.46, 0.4, 0.4)),
    tube("saia", tunic_dk, (0, 0, 0.5), 0.43, 0.22, r2=0.47),
    tube("cinto", leather, (0, 0, 0.6), 0.47, 0.11, bevel=0.01),
    block("fivela", gold, (0, -0.47, 0.6), (0.11, 0.03, 0.08), bevel=0.015),
])
attach(rig, "spine", [
    blob("peito", mail, (0, 0, 1.0), (0.44, 0.36, 0.3)),
    dome("ombreiraE", steel, (0.42, 0, 1.08), (0.22, 0.22, 0.17)),
    dome("ombreiraD", steel, (-0.42, 0, 1.08), (0.22, 0.22, 0.17)),
    ring("rebordoE", gold, (0.42, 0, 1.08), 0.2, 0.025),
    ring("rebordoD", gold, (-0.42, 0, 1.08), 0.2, 0.025),
])

# ---- cabeça grande: rosto, olhos, nariz, barba, capacete com chifres
H = 1.68
head = [
    blob("cabeca", skin, (0, 0, H), (0.52, 0.5, 0.48)),
    blob("nariz", skin, (0, -0.5, H - 0.04), (0.11, 0.1, 0.1)),
    blob("barba", beard, (0, -0.27, H - 0.32), (0.4, 0.3, 0.3)),
    blob("bigode", beard, (0, -0.47, H - 0.1), (0.24, 0.07, 0.06)),
    tube("tranca", beard, (0, -0.42, H - 0.6), 0.07, 0.24, r2=0.03),
    ring("anel_tranca", gold, (0, -0.42, H - 0.55), 0.06, 0.02, rot=(0, 0, 0)),
    dome("capacete", steel, (0, 0.02, H + 0.06), (0.56, 0.54, 0.5)),
    ring("aro_capacete", gold, (0, 0.02, H + 0.08), 0.55, 0.035),
    block("protetor_nasal", steel, (0, -0.53, H + 0.12), (0.035, 0.03, 0.14), bevel=0.01),
]
for sx in (1, -1):
    head += [
        blob(f"olho{sx}", eye, (0.19 * sx, -0.45, H + 0.0), (0.08, 0.05, 0.11)),
        blob(f"brilho{sx}", shine, (0.19 * sx + 0.03, -0.49, H + 0.04), (0.025, 0.015, 0.025)),
        block(f"sobrancelha{sx}", beard, (0.19 * sx, -0.47, H + 0.15), (0.1, 0.03, 0.03), rot=(0, math.radians(-14 * sx), 0), bevel=0.01),
        tube(f"chifre{sx}", horn, (0.5 * sx, 0.02, H + 0.32), 0.09, 0.42, rot=(0, math.radians(-58 * sx), 0), r2=0.0),
    ]
attach(rig, "head", head)

# ---- braços: mangas e luvas
for sx, arm, hand in ((1, "arm.L", "hand.L"), (-1, "arm.R", "hand.R")):
    attach(rig, arm, [tube(f"manga{arm}", tunic, (0.47 * sx, 0, 0.93), 0.12, 0.32)])
    attach(rig, hand, [blob(f"luva{hand}", leather, (0.51 * sx, -0.02, 0.7), (0.15, 0.15, 0.15))])

# ---- escudo redondo de madeira com aro, rebites e emblema de folha
# Modelado com o braço esquerdo já em guarda (GUARD): fica à frente do corpo, preso à mão.
GUARD = {"arm.L": (-40, 0, 12)}
cx, cy, cz = 0.47, -0.72, 0.8
FACE = (math.radians(90), 0, math.radians(-12))      # disco virado para a frente, levemente para fora
shield = [
    tube("escudo", wood, (cx, cy, cz), 0.36, 0.07, rot=FACE, verts=40),
    ring("aro_escudo", steel, (cx, cy, cz), 0.36, 0.03, rot=FACE),
    blob("umbo", steel, (cx + 0.01, cy - 0.06, cz), (0.11, 0.06, 0.11)),
    blob("folha", tunic, (cx + 0.02, cy - 0.05, cz + 0.2), (0.07, 0.02, 0.11)),
    block("alca", leather, (cx, cy + 0.06, cz), (0.05, 0.03, 0.16), bevel=0.01),
]
for i in range(8):
    a = i / 8 * math.tau
    shield.append(blob(f"rebite{i}", gold, (cx + math.cos(a) * 0.28, cy - 0.05, cz + math.sin(a) * 0.28), (0.028, 0.028, 0.028)))
attach_posed(rig, "hand.L", shield, GUARD)

# ---- machado de lâmina dupla (mão direita), horizontal apontando para a frente na pose de guarda
hx, hz = -0.66, 0.68   # afastado da lateral: o machado passa ao lado da cabeça no golpe por cima
R90 = (math.radians(90), 0, 0)
ax = [
    tube("cabo", wood, (hx, -0.4, hz), 0.045, 1.05, rot=R90),
    ring("pega", leather, (hx, -0.05, hz), 0.05, 0.02, rot=R90),
    block("lamina_cima", steel, (hx, -0.82, hz + 0.17), (0.03, 0.2, 0.17), bevel=0.02),
    block("lamina_baixo", steel, (hx, -0.82, hz - 0.13), (0.03, 0.14, 0.11), bevel=0.02),
    tube("ponta", steel, (hx, -0.98, hz), 0.04, 0.16, rot=R90, r2=0.0),
    block("anel_lamina", gold, (hx, -0.82, hz), (0.06, 0.07, 0.06), bevel=0.01),
]
attach(rig, "hand.R", ax)

# ---- capa
attach(rig, "cape", [cape("capa", red, (0, 0.22, 1.2), 0.42, 0.95)])

standard_actions(rig, weapon_arm="arm.R", base=GUARD, shield_arm=True)
report_clipping(rig, gear=["escudo", "aro_escudo", "cabo", "lamina_cima", "lamina_baixo"], body=["barriga", "peito", "cabeca", "barba", "saia"])
export(out_path("characters/heroes/brom.glb"))
