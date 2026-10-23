extends Node3D
## Vitrine (prévia da versão Godot): heróis, inimigos e chefes modelados no Blender, com o visual
## estilizado, alternando as animações padrão. O grupo exibido troca a cada GROUP_TIME segundos.

const Stylize := preload("res://scripts/presentation/stylize.gd")
const Data := preload("res://scripts/core/data.gd")
const ACTS := ["Attack", "Cast", "Victory", "Hit"]
const GROUP_TIME := 14.0
const GROUPS := [
	{"title": "Heróis", "dir": "heroes", "keys": []},   # preenchido com a ordem dos dados
	{"title": "Inimigos", "dir": "enemies", "keys": ["goblin", "arqueiro", "xama", "esqueleto", "magoEsq", "diabrete", "bruto"]},
	{"title": "Chefes", "dir": "bosses", "keys": ["grakk", "lich", "gorruk", "ignar"]},
]
var group := 0
var holder: Node3D

var heroes: Array = []   # [{node, anim, key}]
var label: Label
var turn := 0

func _ready() -> void:
	_environment()
	_floor()
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
	group = _url_group()
	_spawn()

## No navegador, `?grupo=N` começa no grupo N (0 heróis, 1 inimigos, 2 chefes).
func _url_group() -> int:
	if not OS.has_feature("web"): return 0
	var q := str(JavaScriptBridge.eval("new URLSearchParams(location.search).get('grupo') || ''", true))
	return clampi(int(q), 0, GROUPS.size() - 1) if q.is_valid_int() else 0

func _spawn() -> void:
	if holder: holder.queue_free()
	holder = Node3D.new()
	add_child(holder)
	heroes.clear()
	turn = 0
	var gdef: Dictionary = GROUPS[group]
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

func _environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("1b120f")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("6b5a80")
	env.ambient_light_energy = 0.5
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var key := DirectionalLight3D.new()
	key.light_color = Color("ffd9a8")
	key.light_energy = 1.15
	key.shadow_enabled = true
	key.rotation_degrees = Vector3(-55, -35, 0)
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.light_color = Color("8a7cff")
	fill.light_energy = 0.3
	fill.rotation_degrees = Vector3(-25, 150, 0)
	add_child(fill)
	var cam := Camera3D.new()
	cam.fov = 34
	cam.position = Vector3(0.6, 6.2, 11.5)
	cam.look_at_from_position(cam.position, Vector3(0, 0.9, 0.2))
	add_child(cam)

func _floor() -> void:
	var tiles := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.96, 0.3, 0.96)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color("2e2733")
	m.roughness = 0.95
	m.vertex_color_use_as_albedo = true
	box.material = m
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = box
	mm.instance_count = 256
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	var i := 0
	for x in range(-8, 8):
		for z in range(-8, 8):
			mm.set_instance_transform(i, Transform3D(Basis(), Vector3(x + 0.5, -0.15 + rng.randf_range(-0.02, 0.02), z + 0.5)))
			var v := rng.randf_range(0.8, 1.1)
			mm.set_instance_color(i, Color(v, v, v))
			i += 1
	tiles.multimesh = mm
	add_child(tiles)
