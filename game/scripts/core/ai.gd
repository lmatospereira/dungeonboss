extends RefCounted
## Inteligência artificial (heróis no AUTO e na defesa da Invasão, inimigos e chefes).
## Toda aleatoriedade usa o rng da batalha, então a mesma semente gera a mesma luta.
## Espelha heroAI/enemyAI/bestFoe de src/js/05-battle.js.

const Data := preload("res://scripts/core/data.gd")

static func best_foe(b, u, mode: String = "") -> Variant:
	var foes: Array = b.foes_of(u)
	if foes.is_empty(): return null
	for f in foes:
		if f.has_status("taunt"): return f
	if mode == "random":
		if b.rng.randf() < 0.4:
			var s := foes.duplicate()
			s.sort_custom(func(a, c): return a.hp < c.hp)
			return s[0]
		return foes[b.rng.randi() % foes.size()]
	var s2 := foes.duplicate()
	s2.sort_custom(func(a, c):
		var ea: float = b.elem_mult(u.el, a.el)
		var ec: float = b.elem_mult(u.el, c.el)
		if ea != ec: return ea > ec
		return a.ratio() < c.ratio())
	return s2[0]

static func choose(b, u) -> Dictionary:
	if u.is_hero: return hero(b, u)
	return enemy(b, u)

static func hero(b, u) -> Dictionary:
	var basic: String = u.abilities[0]
	var specials: Array = u.abilities.slice(1)
	specials.reverse()                      # o último (4º poder) tem prioridade
	var foes: Array = b.foes_of(u)
	var friends: Array = b.friends_of(u)
	var low = friends[0]
	for f in friends:
		if f.ratio() < low.ratio(): low = f
	var hurt := friends.filter(func(f): return f.ratio() < 0.7).size()
	var dots := friends.any(func(f): return f.has_status("poison") or f.has_status("burn") or f.has_status("stun"))
	var taunting := foes.any(func(f): return f.has_status("taunt"))
	for id in specials:
		if u.cds.get(id, 0) > 0: continue
		var a := Data.ability(id)
		match a.get("target", "enemy"):
			"self":
				if id == "provocar" and u.has_status("taunt"): continue
				if id == "sede" and u.has_status("enrage"): continue
				return {"ab": id, "target": u}
			"ally":
				if low.ratio() < 0.6: return {"ab": id, "target": low}
			"fallen":
				var f: Array = b.fallen_of(u)
				if not f.is_empty(): return {"ab": id, "target": f[0]}
			"allies":
				var kind: String = a.get("kind", "")
				if kind == "heal" and (hurt >= 2 or low.ratio() < 0.45 or (dots and hurt >= 1)): return {"ab": id}
				if kind == "shield" and not friends.any(func(f): return f.shield() > 0) and (low.ratio() < 0.85 or foes.any(func(f): return f.is_boss)):
					return {"ab": id}
			"enemies":
				if foes.size() >= 2 or foes.any(func(f): return f.is_boss): return {"ab": id}
			"enemy":
				var t = _ai_target(b, u, id)
				if t == null: continue
				return {"ab": id, "target": best_foe(b, u) if taunting else t}
	return {"ab": basic, "target": best_foe(b, u)}

## Alvos especiais de algumas habilidades.
static func _ai_target(b, u, id: String) -> Variant:
	var foes: Array = b.foes_of(u)
	match id:
		"veneno":
			var c := foes.filter(func(f): return not f.has_status("poison"))
			if c.is_empty(): return null
			c.sort_custom(func(a, d): return a.hp > d.hp)
			return c[0]
		"execucao":
			var s := foes.duplicate()
			s.sort_custom(func(a, d): return a.ratio() < d.ratio())
			var f = s[0]
			if f.ratio() < float(Data.values("execucao")["lowHp"]) + 0.05 or f.is_boss or foes.size() == 1: return f
			return null
	return best_foe(b, u)

static func enemy(b, u) -> Dictionary:
	var ready := func(id): return u.cds.get(id, 0) == 0
	if u.is_boss:
		u.boss_turns += 1
		if u.has_status("charge"): return {"ab": "bBig"}
		if not u.enraged and u.ratio() < float(Data.values("bRage")["at"]): return {"ab": "bRage"}
		var every := int(Data.values("bPrep")["every"])
		if u.boss_turns % every == every - 1: return {"ab": "bPrep"}
		if ready.call("bAoe") and b.rng.randf() < float(Data.values("bAoe")["useChance"]): return {"ab": "bAoe"}
		return {"ab": "bBasic", "target": best_foe(b, u, "random")}
	if "curaLodo" in u.abilities and ready.call("curaLodo"):
		var hurt: Array = b.friends_of(u).filter(func(f): return f.ratio() < 0.6)
		if not hurt.is_empty():
			hurt.sort_custom(func(a, c): return a.ratio() < c.ratio())
			return {"ab": "curaLodo", "target": hurt[0]}
	for id in ["rajada", "rajadaFogo"]:
		if id in u.abilities and ready.call(id) and b.foes_of(u).size() >= 2 and b.rng.randf() < 0.8: return {"ab": id}
	return {"ab": u.abilities[0], "target": best_foe(b, u, "random")}
