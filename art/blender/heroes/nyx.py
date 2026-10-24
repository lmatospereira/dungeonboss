"""Nyx, a Necromante (dano, Sombra): capuz com orelhas, caveira familiar e cajado com cristal."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)
eye = mat("olho", hexc("1b1222"), rough=0.2)

skin = mat("pele", hexc("d8d0e0")); robe = mat("manto", hexc("2a1838")); robe2 = mat("manto_escuro", hexc("1a0e26"))
hood = mat("capuz", hexc("221430")); bone = mat("osso", hexc("e9e3d0"), rough=0.6); green = mat("alma", hexc("9effc8"), emit=hexc("5ef0a0"))
wood = mat("madeira", hexc("3a2e2e")); hair = mat("cabelo", hexc("f0f0ff")); boots = mat("botas", hexc("140c1c")); acc = mat("detalhe", hexc("5ef0a0"), rough=0.4)
rig = armature("nyx")
body = humanoid(rig, {"skin": skin, "cloth": robe, "cloth2": robe2, "boots": boots, "belt": acc, "buckle": bone, "eye": mat("olho_nyx", hexc("2a0a3a"), rough=0.2), "brow": hair, "robe": True, "flare": 1.08, "belly": 0.38})
attach(rig, "head", [
    blob("capuz", hood, (0, 0.16, H + 0.04), (0.6, 0.5, 0.56)),
    tube("orelhaE", hood, (0.3, 0.1, H + 0.5), 0.1, 0.34, rot=(0, math.radians(-25), 0), r2=0.0),
    tube("orelhaD", hood, (-0.3, 0.1, H + 0.5), 0.1, 0.34, rot=(0, math.radians(25), 0), r2=0.0),
    blob("franja", hair, (-0.14, -0.2, H + 0.38), (0.26, 0.13, 0.1), rot=(0, 0, math.radians(14))),
])
attach(rig, "spine", [blob(f"colar_osso{i}", bone, ((i - 1) * 0.12, -0.33, 1.04), (0.05, 0.04, 0.05)) for i in range(3)] +
       [dome("ombreiraE", hood, (0.42, 0, 1.06), (0.2, 0.2, 0.18)), dome("ombreiraD", hood, (-0.42, 0, 1.06), (0.2, 0.2, 0.18))])
# caveira familiar flutuando ao lado
attach(rig, "spine", [blob("familiar", bone, (0.78, 0.05, 1.6), (0.15, 0.14, 0.15)),
                      blob("familiar_olhoE", green, (0.73, -0.08, 1.62), (0.035, 0.02, 0.035)),
                      blob("familiar_olhoD", green, (0.83, -0.08, 1.62), (0.035, 0.02, 0.035))])
attach(rig, "cape", [cape("capa", robe2, (0, 0.22, 1.15), 0.4, 0.9)])
gear = staff_up(rig, "hand.R", -0.58, wood, lambda t: [
    blob("cristal", green, (t[0], t[1], t[2] + 0.12), (0.1, 0.1, 0.17), segs=6),
    ring("garra", bone, (t[0], t[1], t[2]), 0.1, 0.025)])
caster_actions(rig, weapon_arm="arm.R")
report_clipping(rig, gear=gear, body=body + ["capuz"])
export(out_path("characters/heroes/nyx.glb"))
