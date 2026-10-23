extends Node
## Mapa da campanha: capítulos (masmorras) com 3 fases cada. Mostra estrelas, cadeado,
## as fichas que a fase dá e o painel da fase escolhida com o botão Jogar.
## Também abre a tela de Heróis e a Loja (diamantes).

const UI := preload("res://scripts/ui/ui_kit.gd")
const Data := preload("res://scripts/core/data.gd")
const Campaign := preload("res://scripts/core/campaign.gd")
const Profile := preload("res://scripts/core/profile.gd")
const Progression := preload("res://scripts/core/progression.gd")
const Backdrop := preload("res://scripts/screens/backdrop.gd")
const TopBar := preload("res://scripts/screens/top_bar.gd")

var app
var focus_stage := ""
var chapter := 0
var selected := ""
var _bg
var _layer: CanvasLayer
var _ui: Control
var _top

func _ready() -> void:
	_bg = Backdrop.new()
	add_child(_bg)
	_layer = CanvasLayer.new()
	add_child(_layer)
	selected = focus_stage if focus_stage != "" else _first_open()
	chapter = int(Campaign.stage(selected).get("chapter", 0))
	get_viewport().size_changed.connect(_build)
	_build()

## Primeira fase ainda não vencida que esteja aberta (onde o jogador parou).
func _first_open() -> String:
	var last := ""
	for st in Campaign.stages():
		if Profile.stage_open(app.profile, st["id"]):
			last = st["id"]
			if not Profile.cleared(app.profile, st["id"]): return last
	return last

func _chapter_stages() -> Array:
	return Campaign.stages().filter(func(s): return s["chapter"] == chapter)

func _build() -> void:
	if _ui: _ui.queue_free()
	var ch: Dictionary = Campaign.conf()["chapters"][chapter]
	var d := Campaign.dungeon(ch["dungeon"])
	_bg.set_theme(d.get("theme", "goblin"))
	var portrait := UI.is_portrait(self)
	_bg.base = Vector3(0, 3.4, 9.0) if not portrait else Vector3(0, 2.6, 8.0)
	_bg.look = Vector3(0, 1.2, -1.0) if not portrait else Vector3(0, 0.4, -1.0)
	_bg.set_lineup(app.profile["team"], -3.2 if not portrait else 0.0, 1.9)
	_ui = UI.full(Control.new())
	_ui.theme = UI.theme()
	_layer.add_child(_ui)
	_top = TopBar.new()
	_top.title = "Masmorra do Rei Ogro"
	_top.profile = app.profile
	_ui.add_child(_top)
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
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left.add_theme_constant_override("separation", 12)
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	body.add_child(left)
	left.add_child(_chapter_bar(d))
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	left.add_child(spacer)
	left.add_child(_stage_path())
	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 12)
	var heroes := UI.button("Heróis", Color("3b6fd1"), 24)
	heroes.icon = UI.icon("users")
	heroes.add_theme_constant_override("icon_max_width", 28)
	heroes.pressed.connect(func(): app.open_heroes())
	buttons.add_child(heroes)
	var ready := _unlock_ready()
	if ready != "":
		var r := UI.label("%s pronto para liberar!" % Data.unit_def(ready)["name"], 18, Color("aef5b0"))
		r.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		buttons.add_child(r)
	var shop := UI.button("Loja", Color("1f9fb3"), 24)
	shop.icon = UI.icon("gem")
	shop.add_theme_constant_override("icon_max_width", 26)
	shop.pressed.connect(_open_shop)
	buttons.add_child(shop)
	left.add_child(buttons)
	var details := _stage_details(Campaign.stage(selected))
	details.custom_minimum_size = Vector2(430 if not portrait else 0, 0)
	details.size_flags_vertical = Control.SIZE_SHRINK_END if not portrait else Control.SIZE_SHRINK_BEGIN
	body.add_child(details)

func _unlock_ready() -> String:
	for k in Data.hero_order():
		if Profile.can_unlock(app.profile, k): return k
	return ""

