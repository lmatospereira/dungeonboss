"""Mira, a Sacerdotisa das Marés (suporte, Água): cabelo branco longo, coroa de conchas e tridente."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("9a6448")); robe = mat("manto", hexc("2a7ad8")); robe2 = mat("manto_escuro", hexc("1a5ab8"))
hair = mat("cabelo", hexc("f0f4ff")); shell = mat("concha", hexc("ffc8d6"), rough=0.4); coral = mat("coral", hexc("ff8fa8"), rough=0.5)
pearl = mat("perola", hexc("e8f4ff"), rough=0.15, metal=0.3); wood = mat("madeira", hexc("c8b48a"))
water = mat("agua", hexc("9fe4ff"), emit=hexc("45aaff")); boots = mat("botas", hexc("1a2a48")); blush = mat("bochecha", hexc("d97a6a"))
rig = armature("mira")
body = humanoid(rig, {"skin": skin, "cloth": robe, "cloth2": robe2, "boots": boots, "belt": pearl, "buckle": shell, "eye": eye, "brow": hair, "blush": blush, "robe": True, "flare": 1.08, "belly": 0.4})
head = [blob("cabelo", hair, (0, 0.16, H + 0.04), (0.57, 0.52, 0.52)),
        blob("cabelo_longo", hair, (0, 0.3, H - 0.45), (0.42, 0.24, 0.45)),
        blob("franja", hair, (0.12, -0.22, H + 0.36), (0.3, 0.14, 0.11), rot=(0, 0, math.radians(-12)))]
for i in range(-2, 3):
    head.append(tube(f"concha{i+2}", shell, (i * 0.13, -0.18, H + 0.46 - abs(i) * 0.03), 0.06, 0.22, rot=(math.radians(-20), math.radians(i * 14), 0), r2=0.0))
attach(rig, "head", head)
attach(rig, "spine", [ring("colar", pearl, (0, 0, 1.1), 0.3, 0.035),
                      dome("ombreiraE", shell, (0.42, 0, 1.06), (0.2, 0.2, 0.15)), dome("ombreiraD", shell, (-0.42, 0, 1.06), (0.2, 0.2, 0.15))])
attach(rig, "cape", [cape("capa", robe2, (0, 0.24, 1.15), 0.38, 0.8)])
gear = staff_up(rig, "hand.R", -0.58, wood, lambda t: [
    block("tridente_base", coral, (t[0], t[1], t[2]), (0.16, 0.03, 0.03), bevel=0.01),
    tube("dente_c", coral, (t[0], t[1], t[2] + 0.16), 0.03, 0.3, r2=0.0),
    tube("dente_e", coral, (t[0] + 0.12, t[1], t[2] + 0.12), 0.025, 0.24, r2=0.0),
    tube("dente_d", coral, (t[0] - 0.12, t[1], t[2] + 0.12), 0.025, 0.24, r2=0.0),
    blob("gota", water, (t[0], t[1], t[2] - 0.08), (0.07, 0.07, 0.07))])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["cabelo", "cabelo_longo"])
export(out_path("characters/heroes/mira.glb"))
