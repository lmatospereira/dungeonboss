"""Bruto de Magma: corpo de pedra, elmo de ferro e clava com lava."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("8a4a3a")); rock = mat("pedra", hexc("3a302e"), rough=0.95); rock2 = mat("pedra_clara", hexc("4e4440"), rough=0.95)
lava = mat("lava", hexc("ffb060"), emit=hexc("ff6a1a")); metal = mat("ferro", hexc("4a4a52"), rough=0.4, metal=0.85)
brow = mat("sobrancelha", hexc("3a1a10")); wood = mat("madeira", hexc("3a2a22")); eye = mat("olho", hexc("ffd070"), emit=hexc("ff8a2a"))
rig = armature("bruto")
body = humanoid(rig, {"skin": skin, "cloth": rock, "cloth2": rock2, "boots": rock2, "belt": metal, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "belly": 0.5, "gloves": rock2})
goblin_face(rig, skin, brow, tusks=mat("presa", hexc("f1e6cc")))
rock_body(rig, rock, rock2, lava, belly=0.5)
attach(rig, "head", [dome("elmo", metal, (0, 0.04, H + 0.12), (0.56, 0.54, 0.42))])
gear = [tube("clava", wood, (-0.72, -0.5, 0.68), 0.09, 1.0, rot=R90, r2=0.05), blob("cabeca_clava", rock2, (-0.72, -0.98, 0.68), (0.2, 0.2, 0.2), segs=8),
        blob("lava_clava", lava, (-0.72, -1.12, 0.74), (0.07, 0.05, 0.07))]
attach(rig, "hand.R", gear)
standard_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=[o.name for o in gear], body=body + ["elmo", "peito_pedra"])
export(out_path("characters/enemies/bruto.glb"))