func _chapter_bar(d: Dictionary) -> Control:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	var prev := UI.button("", Color("4a3560"), 24)
	prev.icon = UI.icon("back")
	prev.add_theme_constant_override("icon_max_width", 28)
	prev.disabled = chapter == 0
	prev.pressed.connect(func(): _go_chapter(-1))
	h.add_child(prev)
	var p := UI.panel(Color(0.1, 0.05, 0.12, 0.85))
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 0)
	var t := UI.label("Capítulo %d" % (chapter + 1), 18, UI.INK_DIM)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var n := UI.label(d["name"], 30, UI.GOLD, 8)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(n)
	p.add_child(v)
	h.add_child(p)
	var next := UI.button("", Color("4a3560"), 24)
	next.icon = UI.icon("play")
	next.add_theme_constant_override("icon_max_width", 28)
	var chapters: Array = Campaign.conf()["chapters"]
	next.disabled = chapter >= chapters.size() - 1 or not Profile.stage_open(app.profile, chapters[chapter + 1]["stages"][0]["id"]) if chapter < chapters.size() - 1 else true
	next.pressed.connect(func(): _go_chapter(1))
	h.add_child(next)
	return h

func _go_chapter(step: int) -> void:
	chapter = clampi(chapter + step, 0, Campaign.conf()["chapters"].size() - 1)
	var list := _chapter_stages()
	selected = list[0]["id"]
	for s in list:
		if Profile.stage_open(app.profile, s["id"]): selected = s["id"]
	_build()

## Caminho das 3 fases do capítulo: nós redondos com número, estrelas e a ficha que dão.
func _stage_path() -> Control:
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 0)
	var list := _chapter_stages()
	for i in list.size():
		var st: Dictionary = list[i]
		if i > 0:
			var link := ColorRect.new()
			link.color = UI.GOLD if Profile.cleared(app.profile, list[i - 1]["id"]) else Color(0.3, 0.25, 0.32)
			link.custom_minimum_size = Vector2(44, 8)
			link.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			link.mouse_filter = Control.MOUSE_FILTER_IGNORE
			h.add_child(link)
		h.add_child(_stage_node(st))
	return h

func _stage_node(st: Dictionary) -> Control:
	var open := Profile.stage_open(app.profile, st["id"])
	var boss: bool = st.get("boss", false)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 4)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	var size := 104.0 if boss else 86.0
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(size, size)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var col := Color("c0392b") if boss else Color("8a3fd1")
	if not open: col = Color("4a4050")
	for s in ["normal", "hover", "pressed", "disabled"]:
		var sb := UI.button_box(col, s)
		sb.set_corner_radius_all(int(size / 2))
		if st["id"] == selected:
			sb.border_color = UI.GOLD
			sb.set_border_width_all(5)
			sb.border_width_bottom = 9
		b.add_theme_stylebox_override(s, sb)
	b.add_theme_stylebox_override("focus", UI.button_box(col, "focus"))
	if open:
		b.text = st["id"]
		b.add_theme_font_size_override("font_size", 28 if boss else 26)
	else:
		b.icon = UI.icon("lock")
		b.expand_icon = true
	b.pressed.connect(func():
		selected = st["id"]
		_build())
	v.add_child(b)
	var stars := UI.stars(Profile.stars(app.profile, st["id"]), 22)
	stars.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_child(stars)
	var toks := Campaign.token_heroes(st)
	if toks.size() > 0:
		var k: String = toks[0]
		var pf := UI.portrait_frame(k, 40, not Profile.owns(app.profile, k))
		pf.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		v.add_child(pf)
	return v

