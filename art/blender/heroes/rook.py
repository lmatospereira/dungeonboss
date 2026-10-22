"""Rook, o Berserker (tanque ofensivo, Fogo): elmo com chifres, moicano, pele de urso e dois machados."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("e0a07a")); cloth = mat("roupa", hexc("8a2a1c")); cloth2 = mat("calca", hexc("4a2a1a"))
metal = mat("metal", hexc("5d636c"), rough=0.4, metal=0.85); steel = mat("lamina", hexc("b9c2cc"), rough=0.3, metal=0.9)
horn = mat("chifre", hexc("f1e6cc"), rough=0.6); hair = mat("cabelo", hexc("ff5a2a")); fur = mat("pele_urso", hexc("7a5a3a"), rough=1.0)
wood = mat("madeira", hexc("5a3a22")); leather = mat("couro", hexc("3a2a22")); ember = mat("brasa", hexc("ff7a2a"), emit=hexc("ff5a1a"))
boots = mat("botas", hexc("2a1a14"))
rig = armature("rook")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": boots, "belt": leather, "buckle": metal, "eye": eye, "brow": hair, "gloves": leather, "belly": 0.46})
attach(rig, "head", [
    dome("elmo", metal, (0, 0.04, H + 0.08), (0.56, 0.54, 0.42)),
    blob("moicano0", hair, (0, -0.28, H + 0.50), (0.07, 0.1, 0.10)),
    blob("moicano1", hair, (0, -0.14, H + 0.53), (0.07, 0.1, 0.13)),
    blob("moicano2", hair, (0, 0.00, H + 0.56), (0.07, 0.1, 0.16)),
    blob("moicano3", hair, (0, 0.14, H + 0.53), (0.07, 0.1, 0.13)),
    blob("moicano4", hair, (0, 0.28, H + 0.50), (0.07, 0.1, 0.10)),
    tube("chifreE", horn, (0.5, 0.06, H + 0.38), 0.1, 0.5, rot=(math.radians(20), math.radians(-50), 0), r2=0.0),
    tube("chifreD", horn, (-0.5, 0.06, H + 0.38), 0.1, 0.5, rot=(math.radians(20), math.radians(50), 0), r2=0.0),
    blob("barba", hair, (0, -0.32, H - 0.3), (0.34, 0.2, 0.2)),
    block("pintura", ember, (0, -0.5, H + 0.0), (0.3, 0.01, 0.025), bevel=0.005),
])
attach(rig, "spine", [blob("pele_urso", fur, (0, 0.08, 1.06), (0.56, 0.4, 0.2)),
                      block("tira", leather, (0, -0.02, 0.92), (0.05, 0.44, 0.05), rot=(0, 0, math.radians(-40)), bevel=0.01)])
attach(rig, "cape", [cape("capa", fur, (0, 0.24, 1.18), 0.44, 0.7)])
def axe(prefix, hand, x):
    objs = [tube(prefix + "_cabo", wood, (x, -0.36, 0.68), 0.04, 0.9, rot=R90),
            block(prefix + "_lamina", steel, (x, -0.74, 0.8), (0.03, 0.15, 0.17), bevel=0.02),
            block(prefix + "_anel", metal, (x, -0.74, 0.68), (0.06, 0.06, 0.06), bevel=0.01),
            blob(prefix + "_brasa", ember, (x, -0.74, 0.93), (0.04, 0.04, 0.04))]
    attach(rig, hand, objs); return [o.name for o in objs]
gear = axe("machadoD", "hand.R", -0.66) + axe("machadoE", "hand.L", 0.66)
standard_actions(rig, weapon_arm="arm.R", dual=True)
report_clipping(rig, gear=gear, body=body + ["elmo", "barba"])
export(out_path("characters/heroes/rook.glb"))
