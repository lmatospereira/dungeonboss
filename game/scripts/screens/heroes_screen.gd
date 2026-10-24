extends Node
## Heróis e equipe: os 4 espaços da equipe no topo, a lista de todos os heróis (os bloqueados
## mostram as fichas juntadas) e a ficha do herói escolhido, com treino, evolução, liberação e
## compra de ficha. Vinda do mapa com uma fase (`then_stage`), mostra o botão Lutar.

const UI := preload("res://scripts/ui/ui_kit.gd")
const Data := preload("res://scripts/core/data.gd")
const Campaign := preload("res://scripts/core/campaign.gd")
const Profile := preload("res://scripts/core/profile.gd")
const Progression := preload("res://scripts/core/progression.gd")
const Backdrop := preload("res://scripts/screens/backdrop.gd")
const TopBar := preload("res://scripts/screens/top_bar.gd")

var app
var then_stage := ""
var selected := ""
var _bg
var _layer: CanvasLayer
var _ui: Control
var _msg := ""

func _ready() -> void:
	_bg = Backdrop.new()
	add_child(_bg)
	_bg.set_theme("arena")
	_layer = CanvasLayer.new()
	add_child(_layer)
	selected = app.profile["team"][0] if app.profile["team"].size() > 0 else Data.hero_order()[0]
	get_viewport().size_changed.connect(_build)
	_build()

func _p() -> Dictionary: return app.profile

func _build() -> void:
	if _ui: _ui.queue_free()
	var portrait := UI.is_portrait(self)
	_bg.base = Vector3(0, 2.8, 9.8) if not portrait else Vector3(0, 1.2, 8.0)
	_bg.look = Vector3(0, 1.1, -1.0) if not portrait else Vector3(0, -4.2, -1.0)
	_bg.set_lineup([selected], -1.0 if not portrait else 0.0, 2.0, 0.6 if not portrait else 0.0)
	_bg.spin(true)
	_ui = UI.full(Control.new())
	_ui.theme = UI.theme()
	_layer.add_child(_ui)
	var top := TopBar.new()
	top.title = "Equipe" if then_stage != "" else "Heróis"
	top.show_back = true
	top.profile = _p()
	top.back_pressed.connect(func(): app.open_map(then_stage))
	_ui.add_child(top)
	var body := BoxContainer.new()
	body.vertical = portrait
	body.set_anchors_preset(Control.PRESET_FULL_RECT)
	body.offset_top = 80
	body.offset_left = 16
	body.offset_right = -16
	body.offset_bottom = -16
	body.add_theme_constant_override("separation", 14)
	body.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ui.add_child(body)
	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL if portrait else Control.SIZE_SHRINK_BEGIN
	left.add_theme_constant_override("separation", 10)
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if portrait:
		var room := Control.new()
		room.custom_minimum_size = Vector2(0, 250)
		room.mouse_filter = Control.MOUSE_FILTER_IGNORE
		body.add_child(room)
	body.add_child(left)
	left.add_child(_team_row())
	left.add_child(_roster(portrait))
	var sheet := _sheet(selected)
	sheet.custom_minimum_size = Vector2(470 if not portrait else 0, 0)
	sheet.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	if not portrait:
		var middle := Control.new()
		middle.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		middle.mouse_filter = Control.MOUSE_FILTER_IGNORE
		body.add_child(middle)
		var spacer := Control.new()
		spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
		spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		left.add_child(spacer)
	body.add_child(sheet)
	if then_stage != "":
		var fight := UI.button("Lutar!  Fase %s" % then_stage, Color("3aa655"), 30)
		fight.custom_minimum_size = Vector2(0, 66)
		fight.disabled = _p()["team"].is_empty()
		fight.pressed.connect(func():
			app.save()
			app.open_battle(then_stage))
		left.add_child(fight)

