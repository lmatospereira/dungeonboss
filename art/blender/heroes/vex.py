"""Vex, o Ladino (dano, Sombra): capuz pontudo, máscara, cachecol e duas adagas."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("d9a07c")); cloth = mat("roupa", hexc("3b2b4d")); cloth2 = mat("calca", hexc("2a2036"))
hood = mat("capuz", hexc("2e2240")); mask = mat("mascara", hexc("1b1424")); acc = mat("faixa", hexc("8b5cf6"))
steel = mat("lamina", hexc("c9d2dc"), rough=0.25, metal=0.9); leather = mat("couro", hexc("4a3a2a")); boots = mat("botas", hexc("1e1726"))
rig = armature("vex")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth2, "boots": boots, "belt": leather, "buckle": acc, "eye": eye, "brow": mask, "gloves": leather, "belly": 0.38, "nose": False})
attach(rig, "head", [
    blob("capuz", hood, (0, 0.12, H + 0.04), (0.6, 0.52, 0.56)),
    tube("ponta_capuz", hood, (0, 0.42, H + 0.42), 0.18, 0.5, rot=(math.radians(-55), 0, 0), r2=0.0),
    blob("mascara", mask, (0, -0.3, H - 0.2), (0.44, 0.22, 0.2)),
])
attach(rig, "spine", [
    ring("cachecol", acc, (0, 0, 1.12), 0.32, 0.07),
    block("ponta_cachecol", acc, (0.12, 0.34, 0.96), (0.08, 0.03, 0.2), rot=(math.radians(-20), 0, math.radians(-15)), bevel=0.02),
    tube("bainha", leather, (0.25, 0.3, 0.75), 0.05, 0.4, rot=(math.radians(-60), 0, 0)),
])
def dagger(prefix, hand, x):
    objs = [tube(prefix + "_cabo", leather, (x, -0.12, 0.68), 0.035, 0.2, rot=R90),
            block(prefix + "_guarda", acc, (x, -0.24, 0.68), (0.12, 0.025, 0.03), bevel=0.01),
            block(prefix + "_lamina", steel, (x, -0.46, 0.68), (0.02, 0.2, 0.05), bevel=0.012)]
    attach(rig, hand, objs); return [o.name for o in objs]
gear = dagger("adagaD", "hand.R", -0.5) + dagger("adagaE", "hand.L", 0.5)
standard_actions(rig, weapon_arm="arm.R", dual=True)
report_clipping(rig, gear=gear, body=body + ["capuz", "mascara"])
export(out_path("characters/heroes/vex.glb"))
