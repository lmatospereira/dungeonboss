extends CanvasLayer
## Interface da batalha, no espírito dos RPGs de masmorra para celular:
## topo com pausa, fase e sala (bolinhas) e ouro ganho; barra grande do chefe;
## cartões dos heróis embaixo (retrato, vida, escudo, status), com o herói da vez levantado;
## botões redondos dos poderes do herói da vez (recarga em número) e botões AUTO e 2x.
## Barras de vida pequenas acompanham os inimigos na cena.

signal ability_pressed(ability_id: String)
signal card_pressed(unit_id: int)
signal auto_toggled(on: bool)
signal speed_toggled(fast: bool)
signal pause_toggled(paused: bool)
signal quit_pressed

const UI := preload("res://scripts/ui/ui_kit.gd")
const Data := preload("res://scripts/core/data.gd")

const STATUS_ICONS := {"burn": ["fire", Color("ff7a3d")], "poison": ["drop", Color("8ee04f")], "stun": ["star", Color("ffe27a")],
	"shield": ["shield", Color("8fd8ff")], "taunt": ["taunt", Color("ffb35a")], "enrage": ["rage", Color("ff4d4d")], "charge": ["warn", Color("ffd34d")]}

var root: Control
var _top_title: Label
var _pips: HBoxContainer
var _gold: HBoxContainer
var _boss_box: PanelContainer
var _boss_bar: ProgressBar
var _boss_name: Label
var _boss_unit = null
var _bottom: Control
var _cards: HBoxContainer
var _abilities: HBoxContainer
var _info: PanelContainer
var _info_label: Label
var _hint: Label
var _auto_btn: Button
var _speed_btn: Button
var _banner: PanelContainer
var _banner_title: Label
var _banner_sub: Label
var _pause_menu: Control
var _card_by_id := {}       # unit_id → {panel, bar, shield, hp_label, status, portrait}
var _enemy_bars := {}       # unit_id → {box, bar, status}
var _views := {}            # unit_id → UnitView (para posicionar as barras)
var camera: Camera3D
var auto_on := false
var fast := false
var _pick_mode := ""        # "", "ally", "fallen"

func _init() -> void:
	layer = 5
	process_mode = Node.PROCESS_MODE_ALWAYS

func _ready() -> void:
	root = UI.full(Control.new())
	root.theme = UI.theme()
	add_child(root)
	_build_top()
	_build_boss()
	_build_bottom()
	_build_banner()
	_build_pause()
	get_viewport().size_changed.connect(_layout)
	_layout()

# ---------------- montagem ----------------
func _build_top() -> void:
	var bar := HBoxContainer.new()
	bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	bar.offset_left = 14
	bar.offset_right = -14
	bar.offset_top = 10
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(bar)
	var pause := _round_button("pause", Color("4a3560"), 54)
	pause.pressed.connect(func(): set_paused(true))
	bar.add_child(pause)
	var mid := VBoxContainer.new()
	mid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	mid.alignment = BoxContainer.ALIGNMENT_CENTER
	mid.add_theme_constant_override("separation", 2)
	mid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_top_title = UI.label("", 24)
	_top_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mid.add_child(_top_title)
	_pips = HBoxContainer.new()
	_pips.alignment = BoxContainer.ALIGNMENT_CENTER
	_pips.add_theme_constant_override("separation", 8)
	_pips.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mid.add_child(_pips)
	bar.add_child(mid)
	var gp := UI.panel(Color(0.08, 0.04, 0.1, 0.75), Color("6b4a2a"), 22)
	_gold = UI.currency("coin", UI.GOLD, 0)
	gp.add_child(_gold)
	gp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_child(gp)

func _build_boss() -> void:
	_boss_box = UI.panel(Color(0.1, 0.04, 0.08, 0.85), Color("c0392b"), 14)
	_boss_box.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_boss_box.offset_top = 84
	_boss_box.custom_minimum_size = Vector2(520, 0)
	_boss_box.offset_left = -260
	_boss_box.offset_right = 260
	_boss_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 4)
	_boss_name = UI.label("", 22, Color("ffd2c8"))
	_boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_boss_name)
	_boss_bar = UI.bar(Color("e8452f"), 20)
	v.add_child(_boss_bar)
	_boss_box.add_child(v)
	_boss_box.visible = false
	root.add_child(_boss_box)

