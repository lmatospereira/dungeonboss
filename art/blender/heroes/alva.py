"""Alva, a Clériga (suporte, Luz): capuz, auréola, asinhas e cetro dourado."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("f6d0b3")); robe = mat("manto", hexc("f1eadb")); robe2 = mat("manto_sombra", hexc("d8ccb4"))
gold = mat("ouro", hexc("e1b23f"), rough=0.3, metal=0.85); hood = mat("capuz", hexc("e6dcc8")); hair = mat("cabelo", hexc("f3d27a"))
boots = mat("botas", hexc("6b5a48")); blush = mat("bochecha", hexc("ff9a9a")); halo = mat("aureola", hexc("ffe27a"), emit=hexc("ffd75e"))
wing = mat("asa", hexc("ffffff"), rough=0.6); light = mat("luz", hexc("fff2b0"), emit=hexc("ffe08a"))
rig = armature("alva")
body = humanoid(rig, {"skin": skin, "cloth": robe, "cloth2": robe2, "boots": boots, "belt": gold, "buckle": gold, "eye": eye, "brow": hair, "blush": blush, "robe": True, "flare": 1.08, "belly": 0.4})
attach(rig, "head", [
    blob("capuz", hood, (0, 0.16, H + 0.02), (0.6, 0.5, 0.56)),
    blob("cabelo", hair, (0, -0.2, H + 0.3), (0.4, 0.2, 0.15)),
    ring("aureola", halo, (0, 0.04, H + 0.72), 0.28, 0.035),
])
attach(rig, "spine", [
    block("cruz_v", gold, (0, -0.36, 1.0), (0.05, 0.03, 0.13), bevel=0.015),
    block("cruz_h", gold, (0, -0.36, 1.04), (0.12, 0.03, 0.04), bevel=0.015),
    blob("asaE1", wing, (0.24, 0.36, 1.08), (0.1, 0.06, 0.3), rot=(0, math.radians(30), math.radians(25))),
    blob("asaE2", wing, (0.36, 0.38, 0.96), (0.08, 0.05, 0.22), rot=(0, math.radians(55), math.radians(25))),
    blob("asaD1", wing, (-0.24, 0.36, 1.08), (0.1, 0.06, 0.3), rot=(0, math.radians(-30), math.radians(-25))),
    blob("asaD2", wing, (-0.36, 0.38, 0.96), (0.08, 0.05, 0.22), rot=(0, math.radians(-55), math.radians(-25))),
])
attach(rig, "cape", [cape("capa", hood, (0, 0.22, 1.15), 0.38, 0.75)])
scepter = staff_up(rig, "hand.R", -0.58, gold, lambda t: [
    blob("cetro_esfera", light, (t[0], t[1], t[2] + 0.08), (0.12, 0.12, 0.12)),
    ring("cetro_aro", gold, (t[0], t[1], t[2] + 0.08), 0.15, 0.025, rot=(0, math.radians(90), 0)),
    block("cetro_cruz", gold, (t[0], t[1], t[2] + 0.28), (0.025, 0.025, 0.1), bevel=0.01)], length=1.05)
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=scepter, body=body + ["capuz"])
export(out_path("characters/heroes/alva.glb"))
