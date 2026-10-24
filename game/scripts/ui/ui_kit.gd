extends RefCounted
## Peças de interface no estilo de RPG mobile (molduras grossas, cantos redondos, texto com contorno).
## Tudo é criado em código para não depender de cenas .tscn difíceis de revisar.

const Data := preload("res://scripts/core/data.gd")
const FONT := preload("res://assets/fonts/LilitaOne-Regular.ttf")

const INK := Color("fff6e0")
const INK_DIM := Color("cdbfa6")
const GOLD := Color("ffc93c")
const GEM := Color("7fe3ff")
const CRYSTAL := Color("d58bff")
const PANEL := Color("2a1d33")
const PANEL_DK := Color("170f1d")
const EDGE := Color("e2a94a")
const GOOD := Color("57d66b")
const BAD := Color("ff5a4f")

const ELEMENT_COLORS := {"fogo": Color("ff6a3d"), "natureza": Color("5fcf4f"), "agua": Color("43a6ff"), "luz": Color("ffd34d"), "sombra": Color("a06bff")}
const ELEMENT_ICONS := {"fogo": "fire", "natureza": "leaf", "agua": "drop", "luz": "sun", "sombra": "moon"}

static var _theme: Theme
static var _icons := {}
static var _portraits := {}

## Tema global: fonte, contorno do texto e botões arredondados.
static func theme() -> Theme:
	if _theme: return _theme
	var t := Theme.new()
	t.default_font = FONT
	t.default_font_size = 20
	t.set_color("font_color", "Label", INK)
	t.set_color("font_outline_color", "Label", Color(0.06, 0.03, 0.08))
	t.set_constant("outline_size", "Label", 6)
	for s in ["normal", "hover", "pressed", "disabled", "focus"]:
		t.set_stylebox(s, "Button", button_box(Color("8a3fd1") if s != "disabled" else Color("4a4050"), s))
	t.set_color("font_color", "Button", INK)
	t.set_color("font_hover_color", "Button", INK)
	t.set_color("font_pressed_color", "Button", INK)
	t.set_color("font_disabled_color", "Button", INK_DIM)
	t.set_color("font_outline_color", "Button", Color(0.06, 0.03, 0.08))
	t.set_constant("outline_size", "Button", 6)
	t.set_font_size("font_size", "Button", 22)
	_theme = t
	return t

static func box(bg: Color, edge := EDGE, radius := 14, border := 3, shadow := 6) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = edge
	s.set_border_width_all(border)
	s.set_corner_radius_all(radius)
	s.shadow_color = Color(0, 0, 0, 0.45)
	s.shadow_size = shadow
	s.shadow_offset = Vector2(0, 3)
	s.anti_aliasing = true
	return s

static func button_box(bg: Color, state := "normal") -> StyleBoxFlat:
	var c := bg
	if state == "hover": c = bg.lightened(0.12)
	elif state == "pressed": c = bg.darkened(0.15)
	var s := box(c, c.darkened(0.45), 16, 3, 4 if state != "pressed" else 1)
	s.border_width_bottom = 7 if state != "pressed" else 3
	s.content_margin_left = 18
	s.content_margin_right = 18
	s.content_margin_top = 8
	s.content_margin_bottom = 10
	if state == "focus":
		s.bg_color = Color(0, 0, 0, 0)
		s.border_color = Color(1, 1, 1, 0.0)
		s.shadow_size = 0
	return s

static func panel(bg := PANEL, edge := EDGE, radius := 16) -> PanelContainer:
	var p := PanelContainer.new()
	var s := box(bg, edge, radius)
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	p.add_theme_stylebox_override("panel", s)
	return p

static func label(text: String, size := 20, color := INK, outline := 6) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_constant_override("outline_size", outline)
	return l

static func button(text: String, color := Color("8a3fd1"), size := 22) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", size)
	for s in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(s, button_box(color, s))
	b.add_theme_stylebox_override("focus", button_box(color, "focus"))
	return b

