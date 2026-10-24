"""Goblin Arqueiro: capuz verde e arco curto."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("7cbf4a")); cloth = mat("roupa", hexc("4d6b2f")); cloth2 = mat("calca", hexc("3a5022"))
hood = mat("capuz", hexc("3e5a26")); leather = mat("couro", hexc("6b4a2e")); brow = mat("sobrancelha", hexc("3d5a22"))
wood = mat("madeira", hexc("8a5a2b")); string = mat("corda", hexc("e8e2d0")); eye = mat("olho", hexc("2a0606"), rough=0.2)
rig = armature("arqueiro")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": leather, "belt": leather, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "belly": 0.38})
goblin_face(rig, skin, brow)
attach(rig, "head", [blob("capuz", hood, (0, 0.2, H + 0.02), (0.58, 0.44, 0.54))])
attach(rig, "spine", [tube("aljava", leather, (0.16, 0.34, 0.98), 0.09, 0.5, rot=(math.radians(-15), 0, math.radians(-20)))])
gear = bow(rig, "hand.L", 0.64, wood, string, size=0.65)
archer_actions(rig, bow_arm="arm.L")
report_clipping(rig, gear=gear, body=body + ["capuz", "narigao"])
export(out_path("characters/enemies/arqueiro.glb"))
