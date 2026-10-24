"""Esqueleto Arcano: capuz pontudo roxo e cajado com orbe sombrio."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

bone = mat("osso", hexc("e9e3d0"), rough=0.6); dark = mat("orbita", hexc("120c14"), rough=0.9); glow = mat("brilho_alma", hexc("e2b8ff"), emit=hexc("b47bff"))
robe = mat("manto", hexc("3b2459")); robe2 = mat("manto_escuro", hexc("2c1a44")); acc = mat("faixa", hexc("b47bff")); wood = mat("madeira", hexc("3a2a2a"))
rig = armature("magoEsq")
body = humanoid(rig, {"skin": bone, "cloth": robe, "cloth2": robe2, "boots": robe2, "belt": acc, "eye": dark, "brow": dark, "nose": False, "robe": True, "flare": 1.08, "belly": 0.36})
skeleton_details(rig, bone, dark, glow)
attach(rig, "head", [blob("capuz", robe2, (0, 0.16, H + 0.04), (0.6, 0.5, 0.56)), tube("ponta", robe2, (0, 0.4, H + 0.45), 0.2, 0.55, rot=(math.radians(-50), 0, 0), r2=0.0)])
attach(rig, "cape", [cape("capa", robe2, (0, 0.22, 1.15), 0.36, 0.85)])
gear = staff_up(rig, "hand.R", -0.58, wood, lambda t: [blob("orbe", glow, (t[0], t[1], t[2] + 0.12), (0.13, 0.13, 0.13)), ring("garra", bone, (t[0], t[1], t[2]), 0.1, 0.025)])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["capuz", "mandibula"])
export(out_path("characters/enemies/magoEsq.glb"))