## Os 4 espaços da equipe (tocar num herói da lista põe ou tira).
func _team_row() -> Control:
	var p := UI.panel(Color(0.1, 0.05, 0.12, 0.88))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 6)
	var team: Array = _p()["team"]
	v.add_child(UI.label("Equipe (%d/%d) · poder %s" % [team.size(), Profile.TEAM_SIZE, UI.fmt(Progression.team_power(Profile.battle_team(_p())))], 20))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	for i in Profile.TEAM_SIZE:
		if i < team.size():
			var k: String = team[i]
			var pf := UI.portrait_frame(k, 74)
			pf.gui_input.connect(_tap.bind(func(): _toggle_team(k)))
			h.add_child(pf)
		else:
			var empty := PanelContainer.new()
			empty.add_theme_stylebox_override("panel", UI.box(Color(0, 0, 0, 0.35), Color(1, 1, 1, 0.25), 12, 2, 0))
			empty.custom_minimum_size = Vector2(74, 74)
			var plus := UI.label("+", 36, Color(1, 1, 1, 0.4))
			plus.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			plus.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			empty.add_child(plus)
			h.add_child(empty)
	v.add_child(h)
	if _msg != "": v.add_child(UI.label(_msg, 17, Color("ffd68a")))
	p.add_child(v)
	return p

func _tap(ev: InputEvent, action: Callable) -> void:
	if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed):
		action.call()

func _toggle_team(k: String) -> void:
	var team: Array = _p()["team"].duplicate()
	_msg = ""
	if k in team:
		if team.size() == 1: _msg = "A equipe precisa de pelo menos 1 herói."
		else: team.erase(k)
	elif Profile.owns(_p(), k):
		if team.size() >= Profile.TEAM_SIZE: _msg = "Equipe cheia: toque num herói da equipe para tirar."
		else: team.append(k)
	Profile.set_team(_p(), team)
	app.save()
	selected = k
	_build()

## Lista de todos os heróis: os da equipe com selo, os bloqueados escurecidos com a barra de fichas.
func _roster(portrait: bool) -> Control:
	var p := UI.panel(Color(0.1, 0.05, 0.12, 0.88))
	var g := GridContainer.new()
	g.columns = 4
	g.add_theme_constant_override("h_separation", 10)
	g.add_theme_constant_override("v_separation", 10)
	var need := int(Campaign.conf()["unlock"]["tokens"])
	for k in Data.hero_order():
		var owned := Profile.owns(_p(), k)
		var v := VBoxContainer.new()
		v.add_theme_constant_override("separation", 3)
		var size := 82.0 if not portrait else 70.0
		var pf := UI.portrait_frame(k, size, not owned)
		if k == selected:
			var st: StyleBoxFlat = pf.get_theme_stylebox("panel").duplicate()
			st.border_color = UI.GOLD
			st.set_border_width_all(5)
			pf.add_theme_stylebox_override("panel", st)
		pf.gui_input.connect(_tap.bind(func():
			selected = k
			_msg = ""
			_build()))
		v.add_child(pf)
		if owned:
			var h := HBoxContainer.new()
			h.add_child(UI.label("Nv %d" % _p()["heroes"][k]["lvl"], 15))
			h.add_child(UI.stars(int(_p()["heroes"][k]["evo"]), 12))
			v.add_child(h)
		else:
			var b := UI.bar(Color("b98aff"), 10)
			b.max_value = need
			b.value = Profile.tokens(_p(), k)
			v.add_child(b)
			v.add_child(UI.label("%d/%d fichas" % [Profile.tokens(_p(), k), need], 13, UI.INK_DIM))
		g.add_child(v)
	p.add_child(g)
	return p

