extends Node3D
## Sala de masmorra montada com o kit do Blender (game/assets/dungeon/*.glb): piso em MultiMesh,
## parede do fundo com o arco gradeado, paredes laterais, pilares, tochas e objetos de cada tema.
## Também cria a iluminação e o ambiente (névoa, cor de fundo, poeira no ar).
##
##     var room := DungeonRoom.new(); add_child(room); room.build("cripta", true)
##
## Área livre para a batalha: x de -8 a 8 e z de -6 a 6 (a câmera olha de +z para -z).

const Stylize := preload("res://scripts/presentation/stylize.gd")
const Flame := preload("res://scripts/presentation/flame.gd")
const KIT := "res://assets/dungeon/%s.glb"

## Tons neutros com que as peças foram modeladas: o tema informa a cor final e o tingimento
## é a razão entre as duas (ver mats() em art/blender/dungeon/kit.py).
const BASE := {"piso": Color("9a9296"), "parede": Color("8f878c"), "estandarte": Color("b9b2b0")}

## Visual de cada tema (as cores do piso, da parede e do estandarte são as finais, já tingidas).
const THEMES := {
	"goblin": {"bg": "1b120f", "ambient": "6a5a6e", "key": "ffd9a8", "fill": "8a7cff",
		"piso": "4e443c", "parede": "4a3e3a", "estandarte": "a8322b", "fogo": "ff9440", "chama": "ffd27a", "cristal": "ffb347"},
	"cripta": {"bg": "0b1316", "ambient": "4a6a80", "key": "bfe6ff", "fill": "4fe0c6",
		"piso": "3e4a50", "parede": "36424a", "estandarte": "2c6b78", "fogo": "4fe0c6", "chama": "c8fff2", "cristal": "7ff0ff"},
	"lodo": {"bg": "0c140d", "ambient": "4a5a48", "key": "ffe0b0", "fill": "7ac850",
		"piso": "3c4236", "parede": "363c30", "estandarte": "3d7a2e", "fogo": "9cff5a", "chama": "e6ffc2", "cristal": "9cff5a"},
	"forja": {"bg": "1a0906", "ambient": "6a4a50", "key": "ffcfb0", "fill": "c07a6a",
		"piso": "3e3230", "parede": "3e2e2a", "estandarte": "8a1f10", "fogo": "ff5a1a", "chama": "ffc070", "cristal": "ff6a2a"},
	"arena": {"bg": "14101c", "ambient": "6a6080", "key": "ffe6c0", "fill": "8a7cff",
		"piso": "6a5e50", "parede": "564a44", "estandarte": "2b4fa8", "fogo": "ffb040", "chama": "ffe2a0", "cristal": "9fd4ff"},
}

