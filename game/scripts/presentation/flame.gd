extends Node3D
## Chama de tocha ou braseiro: dois cones aditivos, um brilho que olha para a câmera, faíscas
## subindo e (opcional) uma luz que tremula junto. Cores vêm do tema da masmorra.

var outer_color := Color("ff9440")
var inner_color := Color("ffd27a")
var size := 1.0
var with_light := false
var light_energy := 1.3
var light_range := 9.0

var _outer: MeshInstance3D
var _inner: MeshInstance3D
var _light: OmniLight3D
var _t := randf() * 10.0

func _ready() -> void:
	_outer = _cone(0.17, 0.55, outer_color, 0.85)
	_inner = _cone(0.085, 0.32, inner_color, 0.95)
	add_child(_glow())
	add_child(_sparks())
	if with_light:
		_light = OmniLight3D.new()
		_light.light_color = outer_color
		_light.light_energy = light_energy
		_light.omni_range = light_range
		_light.omni_attenuation = 1.4
		_light.position = Vector3(0, 0.3 * size, 0.3)
		add_child(_light)

func _cone(radius: float, height: float, color: Color, alpha: float) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.0
	mesh.bottom_radius = radius * size
	mesh.height = height * size
	mesh.radial_segments = 10
	mesh.rings = 1
	mesh.material = _additive(Color(color, alpha))
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position.y = height * size * 0.4
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi

func _glow() -> MeshInstance3D:
	var g := Gradient.new()
	g.set_color(0, Color(outer_color, 0.55))
	g.set_color(1, Color(outer_color, 0.0))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(0.5, 0.0)
	tex.width = 64
	tex.height = 64
	var m := _additive(Color.WHITE)
	m.albedo_texture = tex
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE * 1.9 * size
	quad.material = m
	var mi := MeshInstance3D.new()
	mi.mesh = quad
	mi.position.y = 0.25 * size
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi

func _sparks() -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 6
	p.lifetime = 1.3
	p.randomness = 0.5
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.1 * size
	p.direction = Vector3.UP
	p.spread = 25.0
	p.gravity = Vector3(0, 0.5, 0)
	p.initial_velocity_min = 0.4
	p.initial_velocity_max = 0.9
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.0
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE * 0.05 * size
	var m := _additive(inner_color)
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	quad.material = m
	p.mesh = quad
	p.position.y = 0.3 * size
	return p

func _additive(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.no_depth_test = false
	m.depth_draw_mode = BaseMaterial3D.DEPTH_DRAW_DISABLED
	m.albedo_color = color
	return m

func _process(delta: float) -> void:
	_t += delta
	var f := 1.0 + 0.12 * sin(_t * 13.0) + 0.08 * sin(_t * 23.0 + 1.3)
	_outer.scale = Vector3(1.0 / sqrt(f), f, 1.0 / sqrt(f))
	_inner.scale = Vector3(1, 0.9 + 0.15 * sin(_t * 17.0 + 0.4), 1)
	_outer.rotation.y = _t * 2.0
	if _light: _light.light_energy = light_energy * (0.85 + 0.15 * f)
