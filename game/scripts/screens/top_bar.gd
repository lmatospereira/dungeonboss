extends HBoxContainer
## Barra do topo das telas de menu: botão de voltar (opcional), título e as moedas do jogador.

const UI := preload("res://scripts/ui/ui_kit.gd")

signal back_pressed

var title := ""
var show_back := false
var profile: Dictionary
var _vals := {}

func _ready() -> void:
	set_anchors_preset(Control.PRESET_TOP_WIDE)
	offset_left = 14
	offset_right = -14
	offset_top = 10
	add_theme_constant_override("separation", 10)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	if show_back:
		var b := UI.button("Voltar", Color("4a3560"), 20)
		b.icon = UI.icon("back")
		b.expand_icon = false
		b.add_theme_constant_override("icon_max_width", 22)
		b.pressed.connect(func(): back_pressed.emit())
		add_child(b)
	var t := UI.label(title, 30, UI.GOLD, 8)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	t.clip_text = true
	add_child(t)
	for c in [["coin", UI.GOLD, "gold"], ["gem", UI.GEM, "gems"], ["crystal", UI.CRYSTAL, "crystals"]]:
		var p := UI.panel(Color(0.08, 0.04, 0.1, 0.8), c[1].darkened(0.35), 22)
		var h := UI.currency(c[0], c[1], int(profile.get(c[2], 0)))
		p.add_child(h)
		p.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_vals[c[2]] = h.get_node("Value")
		add_child(p)

func refresh() -> void:
	for k in _vals: _vals[k].text = UI.fmt(int(profile.get(k, 0)))
