extends Node3D
## Vitrine de teste do pipeline Blender → Godot → web: mostra um herói com o visual estilizado
## e percorre as animações padrão (Idle, Attack, Cast, Hit, Victory).

const Stylize := preload("res://scripts/presentation/stylize.gd")
const HERO := "res://assets/characters/heroes/brom.glb"
const CYCLE := ["Idle", "Attack", "Idle", "Cast", "Hit", "Idle", "Victory"]

var anim: AnimationPlayer
var step := 0
var label: Label

func _ready() -> void:
	_environment()
	_floor()
	var hero: Node3D = load(HERO).instantiate()
	add_child(hero)
	hero.rotation.y = deg_to_rad(-25)
	Stylize.apply(hero)
	anim = hero.find_children("*", "AnimationPlayer", true, false)[0]
	for loop in ["Idle", "Victory"]:   # ações em laço (começam e terminam na mesma pose)
		if anim.has_animation(loop): anim.get_animation(loop).loop_mode = Animation.LOOP_LINEAR
	anim.playback_default_blend_time = 0.22   # mistura entre ações: sem trancos
	anim.animation_finished.connect(_next)
	label = Label.new()
	label.position = Vector2(24, 20)
	label.add_theme_font_size_override("font_size", 22)
	add_child(label)
	_next("")

func _next(_n) -> void:
	var a: String = CYCLE[step % CYCLE.size()]
	step += 1
	label.text = "Brom · " + a + "  (Godot %s, %s)" % [Engine.get_version_info()["string"], OS.get_name()]
	anim.play(a)
	if a == "Idle" or a == "Victory":
		await get_tree().create_timer(2.4).timeout
		_next("")

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
	var key := DirectionalLight3D.new()       # luz principal quente
	key.light_color = Color("ffd9a8")
	key.light_energy = 1.15
	key.shadow_enabled = true
	key.rotation_degrees = Vector3(-55, -35, 0)
	add_child(key)
	var fill := DirectionalLight3D.new()      # preenchimento frio
	fill.light_color = Color("8a7cff")
	fill.light_energy = 0.3
	fill.rotation_degrees = Vector3(-25, 150, 0)
	add_child(fill)
	var cam := Camera3D.new()
	cam.fov = 32
	cam.position = Vector3(0, 3.2, 6.2)
	cam.look_at_from_position(cam.position, Vector3(0, 1.1, 0))
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
	mm.instance_count = 144
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	var i := 0
	for x in range(-6, 6):
		for z in range(-6, 6):
			mm.set_instance_transform(i, Transform3D(Basis(), Vector3(x + 0.5, -0.15 + rng.randf_range(-0.02, 0.02), z + 0.5)))
			var v := rng.randf_range(0.8, 1.1)
			mm.set_instance_color(i, Color(v, v, v))
			i += 1
	tiles.multimesh = mm
	add_child(tiles)
