extends Node3D
## Vitrine (prévia da versão Godot): heróis, inimigos e chefes modelados no Blender, com o visual
## estilizado, alternando as animações padrão. O grupo exibido troca a cada GROUP_TIME segundos.

const Stylize := preload("res://scripts/presentation/stylize.gd")
const Data := preload("res://scripts/core/data.gd")
const DungeonRoom := preload("res://scripts/presentation/dungeon_room.gd")
const ACTS := ["Attack", "Cast", "Victory", "Hit"]
const GROUP_TIME := 14.0
const GROUPS := [
	{"title": "Heróis", "dir": "heroes", "keys": [], "theme": "goblin"},   # keys vazio: ordem dos dados
	{"title": "Inimigos", "dir": "enemies", "keys": ["goblin", "arqueiro", "xama", "esqueleto", "magoEsq", "diabrete", "bruto"], "theme": "cripta"},
	{"title": "Chefes", "dir": "bosses", "keys": ["grakk", "lich", "gorruk", "ignar"], "theme": "forja", "boss": true},
]
var group := 0
var holder: Node3D
var room: Node3D
var fixed_theme := ""   # ?tema=<chave> fixa o cenário em todos os grupos

var heroes: Array = []   # [{node, anim, key}]
var label: Label
var turn := 0

func _ready() -> void:
	_camera()
	room = DungeonRoom.new()
	add_child(room)
	label = Label.new()
	label.position = Vector2(24, 20)
	label.add_theme_font_size_override("font_size", 22)
	add_child(label)
	var t := Timer.new()
	t.wait_time = 1.4
	t.autostart = true
	t.timeout.connect(_next)
	add_child(t)
	var g := Timer.new()
	g.wait_time = GROUP_TIME
	g.autostart = true
	g.timeout.connect(func(): group = (group + 1) % GROUPS.size(); _spawn())
	add_child(g)
	var q := _url_param("grupo")
	group = clampi(int(q), 0, GROUPS.size() - 1) if q.is_valid_int() else 0
	fixed_theme = _url_param("tema")
	_spawn()

## Parâmetros da URL no navegador: `?grupo=N` (0 heróis, 1 inimigos, 2 chefes) e `?tema=<chave>`.
func _url_param(key: String) -> String:
	if not OS.has_feature("web"): return ""
	return str(JavaScriptBridge.eval("new URLSearchParams(location.search).get('%s') || ''" % key, true))

func _spawn() -> void:
	if holder: holder.queue_free()
	holder = Node3D.new()
	add_child(holder)
	heroes.clear()
	turn = 0
	var gdef: Dictionary = GROUPS[group]
	room.build(fixed_theme if fixed_theme != "" else gdef["theme"], gdef.get("boss", false))
	var keys: Array = Data.hero_order() if gdef["keys"].is_empty() else gdef["keys"]
	var per_row := 4
	var spacing := 2.3 if gdef["dir"] != "bosses" else 2.9
	for i in keys.size():
		var key: String = keys[i]
		var path := "res://assets/characters/%s/%s.glb" % [gdef["dir"], key]
		if not ResourceLoader.exists(path): continue
		var n: Node3D = load(path).instantiate()
		holder.add_child(n)
		var row := i / per_row
		var col := i % per_row
		var cols: int = mini(per_row, keys.size() - row * per_row)
		n.position = Vector3((col - (cols - 1) / 2.0) * spacing + row * 1.15, 0, row * 2.2 - 1.4)
		n.rotation.y = deg_to_rad(-12 + (col - 1.5) * 6)
		if gdef["dir"] == "bosses": n.scale = Vector3.ONE * 1.25
		Stylize.apply(n)
		var anim: AnimationPlayer = n.find_children("*", "AnimationPlayer", true, false)[0]
		for loop in ["Idle", "Victory"]:
			if anim.has_animation(loop): anim.get_animation(loop).loop_mode = Animation.LOOP_LINEAR
		anim.playback_default_blend_time = 0.22
		anim.play("Idle")
		anim.seek(randf() * 1.5)
		anim.animation_finished.connect(func(_a): anim.play("Idle"))
		heroes.append({"node": n, "anim": anim, "key": key})
	_next()

func _next() -> void:
	if heroes.is_empty(): return
	var h: Dictionary = heroes[turn % heroes.size()]
	var a: String = ACTS[(turn / heroes.size()) % ACTS.size()]
	turn += 1
	h["anim"].play(a)
	var d: Dictionary = Data.unit_def(h["key"])
	label.text = "%s · %s · %s   (prévia Godot)" % [GROUPS[group]["title"], d.get("name", h["key"]), a]

func _camera() -> void:
	var cam := Camera3D.new()
	cam.fov = 34
	cam.position = Vector3(0.6, 5.2, 10.8)
	cam.look_at_from_position(cam.position, Vector3(0, 1.4, -0.9))
	add_child(cam)
	get_viewport().size_changed.connect(_fit_camera.bind(cam))
	_fit_camera(cam)

## Em tela deitada fixa o campo de visão vertical; em pé, o horizontal (todos continuam no quadro).
func _fit_camera(cam: Camera3D) -> void:
	var s := get_viewport().get_visible_rect().size
	if s.x >= s.y:
		cam.keep_aspect = Camera3D.KEEP_HEIGHT
		cam.fov = 34
	else:
		cam.keep_aspect = Camera3D.KEEP_WIDTH
		cam.fov = 50
