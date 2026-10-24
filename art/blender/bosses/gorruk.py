"""Gorruk, Rei Ogro do Lodo: pele azulada, presas, coroa, ombreira e clava com cravos."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("6c93b8")); cloth = mat("roupa", hexc("4a3829")); gold = mat("ouro", hexc("e2ad35"), rough=0.3, metal=0.85)
tusk = mat("presa", hexc("f1ead6")); metal = mat("metal", hexc("8c96a3"), rough=0.4, metal=0.85); brow = mat("sobrancelha", hexc("3d5671"))
wood = mat("madeira", hexc("6a4424")); ruby = mat("rubi", hexc("ff3b4e"), emit=hexc("c0122a")); slime = mat("lodo", hexc("7dff6a"), emit=hexc("2ecc40"))
eye = mat("olho", hexc("2a0a00"), rough=0.2)
rig = armature("gorruk")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": cloth, "boots": cloth, "belt": gold, "buckle": gold, "eye": eye, "brow": brow, "nose": False, "belly": 0.54})
H2 = 1.66
attach(rig, "head", [blob("narigao", skin, (0, -0.52, H2 - 0.08), (0.14, 0.12, 0.12)),
                     tube("presaE", tusk, (0.17, -0.42, H2 - 0.22), 0.06, 0.2, rot=(math.radians(15), 0, 0), r2=0.0),
                     tube("presaD", tusk, (-0.17, -0.42, H2 - 0.22), 0.06, 0.2, rot=(math.radians(15), 0, 0), r2=0.0),
                     block("carrancaE", brow, (0.18, -0.47, H2 + 0.1), (0.12, 0.035, 0.035), rot=(0, math.radians(22), 0), bevel=0.01),
                     block("carrancaD", brow, (-0.18, -0.47, H2 + 0.1), (0.12, 0.035, 0.035), rot=(0, math.radians(-22), 0), bevel=0.01),
                     tube("coroa", gold, (0, 0, H2 + 0.44), 0.34, 0.16)] +
       [tube(f"ponta{i}", gold, (math.cos(i / 5 * math.tau + math.pi / 2) * 0.3, math.sin(i / 5 * math.tau + math.pi / 2) * 0.3, H2 + 0.62), 0.07, 0.22, r2=0.0) for i in range(5)] +
       [blob("rubi", ruby, (0, -0.34, H2 + 0.44), (0.06, 0.03, 0.06))])
attach(rig, "spine", [dome("ombreira", metal, (-0.5, 0, 1.08), (0.26, 0.24, 0.2)), tube("cravo", metal, (-0.56, 0, 1.3), 0.06, 0.2, r2=0.0),
                      blob("lodo1", slime, (0.3, -0.42, 0.9), (0.08, 0.04, 0.1)), blob("lodo2", slime, (-0.2, -0.44, 0.78), (0.06, 0.03, 0.07))])
gear = [tube("clava", wood, (-0.75, -0.5, 0.68), 0.1, 1.1, rot=R90, r2=0.06)]
for i in range(4):
    a = i / 4 * math.tau
    gear.append(tube(f"cravo{i}", metal, (-0.75 + math.cos(a) * 0.17, -0.95, 0.68 + math.sin(a) * 0.17), 0.04, 0.16, rot=(0, math.atan2(math.cos(a), math.sin(a)), 0), r2=0.0))
attach(rig, "hand.R", gear)
standard_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=[o.name for o in gear], body=body + ["coroa", "narigao"])
export(out_path("characters/bosses/gorruk.glb"))