## Objetos soltos por tema: [peça, x, z, giro em graus, escala] (y opcional como 6º item).
const PROPS := {
	"goblin": [["barril", -8.6, -6.4, 0, 1], ["barril", -9.6, -5.2, 40, 1], ["caixote", 9.7, -4.6, 17, 1],
		["caixote", 9.7, -4.6, 52, 0.75, 0.9], ["caixote", -10.2, -2.6, 12, 1], ["ossos", 8.4, -2.4, 30, 1.2],
		["bau", 6.4, -7.7, -8, 1], ["moedas", 5.2, -7.6, 0, 1], ["braseiro", -9.4, 1.8, 0, 1]],
	"cripta": [["urna", -9.2, -5.8, 0, 1.1], ["urna", -8.3, -6.6, 50, 0.8], ["urna", 9.3, -5.4, 20, 1],
		["ossos", -8.6, -3.0, 0, 1.2], ["ossos", 8.6, -2.6, 120, 1.2], ["ossos", 9.4, 3.0, 200, 1],
		["coluna_quebrada", 9.6, 0.6, 40, 1], ["cristal", -10.0, 1.6, 0, 1.3], ["cristal", 6.0, -7.8, 70, 0.9]],
	"lodo": [["braseiro", -7.2, -6.0, 0, 1], ["braseiro", 7.2, -6.0, 0, 1], ["cristal", -9.4, -3.0, 0, 1.4],
		["cristal", 9.6, -2.0, 90, 1.1], ["cristal", -9.8, 2.6, 30, 1], ["coluna_quebrada", -9.8, -0.6, 200, 1],
		["ossos", 8.8, 1.4, 60, 1.2], ["barril", 9.6, -5.6, 0, 1]],
	"forja": [["braseiro", -10.0, -0.5, 0, 1.2], ["braseiro", 10.0, -0.5, 0, 1.2], ["caixote", -9.2, -5.6, 10, 1],
		["barril", -8.2, -6.6, 0, 1], ["bau", 8.6, -6.4, -20, 1], ["moedas", 7.4, -6.9, 0, 1.1],
		["cristal", 9.8, 2.6, 0, 1.2], ["cristal", -9.6, 3.0, 45, 1]],
	"arena": [["braseiro", -9.6, -5.2, 0, 1.2], ["braseiro", 9.6, -5.2, 0, 1.2], ["braseiro", -9.6, 2.6, 0, 1],
		["braseiro", 9.6, 2.6, 0, 1], ["caixote", -10.4, -1.2, 5, 1], ["barril", 10.4, -1.4, 0, 1]],
}

const WALL_Z := -9.4         # centro da parede do fundo (a face fica em z = -9.0)
const TORCH_FLAME := Vector3(0, 0.42, 0.42)
const BRAZIER_FLAME := Vector3(0, 1.12, 0)
const MAX_LIGHTS := 6        # no renderizador Compatibility cada luz é uma passada a mais

var theme := "goblin"
var _t: Dictionary
var _tint: Dictionary
var _cache := {}
var _lights := 0

func build(theme_key := "goblin", boss := false) -> void:
	for c in get_children(): c.queue_free()
	theme = theme_key if THEMES.has(theme_key) else "goblin"
	_t = THEMES[theme]
	_cache = {}
	_lights = 0
	_tint = {}
	for k in BASE:
		var target := Color(_t[k])
		var b: Color = BASE[k]
		_tint[k] = Color(target.r / b.r, target.g / b.g, target.b / b.b)
	_tint["brasa"] = Color(_t["fogo"])
	_tint["cristal"] = Color(_t["cristal"])
	_environment()
	_floor()
	_walls()
	_wall_decor()
	for p in PROPS[theme]:
		var y: float = p[5] if p.size() > 5 else 0.0
		var n := _piece(p[0], Vector3(p[1], y, p[2]), p[3], p[4])
		if p[0] == "braseiro": _flame(n, BRAZIER_FLAME, 1.5)
		if p[0] == "cristal": _crystal_light(n)
	if boss:
		_piece("trono", Vector3(0, 0, -7.9), 0, 1.0)
	_dust()

# ------------------------------------------------------------------ peças
func _piece(name: String, pos: Vector3, rot_y_deg: float, s: float, outline := 0.006) -> Node3D:
	var n: Node3D = load(KIT % name).instantiate()
	n.position = pos
	n.rotation.y = deg_to_rad(rot_y_deg)
	n.scale = Vector3.ONE * s
	add_child(n)
	Stylize.apply(n, outline, _tint, 0.08, _cache)
	return n

func _floor() -> void:
	var variants := ["piso", "piso", "piso", "piso", "piso", "piso_rachado", "piso_pedras"]
	var spots := {}
	var rng := RandomNumberGenerator.new()
	rng.seed = 11
	for x in range(-11, 12, 2):
		for z in range(-8, 9, 2):
			var v: String = variants[rng.randi() % variants.size()]
			if not spots.has(v): spots[v] = []
			spots[v].append(Transform3D(Basis(Vector3.UP, rng.randi_range(0, 3) * PI / 2), Vector3(x, 0, z)))
	for v in spots:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = _styled_mesh(v)
		mm.instance_count = spots[v].size()
		for i in mm.instance_count: mm.set_instance_transform(i, spots[v][i])
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mmi)

