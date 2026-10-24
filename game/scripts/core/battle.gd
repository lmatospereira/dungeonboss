extends RefCounted
## Núcleo de combate por turnos. Puro: sem nós, sem animação, determinístico com semente.
##
## Uso (apresentação ou simulador):
##   var b = Battle.new(seed)
##   b.add_heroes([{k, lvl, evo}, ...]); b.load_room([{k, lvl}, ...])
##   loop: var r = b.step()  → r.events (lista de eventos a animar), r.state
##         se r.state == "await_input": chamar b.act(ability_id, target_id) e seguir com step()
##   estados: "running", "await_input", "room_won", "lost", "stalled"
## Regras espelham src/js/05-battle.js e 06-flow.js; números vêm de data/.

const Data := preload("res://scripts/core/data.gd")
const UnitState := preload("res://scripts/core/unit_state.gd")
const Abilities := preload("res://scripts/core/abilities.gd")
const AI := preload("res://scripts/core/ai.gd")

var rng := RandomNumberGenerator.new()
var units: Array = []
var current = null
var clock := 0.0
var actions := 0
var auto_heroes := true        # false: heróis esperam o jogador (await_input)
var events: Array = []         # eventos da ação em andamento
var _next_id := 1
var _waiting := false

func _init(p_seed: int = 1) -> void:
	rng.seed = p_seed

# ---------------- montagem ----------------
func add_unit(key: String, side: String, lvl: int, evo: int = 1, slot: int = -1):
	var u = UnitState.create(_next_id, key, side, lvl, evo)
	_next_id += 1
	u.slot = slot if slot >= 0 else side_units(side).size()
	units.append(u)
	return u

func add_heroes(team: Array) -> void:
	for i in team.size():
		var t: Dictionary = team[i]
		add_unit(t["k"], "hero", int(t["lvl"]), int(t.get("evo", 1)), i)

## Nova sala: remove inimigos anteriores, adiciona os novos e reinicia o relógio.
func load_room(enemies: Array) -> void:
	units = units.filter(func(u): return u.side == "hero")
	for i in enemies.size():
		var e: Dictionary = enemies[i]
		add_unit(e["k"], "enemy", int(e["lvl"]), int(e.get("evo", 1)), i)
	clock = 0.0
	for u in units:
		if u.alive:
			var base: float = 1000.0 / u.spd
			u.timer = base * (rng.randf_range(0.1, 0.75) if u.side == "hero" else rng.randf_range(0.3, 1.0))

## Entre salas: limpa status e recupera parte da vida dos heróis vivos.
func rest_between_rooms() -> Array:
	events = []
	for h in alive("hero"):
		h.status.clear()
		heal(h, h.max_hp * Data.rules()["roomHeal"], null)
	return events

# ---------------- consultas ----------------
func side_units(side: String) -> Array: return units.filter(func(u): return u.side == side)
func alive(side: String) -> Array: return units.filter(func(u): return u.side == side and u.alive)
func foes_of(u) -> Array: return alive("enemy" if u.side == "hero" else "hero")
func friends_of(u) -> Array: return alive(u.side)
func fallen_of(u) -> Array: return units.filter(func(x): return x.side == u.side and not x.alive and x.is_hero)
func unit_by_id(uid: int) -> Variant:
	for u in units:
		if u.id == uid: return u
	return null

func emit(type: String, data: Dictionary = {}) -> void:
	data["type"] = type
	events.append(data)

# ---------------- regras de dano e cura ----------------
func elem_mult(a: String, d: String) -> float:
	var el := Data.elements()
	var r := Data.rules()
	if el[a]["beats"] == d: return r["elemAdv"]
	if el[d]["beats"] == a: return r["elemDis"]
	return 1.0

## Golpe central: todo dano direto passa por aqui. Devolve o dano tirado da vida.
func hit(u, t, mult: float, o: Dictionary = {}) -> int:
	if not t.alive: return 0
	var r := Data.rules()
	var dmg: float = u.atk() * mult * rng.randf_range(1.0 - r["dmgVariance"], 1.0 + r["dmgVariance"])
	var em := elem_mult(u.el, t.el)
	dmg *= em
	var crit := rng.randf() < float(o.get("crit", u.crit))
	if crit: dmg *= r["critMult"]
	dmg *= 1.0 - t.dr
	dmg *= float(o.get("bonus", 1.0))
	var d := maxi(1, roundi(dmg))
	var absorbed := 0
	var sh = t.get_status("shield")
	if sh and not o.get("pierce", false):
		absorbed = mini(int(sh["value"]), d)
		sh["value"] -= absorbed
		d -= absorbed
		if sh["value"] <= 0: t.status.erase(sh)
	t.hp = maxi(0, t.hp - d)
	u.stats["dmg"] += d
	t.stats["taken"] += d
	emit("damage", {"src": u.id, "target": t.id, "amount": d, "absorbed": absorbed, "crit": crit, "elem": em, "heavy": o.get("heavy", false)})
	if t.hp <= 0:
		u.stats["kills"] += 1
		kill(t)
	return d

func heal(t, amount: float, src) -> int:
	if not t.alive: return 0
	var before: int = t.hp
	t.hp = mini(t.max_hp, t.hp + roundi(amount))
	var gained: int = t.hp - before
	if src: src.stats["heal"] += gained
	emit("heal", {"src": src.id if src else 0, "target": t.id, "amount": gained})
	return gained

func kill(t) -> void:
	t.alive = false
	t.status.clear()
	emit("death", {"target": t.id})

