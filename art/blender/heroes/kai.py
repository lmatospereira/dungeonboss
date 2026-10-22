"""Kai, o Arqueiro (dano, Água): capuz azul, aljava nas costas e arco."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("e8b98f")); cloth = mat("roupa", hexc("2a6f8a")); cloth2 = mat("calca", hexc("1f4d60"))
hood = mat("capuz", hexc("1f5a72")); hair = mat("cabelo", hexc("3a2a22")); leather = mat("couro", hexc("6b4426"))
wood = mat("madeira", hexc("8a5a2b")); string = mat("corda", hexc("e8e2d0")); feather = mat("pena", hexc("f2f2f2"))
acc = mat("detalhe", hexc("9ad8e8"), rough=0.4, metal=0.5); boots = mat("botas", hexc("223040")); blush = mat("bochecha", hexc("f0a08a"))
rig = armature("kai")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": boots, "belt": leather, "buckle": acc, "eye": eye, "brow": hair, "gloves": leather, "blush": blush, "belly": 0.39})
attach(rig, "head", [
    blob("cabelo", hair, (0, 0.1, H + 0.12), (0.56, 0.5, 0.46)),
    blob("topete", hair, (0.08, -0.3, H + 0.3), (0.3, 0.14, 0.12)),
    blob("capuz", hood, (0, 0.24, H - 0.04), (0.6, 0.42, 0.56)),
])
quiver = [tube("aljava", leather, (0.18, 0.34, 0.98), 0.1, 0.55, rot=(math.radians(-15), 0, math.radians(-20)))]
for i, dx in enumerate((-0.04, 0.0, 0.05)):
    quiver.append(tube(f"flecha{i}", wood, (0.24 + dx, 0.4, 1.3), 0.012, 0.3, rot=(math.radians(-15), 0, math.radians(-20))))
    quiver.append(blob(f"pena{i}", feather, (0.27 + dx, 0.43, 1.45), (0.03, 0.01, 0.06)))
quiver += [block("alca", leather, (0, -0.02, 1.0), (0.04, 0.42, 0.04), rot=(0, 0, math.radians(40)), bevel=0.01),
           dome("ombreiraE", acc, (0.42, 0, 1.06), (0.18, 0.18, 0.13)), dome("ombreiraD", acc, (-0.42, 0, 1.06), (0.18, 0.18, 0.13))]
attach(rig, "spine", quiver)
attach(rig, "cape", [cape("capa", hood, (0, 0.24, 1.15), 0.4, 0.8)])
gear = bow(rig, "hand.L", 0.64, wood, string)   # afastado da lateral: o arco passa ao lado da cabeça ao mirar
archer_actions(rig, bow_arm="arm.L")
report_clipping(rig, gear=gear, body=body + ["capuz", "cabelo"])
export(out_path("characters/heroes/kai.glb"))
