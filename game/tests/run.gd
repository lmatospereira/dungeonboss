extends SceneTree
## Testes headless do núcleo de combate e dos dados.
##   tools/godot.sh test
## Sai com código 1 se algum teste falhar.

const Data := preload("res://scripts/core/data.gd")
const Progression := preload("res://scripts/core/progression.gd")
const Battle := preload("res://scripts/core/battle.gd")
const Abilities := preload("res://scripts/core/abilities.gd")
const DungeonRun := preload("res://scripts/core/dungeon_run.gd")

var passed := 0
var failed: Array = []

func check(cond: bool, name: String) -> void:
	if cond: passed += 1
	else: failed.append(name)

func team(keys: Array, lvl := 1, evo := 1) -> Array:
	return keys.map(func(k): return {"k": k, "lvl": lvl, "evo": evo})

## Avança a luta até pred() ser verdadeiro. Heróis que esperam o jogador usam o ataque básico.
func run_until(b, pred: Callable, limit := 500) -> void:
	for i in limit:
		if pred.call(): return
		var r: Dictionary = b.step()
		if r["state"] == "await_input":
			if pred.call(): return
			var u = b.current
			b.act(u.abilities[0], b.foes_of(u)[0].id)
		elif r["state"] != "running": return

func _init() -> void:
	# cada bloco devolve true no fim; se parar no meio por erro de script, conta como falha
	for t in ["test_data", "test_progression", "test_damage", "test_cooldowns_and_status", "test_revive_and_boss", "test_determinism_and_termination"]:
		check(call(t) == true, "%s terminou sem erro de script" % t)
	print("\n%d testes passaram, %d falharam" % [passed, failed.size()])
	for f in failed: print("  FALHOU: ", f)
	quit(1 if failed.size() > 0 else 0)

# ---------------- dados ----------------
func test_data() -> bool:
	var abl := Data.abilities()
	for id in abl.keys():
		check(id in Abilities.IMPLEMENTED, "habilidade %s tem lógica no núcleo" % id)
		check(abl[id].has("values") and abl[id]["values"].has("cd"), "habilidade %s tem values.cd" % id)
		if abl[id].has("text"):
			var t := Data.ability_text(id)
			check(t != "" and not "{" in t, "texto de %s renderiza (%s)" % [id, t])
	for id in Abilities.IMPLEMENTED:
		check(abl.has(id), "lógica %s tem dados" % id)
	for k in Data.hero_order():
		var h: Dictionary = Data.heroes()[k]
		check(h["abilities"].size() == 3, "%s tem básico + 2 habilidades" % k)
		check(h.has("ult") and abl.has(h["ult"]) and abl[h["ult"]].get("ult", false), "%s tem 4º poder marcado como ult" % k)
		check(h.has("weapon") and h["weapon"].has("name"), "%s tem arma lendária" % k)
		check(Data.elements().has(h["el"]), "%s tem elemento válido" % k)
		for a in h["abilities"]: check(abl.has(a), "%s: habilidade %s existe" % [k, a])
	for d in Data.dungeons():
		check(Data.unit_def(d["boss"]).get("boss", false), "masmorra %s tem chefe válido" % d["id"])
		for r in d["rooms"]:
			for e in r: check(not Data.unit_def(e).is_empty(), "inimigo %s existe" % e)
	return true