func _build_bottom() -> void:
	_bottom = Control.new()
	_bottom.set_anchors_preset(Control.PRESET_FULL_RECT)
	_bottom.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_bottom)
	_cards = HBoxContainer.new()
	_cards.add_theme_constant_override("separation", 10)
	_cards.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_bottom.add_child(_cards)
	_abilities = HBoxContainer.new()
	_abilities.add_theme_constant_override("separation", 12)
	_abilities.alignment = BoxContainer.ALIGNMENT_END
	_abilities.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_bottom.add_child(_abilities)
	_info = UI.panel(Color(0.08, 0.04, 0.1, 0.9), UI.EDGE, 12)
	_info_label = UI.label("", 18)
	_info_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_info_label.custom_minimum_size = Vector2(300, 0)
	_info.add_child(_info_label)
	_info.visible = false
	_info.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_bottom.add_child(_info)
	_hint = UI.label("", 22, Color("fff1a8"))
	_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_bottom.add_child(_hint)
	_auto_btn = UI.button("AUTO", Color("3b6fd1"), 20)
	_auto_btn.toggle_mode = true
	_auto_btn.custom_minimum_size = Vector2(88, 48)
	_auto_btn.toggled.connect(func(on):
		auto_on = on
		_sync_tools()
		auto_toggled.emit(on))
	_bottom.add_child(_auto_btn)
	_speed_btn = UI.button("1x", Color("3b6fd1"), 20)
	_speed_btn.custom_minimum_size = Vector2(64, 48)
	_speed_btn.pressed.connect(func():
		fast = not fast
		_sync_tools()
		speed_toggled.emit(fast))
	_bottom.add_child(_speed_btn)

func _build_banner() -> void:
	_banner = UI.panel(Color(0.12, 0.05, 0.12, 0.92), UI.GOLD, 18)
	_banner.set_anchors_preset(Control.PRESET_CENTER)
	_banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	_banner_title = UI.label("", 44, UI.GOLD, 10)
	_banner_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_sub = UI.label("", 22)
	_banner_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_banner_title)
	v.add_child(_banner_sub)
	_banner.add_child(v)
	_banner.visible = false
	root.add_child(_banner)

func _build_pause() -> void:
	_pause_menu = UI.full(ColorRect.new())
	_pause_menu.color = Color(0, 0, 0, 0.6)
	_pause_menu.mouse_filter = Control.MOUSE_FILTER_STOP
	var p := UI.panel()
	p.set_anchors_preset(Control.PRESET_CENTER)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 14)
	var t := UI.label("Pausado", 40, UI.GOLD)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var cont := UI.button("Continuar", Color("3aa655"))
	cont.pressed.connect(func(): set_paused(false))
	v.add_child(cont)
	var quit := UI.button("Sair da fase", Color("b8402f"))
	quit.pressed.connect(func():
		set_paused(false)
		quit_pressed.emit())
	v.add_child(quit)
	p.add_child(UI.margin(v, 30, 20, 30, 20))
	_pause_menu.add_child(p)
	_pause_menu.visible = false
	root.add_child(_pause_menu)
	p.resized.connect(func(): p.position = (_pause_menu.size - p.size) / 2)

func set_paused(on: bool) -> void:
	_pause_menu.visible = on
	get_tree().paused = on
	pause_toggled.emit(on)

func _round_button(icon_name: String, color: Color, size: float) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(size, size)
	b.icon = UI.icon(icon_name)
	b.expand_icon = true
	b.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	for s in ["normal", "hover", "pressed", "disabled"]:
		var st := UI.button_box(color, s)
		st.set_corner_radius_all(int(size / 2))
		st.content_margin_left = size * 0.2
		st.content_margin_right = size * 0.2
		st.content_margin_top = size * 0.18
		st.content_margin_bottom = size * 0.22
		b.add_theme_stylebox_override(s, st)
	b.add_theme_stylebox_override("focus", UI.button_box(color, "focus"))
	return b

