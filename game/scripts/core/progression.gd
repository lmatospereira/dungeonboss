extends RefCounted
## Fórmulas de progressão (nível, evolução, arma, poder e recompensas), lidas de data/progression.json.
## Espelha src/js/04-data.js; os dois usam os mesmos dados.

const Data := preload("res://scripts/core/data.gd")

static func prog() -> Dictionary: return Data.progression()

static func level_mult(lvl: int) -> float:
	return 1.0 + float(prog()["levelBonus"]) * (lvl - 1)

static func xp_need(lvl: int) -> int:
	var x: Dictionary = prog()["xpNeed"]
	return int(x["base"] + x["perLevel"] * lvl)

static func train_cost(lvl: int) -> int:
	var t: Dictionary = prog()["trainCost"]
	return roundi(t["perLevel"] * lvl * pow(t["growth"], lvl - 1))

static func evo_mult(evo: int) -> float:
	var m: Array = prog()["evolution"]["mult"]
	return float(m[clampi(evo, 0, m.size() - 1)])

static func max_evo() -> int: return int(prog()["evolution"]["max"])

## Atributos de um herói: base × nível × evolução × arma (evolução 3).
static func hero_stats(key: String, lvl: int = 1, evo: int = 1) -> Dictionary:
	var d: Dictionary = Data.heroes()[key]
	var m := level_mult(lvl) * evo_mult(evo)
	var w: Dictionary = d["weapon"] if evo >= 3 else {}
	return {
		"hp": roundi(d["hp"] * m * (1.0 + w.get("hp", 0.0))),
		"atk": d["atk"] * m * (1.0 + w.get("atk", 0.0)),
		"spd": d["spd"] + w.get("spd", 0.0),
		"crit": d.get("crit", 0.1) + w.get("crit", 0.0),
		"dr": d.get("dr", 0.0) + w.get("dr", 0.0),
	}

## Atributos de inimigos e chefes: base × nível.
static func enemy_stats(key: String, lvl: int) -> Dictionary:
	var d := Data.unit_def(key)
	var m := level_mult(lvl)
	return {"hp": roundi(d["hp"] * m), "atk": d["atk"] * m, "spd": float(d["spd"]), "crit": d.get("crit", 0.1), "dr": d.get("dr", 0.0)}

## Habilidades disponíveis: básico + 2; o 4º poder (ult) só a partir da evolução 2.
static func hero_abilities(key: String, evo: int = 1) -> Array:
	var d: Dictionary = Data.heroes()[key]
	var list: Array = d["abilities"].duplicate()
	if evo >= 2 and d.has("ult"): list.append(d["ult"])
	return list

static func hero_power(key: String, lvl: int, evo: int = 1) -> int:
	var s := hero_stats(key, lvl, evo)
	var p: Dictionary = prog()["power"]
	return roundi(s["hp"] * p["hp"] + s["atk"] * p["atk"] * (1.0 + s["crit"] * p["critWeight"]) + (p["evoBonusPerLevel"] * level_mult(lvl) if evo >= 2 else 0.0))

static func team_power(team: Array) -> int:
	var t := 0
	for h in team: t += hero_power(h["k"], int(h["lvl"]), int(h.get("evo", 1)))
	return t

static func recommended_power(lvl: int) -> int:
	var p: Dictionary = prog()["power"]
	return roundi(4 * (p["recommendedHp"] * p["hp"] + p["recommendedAtk"] * p["atk"]) * level_mult(lvl))
