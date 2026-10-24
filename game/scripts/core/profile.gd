extends RefCounted
## Perfil do jogador na versão Godot: moedas (ouro, diamantes, cristais), heróis, fichas e fases.
## É um Dictionary simples (vira JSON no salvamento); as funções aqui só aplicam as regras.
##
##   var p := Profile.create()
##   var r := Profile.finish_stage(p, "1-1", true, 2, 3, ["brom", "lyra", "alva"], rng)
##   Profile.unlock(p, "kai")

const Data := preload("res://scripts/core/data.gd")
const Progression := preload("res://scripts/core/progression.gd")
const Campaign := preload("res://scripts/core/campaign.gd")

const VERSION := 1
const TEAM_SIZE := 4

static func create() -> Dictionary:
	var s: Dictionary = Campaign.conf()["start"]
	var p := {"v": VERSION, "gold": int(s["gold"]), "gems": int(s["gems"]), "crystals": int(s["crystals"]),
		"heroes": {}, "tokens": {}, "stages": {}, "team": [], "settings": {"auto": false, "fast": false}}
	for k in s["heroes"]:
		p["heroes"][k] = {"lvl": 1, "xp": 0, "evo": 1}
		p["team"].append(k)
	return p

## Completa campos que faltarem num perfil salvo por uma versão anterior.
static func migrate(p: Dictionary) -> Dictionary:
	var base := create()
	for k in base:
		if not p.has(k): p[k] = base[k]
	p["v"] = VERSION
	return p

# ---------------- heróis e fichas ----------------
static func owns(p: Dictionary, k: String) -> bool: return p["heroes"].has(k)
static func tokens(p: Dictionary, k: String) -> int: return int(p["tokens"].get(k, 0))
static func unlock_cost() -> Dictionary: return Campaign.conf()["unlock"]

## Fichas recebidas. Para herói que já está na equipe, cada ficha vira ouro. Devolve o ouro dado.
static func add_tokens(p: Dictionary, k: String, n: int) -> int:
	if owns(p, k):
		var g: int = n * int(Campaign.conf()["surplusTokenGold"])
		p["gold"] += g
		return g
	p["tokens"][k] = tokens(p, k) + n
	return 0

static func can_unlock(p: Dictionary, k: String) -> bool:
	var c := unlock_cost()
	return not owns(p, k) and tokens(p, k) >= int(c["tokens"]) and p["gold"] >= int(c["gold"])

static func unlock(p: Dictionary, k: String) -> bool:
	if not can_unlock(p, k): return false
	var c := unlock_cost()
	p["tokens"][k] = tokens(p, k) - int(c["tokens"])
	if p["tokens"][k] <= 0: p["tokens"].erase(k)
	p["gold"] -= int(c["gold"])
	p["heroes"][k] = {"lvl": 1, "xp": 0, "evo": 1}
	if p["team"].size() < TEAM_SIZE: p["team"].append(k)
	return true

## Equipe para a batalha: [{k, lvl, evo}] dos heróis escolhidos que o jogador tem.
static func battle_team(p: Dictionary) -> Array:
	var out: Array = []
	for k in p["team"]:
		if owns(p, k): out.append({"k": k, "lvl": p["heroes"][k]["lvl"], "evo": p["heroes"][k]["evo"]})
	return out

static func set_team(p: Dictionary, keys: Array) -> bool:
	if keys.is_empty() or keys.size() > TEAM_SIZE: return false
	for k in keys:
		if not owns(p, k) or keys.count(k) > 1: return false
	p["team"] = keys.duplicate()
	return true

## Experiência: sobe de nível enquanto der (máximo em progression.json). Devolve quantos níveis subiu.
static func add_xp(p: Dictionary, k: String, xp: int) -> int:
	var h: Dictionary = p["heroes"][k]
	var max_lvl := int(Data.progression()["maxLevel"])
	var ups := 0
	h["xp"] += xp
	while h["lvl"] < max_lvl and h["xp"] >= Progression.xp_need(h["lvl"]):
		h["xp"] -= Progression.xp_need(h["lvl"])
		h["lvl"] += 1
		ups += 1
	if h["lvl"] >= max_lvl: h["xp"] = 0
	return ups

static func train(p: Dictionary, k: String) -> bool:
	var h: Dictionary = p["heroes"][k]
	var cost := Progression.train_cost(h["lvl"])
	if h["lvl"] >= int(Data.progression()["maxLevel"]) or p["gold"] < cost: return false
	p["gold"] -= cost
	h["lvl"] += 1
	h["xp"] = 0
	return true

## O que falta para a próxima evolução ([] se já pode evoluir; ["máxima"] na última).
static func evo_missing(p: Dictionary, k: String) -> Array:
	var h: Dictionary = p["heroes"][k]
	if h["evo"] >= Progression.max_evo(): return ["máxima"]
	var req: Dictionary = Data.progression()["evolution"]["require"][str(h["evo"] + 1)]
	var out: Array = []
	if h["lvl"] < int(req["lvl"]): out.append("nível %d" % int(req["lvl"]))
	if p["crystals"] < int(req["crystals"]): out.append("%d cristais" % int(req["crystals"]))
	if p["gold"] < int(req["gold"]): out.append("%d de ouro" % int(req["gold"]))
	return out

