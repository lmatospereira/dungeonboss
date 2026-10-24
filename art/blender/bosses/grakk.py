"""Grakk, Chefe Goblin: coroa com gema verde, presas, manto de pele e machadão."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("6aa840")); cloth = mat("roupa", hexc("5a3a22")); fur = mat("pele_animal", hexc("b08a5a"), rough=1.0)
gold = mat("ouro", hexc("e2ad35"), rough=0.3, metal=0.85); gem = mat("gema", hexc("5eff7a"), emit=hexc("2ecc40")); brow = mat("sobrancelha", hexc("2d4a18"))
wood = mat("madeira", hexc("6b4426")); steel = mat("lamina", hexc("b9c0c8"), rough=0.3, metal=0.9); tusk = mat("presa", hexc("f1ead6"))
eye = mat("olho", hexc("2a0606"), rough=0.2)
rig = armature("grakk")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth, "boots": fur, "belt": gold, "buckle": gem, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "belly": 0.48})
goblin_face(rig, skin, brow, tusks=tusk)
crown = [tube("coroa", gold, (0, 0, H + 0.42), 0.34, 0.16)]
for i in range(5):
    a = i / 5 * math.tau + math.pi / 2
    crown.append(tube(f"ponta{i}", gold, (math.cos(a) * 0.3, math.sin(a) * 0.3, H + 0.6), 0.07, 0.22, r2=0.0))
crown.append(blob("gema", gem, (0, -0.34, H + 0.42), (0.06, 0.03, 0.06)))
attach(rig, "head", crown)
attach(rig, "spine", [blob("gola_pele", fur, (0, 0.06, 1.1), (0.5, 0.42, 0.16)), blob("ombroE", fur, (0.44, 0, 1.06), (0.24, 0.22, 0.18)), blob("ombroD", fur, (-0.44, 0, 1.06), (0.24, 0.22, 0.18))])
attach(rig, "cape", [cape("capa", fur, (0, 0.26, 1.18), 0.46, 0.85)])
gear = [tube("cabo", wood, (-0.7, -0.45, 0.68), 0.05, 1.15, rot=R90), block("lamina_cima", steel, (-0.7, -0.92, 0.88), (0.035, 0.22, 0.24), bevel=0.025),
        block("lamina_baixo", steel, (-0.7, -0.92, 0.5), (0.035, 0.16, 0.14), bevel=0.025), blob("gema_machado", gem, (-0.7, -0.92, 0.68), (0.06, 0.06, 0.06))]
attach(rig, "hand.R", gear)
standard_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=[o.name for o in gear], body=body + ["coroa", "narigao"])
export(out_path("characters/bosses/grakk.glb"))