static func icon(name: String) -> Texture2D:
	if not _icons.has(name):
		var path := "res://assets/icons/%s.svg" % name
		_icons[name] = load(path) if ResourceLoader.exists(path) else null
	return _icons[name]

static func icon_rect(name: String, size := 24.0, color := Color.WHITE) -> TextureRect:
	var r := TextureRect.new()
	r.texture = icon(name)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = Vector2(size, size)
	r.modulate = color
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func portrait(key: String) -> Texture2D:
	if not _portraits.has(key):
		var path := "res://assets/portraits/%s.png" % key
		_portraits[key] = load(path) if ResourceLoader.exists(path) else null
	return _portraits[key]

## Retrato dentro de uma moldura com a cor do elemento (o cartão dos heróis e inimigos).
static func portrait_frame(key: String, size := 72.0, locked := false) -> PanelContainer:
	var el: String = Data.unit_def(key).get("el", "luz")
	var c: Color = ELEMENT_COLORS.get(el, EDGE)
	var p := PanelContainer.new()
	var s := box(c.darkened(0.55), c, 12, 4, 3)
	s.set_content_margin_all(2)
	p.add_theme_stylebox_override("panel", s)
	p.custom_minimum_size = Vector2(size, size)
	var t := TextureRect.new()
	t.texture = portrait(key)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if locked: t.modulate = Color(0.25, 0.22, 0.3)
	p.add_child(t)
	p.mouse_filter = Control.MOUSE_FILTER_PASS
	return p

## Selo redondo com o ícone do elemento.
static func element_badge(el: String, size := 22.0) -> PanelContainer:
	var p := PanelContainer.new()
	var c: Color = ELEMENT_COLORS.get(el, EDGE)
	var s := box(c, Color(0.1, 0.05, 0.1), int(size), 2, 2)
	s.set_content_margin_all(3)
	p.add_theme_stylebox_override("panel", s)
	p.custom_minimum_size = Vector2(size, size)
	p.add_child(icon_rect(ELEMENT_ICONS.get(el, "star"), size - 6))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p

## Barra (vida, fichas, experiência).
static func bar(color: Color, height := 14.0, bg := Color(0.08, 0.04, 0.1, 0.9)) -> ProgressBar:
	var b := ProgressBar.new()
	b.show_percentage = false
	b.custom_minimum_size = Vector2(0, height)
	var f := box(color, color.darkened(0.3), int(height / 2), 0, 0)
	var g := box(bg, Color(0, 0, 0, 0.8), int(height / 2), 2, 0)
	b.add_theme_stylebox_override("fill", f)
	b.add_theme_stylebox_override("background", g)
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return b

## Contador de moeda (ícone + número) para as barras do topo.
static func currency(icon_name: String, color: Color, value: int) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 6)
	h.add_child(icon_rect(icon_name, 26, color))
	var l := label(fmt(value), 22)
	l.name = "Value"
	h.add_child(l)
	return h

static func fmt(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "." + s.right(3) + out
		s = s.left(s.length() - 3)
	return ("-" if n < 0 else "") + s + out

## Estrelas da fase (cheias até n).
static func stars(n: int, size := 22.0, of := 3) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 1)
	for i in of:
		h.add_child(icon_rect("star", size, GOLD if i < n else Color(0.25, 0.2, 0.28)))
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return h

## Tela cheia que ignora o mouse (raiz das telas e camadas).
static func full(c: Control) -> Control:
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c

static func margin(c: Control, l := 0, t := 0, r := 0, b := 0) -> MarginContainer:
	var m := MarginContainer.new()
	m.add_theme_constant_override("margin_left", l)
	m.add_theme_constant_override("margin_top", t)
	m.add_theme_constant_override("margin_right", r)
	m.add_theme_constant_override("margin_bottom", b)
	m.add_child(c)
	return m

static func is_portrait(node: Node) -> bool:
	var s := node.get_viewport().get_visible_rect().size
	return s.y > s.x
