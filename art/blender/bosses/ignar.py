"""Ignar, Golem da Forja: pedra facetada, olhos e núcleo de lava, punhos de rocha."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

rock = mat("pedra", hexc("4a3c3a"), rough=0.95); rock2 = mat("pedra_escura", hexc("3a302e"), rough=0.95)
lava = mat("lava", hexc("ffb060"), emit=hexc("ff6a1a")); eye = mat("olho_lava", hexc("ffd070"), emit=hexc("ff8a2a"))
rig = armature("ignar")
body = humanoid(rig, {"skin": rock, "cloth": rock2, "cloth2": rock2, "boots": rock2, "belt": lava, "eye": eye, "brow": rock2, "nose": False, "belly": 0.52, "gloves": rock2})
rock_body(rig, rock, rock2, lava, belly=0.52)
attach(rig, "head", [blob("testa", rock2, (0, -0.1, H + 0.3), (0.5, 0.36, 0.22), segs=7),
                     blob("rochaE", rock2, (0.36, 0.0, H + 0.24), (0.2, 0.2, 0.2), segs=6),
                     blob("rochaD", rock2, (-0.36, 0.0, H + 0.24), (0.2, 0.2, 0.2), segs=6),
                     block("boca_lava", lava, (0, -0.47, H - 0.18), (0.14, 0.02, 0.03), bevel=0.01)])
attach(rig, "spine", [blob("nucleo", lava, (0, -0.42, 0.9), (0.13, 0.05, 0.13))])
fists = []
for sx, hand in ((1, "hand.L"), (-1, "hand.R")):
    f = [blob(f"punho{hand}", rock, (0.55 * sx, -0.12, 0.66), (0.24, 0.24, 0.22), segs=7),
         blob(f"lava_punho{hand}", lava, (0.55 * sx, -0.34, 0.68), (0.05, 0.03, 0.05))]
    attach(rig, hand, f); fists += [o.name for o in f]
standard_actions(rig, weapon_arm="arm.R", dual=True)   # dois punhos
report_clipping(rig, gear=fists, body=["cabeca", "testa"])
export(out_path("characters/bosses/ignar.glb"))