# ---------------- progressão (valores conferidos na versão three.js) ----------------
func test_progression() -> bool:
	# fórmula: base × (1 + bônus × (nível−1)) × multiplicador da evolução × (1 + bônus da arma)
	var h: Dictionary = Data.heroes()["brom"]
	var m: float = (1.0 + Data.progression()["levelBonus"] * 11) * float(Data.progression()["evolution"]["mult"][3])
	var s := Progression.hero_stats("brom", 12, 3)
	check(s["hp"] == roundi(h["hp"] * m * (1.0 + h["weapon"].get("hp", 0.0))), "vida do Brom nível 12 evo 3 segue a fórmula (veio %s)" % s["hp"])
	check(is_equal_approx(s["atk"], h["atk"] * m * (1.0 + h["weapon"].get("atk", 0.0))), "ataque do Brom nível 12 evo 3 segue a fórmula")
	check(s["hp"] > Progression.hero_stats("brom", 12, 2)["hp"] and Progression.hero_stats("brom", 12, 2)["hp"] > Progression.hero_stats("brom", 12, 1)["hp"], "evolução aumenta a vida")
	check(Progression.hero_abilities("lyra", 1).size() == 3, "evolução 1: 3 poderes")
	check(Progression.hero_abilities("lyra", 2).size() == 4, "evolução 2: 4 poderes")
	check(Progression.xp_need(1) == 80, "XP do nível 1 para o 2 = 80")
	check(Progression.hero_power("brom", 2) > Progression.hero_power("brom", 1), "poder cresce com o nível")
	return true

# ---------------- dano ----------------
func test_damage() -> bool:
	var b = Battle.new(7)
	check(b.elem_mult("fogo", "natureza") == Data.rules()["elemAdv"], "fogo vence natureza")
	check(b.elem_mult("natureza", "fogo") == Data.rules()["elemDis"], "natureza resiste mal ao fogo")
	check(b.elem_mult("luz", "sombra") == Data.rules()["elemAdv"] and b.elem_mult("sombra", "luz") == Data.rules()["elemAdv"], "luz e sombra vencem uma à outra")
	b.add_heroes(team(["lyra"]))
	b.load_room([{"k": "goblin", "lvl": 1}])
	var lyra = b.alive("hero")[0]
	var gob = b.alive("enemy")[0]
	lyra.crit = 0.0
	var d: int = b.hit(lyra, gob, 1.0)
	var exp: float = lyra.atk() * 1.5
	check(d >= floor(exp * 0.92) and d <= ceil(exp * 1.08), "dano com vantagem dentro da variação (%d, esperado ~%d)" % [d, roundi(exp)])
	gob.hp = gob.max_hp
	b.add_status(gob, "shield", 2, 10000)
	var d2: int = b.hit(lyra, gob, 1.0)
	check(d2 == 0 and gob.hp == gob.max_hp, "escudo absorve o dano")
	var d3: int = b.hit(lyra, gob, 1.0, {"pierce": true})
	check(d3 > 0, "perfurante ignora escudo")
	return true

# ---------------- recarga e status ----------------
func test_cooldowns_and_status() -> bool:
	var b = Battle.new(3)
	b.auto_heroes = false
	b.add_heroes(team(["lyra", "brom", "alva", "vex"]))
	b.load_room([{"k": "goblin", "lvl": 1}, {"k": "goblin", "lvl": 1}])
	run_until(b, func(): return b._waiting and b.current.key == "lyra")
	var lyra = b.current
	check(lyra.key == "lyra", "chega a vez da Lyra")
	lyra.cds["bolafogo"] = 0
	var gob = b.alive("enemy")[0]
	var r: Dictionary = b.act("bolafogo", gob.id)
	check(not r.has("error"), "jogador usa Bola de Fogo")
	check(lyra.cds["bolafogo"] == int(Data.values("bolafogo")["cd"]), "Bola de Fogo entra em recarga")
	check(not gob.alive or gob.has_status("burn"), "Bola de Fogo queima o alvo")
	var r2: Dictionary = b.act("bolafogo", gob.id)
	check(r2.has("error"), "não age fora da vez")
	# provocação redireciona ataques individuais
	var b2 = Battle.new(5)
	b2.add_heroes(team(["brom", "lyra"]))
	b2.load_room([{"k": "goblin", "lvl": 1}])
	var brom = b2.side_units("hero")[0]
	b2.add_status(brom, "taunt", 5)
	var foe = b2.alive("enemy")[0]
	var AI := preload("res://scripts/core/ai.gd")
	check(AI.best_foe(b2, foe, "random") == brom, "provocação atrai o ataque")
	# atordoamento faz perder a vez; chefe é imune
	var b3 = Battle.new(9)
	b3.add_heroes(team(["kai"]))
	b3.load_room([{"k": "grakk", "lvl": 1}])
	var boss = b3.alive("enemy")[0]
	b3.stun(boss)
	check(not boss.has_status("stun"), "chefe é imune a atordoamento")
	# veneno tira vida no início do turno
	var b4 = Battle.new(11)
	b4.add_heroes(team(["vex"]))
	b4.load_room([{"k": "esqueleto", "lvl": 3}])
	var sk = b4.alive("enemy")[0]
	b4.add_status(sk, "poison", 3, 50)
	var before: int = sk.hp
	b4._tick_start(sk)
	check(sk.hp == before - 50, "veneno causa dano por turno")
	return true