func revive(t, pct: float, src) -> void:
	if t.alive: return
	t.alive = true
	t.status.clear()
	t.hp = maxi(1, roundi(t.max_hp * pct))
	t.timer = clock + 1000.0 / t.spd * 0.5
	if src: src.stats["heal"] += t.hp
	emit("revive", {"src": src.id if src else 0, "target": t.id, "hp": t.hp})

# ---------------- status ----------------
func add_status(t, type: String, turns: int, value: float = 0.0, src = null) -> void:
	if not t.alive: return
	var s = t.get_status(type)
	if s:
		s["turns"] = maxi(s["turns"], turns)
		s["value"] = s["value"] + value if type == "shield" else maxf(s["value"], value)
		s["fresh"] = t == current
	else:
		t.status.append({"type": type, "turns": turns, "value": value, "fresh": t == current})
	if type == "shield" and src: src.stats["shield"] += int(value)
	emit("status", {"target": t.id, "status": type, "turns": turns, "value": value})

func remove_status(t, type: String) -> void:
	var s = t.get_status(type)
	if s:
		t.status.erase(s)
		emit("status_end", {"target": t.id, "status": type})

func stun(t) -> void:
	if t.stun_immune:
		emit("immune", {"target": t.id})
		return
	add_status(t, "stun", 1)

func cleanse(t, types: Array) -> void:
	var had := false
	for s in t.status.duplicate():
		if s["type"] in types:
			t.status.erase(s)
			had = true
	if had: emit("cleanse", {"target": t.id})

func summon(key: String, lvl: int, side: String):
	var u = add_unit(key, side, lvl, 1, 100 + side_units(side).size())
	u.timer = clock + 1000.0 / u.spd * 0.6
	emit("summon", {"target": u.id, "key": key})
	return u

# ---------------- fila de turnos ----------------
func _tick_start(u) -> void:
	for k in u.cds.keys():
		if u.cds[k] > 0: u.cds[k] -= 1
	for s in u.status.duplicate():
		if (s["type"] == "burn" or s["type"] == "poison") and u.alive:
			var d := mini(u.hp, int(s["value"]))
			u.hp -= d
			u.stats["taken"] += d
			emit("dot", {"target": u.id, "status": s["type"], "amount": d})
			if u.hp <= 0:
				kill(u)
				break

func _end_turn(u) -> void:
	for s in u.status:
		if s["fresh"]: s["fresh"] = false
		else: s["turns"] -= 1
	u.status = u.status.filter(func(s): return s["turns"] > 0 and not (s["type"] == "shield" and s["value"] <= 0))

func _outcome() -> String:
	if alive("hero").is_empty(): return "lost"
	if alive("enemy").is_empty(): return "room_won"
	return ""

## Executa a próxima ação (ou para esperando o jogador). Devolve {events, state, actor}.
func step() -> Dictionary:
	events = []
	if _waiting: return {"events": events, "state": "await_input", "actor": current.id}
	var end := _outcome()
	if end != "": return {"events": events, "state": end}
	if actions >= int(Data.rules()["maxTurns"]): return {"events": events, "state": "stalled"}
	var u = null
	for v in units:
		if v.alive and (u == null or v.timer < u.timer): u = v
	clock = u.timer
	current = u
	actions += 1
	emit("turn", {"actor": u.id})
	_tick_start(u)
	end = _outcome()
	if end != "": return {"events": events, "state": end}
	if u.alive:
		if u.has_status("stun"):
			emit("stunned", {"target": u.id})
			_finish(u)
		elif u.side == "hero" and not auto_heroes:
			_waiting = true
			return {"events": events, "state": "await_input", "actor": u.id}
		else:
			var c: Dictionary = AI.choose(self, u)
			_perform(u, c["ab"], c.get("target"))
			_finish(u)
	else:
		u.timer += 1000.0 / u.spd
	end = _outcome()
	return {"events": events, "state": end if end != "" else "running"}

## Ação escolhida pelo jogador (depois de um step() com "await_input").
func act(ability_id: String, target_id: int = 0) -> Dictionary:
	events = []
	if not _waiting: return {"events": events, "state": "running", "error": "não é a vez do jogador"}
	var u = current
	var err := validate(u, ability_id, target_id)
	if err != "": return {"events": events, "state": "await_input", "error": err, "actor": u.id}
	_waiting = false
	_perform(u, ability_id, unit_by_id(target_id) if target_id else null)
	_finish(u)
	var end := _outcome()
	return {"events": events, "state": end if end != "" else "running"}

## Confere se a ação do jogador é válida. Devolve "" ou a mensagem de erro.
func validate(u, ability_id: String, target_id: int) -> String:
	if not ability_id in u.abilities: return "habilidade indisponível"
	if u.cds.get(ability_id, 0) > 0: return "recarregando"
	var target: String = Data.ability(ability_id).get("target", "enemy")
	var t = unit_by_id(target_id) if target_id else null
	match target:
		"enemy":
			if t == null or not t in foes_of(u): return "escolha um inimigo"
		"ally":
			if t == null or not t in friends_of(u): return "escolha um aliado"
		"fallen":
			if t == null or not t in fallen_of(u): return "escolha um aliado caído"
	return ""

func _perform(u, ab: String, t) -> void:
	var cd := int(Data.values(ab).get("cd", 0))
	if cd > 0: u.cds[ab] = cd
	u.stats["actions"] += 1
	u.stats["casts"][ab] = u.stats["casts"].get(ab, 0) + 1
	emit("ability", {"actor": u.id, "ability": ab, "target": t.id if t else 0})
	Abilities.run(self, ab, u, t)

func _finish(u) -> void:
	if u.alive: _end_turn(u)
	u.timer += 1000.0 / u.spd