func _stage_details(st: Dictionary) -> Control:
	var p := UI.panel(Color(0.12, 0.07, 0.15, 0.93))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	p.add_child(v)
	var d := Campaign.dungeon(st["dungeon"])
	var head := HBoxContainer.new()
	var t := UI.label("Fase %s" % st["id"], 30, UI.GOLD, 8)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	head.add_child(UI.stars(Profile.stars(app.profile, st["id"]), 26))
	v.add_child(head)
	var sub := UI.label("%s · nível %d%s" % [d["name"], st["lvl"], " · chefe" if st.get("boss", false) else ""], 18, UI.INK_DIM)
	v.add_child(sub)
	# inimigos
	v.add_child(UI.label("Inimigos", 18, UI.INK_DIM))
	var foes := HBoxContainer.new()
	foes.add_theme_constant_override("separation", 6)
	var seen := []
	for r in Campaign.rooms(st):
		for e in r:
			if e["k"] in seen: continue
			seen.append(e["k"])
			foes.add_child(UI.portrait_frame(e["k"], 52))
	v.add_child(foes)
	# poder
	var team_power := Progression.team_power(Profile.battle_team(app.profile))
	var rec := roundi(Progression.recommended_power(int(st["lvl"])) * float(Campaign.conf()["recommended"]["boss" if st.get("boss", false) else "stage"]))
	var pw := HBoxContainer.new()
	pw.add_child(UI.icon_rect("swords", 22, UI.INK))
	pw.add_child(UI.label(" Poder da equipe %s / recomendado %s" % [UI.fmt(team_power), UI.fmt(rec)], 18, UI.GOOD if team_power >= rec else Color("ffb35a")))
	v.add_child(pw)
	# recompensas
	var first := not Profile.cleared(app.profile, st["id"])
	v.add_child(UI.label("Primeira vitória" if first else "Recompensas", 18, UI.INK_DIM))
	var rw := HBoxContainer.new()
	rw.add_theme_constant_override("separation", 12)
	var f: Dictionary = st.get("first", {})
	if first:
		if f.get("gems", 0) > 0: rw.add_child(_reward("gem", UI.GEM, "+%d" % f["gems"]))
		if f.get("crystals", 0) > 0: rw.add_child(_reward("crystal", UI.CRYSTAL, "+%d" % f["crystals"]))
		for k in f.get("tokens", {}): rw.add_child(_token_reward(k, "+%d" % int(f["tokens"][k])))
	var drop: Dictionary = st.get("drop", {})
	if not drop.is_empty():
		rw.add_child(_token_reward(drop["hero"], "%d%%" % roundi(drop["chance"] * 100)))
	rw.add_child(_reward("coin", UI.GOLD, "ouro"))
	v.add_child(rw)
	var play := UI.button("Jogar", Color("3aa655"), 30)
	play.custom_minimum_size = Vector2(0, 64)
	play.disabled = not Profile.stage_open(app.profile, st["id"])
	play.pressed.connect(func(): app.open_heroes(st["id"]))
	v.add_child(play)
	return p

func _reward(icon_name: String, color: Color, text: String) -> Control:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 4)
	h.add_child(UI.icon_rect(icon_name, 28, color))
	h.add_child(UI.label(text, 20))
	return h

func _token_reward(k: String, text: String) -> Control:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 4)
	var pf := UI.portrait_frame(k, 40, not Profile.owns(app.profile, k))
	h.add_child(pf)
	var need := int(Campaign.conf()["unlock"]["tokens"])
	var vv := VBoxContainer.new()
	vv.add_theme_constant_override("separation", 0)
	vv.add_child(UI.label(text, 18))
	if not Profile.owns(app.profile, k):
		vv.add_child(UI.label("%d/%d" % [Profile.tokens(app.profile, k), need], 14, UI.INK_DIM))
	h.add_child(vv)
	return h

# ---------------- loja ----------------
func _open_shop() -> void:
	var dim := UI.full(ColorRect.new())
	dim.color = Color(0, 0, 0, 0.6)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	_ui.add_child(dim)
	var p := UI.panel()
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	v.custom_minimum_size = Vector2(minf(460, _ui.size.x - 60), 0)
	var t := UI.label("Loja", 36, UI.GOLD, 8)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var shop: Dictionary = Campaign.conf()["shop"]
	var have := UI.label("Você tem %s diamantes" % UI.fmt(app.profile["gems"]), 20, UI.GEM)
	have.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(have)
	var buy := UI.button("%s de ouro por %d diamantes" % [UI.fmt(int(shop["goldPack"]["gold"])), int(shop["goldPack"]["gems"])], Color("c48a1a"), 22)
	buy.disabled = app.profile["gems"] < int(shop["goldPack"]["gems"])
	buy.pressed.connect(func():
		if Profile.buy_gold(app.profile):
			app.save()
			dim.queue_free()
			_build())
	v.add_child(buy)
	var info := UI.label("Fichas de heróis bloqueados custam %d diamantes cada, na tela Heróis." % int(shop["tokenGems"]), 18, UI.INK_DIM)
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(info)
	var close := UI.button("Fechar", Color("4a3560"))
	close.pressed.connect(dim.queue_free)
	v.add_child(close)
	p.add_child(v)
	dim.add_child(p)
	p.resized.connect(func(): p.position = (dim.size - p.size) / 2)
