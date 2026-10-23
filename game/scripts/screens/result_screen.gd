extends CanvasLayer
## Resultado da fase, por cima da batalha: vitória ou derrota, estrelas, moedas, fichas
## (com a barra até liberar o herói), experiência e botões Mapa / Repetir / Próxima.

const UI := preload("res://scripts/ui/ui_kit.gd")
const Data := preload("res://scripts/core/data.gd")
const Campaign := preload("res://scripts/core/campaign.gd")
const Profile := preload("res://scripts/core/profile.gd")

var app
var stage_id := ""
var result: Dictionary
var team: Array = []

func _init() -> void:
	layer = 20

func _ready() -> void:
	var root := UI.full(ColorRect.new())
	root.color = Color(0.03, 0.01, 0.05, 0.72)
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	root.theme = UI.theme()
	add_child(root)
	var p := UI.panel(Color(0.13, 0.07, 0.16, 0.97), UI.GOLD if result["win"] else UI.BAD, 20)
	root.add_child(p)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	var w := minf(620, root.get_viewport_rect().size.x - 32)
	v.custom_minimum_size = Vector2(w, 0)
	p.add_child(UI.margin(v, 10, 6, 10, 6))
	var t := UI.label("Vitória!" if result["win"] else "Derrota", 52, UI.GOLD if result["win"] else UI.BAD, 12)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var sub := UI.label("Fase %s%s" % [stage_id, " · primeira vitória!" if result["first"] else ""], 20, UI.INK_DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(sub)
	if result["win"]:
		var stars := UI.stars(0, 52)
		stars.alignment = BoxContainer.ALIGNMENT_CENTER
		v.add_child(stars)
		for i in result["stars"]:
			var s: TextureRect = stars.get_child(i)
			s.pivot_offset = Vector2(26, 26)
			var tw := create_tween()
			tw.tween_interval(0.25 + 0.3 * i)
			tw.tween_property(s, "modulate", UI.GOLD, 0.05)
			tw.tween_property(s, "scale", Vector2.ONE * 1.35, 0.12)
			tw.tween_property(s, "scale", Vector2.ONE, 0.12)
	# moedas
	var coins := HBoxContainer.new()
	coins.alignment = BoxContainer.ALIGNMENT_CENTER
	coins.add_theme_constant_override("separation", 26)
	coins.add_child(_coin("coin", UI.GOLD, result["gold"] + result["token_gold"]))
	if result["gems"] > 0: coins.add_child(_coin("gem", UI.GEM, result["gems"]))
	if result["crystals"] > 0: coins.add_child(_coin("crystal", UI.CRYSTAL, result["crystals"]))
	v.add_child(coins)
	# fichas
	var need := int(Campaign.conf()["unlock"]["tokens"])
	for k in result["tokens"]:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		row.add_child(UI.portrait_frame(k, 56, not Profile.owns(app.profile, k)))
		var col := VBoxContainer.new()
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		col.add_theme_constant_override("separation", 2)
		var name: String = Data.unit_def(k)["name"]
		if Profile.owns(app.profile, k):
			col.add_child(UI.label("+%d fichas de %s (viraram ouro)" % [result["tokens"][k], name], 19))
		else:
			var have := Profile.tokens(app.profile, k)
			col.add_child(UI.label("+%d fichas de %s · %d/%d" % [result["tokens"][k], name, have, need], 19))
			var b := UI.bar(Color("b98aff"), 14)
			b.max_value = need
			b.value = 0
			col.add_child(b)
			create_tween().tween_property(b, "value", float(mini(have, need)), 0.8).set_delay(0.4)
			if have >= need: col.add_child(UI.label("Pronto para liberar na tela Heróis!", 17, Color("aef5b0")))
		row.add_child(col)
		v.add_child(row)
	# experiência
	if result["xp"] > 0:
		var xp := HBoxContainer.new()
		xp.alignment = BoxContainer.ALIGNMENT_CENTER
		xp.add_theme_constant_override("separation", 10)
		for k in team:
			if not Profile.owns(app.profile, k): continue
			var c := VBoxContainer.new()
			c.add_theme_constant_override("separation", 0)
			var pf := UI.portrait_frame(k, 54)
			pf.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
			c.add_child(pf)
			var up: int = result["levelups"].get(k, 0)
			var l := UI.label("Nv %d%s" % [app.profile["heroes"][k]["lvl"], " +%d" % up if up > 0 else ""], 16, Color("aef5b0") if up > 0 else UI.INK)
			l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			c.add_child(l)
			xp.add_child(c)
		v.add_child(xp)
		var xl := UI.label("+%d de experiência para cada herói" % result["xp"], 16, UI.INK_DIM)
		xl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(xl)
	# botões
	var buttons := HBoxContainer.new()
	buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	buttons.add_theme_constant_override("separation", 12)
	var map := UI.button("Mapa", Color("4a3560"), 24)
	map.pressed.connect(func(): _go(func(): app.open_map(stage_id)))
	buttons.add_child(map)
	var again := UI.button("Repetir", Color("3b6fd1"), 24)
	again.pressed.connect(func(): _go(func(): app.open_battle(stage_id)))
	buttons.add_child(again)
	var nxt := _next_stage()
	if result["win"] and nxt != "":
		var go := UI.button("Próxima: %s" % nxt, Color("3aa655"), 24)
		go.pressed.connect(func(): _go(func(): app.open_heroes(nxt)))
		buttons.add_child(go)
	elif not result["win"]:
		var heroes := UI.button("Melhorar heróis", Color("3aa655"), 24)
		heroes.pressed.connect(func(): _go(func(): app.open_heroes(stage_id)))
		buttons.add_child(heroes)
	v.add_child(buttons)
	p.resized.connect(func(): p.position = (root.size - p.size) / 2)
	p.modulate.a = 0
	create_tween().tween_property(p, "modulate:a", 1.0, 0.25)

func _coin(icon_name: String, color: Color, n: int) -> Control:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 6)
	h.add_child(UI.icon_rect(icon_name, 36, color))
	h.add_child(UI.label("+" + UI.fmt(n), 30, color, 8))
	return h

func _next_stage() -> String:
	var all := Campaign.stages()
	for i in all.size() - 1:
		if all[i]["id"] == stage_id: return all[i + 1]["id"]
	return ""

func _go(action: Callable) -> void:
	queue_free()
	action.call()
