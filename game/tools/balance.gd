extends SceneTree
## Simulador de balanceamento: roda milhares de lutas com o núcleo real e gera um relatório.
##   tools/godot.sh balance                 relatório no terminal
##   tools/godot.sh balance --write         grava também ../docs/balanceamento.md
##   tools/godot.sh balance --pvp 4000 --dungeon 400 --seed 1
## Metas (docs/balanceamento.md): PvP 45–55% por herói; masmorras 70–85% no nível recomendado;
## lutas de chefe de 8 a 15 rodadas.

const Data := preload("res://scripts/core/data.gd")
const Progression := preload("res://scripts/core/progression.gd")
const DungeonRun := preload("res://scripts/core/dungeon_run.gd")

var args := {"pvp": 3000, "dungeon": 300, "seed": 1, "write": false}
var rng := RandomNumberGenerator.new()

func _init() -> void:
	var a := OS.get_cmdline_user_args()
	var i := 0
	while i < a.size():
		match a[i]:
			"--write": args["write"] = true
			"--pvp": i += 1; args["pvp"] = int(a[i])
			"--dungeon": i += 1; args["dungeon"] = int(a[i])
			"--seed": i += 1; args["seed"] = int(a[i])
		i += 1
	rng.seed = args["seed"]
	var t0 := Time.get_ticks_msec()
	var lines: Array = []
	lines.append_array(pvp_report())
	lines.append_array(dungeon_report())
	var md := "\n".join(lines)
	print(md)
	print("\n(%d ms)" % (Time.get_ticks_msec() - t0))
	if args["write"]: write_doc(md)
	quit(0)

func team_of(keys: Array, lvl: int, evo: int) -> Array:
	return keys.map(func(k): return {"k": k, "lvl": lvl, "evo": evo})

func random_team(n := 4) -> Array:
	var order: Array = Data.hero_order().duplicate()
	for i in range(order.size() - 1, 0, -1):
		var j := rng.randi() % (i + 1)
		var tmp = order[i]; order[i] = order[j]; order[j] = tmp
	return order.slice(0, n)

func pct(v: float) -> String: return "%d%%" % roundi(v * 100.0)

func flag(v: float, lo: float, hi: float) -> String:
	return "✅" if v >= lo and v <= hi else ("🔺" if v > hi else "🔻")

# ---------------- PvP: valor de cada herói ----------------
func pvp_report() -> Array:
	var out: Array = ["## PvP (Invasão): vitória por herói", "",
		"%d lutas por evolução, equipes de 4 sorteadas, nível 10. Cada luta é jogada nos dois lados (ataque e defesa) para anular a vantagem de quem ataca. Meta: 45%% a 55%%." % args["pvp"], ""]
	var order: Array = Data.hero_order()
	var header := "| Herói | Tipo | Evo 1 | Evo 2 | Evo 3 | Dano/luta | Cura+escudo/luta |"
	out.append(header)
	out.append("|---|---|---|---|---|---|---|")
	var res := {}
	for k in order: res[k] = {"w": [0, 0, 0], "n": [0, 0, 0], "dmg": 0.0, "sup": 0.0, "cnt": 0}
	for evo in [1, 2, 3]:
		for m in args["pvp"]:
			var a := random_team()
			var b := random_team()
			for side in 2:
				var ta: Array = a if side == 0 else b
				var tb: Array = b if side == 0 else a
				var r := DungeonRun.pvp(team_of(ta, 10, evo), team_of(tb, 10, evo), rng.randi())
				for k in ta:
					res[k]["n"][evo - 1] += 1
					if r["win"]: res[k]["w"][evo - 1] += 1
				for k in tb:
					res[k]["n"][evo - 1] += 1
					if not r["win"] and r["state"] != "stalled": res[k]["w"][evo - 1] += 1
				if evo == 2:
					for u in r["battle"].units:
						if u.is_hero:
							res[u.key]["dmg"] += u.stats["dmg"]
							res[u.key]["sup"] += u.stats["heal"] + u.stats["shield"]
							res[u.key]["cnt"] += 1
	for k in order:
		var row := "| %s | %s |" % [Data.heroes()[k]["name"], Data.all()["heroes"]["types"][Data.heroes()[k]["type"]]["n"]]
		for e in 3:
			var wr: float = float(res[k]["w"][e]) / max(1, res[k]["n"][e])
			row += " %s %s |" % [pct(wr), flag(wr, 0.45, 0.55)]
		var c: int = max(1, res[k]["cnt"])
		row += " %d | %d |" % [roundi(res[k]["dmg"] / c), roundi(res[k]["sup"] / c)]
		out.append(row)
	out.append("")
	return out

# ---------------- masmorras ----------------
func dungeon_report() -> Array:
	var out: Array = ["## Masmorras: chance de vitória", "",
		"%d corridas por linha, equipes de 4 sorteadas com os heróis disponíveis, heróis no nível da masmorra. Meta no nível recomendado com evolução 1: 70%% a 85%% (o Covil dos Goblins é o tutorial: 85%% a 95%%). Rodadas do chefe = ações do chefe; meta 8 a 15." % args["dungeon"], ""]
	out.append("| Masmorra | Nível dos heróis | Evo | Vitória | Salas limpas (média) | Rodadas do chefe | Heróis vivos no fim |")
	out.append("|---|---|---|---|---|---|---|")
	var unlocked: Array = Data.all()["heroes"]["starters"].duplicate()
	for d in Data.dungeons():
		for cfg in [[int(d["lvl"]), 1], [int(d["lvl"]) + 2, 1], [int(d["lvl"]), 2]]:
			var wins := 0
			var cleared := 0.0
			var boss_rounds := 0.0
			var boss_n := 0
			var alive_end := 0.0
			for i in args["dungeon"]:
				var pool := unlocked.duplicate()
				for j in range(pool.size() - 1, 0, -1):
					var x := rng.randi() % (j + 1)
					var tmp = pool[j]; pool[j] = pool[x]; pool[x] = tmp
				var r := DungeonRun.play(team_of(pool.slice(0, 4), cfg[0], cfg[1]), d, rng.randi())
				if r["win"]:
					wins += 1
					alive_end += r["alive"]
				cleared += r["cleared"]
				for u in r["battle"].units:
					if u.is_boss:
						boss_rounds += u.boss_turns
						boss_n += 1
			var wr: float = float(wins) / args["dungeon"]
			var target: bool = cfg[0] == int(d["lvl"]) and cfg[1] == 1
			var br: float = boss_rounds / max(1, boss_n)
			var tw: Array = d.get("targetWin", [0.70, 0.85])
			out.append("| %s | %d | %d | %s %s | %.1f de 3 | %.1f %s | %.1f |" % [d["name"], cfg[0], cfg[1], pct(wr), flag(wr, tw[0], tw[1]) if target else "", cleared / args["dungeon"], br, flag(br, 8, 15) if boss_n > 0 else "", alive_end / max(1, wins)])
		if d.has("unlockHero"): unlocked.append(d["unlockHero"])
	out.append("")
	return out

func write_doc(md: String) -> void:
	var path := ProjectSettings.globalize_path("res://").path_join("../docs/balanceamento.md")
	var head := "# Balanceamento\n\nRelatório gerado por `tools/godot.sh balance --write` (núcleo de combate do Godot, semente %d). Não edite à mão: mude os números em `data/` e gere de novo.\n\n" % args["seed"]
	var prev := FileAccess.get_file_as_string(path)
	var notes := ""
	var idx := prev.find("## Histórico de ajustes")
	if idx >= 0: notes = "\n" + prev.substr(idx)
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(head + md + notes)
	f.close()
	print("gravado em ", path)
