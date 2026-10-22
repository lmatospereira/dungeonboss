"""Lyra, a Piromante (dano em área, Fogo).  blender -b -P art/blender/heroes/lyra.py"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *

reset()
skin = mat("pele", hexc("ffd3b4")); robe = mat("manto", hexc("b83a2c")); robe2 = mat("manto_escuro", hexc("7e2219"))
gold = mat("ouro", hexc("f2b33d"), rough=0.35, metal=0.85); hair = mat("cabelo", hexc("ff7a2a"), rough=0.7)
hat = mat("chapeu", hexc("5b2b7c")); hat2 = mat("chapeu_faixa", hexc("f2b33d"), rough=0.4, metal=0.6)
boots = mat("botas", hexc("3a1f2a")); eye = mat("olho", hexc("2a1222"), rough=0.2); wood = mat("madeira", hexc("7a4a25"))
blush = mat("bochecha", hexc("ff8f86")); fire = mat("fogo", hexc("ffb36a"), emit=hexc("ff7a2a"))
rig = armature("lyra")
body = humanoid(rig, {"skin": skin, "cloth": robe, "cloth2": robe2, "boots": boots, "belt": hat2, "buckle": gold, "eye": eye,
                      "brow": hair, "blush": blush, "robe": True, "flare": 1.08, "belly": 0.38})
H = 1.66
attach(rig, "head", [
    blob("cabelo", hair, (0, 0.14, H + 0.04), (0.56, 0.5, 0.5)),
    blob("franja", hair, (0, -0.33, H + 0.26), (0.42, 0.16, 0.14)),
    blob("mechaE", hair, (0.44, -0.12, H - 0.26), (0.13, 0.13, 0.26)),
    blob("mechaD", hair, (-0.44, -0.12, H - 0.26), (0.13, 0.13, 0.26)),
    tube("aba", hat, (0, 0, H + 0.36), 0.7, 0.05, verts=40),
    tube("faixa", hat2, (0, 0, H + 0.43), 0.48, 0.1, verts=32),
    tube("copa", hat, (0.06, 0.04, H + 0.95), 0.47, 1.0, rot=(math.radians(-10), math.radians(14), 0), r2=0.0, verts=32),
])
attach(rig, "spine", [ring("colar", gold, (0, 0, 1.1), 0.3, 0.03), blob("joia", fire, (0, -0.3, 1.06), (0.06, 0.04, 0.06))])
attach(rig, "cape", [cape("capa", hat, (0, 0.2, 1.15), 0.36, 0.8)])
staff = staff_up(rig, "hand.R", -0.58, wood, lambda t: [
    blob("orbe", fire, (t[0], t[1], t[2] + 0.13), (0.15, 0.15, 0.15)),
    ring("garra", gold, (t[0], t[1], t[2]), 0.12, 0.025)])
attach(rig, "hand.L", [blob("chama_mao", fire, (0.5, -0.12, 0.74), (0.08, 0.08, 0.1))])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=staff, body=body + ["cabelo", "aba", "copa"])
export(out_path("characters/heroes/lyra.glb"))