# ---------------- layout (deitado / em pé) ----------------
func _layout() -> void:
	var vs := root.get_viewport_rect().size
	var portrait := vs.y > vs.x
	var card_w := 150.0 if not portrait else (vs.x - 40) / 4.0
	for id in _card_by_id:
		_card_by_id[id]["panel"].custom_minimum_size = Vector2(card_w, 0)
		_card_by_id[id]["compact"] = portrait
		_card_by_id[id]["name"].visible = not portrait
	var ab_size := 92.0 if not portrait else 78.0
	for b in _abilities.get_children(): b.custom_minimum_size = Vector2(ab_size, ab_size + 24)
	await get_tree().process_frame
	var cs := _cards.get_combined_minimum_size()
	var as_ := _abilities.get_combined_minimum_size()
	if portrait:
		_cards.position = Vector2((vs.x - cs.x) / 2, vs.y - cs.y - 14)
		_abilities.position = Vector2((vs.x - as_.x) / 2, _cards.position.y - as_.y - 26)
		_auto_btn.position = Vector2(vs.x - 96, 84)
		_speed_btn.position = Vector2(vs.x - 96, 140)
		_info.position = Vector2(16, _abilities.position.y - 110)
		_boss_box.custom_minimum_size = Vector2(vs.x - 40, 0)
		_boss_box.offset_left = -(vs.x - 40) / 2
		_boss_box.offset_right = (vs.x - 40) / 2
	else:
		_cards.position = Vector2(16, vs.y - cs.y - 16)
		_abilities.position = Vector2(vs.x - as_.x - 120, vs.y - as_.y - 14)
		_auto_btn.position = Vector2(vs.x - 104, vs.y - 124)
		_speed_btn.position = Vector2(vs.x - 92, vs.y - 66)
		_info.position = Vector2(vs.x - 450, _abilities.position.y - 100)
		_boss_box.custom_minimum_size = Vector2(520, 0)
		_boss_box.offset_left = -260
		_boss_box.offset_right = 260
	_hint.size = Vector2(vs.x, 30)
	_hint.position = Vector2(0, (_abilities.position.y if portrait else _cards.position.y) - 46)
	_banner.position = (vs - _banner.size) / 2 - Vector2(0, vs.y * 0.12)

# ---------------- topo ----------------
func set_title(text: String) -> void: _top_title.text = text

func set_rooms(current: int, total: int, boss_last: bool) -> void:
	for c in _pips.get_children(): c.queue_free()
	for i in total:
		var is_boss := boss_last and i == total - 1
		var col := UI.GOLD if i < current else (Color("fff6e0") if i == current else Color(0.3, 0.25, 0.32))
		_pips.add_child(UI.icon_rect("skull" if is_boss else "star", 26 if is_boss else 20, col))

func set_gold(n: int) -> void: _gold.get_node("Value").text = UI.fmt(n)

func set_boss(u) -> void:
	_boss_unit = u
	_boss_box.visible = u != null
	if u: _boss_name.text = u.def.get("name", u.key)
	update_boss()

func update_boss() -> void:
	if _boss_unit:
		_boss_bar.max_value = _boss_unit.max_hp
		_boss_bar.value = _boss_unit.hp
		_boss_box.visible = _boss_unit.alive

# ---------------- cartões dos heróis ----------------
func set_heroes(units: Array) -> void:
	for c in _cards.get_children(): c.queue_free()
	_card_by_id.clear()
	for u in units: _add_card(u)
	_layout()