## Ficha do herói: elemento, função, atributos, poderes e ações (treinar, evoluir, liberar, comprar ficha).
func _sheet(k: String) -> Control:
	var d: Dictionary = Data.heroes()[k]
	var p := UI.panel(Color(0.12, 0.07, 0.15, 0.94))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 7)
	p.add_child(v)
	var owned := Profile.owns(_p(), k)
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 8)
	head.add_child(UI.element_badge(d["el"], 34))
	var nm := VBoxContainer.new()
	nm.add_theme_constant_override("separation", 0)
	nm.add_child(UI.label(d["name"], 30, UI.GOLD, 8))
	nm.add_child(UI.label("%s · %s · %s" % [Data.all()["heroes"]["types"][d["type"]]["n"], d.get("role", ""), Data.elements()[d["el"]]["name"]], 16, UI.INK_DIM))
	head.add_child(nm)
	v.add_child(head)
	var h: Dictionary = _p()["heroes"].get(k, {"lvl": 1, "xp": 0, "evo": 1})
	var s := Progression.hero_stats(k, h["lvl"], h["evo"])
	var stats := HBoxContainer.new()
	stats.add_theme_constant_override("separation", 14)
	for it in [["heart", "Vida", UI.fmt(s["hp"])], ["sword", "Ataque", str(roundi(s["atk"]))], ["bolt", "Velocidade", str(roundi(s["spd"]))]]:
		var c := HBoxContainer.new()
		c.add_child(UI.icon_rect(it[0], 20, UI.INK))
		c.add_child(UI.label(" " + it[2], 18))
		c.tooltip_text = it[1]
		stats.add_child(c)
	v.add_child(stats)
	if owned:
		var lv := HBoxContainer.new()
		lv.add_child(UI.label("Nível %d  " % h["lvl"], 18))
		var xb := UI.bar(Color("6fb6ff"), 12)
		xb.max_value = Progression.xp_need(h["lvl"])
		xb.value = h["xp"]
		xb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		xb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		lv.add_child(xb)
		lv.add_child(UI.stars(int(h["evo"]), 18))
		v.add_child(lv)
	# poderes
	var powers: Array = d["abilities"].duplicate()
	if d.has("ult"): powers.append(d["ult"])
	for id in powers:
		var a := Data.ability(id)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var locked: bool = id == d.get("ult", "") and int(h["evo"]) < 2
		row.add_child(UI.icon_rect(str(a.get("icon", "i-star")).trim_prefix("i-"), 30, Color("ffd34d") if id == d.get("ult", "") else UI.INK))
		var t := UI.label("%s%s: %s" % [a.get("name", id), " (evolução 2)" if locked else "", Data.ability_text(id)], 15, UI.INK_DIM if locked else UI.INK, 4)
		t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(t)
		v.add_child(row)
	# ações
	var acts := HBoxContainer.new()
	acts.add_theme_constant_override("separation", 10)
	if owned:
		var cost := Progression.train_cost(h["lvl"])
		var train := UI.button("Treinar · %s ouro" % UI.fmt(cost), Color("c48a1a"), 19)
		train.disabled = _p()["gold"] < cost or h["lvl"] >= int(Data.progression()["maxLevel"])
		train.pressed.connect(func():
			if Profile.train(_p(), k): app.save()
			_build())
		acts.add_child(train)
		var miss := Profile.evo_missing(_p(), k)
		var evo := UI.button("Evoluir" if miss.is_empty() else ("Evolução máxima" if miss == ["máxima"] else "Evoluir: falta " + ", ".join(miss)), Color("8a3fd1"), 17)
		evo.disabled = not miss.is_empty()
		evo.pressed.connect(func():
			if Profile.evolve(_p(), k): app.save()
			_build())
		acts.add_child(evo)
		var in_team: bool = k in _p()["team"]
		var tb := UI.button("Tirar da equipe" if in_team else "Pôr na equipe", Color("3b6fd1"), 19)
		tb.pressed.connect(func(): _toggle_team(k))
		v.add_child(tb)
	else:
		var c := Profile.unlock_cost()
		var need := int(c["tokens"])
		var have := Profile.tokens(_p(), k)
		var tl := UI.label("Fichas: %d/%d. Consiga nas fases: %s" % [have, need, ", ".join(_stages_with(k))], 17, UI.INK)
		tl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		v.add_child(tl)
		var un := UI.button("Liberar · %d fichas + %d ouro" % [need, int(c["gold"])], Color("3aa655"), 19)
		un.disabled = not Profile.can_unlock(_p(), k)
		un.pressed.connect(func():
			if Profile.unlock(_p(), k):
				app.save()
				_msg = "%s entrou para a equipe!" % d["name"]
			_build())
		acts.add_child(un)
		var cost := int(Campaign.conf()["shop"]["tokenGems"])
		var buy := UI.button("1 ficha · %d" % cost, Color("1f9fb3"), 19)
		buy.icon = UI.icon("gem")
		buy.add_theme_constant_override("icon_max_width", 22)
		buy.disabled = _p()["gems"] < cost
		buy.pressed.connect(func():
			if Profile.buy_token(_p(), k): app.save()
			_build())
		acts.add_child(buy)
	v.add_child(acts)
	return p

func _stages_with(k: String) -> Array:
	var out: Array = []
	for st in Campaign.stages():
		if k in Campaign.token_heroes(st): out.append(st["id"])
	return out
