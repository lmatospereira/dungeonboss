extends RefCounted
## Estado de uma unidade em combate (herói, inimigo ou chefe). Não conhece nós 3D.

const Data := preload("res://scripts/core/data.gd")
const Progression := preload("res://scripts/core/progression.gd")

var id: int                 # identificador único na batalha
var key: String             # chave nos dados (ex.: "brom", "goblin", "grakk")
var side: String            # "hero" ou "enemy"
var slot: int = 0           # posição na formação (apresentação usa)
var def: Dictionary
var lvl: int = 1
var evo: int = 1
var el: String
var max_hp: int
var hp: int
var base_atk: float
var spd: float
var crit: float
var dr: float
var abilities: Array = []
var cds: Dictionary = {}
var status: Array = []      # [{type, turns, value, fresh}]
var timer: float = 0.0
var alive := true
var is_hero := false
var is_boss := false
var stun_immune := false
var enraged := false
var boss_turns := 0         # contador de ações do chefe (padrão de ataque)
var stats := {"dmg": 0, "heal": 0, "shield": 0, "taken": 0, "kills": 0, "actions": 0, "casts": {}}

static func create(p_id: int, p_key: String, p_side: String, p_lvl: int, p_evo: int = 1):
	var u = new()
	u.id = p_id
	u.key = p_key
	u.side = p_side
	u.lvl = p_lvl
	u.def = Data.unit_def(p_key)
	u.el = u.def["el"]
	u.is_hero = Data.is_hero(p_key)
	u.is_boss = u.def.get("boss", false)
	u.stun_immune = u.def.get("stunImmune", false)
	var st: Dictionary
	if u.is_hero:
		u.evo = clampi(p_evo, 1, Progression.max_evo())
		st = Progression.hero_stats(p_key, p_lvl, u.evo)
		u.abilities = Progression.hero_abilities(p_key, u.evo)
	else:
		st = Progression.enemy_stats(p_key, p_lvl)
		u.abilities = u.def["abilities"].duplicate()
	u.max_hp = st["hp"]
	u.hp = u.max_hp
	u.base_atk = st["atk"]
	u.spd = st["spd"]
	u.crit = st["crit"]
	u.dr = st["dr"]
	u.reset_cooldowns()
	return u

func reset_cooldowns() -> void:
	cds.clear()
	for a in abilities:
		var v := Data.values(a)
		var cd := int(v.get("cd", 0))
		cds[a] = int(v.get("start", ceili(cd / 2.0))) if cd > 0 else 0

func atk() -> float:
	return base_atk * (Data.rules()["enrageAtk"] if has_status("enrage") else 1.0)

func ratio() -> float: return float(hp) / max_hp

func has_status(t: String) -> bool:
	for s in status:
		if s["type"] == t: return true
	return false

func get_status(t: String) -> Variant:
	for s in status:
		if s["type"] == t: return s
	return null

func shield() -> int:
	var s = get_status("shield")
	return int(s["value"]) if s else 0

func name() -> String: return def.get("short", def.get("name", key))