func _add_card(u) -> void:
	var el: String = u.el
	var col: Color = UI.ELEMENT_COLORS.get(el, UI.EDGE)
	var p := PanelContainer.new()
	var st := UI.box(Color(0.1, 0.06, 0.13, 0.92), col.darkened(0.1), 12, 3, 5)
	st.set_content_margin_all(5)
	p.add_theme_stylebox_override("panel", st)
	p.mouse_filter = Control.MOUSE_FILTER_STOP
	p.gui_input.connect(func(ev):
		if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed):
			card_pressed.emit(u.id))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 3)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 6)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var portrait := UI.portrait_frame(u.key, 58)
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(portrait)
	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_theme_constant_override("separation", 0)
	info.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var name := UI.label(u.def.get("name", u.key), 18)
	name.clip_text = true
	info.add_child(name)
	var lv := HBoxContainer.new()
	lv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	lv.add_child(UI.element_badge(el, 20))
	lv.add_child(UI.label("Nv %d" % u.lvl, 16, UI.INK_DIM))
	info.add_child(lv)
	var status := HBoxContainer.new()
	status.add_theme_constant_override("separation", 1)
	status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	info.add_child(status)
	h.add_child(info)
	v.add_child(h)
	var hb := UI.bar(UI.GOOD, 14)
	v.add_child(hb)
	var sb := UI.bar(Color("8fd8ff"), 5, Color(0, 0, 0, 0))
	v.add_child(sb)
	var hp_label := UI.label("", 14, UI.INK, 4)
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	hb.add_child(hp_label)
	p.add_child(v)
	var wrap := MarginContainer.new()
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.add_theme_constant_override("margin_top", 14)
	wrap.add_theme_constant_override("margin_bottom", 0)
	wrap.add_child(p)
	_cards.add_child(wrap)
	_card_by_id[u.id] = {"wrap": wrap, "panel": p, "bar": hb, "shield": sb, "hp_label": hp_label, "status": status, "style": st, "color": col, "unit": u, "name": name, "portrait": portrait, "compact": false}
	update_unit(u)

func update_unit(u) -> void:
	if _card_by_id.has(u.id):
		var c: Dictionary = _card_by_id[u.id]
		c["bar"].max_value = u.max_hp
		c["bar"].value = u.hp
		var ratio: float = u.ratio()
		c["bar"].get_theme_stylebox("fill").bg_color = UI.GOOD if ratio > 0.5 else (Color("ffc93c") if ratio > 0.25 else UI.BAD)
		c["shield"].max_value = u.max_hp
		c["shield"].value = u.shield()
		c["shield"].modulate.a = 1.0 if u.shield() > 0 else 0.0
		c["hp_label"].text = UI.fmt(u.hp)
		c["portrait"].modulate = Color.WHITE if u.alive else Color(0.35, 0.3, 0.35)
		_fill_status(c["status"], u, 16)
	if _enemy_bars.has(u.id):
		var e: Dictionary = _enemy_bars[u.id]
		e["bar"].max_value = u.max_hp
		e["bar"].value = u.hp
		_fill_status(e["status"], u, 16)
		if not u.alive: e["box"].visible = false
	if u == _boss_unit: update_boss()

func _fill_status(box: HBoxContainer, u, size: float) -> void:
	for c in box.get_children(): c.queue_free()
	for s in u.status:
		var d: Array = STATUS_ICONS.get(s["type"], ["star", Color.WHITE])
		box.add_child(UI.icon_rect(d[0], size, d[1]))

## Herói da vez: cartão levantado com borda dourada.
func set_active(uid: int) -> void:
	for id in _card_by_id:
		var c: Dictionary = _card_by_id[id]
		var on: bool = id == uid
		c["style"].border_color = UI.GOLD if on else c["color"].darkened(0.1)
		c["style"].set_border_width_all(5 if on else 3)
		c["wrap"].add_theme_constant_override("margin_top", 0 if on else 14)
		c["wrap"].add_theme_constant_override("margin_bottom", 14 if on else 0)
		c["style"].shadow_color = Color(1, 0.8, 0.3, 0.5) if on else Color(0, 0, 0, 0.45)

## Modo de escolha de aliado: cartões que podem ser escolhidos piscam.
func set_pick_mode(mode: String, valid_ids: Array) -> void:
	_pick_mode = mode
	for id in _card_by_id:
		var c: Dictionary = _card_by_id[id]
		c["panel"].modulate = Color(1.25, 1.25, 1.0) if id in valid_ids else (Color(0.6, 0.6, 0.6) if mode != "" else Color.WHITE)
	_hint.text = {"ally": "Toque no aliado", "fallen": "Toque no aliado caído"}.get(mode, "")

func set_hint(t: String) -> void: _hint.text = t

# ---------------- poderes ----------------
## Botões do herói da vez. `list` = [{id, cd, ready, ult}]. Vazio esconde a barra.
func set_abilities(list: Array) -> void:
	for c in _abilities.get_children(): c.queue_free()
	_info.visible = false
	for a in list: _abilities.add_child(_ability_button(a))
	_layout()

