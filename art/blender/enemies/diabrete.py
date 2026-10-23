"""Diabrete: pele vermelha, chifres, cauda e cajado de brasa."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

skin = mat("pele", hexc("d8483a")); cloth = mat("roupa", hexc("2a1414")); horn = mat("chifre", hexc("2a1a14"), rough=0.5)
acc = mat("faixa", hexc("ffa62a")); brow = mat("sobrancelha", hexc("6a1a10")); wood = mat("madeira", hexc("3a2a22"))
fire = mat("brasa", hexc("ffc070"), emit=hexc("ff5a1a")); eye = mat("olho", hexc("ffe066"), rough=0.2, emit=hexc("ffb020"))
rig = armature("diabrete")
body = humanoid(rig, {"skin": skin, "cloth": cloth, "cloth2": skin, "boots": horn, "belt": acc, "eye": eye, "brow": brow, "ears": "pontuda", "nose": False, "belly": 0.38})
goblin_face(rig, skin, brow)
attach(rig, "head", [tube("chifreE", horn, (0.24, 0.0, H + 0.48), 0.08, 0.32, rot=(0, math.radians(-25), 0), r2=0.0),
                     tube("chifreD", horn, (-0.24, 0.0, H + 0.48), 0.08, 0.32, rot=(0, math.radians(25), 0), r2=0.0)])
attach(rig, "hips", [tube("cauda", skin, (0, 0.42, 0.5), 0.04, 0.6, rot=(math.radians(-60), 0, 0)), tube("ponta_cauda", horn, (0, 0.7, 0.68), 0.08, 0.14, rot=(math.radians(-60), 0, 0), r2=0.0)])
gear = staff_up(rig, "hand.R", -0.58, wood, lambda t: [blob("orbe", fire, (t[0], t[1], t[2] + 0.1), (0.12, 0.12, 0.12)), ring("garra", horn, (t[0], t[1], t[2]), 0.1, 0.025)])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["narigao"])
export(out_path("characters/enemies/diabrete.glb"))
