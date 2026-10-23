"""Goblin Lanceiro: elmo de couro e lança comprida."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("7cbf4a")); cloth = mat("roupa", hexc("7a5532")); cloth2 = mat("calca", hexc("5a3c22"))
acc = mat("faixa", hexc("a33b2b")); leather = mat("couro", hexc("6b4a2e")); brow = mat("sobrancelha", hexc("3d5a22"))
wood = mat("madeira", hexc("6b4a2e")); steel = mat("ponta", hexc("b9c0c8"), rough=0.35, metal=0.85); eye = mat("olho", hexc("2a0606"), rough=0.2)
rig = armature("goblin")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": leather, "belt": acc, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "belly": 0.4})
goblin_face(rig, skin, brow)
attach(rig, "head", [dome("elmo", leather, (0, 0.04, H + 0.12), (0.54, 0.52, 0.4)), ring("aro", acc, (0, 0.04, H + 0.12), 0.53, 0.03)])
attach(rig, "spine", [block("ombreira", leather, (0.42, 0, 1.08), (0.18, 0.16, 0.08), rot=(0, math.radians(-20), 0), bevel=0.03)])
gear = [tube("lanca", wood, (-0.6, -0.5, 0.68), 0.035, 1.4, rot=R90), tube("ponta", steel, (-0.6, -1.25, 0.68), 0.07, 0.24, rot=(math.radians(-90), 0, 0), r2=0.0),
        ring("amarra", acc, (-0.6, -1.08, 0.68), 0.045, 0.015, rot=R90)]
attach(rig, "hand.R", gear)
standard_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=[o.name for o in gear], body=body + ["elmo", "narigao"])
export(out_path("characters/enemies/goblin.glb"))