func _ability_button(a: Dictionary) -> Control:
	var d := Data.ability(a["id"])
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	v.alignment = BoxContainer.ALIGNMENT_END
	var size := 84.0
	var color := Color("d9a23a") if a.get("ult", false) else Color("6a3fb0")
	var b := _round_button(str(d.get("icon", "i-star")).trim_prefix("i-"), color, size)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.disabled = not a["ready"]
	b.pressed.connect(func(): ability_pressed.emit(a["id"]))
	b.mouse_entered.connect(func(): _show_info(a["id"]))
	b.mouse_exited.connect(func(): _info.visible = false)
	if not a["ready"]:
		b.modulate = Color(0.55, 0.55, 0.6)
		var cd := UI.label(str(a["cd"]), 40, Color.WHITE, 10)
		cd.set_anchors_preset(Control.PRESET_FULL_RECT)
		cd.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cd.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		b.add_child(cd)
	v.add_child(b)
	var n := UI.label(d.get("name", a["id"]), 15)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	n.custom_minimum_size = Vector2(size + 14, 0)
	n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	n.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(n)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return v

func _show_info(id: String) -> void:
	_info_label.text = "%s\n%s" % [Data.ability(id).get("name", id), Data.ability_text(id)]
	_info.visible = true

func _sync_tools() -> void:
	_auto_btn.set_pressed_no_signal(auto_on)
	var col := Color("3aa655") if auto_on else Color("3b6fd1")
	for s in ["normal", "hover", "pressed"]:
		_auto_btn.add_theme_stylebox_override(s, UI.button_box(col, s))
	_speed_btn.text = "2x" if fast else "1x"

func set_tools(auto: bool, is_fast: bool) -> void:
	auto_on = auto
	fast = is_fast
	_auto_btn.set_pressed_no_signal(auto)
	_sync_tools()

# ---------------- barras dos inimigos (seguem o modelo) ----------------
func add_enemy(u, view) -> void:
	_views[u.id] = view
	if u.is_boss: return
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 1)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 3)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(UI.element_badge(u.el, 20))
	var hb := UI.bar(Color("e8452f"), 11)
	hb.custom_minimum_size = Vector2(84, 11)
	hb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	h.add_child(hb)
	box.add_child(h)
	var status := HBoxContainer.new()
	status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	box.add_child(status)
	root.add_child(box)
	root.move_child(box, 0)
	_enemy_bars[u.id] = {"box": box, "bar": hb, "status": status}
	update_unit(u)

func clear_enemies() -> void:
	for id in _enemy_bars: _enemy_bars[id]["box"].queue_free()
	_enemy_bars.clear()
	_views = _views.duplicate()
	set_boss(null)

func _process(_d: float) -> void:
	if camera == null: return
	for id in _enemy_bars:
		var v = _views.get(id)
		if v == null or not is_instance_valid(v): continue
		var p: Vector3 = v.top()
		var box: Control = _enemy_bars[id]["box"]
		if camera.is_position_behind(p): continue
		box.position = camera.unproject_position(p) - Vector2(52, 10)

# ---------------- faixas ----------------
func banner(title: String, sub := "", color := UI.GOLD, time := 1.4) -> void:
	_banner_title.text = title
	_banner_title.add_theme_color_override("font_color", color)
	_banner_sub.text = sub
	_banner_sub.visible = sub != ""
	_banner.visible = true
	_banner.reset_size()
	_banner.modulate.a = 0.0
	_banner.scale = Vector2.ONE * 0.85
	await get_tree().process_frame
	var vs := root.get_viewport_rect().size
	_banner.pivot_offset = _banner.size / 2
	_banner.position = (vs - _banner.size) / 2 - Vector2(0, vs.y * 0.12)
	var tw := create_tween()
	tw.tween_property(_banner, "modulate:a", 1.0, 0.15)
	tw.parallel().tween_property(_banner, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(time)
	tw.tween_property(_banner, "modulate:a", 0.0, 0.25)
	tw.tween_callback(func(): _banner.visible = false)

func hide_controls(h: bool) -> void:
	_bottom.visible = not h