## Malha da peça com os materiais estilizados gravados nela (MultiMesh não aceita troca por instância).
func _styled_mesh(name: String) -> Mesh:
	var n: Node = load(KIT % name).instantiate()
	var mi: MeshInstance3D = n.find_children("*", "MeshInstance3D", true, false)[0]
	var mesh: Mesh = mi.mesh.duplicate()
	for s in mesh.get_surface_count():
		var src: Material = mi.get_active_material(s)
		if not _cache.has(src): _cache[src] = Stylize.make(src, 0.0, _tint, 0.04)
		mesh.surface_set_material(s, _cache[src])
	n.free()
	return mesh

func _walls() -> void:
	_piece("parede_arco", Vector3(0, 0, WALL_Z), 0, 1, 0.0)
	for x in [-12, -8, -4, 4, 8, 12]:
		_piece("parede", Vector3(x, 0, WALL_Z), 0, 1, 0.0)
	for sx in [-1, 1]:
		for z in [-7, -3, 1, 5]:
			_piece("parede", Vector3(12.4 * sx, 0, z), -90 * sx, 1, 0.0)
	for p in [Vector3(-7, 0, -8.1), Vector3(7, 0, -8.1), Vector3(-11.2, 0, -3), Vector3(11.2, 0, -3)]:
		_piece("pilar", p, 0, 1, 0.004)

func _wall_decor() -> void:
	var face := WALL_Z + 0.4
	for x in [-3.6, 3.6, -9.6, 9.6]:
		var t := _piece("tocha", Vector3(x, 2.5, face), 0, 1)
		_flame(t, TORCH_FLAME, 1.0)
	for x in [-5.8, 5.8]:
		_piece("estandarte", Vector3(x, 0.6, face), 0, 1)
	for x in [-2.3, 2.3]:
		_piece("corrente", Vector3(x, 0.2, face), 0, 0.9)

func _flame(parent: Node3D, offset: Vector3, size: float) -> void:
	var f: Node3D = Flame.new()
	f.outer_color = Color(_t["fogo"])
	f.inner_color = Color(_t["chama"])
	f.size = size
	f.with_light = _lights < MAX_LIGHTS
	if f.with_light: _lights += 1
	f.position = offset
	parent.add_child(f)

func _crystal_light(parent: Node3D) -> void:
	if _lights >= MAX_LIGHTS: return
	_lights += 1
	var l := OmniLight3D.new()
	l.light_color = Color(_t["cristal"])
	l.light_energy = 0.8
	l.omni_range = 4.0
	l.position = Vector3(0, 0.8, 0)
	parent.add_child(l)

# ------------------------------------------------------------------ ambiente
func _environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(_t["bg"])
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(_t["ambient"])
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_light_color = Color(_t["bg"])
	env.fog_depth_begin = 15.0
	env.fog_depth_end = 34.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var key := DirectionalLight3D.new()
	key.light_color = Color(_t["key"])
	key.light_energy = 0.95
	key.shadow_enabled = true
	key.directional_shadow_max_distance = 30.0
	key.rotation_degrees = Vector3(-55, -35, 0)
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.light_color = Color(_t["fill"])
	fill.light_energy = 0.25
	fill.rotation_degrees = Vector3(-25, 150, 0)
	add_child(fill)

func _dust() -> void:
	var p := CPUParticles3D.new()
	p.amount = 70
	p.lifetime = 9.0
	p.preprocess = 9.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(11, 3, 8)
	p.position = Vector3(0, 3, -1)
	p.direction = Vector3(0.3, 1, 0)
	p.spread = 60.0
	p.gravity = Vector3.ZERO
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.2
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE * 0.05
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.albedo_color = Color(Color(_t["chama"]), 0.6)
	quad.material = m
	p.mesh = quad
	add_child(p)
