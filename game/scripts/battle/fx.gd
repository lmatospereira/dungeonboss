extends Node3D
## Efeitos da batalha: números flutuantes, projéteis, impactos e brilhos de cura.
## Tudo é criado e destruído sozinho; a batalha só chama as funções.

const FONT := preload("res://assets/fonts/LilitaOne-Regular.ttf")

## Número ou texto que sobe e some (dano, cura, "Crítico!", status).
func float_text(at: Vector3, text: String, color: Color, size := 64, rise := 1.1, life := 0.9) -> void:
	var l := Label3D.new()
	l.text = text
	l.font = FONT
	l.font_size = size
	l.outline_size = 18
	l.modulate = color
	l.outline_modulate = Color(0.08, 0.03, 0.06)
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.fixed_size = false
	l.pixel_size = 0.006
	l.render_priority = 10
	l.position = at + Vector3(randf_range(-0.25, 0.25), 0, 0)
	add_child(l)
	l.scale = Vector3.ONE * 0.4
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector3.ONE * 1.15, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "scale", Vector3.ONE, 0.08)
	tw.parallel().tween_property(l, "position:y", l.position.y + rise, life).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.35).set_delay(life - 0.35)
	tw.tween_callback(l.queue_free)

func _glow_mat(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	return m

## Esfera brilhante que voa de `from` até `to`. Espera chegar.
func projectile(from: Vector3, to: Vector3, color: Color, time := 0.32, radius := 0.22) -> void:
	var s := SphereMesh.new()
	s.radius = radius
	s.height = radius * 2
	s.radial_segments = 12
	s.rings = 6
	s.material = _glow_mat(color)
	var mi := MeshInstance3D.new()
	mi.mesh = s
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.position = from
	add_child(mi)
	var core := MeshInstance3D.new()
	var cs := SphereMesh.new()
	cs.radius = radius * 0.55
	cs.height = radius * 1.1
	cs.material = _glow_mat(Color(1, 1, 0.9))
	core.mesh = cs
	mi.add_child(core)
	var trail := _sparks(color, 14, 0.35)
	mi.add_child(trail)
	var mid := (from + to) / 2 + Vector3(0, 0.8, 0)
	var tw := create_tween()
	tw.tween_method(func(t: float):
		var a := from.lerp(mid, t)
		var b := mid.lerp(to, t)
		mi.position = a.lerp(b, t), 0.0, 1.0, time)
	await tw.finished
	mi.queue_free()

## Explosão curta de partículas.
func burst(at: Vector3, color: Color, amount := 18, size := 1.0) -> void:
	var p := _sparks(color, amount, 0.5, size)
	p.one_shot = true
	p.explosiveness = 0.95
	p.initial_velocity_min = 2.0 * size
	p.initial_velocity_max = 4.5 * size
	p.spread = 180
	p.gravity = Vector3(0, -6, 0)
	p.position = at
	add_child(p)
	p.emitting = true
	get_tree().create_timer(1.2).timeout.connect(p.queue_free)

## Anel que se abre no chão (ataques em área, cura em grupo).
func shockwave(at: Vector3, color: Color, radius := 3.0) -> void:
	var m := TorusMesh.new()
	m.inner_radius = 0.85
	m.outer_radius = 1.0
	m.rings = 32
	m.ring_segments = 6
	m.material = _glow_mat(color)
	var mi := MeshInstance3D.new()
	mi.mesh = m
	mi.position = at + Vector3(0, 0.08, 0)
	mi.scale = Vector3(0.2, 0.1, 0.2)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	var tw := create_tween()
	tw.tween_property(mi, "scale", Vector3(radius, 0.1, radius), 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(m.material, "albedo_color:a", 0.0, 0.45)
	tw.tween_callback(mi.queue_free)

## Brilho subindo (cura, escudo, ressurreição).
func rise(at: Vector3, color: Color) -> void:
	var p := _sparks(color, 16, 0.9)
	p.one_shot = true
	p.explosiveness = 0.6
	p.direction = Vector3.UP
	p.spread = 20
	p.gravity = Vector3(0, 2.5, 0)
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.6
	p.position = at
	add_child(p)
	p.emitting = true
	get_tree().create_timer(1.6).timeout.connect(p.queue_free)

func _sparks(color: Color, amount: int, life: float, size := 1.0) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = amount
	p.lifetime = life
	p.local_coords = false
	var q := QuadMesh.new()
	q.size = Vector2.ONE * 0.12 * size
	var m := _glow_mat(color)
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.vertex_color_use_as_albedo = true
	q.material = m
	p.mesh = q
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.4
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	p.color_ramp = g
	return p
