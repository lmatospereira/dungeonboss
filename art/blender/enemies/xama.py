"""Xamã do Lodo: máscara de osso, penas e cajado com orbe d'água."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("4fb3a0")); cloth = mat("roupa", hexc("3c5a6a")); cloth2 = mat("roupa_escura", hexc("2a4250"))
bone = mat("osso", hexc("d9c49a"), rough=0.6); red = mat("pintura", hexc("c0392b")); brow = mat("sobrancelha", hexc("2d6b5e"))
wood = mat("madeira", hexc("5a3a22")); water = mat("agua", hexc("9fe4ff"), emit=hexc("48c6ff")); eye = mat("olho", hexc("0d0a10"), rough=0.2)
rig = armature("xama")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": cloth2, "belt": bone, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "robe": True, "flare": 1.08, "belly": 0.4})
goblin_face(rig, skin, brow)
head = [block("mascara", bone, (0, -0.46, H + 0.12), (0.32, 0.03, 0.14), bevel=0.04)]
for sx in (1, -1): head.append(block(f"risco{sx}", red, (0.16 * sx, -0.49, H + 0.12), (0.03, 0.01, 0.09), bevel=0.005))
for i, (c, a) in enumerate(((hexc("e74c3c"), -0.3), (hexc("f1c40f"), 0.0), (hexc("48c6ff"), 0.3))):
    head.append(blob(f"pena{i}", mat(f"pena{i}", c), (a * 0.8, 0.0, H + 0.62), (0.07, 0.03, 0.26), rot=(0, a, 0)))
attach(rig, "head", head)
attach(rig, "spine", [blob(f"colar{i}", bone, ((i - 2) * 0.1, -0.34, 1.02 - abs(i - 2) * 0.03), (0.04, 0.03, 0.06)) for i in range(5)])
gear = staff_up(rig, "hand.R", -0.58, wood, lambda t: [blob("orbe", water, (t[0], t[1], t[2] + 0.1), (0.13, 0.13, 0.13)), ring("presas", bone, (t[0], t[1], t[2]), 0.11, 0.025)])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["mascara", "narigao"])
export(out_path("characters/enemies/xama.glb"))