static func evolve(p: Dictionary, k: String) -> bool:
	if not evo_missing(p, k).is_empty(): return false
	var h: Dictionary = p["heroes"][k]
	var req: Dictionary = Data.progression()["evolution"]["require"][str(h["evo"] + 1)]
	p["crystals"] -= int(req["crystals"])
	p["gold"] -= int(req["gold"])
	h["evo"] += 1
	return true

# ---------------- loja (diamantes) ----------------
static func buy_token(p: Dictionary, k: String) -> bool:
	var cost := int(Campaign.conf()["shop"]["tokenGems"])
	if owns(p, k) or not Data.is_hero(k) or p["gems"] < cost: return false
	p["gems"] -= cost
	add_tokens(p, k, 1)
	return true

static func buy_gold(p: Dictionary) -> bool:
	var pack: Dictionary = Campaign.conf()["shop"]["goldPack"]
	if p["gems"] < int(pack["gems"]): return false
	p["gems"] -= int(pack["gems"])
	p["gold"] += int(pack["gold"])
	return true

# ---------------- fases ----------------
static func stars(p: Dictionary, id: String) -> int: return int(p["stages"].get(id, {}).get("stars", 0))
static func cleared(p: Dictionary, id: String) -> bool: return stars(p, id) > 0

static func stage_open(p: Dictionary, id: String) -> bool:
	var prev := Campaign.previous(id)
	return prev == "" or cleared(p, prev)

## Estrelas da vitória: 3 com todos de pé, 2 com pelo menos metade, 1 com menos.
static func stars_for(alive: int, team_size: int) -> int:
	if alive >= team_size: return 3
	if alive * 2 >= team_size: return 2
	return 1

## Ouro e experiência (por herói) de limpar a sala i da fase; a sala do chefe vale mais.
static func room_reward(st: Dictionary, i: int) -> Dictionary:
	var rw: Dictionary = Data.progression()["rewards"]
	var rooms := Campaign.rooms(st)
	var boss: bool = st.get("boss", false) and i == rooms.size() - 1
	var lvl: int = rooms[i][0]["lvl"]
	return {"xp": roundi((rw["roomXp"]["base"] + rw["roomXp"]["perLevel"] * lvl) * (rw["bossXpMult"] if boss else 1)),
		"gold": roundi((rw["roomGold"]["base"] + rw["roomGold"]["perLevel"] * lvl) * (rw["bossGoldMult"] if boss else 1))}

## Fim de uma fase: aplica e devolve as recompensas.
## {win, first, stars, gold, gems, crystals, xp, tokens: {k: n}, token_gold, levelups: {k: n}}
static func finish_stage(p: Dictionary, id: String, win: bool, rooms_cleared: int, alive: int, team: Array, rng: RandomNumberGenerator) -> Dictionary:
	var st := Campaign.stage(id)
	var rw: Dictionary = Data.progression()["rewards"]
	var rooms := Campaign.rooms(st)
	var res := {"win": win, "first": false, "stars": 0, "gold": 0, "gems": 0, "crystals": 0, "xp": 0, "tokens": {}, "token_gold": 0, "levelups": {}}
	for i in mini(rooms_cleared, rooms.size()):
		var rr := room_reward(st, i)
		res["xp"] += rr["xp"]
		res["gold"] += rr["gold"]
	if win:
		var rec: Dictionary = p["stages"].get(id, {"stars": 0, "clears": 0})
		res["first"] = rec["stars"] == 0
		res["stars"] = stars_for(alive, team.size())
		if res["first"]:
			var f: Dictionary = st.get("first", {})
			res["gold"] += int(f.get("gold", rw["firstClearGoldPerLevel"] * int(st["lvl"])))
			res["gems"] += int(f.get("gems", 0))
			res["crystals"] += int(f.get("crystals", 0))
			for k in f.get("tokens", {}): res["tokens"][k] = int(f["tokens"][k])
		elif st.get("boss", false):
			res["crystals"] += int(rw["crystalsRepeat"])
		if res["stars"] == 3 and rec["stars"] < 3:
			res["gems"] += int(Campaign.conf()["stars"]["firstThreeGems"])
		var drop: Dictionary = st.get("drop", {})
		if not drop.is_empty() and rng.randf() < float(drop["chance"]):
			var k: String = drop["hero"]
			res["tokens"][k] = int(res["tokens"].get(k, 0)) + rng.randi_range(int(drop["min"]), int(drop["max"]))
		rec["stars"] = maxi(rec["stars"], res["stars"])
		rec["clears"] += 1
		p["stages"][id] = rec
	p["gold"] += res["gold"]
	p["gems"] += res["gems"]
	p["crystals"] += res["crystals"]
	for k in res["tokens"]: res["token_gold"] += add_tokens(p, k, res["tokens"][k])
	for k in team:
		if owns(p, k):
			var ups := add_xp(p, k, res["xp"])
			if ups > 0: res["levelups"][k] = ups
	return res
