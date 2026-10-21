extends RefCounted
## Lógica de cada habilidade. Só regras: nada de animação aqui (a apresentação lê os eventos).
## Os números vêm de data/abilities.json (values). Espelha AB em src/js/05-battle.js.

const Data := preload("res://scripts/core/data.gd")

static func run(b, id: String, u, t) -> void:
	var v: Dictionary = Data.values(id)
	match id:
		# ---- ataques simples (básicos e inimigos comuns) ----
		"escudo", "faisca", "luzsagrada", "tiro", "jatoAgua", "machadada", "toqueSombrio", "lanca", "flecha", "espada", "jato", "raio":
			b.hit(u, t, v["dmg"])
		# ---- Brom ----
		"provocar":
			b.add_status(u, "taunt", int(v["turns"]))
			b.add_status(u, "shield", int(v["turns"]), roundi(u.max_hp * v["shieldMaxHp"]), u)
		"terremoto":
			for e in b.foes_of(u):
				b.hit(u, e, v["dmg"])
				if e.alive and b.rng.randf() < v["stun"]: b.stun(e)
		"fortaleza":
			for a in b.friends_of(u): b.add_status(a, "shield", int(v["turns"]), roundi(u.max_hp * v["shieldMaxHp"]), u)
			b.add_status(u, "taunt", int(v["turns"]))
		# ---- Lyra ----
		"bolafogo", "explosaoSolar":
			b.hit(u, t, v["dmg"], {"heavy": true})
			if t.alive: b.add_status(t, "burn", int(v["turns"]), roundi(u.atk() * v["burn"]))
		"meteoros", "redemoinho":
			for e in b.foes_of(u):
				b.hit(u, e, v["dmg"])
				if e.alive: b.add_status(e, "burn", int(v["turns"]), roundi(u.atk() * v["burn"]))
		# ---- Alva ----
		"prece":
			b.heal(t, u.atk() * v["heal"], u)
		"bencao":
			for a in b.friends_of(u):
				b.heal(a, u.atk() * v["heal"], u)
				b.cleanse(a, ["burn", "poison", "stun"])
		"ressurreicao":
			b.revive(t, v["hpMax"], u)
		# ---- Vex ----
		"corte":
			for i in int(v["hits"]):
				if t.alive: b.hit(u, t, v["dmg"])
		"veneno":
			b.hit(u, t, v["dmg"])
			if t.alive: b.add_status(t, "poison", int(v["turns"]), roundi(u.atk() * v["poison"]))
		"execucao":
			var low: bool = t.ratio() < v["lowHp"]
			b.hit(u, t, v["dmg"], {"heavy": true, "bonus": v["lowBonus"] if low else 1.0})
		"dancaSombras":
			for i in int(v["hits"]):
				var foes: Array = b.foes_of(u)
				if foes.is_empty(): break
				b.hit(u, foes[b.rng.randi() % foes.size()], v["dmg"], {"crit": u.crit + v["critBonus"]})
		# ---- Kai ----
		"perfurante":
			b.hit(u, t, v["dmg"], {"pierce": true, "crit": u.crit + v["critBonus"], "heavy": true})
		"chuvaFlechas", "rajada":
			for e in b.foes_of(u): b.hit(u, e, v["dmg"])
		"tiroAtordoante":
			b.hit(u, t, v["dmg"], {"heavy": true})
			if t.alive: b.stun(t)
		# ---- Mira ----
		"ondaCura":
			for a in b.friends_of(u): b.heal(a, u.atk() * v["heal"], u)
		"bolha":
			for a in b.friends_of(u): b.add_status(a, "shield", int(v["turns"]), roundi(u.atk() * v["shield"]), u)
		"mareAlta":
			for e in b.foes_of(u): b.hit(u, e, v["dmg"])
			for a in b.friends_of(u): b.heal(a, u.atk() * v["heal"], u)
		# ---- Rook ----
		"sede":
			b.add_status(u, "enrage", int(v["turns"]))
			b.heal(u, u.max_hp * v["healMaxHp"], u)
		"furiaSangue", "drenar":
			var d: int = b.hit(u, t, v["dmg"], {"heavy": true})
			if d > 0: b.heal(u, d * v["lifesteal"], u)
		# ---- Nyx ----
		"maldicao":
			for e in b.foes_of(u):
				b.hit(u, e, v["dmg"])
				if e.alive: b.add_status(e, "poison", int(v["turns"]), roundi(u.atk() * v["poison"]))
		"colheita":
			var total := 0
			for e in b.foes_of(u): total += b.hit(u, e, v["dmg"])
			if total > 0: b.heal(u, total * v["lifesteal"], u)
		# ---- inimigos comuns ----
		"curaLodo":
			b.heal(t, t.max_hp * v["healMaxHp"], u)
		"brasa":
			b.hit(u, t, v["dmg"])
			if t.alive and b.rng.randf() < v["burnChance"]: b.add_status(t, "burn", int(v["turns"]), roundi(u.atk() * v["burn"]))
		"rajadaFogo":
			for e in b.foes_of(u):
				b.hit(u, e, v["dmg"])
				if e.alive: b.add_status(e, "burn", int(v["turns"]), roundi(u.atk() * v["burn"]))
		"pancada":
			b.hit(u, t, v["dmg"], {"heavy": true})
			if t.alive and b.rng.randf() < v["stun"]: b.stun(t)
		# ---- chefes (kit comum) ----
		"bBasic":
			b.hit(u, t, v["dmg"] if u.def["bk"].get("melee", true) else v["dmgRanged"], {"heavy": true})
		"bAoe":
			var st = u.def["bk"].get("aoeStatus")
			for e in b.foes_of(u):
				b.hit(u, e, v["dmg"])
				if e.alive and st: b.add_status(e, st, int(v["turns"]), roundi(u.atk() * v["status"]))
		"bPrep":
			b.add_status(u, "charge", 2)
			b.emit("telegraph", {"actor": u.id})
		"bBig":
			b.remove_status(u, "charge")
			for e in b.foes_of(u): b.hit(u, e, v["dmg"], {"heavy": true})
		"bRage":
			u.enraged = true
			b.add_status(u, "enrage", 99)
			for i in int(v["adds"]):
				b.summon(u.def["bk"]["adds"], maxi(1, u.lvl + int(v["addLvl"])), u.side)
		_:
			push_error("Habilidade sem lógica: %s" % id)

## Todas as habilidades com lógica (o teste confere contra data/abilities.json).
const IMPLEMENTED := ["escudo", "faisca", "luzsagrada", "tiro", "jatoAgua", "machadada", "toqueSombrio", "lanca", "flecha", "espada", "jato", "raio",
	"provocar", "terremoto", "fortaleza", "bolafogo", "explosaoSolar", "meteoros", "redemoinho", "prece", "bencao", "ressurreicao",
	"corte", "veneno", "execucao", "dancaSombras", "perfurante", "chuvaFlechas", "rajada", "tiroAtordoante", "ondaCura", "bolha", "mareAlta",
	"sede", "furiaSangue", "drenar", "maldicao", "colheita", "curaLodo", "brasa", "rajadaFogo", "pancada",
	"bBasic", "bAoe", "bPrep", "bBig", "bRage"]