# ---------------- ressurreição e chefe ----------------
func test_revive_and_boss() -> bool:
	var b = Battle.new(13)
	b.add_heroes(team(["alva", "lyra"], 6, 2))
	b.load_room([{"k": "goblin", "lvl": 1}])
	var alva = b.side_units("hero")[0]
	var lyra = b.side_units("hero")[1]
	check("ressurreicao" in alva.abilities, "Alva evolução 2 tem Ressurreição")
	lyra.hp = 0
	b.kill(lyra)
	b.revive(lyra, Data.values("ressurreicao")["hpMax"], alva)
	check(lyra.alive and lyra.hp == roundi(lyra.max_hp * Data.values("ressurreicao")["hpMax"]), "Ressurreição traz de volta com a vida certa")
	# chefe: prepara de N em N ações, golpe forte em seguida, fúria abaixo de 50% com reforços
	var seen := {}
	for seed in 12:
		var b2 = Battle.new(17 + seed)
		b2.add_heroes(team(["brom", "alva", "mira", "kai"], 9, 2))
		b2.load_room([{"k": "gorruk", "lvl": 9}])
		var boss = b2.alive("enemy")[0]
		for i in 400:
			var r: Dictionary = b2.step()
			for e in r["events"]:
				if e["type"] == "ability" and e["actor"] == boss.id: seen[e["ability"]] = true
				if e["type"] == "summon": seen["summon"] = true
			if r["state"] != "running": break
	check(seen.has("bPrep") and seen.has("bBig"), "chefe telegrafa e usa o golpe forte")
	check(seen.has("bRage") and seen.has("summon"), "chefe entra em fúria e chama reforços")
	return true

# ---------------- determinismo e fim garantido ----------------
func test_determinism_and_termination() -> bool:
	var d: Dictionary = Data.dungeons()[1]
	var t := team(["brom", "alva", "lyra", "nyx"], 5, 2)
	var a := DungeonRun.play(t, d, 42)
	var b := DungeonRun.play(t, d, 42)
	check(a["win"] == b["win"] and a["actions"] == b["actions"], "mesma semente, mesma luta")
	var order: Array = Data.hero_order()
	var bad := 0
	for s in 150:
		var rng := RandomNumberGenerator.new()
		rng.seed = s
		var pick := order.duplicate()
		for i in range(pick.size() - 1, 0, -1):
			var j := rng.randi() % (i + 1)
			var tmp = pick[i]; pick[i] = pick[j]; pick[j] = tmp
		var r := DungeonRun.pvp(team(pick.slice(0, 4), 8, 1 + s % 3), team(pick.slice(4, 8), 8, 1 + (s + 1) % 3), s)
		if r["state"] == "stalled": bad += 1
		for u in r["battle"].units:
			if is_nan(u.base_atk) or u.hp < 0 or u.hp > u.max_hp: bad += 1
	check(bad == 0, "150 lutas PvP terminam sem travar e sem valores inválidos (%d problemas)" % bad)
	return true
