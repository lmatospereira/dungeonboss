"""Morvhal, o Lich: coroa com gema verde, ombreiras com espinhos, manto e cajado de cristal."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

bone = mat("osso", hexc("e9e3d0"), rough=0.6); dark = mat("orbita", hexc("0a0610"), rough=0.9); glow = mat("alma", hexc("9effc8"), emit=hexc("5ef0a0"))
robe = mat("manto", hexc("1e1430")); robe2 = mat("manto_escuro", hexc("160e24")); gold = mat("ouro", hexc("c9a046"), rough=0.35, metal=0.85)
wood = mat("madeira", hexc("2a2224"))
rig = armature("lich")
body = humanoid(rig, {"skin": bone, "cloth": robe, "cloth2": robe2, "boots": robe2, "belt": gold, "buckle": glow, "eye": dark, "brow": dark, "nose": False, "robe": True, "flare": 1.08, "belly": 0.4})
skeleton_details(rig, bone, dark, glow)
crown = [tube("coroa", gold, (0, 0, H + 0.42), 0.34, 0.14)]
for i in range(5):
    a = i / 5 * math.tau + math.pi / 2
    crown.append(tube(f"ponta{i}", gold, (math.cos(a) * 0.3, math.sin(a) * 0.3, H + 0.6), 0.06, 0.24, r2=0.0))
crown.append(blob("gema", glow, (0, -0.34, H + 0.42), (0.06, 0.03, 0.06)))
attach(rig, "head", crown + [blob("capuz", robe2, (0, 0.2, H - 0.02), (0.6, 0.44, 0.54))])
attach(rig, "spine", [dome("ombreiraE", robe2, (0.44, 0, 1.06), (0.24, 0.24, 0.18)), dome("ombreiraD", robe2, (-0.44, 0, 1.06), (0.24, 0.24, 0.18)),
                      tube("espinhoE", bone, (0.5, 0, 1.28), 0.06, 0.3, r2=0.0), tube("espinhoD", bone, (-0.5, 0, 1.28), 0.06, 0.3, r2=0.0)])
attach(rig, "cape", [cape("capa", robe2, (0, 0.24, 1.15), 0.44, 0.95)])
gear = staff_up(rig, "hand.R", -0.6, wood, lambda t: [blob("cristal", glow, (t[0], t[1], t[2] + 0.14), (0.11, 0.11, 0.2), segs=6), ring("garra", bone, (t[0], t[1], t[2]), 0.11, 0.025)])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["coroa", "capuz", "mandibula"])
export(out_path("characters/bosses/lich.glb"))
