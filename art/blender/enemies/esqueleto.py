"""Esqueleto Guerreiro: elmo enferrujado, espada e escudo redondo."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib import *
reset()
H = 1.66
R90 = (math.radians(90), 0, 0)

bone = mat("osso", hexc("e9e3d0"), rough=0.6); dark = mat("orbita", hexc("120c14"), rough=0.9); glow = mat("brilho_alma", hexc("aef8ff"), emit=hexc("7af5ff"))
rags = mat("trapos", hexc("5b5f66")); acc = mat("faixa", hexc("7a2e2e")); rust = mat("ferrugem", hexc("8a6a52"), rough=0.6, metal=0.5)
steel = mat("lamina", hexc("c0c7cf"), rough=0.3, metal=0.9)
rig = armature("esqueleto")
body = humanoid(rig, {"skin": bone, "cloth": rags, "cloth2": bone, "boots": rust, "belt": acc, "eye": dark, "brow": dark, "nose": False, "belly": 0.36})
skeleton_details(rig, bone, dark, glow)
attach(rig, "head", [dome("elmo", rust, (0, 0.04, H + 0.12), (0.55, 0.53, 0.42)), block("crista", acc, (0, 0.04, H + 0.52), (0.04, 0.3, 0.1), bevel=0.03)])
GUARD = {"arm.L": (-40, 0, 12)}
shield = [tube("escudo", rust, (0.47, -0.72, 0.8), 0.32, 0.06, rot=(math.radians(90), 0, math.radians(-12)), verts=24),
          blob("umbo", steel, (0.48, -0.78, 0.8), (0.09, 0.05, 0.09))]
attach_posed(rig, "hand.L", shield, GUARD)
sword = [tube("cabo", acc, (-0.62, -0.12, 0.68), 0.035, 0.2, rot=R90), block("guarda", rust, (-0.62, -0.24, 0.68), (0.16, 0.03, 0.035), bevel=0.01),
         block("espada", steel, (-0.62, -0.62, 0.68), (0.025, 0.36, 0.06), bevel=0.012)]
attach(rig, "hand.R", sword)
standard_actions(rig, weapon_arm="arm.R", base=GUARD, shield_arm=True)
report_clipping(rig, gear=[o.name for o in shield + sword], body=body + ["elmo", "mandibula"])
export(out_path("characters/enemies/esqueleto.glb"))
