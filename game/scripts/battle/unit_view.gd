extends Node3D
## Modelo 3D de uma unidade na batalha: carrega o .glb, estiliza, toca as animações e
## mostra os marcadores (anel do turno, alvo escolhido). Clique nele emite `picked`.

signal picked(unit_id: int)

const Stylize := preload("res://scripts/presentation/stylize.gd")
const Data := preload("res://scripts/core/data.gd")

var unit                     # UnitState do núcleo
var home := Vector3.ZERO     # posição na formação
var facing := 0.0            # giro (radianos) olhando para o outro lado
var height := 2.2            # altura aproximada (para barras e números)
var model: Node3D
var anim: AnimationPlayer
var _ring: MeshInstance3D
var _target_mark: MeshInstance3D
var _mats: Array = []

func setup(u, pos: Vector3, face: float) -> void:
	unit = u
	home = pos
	facing = face
	position = pos
	rotation.y = face
	var dir := "heroes" if u.is_hero else ("bosses" if u.is_boss else "enemies")
	var path := "res://assets/characters/%s/%s.glb" % [dir, u.def.get("view", {}).get("model", u.key)]
	if not ResourceLoader.exists(path): path = "res://assets/characters/%s/%s.glb" % [dir, u.key]
	model = load(path).instantiate()
	add_child(model)
	if u.is_boss: model.scale = Vector3.ONE * 1.3
	height = 2.2 * (1.3 if u.is_boss else 1.0)
	_mats = Stylize.apply(model)
	var players := model.find_children("*", "AnimationPlayer", true, false)
	if players.size() > 0:
		anim = players[0]
		for loop in ["Idle"]:
			if anim.has_animation(loop): anim.get_animation(loop).loop_mode = Animation.LOOP_LINEAR
		anim.playback_default_blend_time = 0.18
		anim.play("Idle")
		anim.seek(randf() * 1.2)
		anim.animation_finished.connect(_on_anim_done)
	_ring = _disc(Color(1.0, 0.82, 0.3, 0.85), 0.62 * (1.4 if u.is_boss else 1.0))
	_target_mark = _disc(Color(1.0, 0.25, 0.2, 0.9), 0.7 * (1.4 if u.is_boss else 1.0))
	_ring.visible = false
	_target_mark.visible = false
	_picker()

func _disc(color: Color, radius: float) -> MeshInstance3D:
	var m := TorusMesh.new()
	m.inner_radius = radius * 0.82
	m.outer_radius = radius
	m.rings = 32
	m.ring_segments = 6
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.material = mat
	var mi := MeshInstance3D.new()
	mi.mesh = m
	mi.scale = Vector3(1, 0.15, 1)
	mi.position.y = 0.04
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi

func _picker() -> void:
	var area := Area3D.new()
	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.75 * (1.3 if unit.is_boss else 1.0)
	cap.height = height
	shape.shape = cap
	shape.position.y = height / 2
	area.add_child(shape)
	area.input_ray_pickable = true
	area.input_event.connect(func(_cam, ev, _pos, _n, _idx):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			picked.emit(unit.id)
		elif ev is InputEventScreenTouch and ev.pressed:
			picked.emit(unit.id))
	add_child(area)

func set_turn(on: bool) -> void: _ring.visible = on and unit.alive
func set_target(on: bool) -> void: _target_mark.visible = on and unit.alive

func _process(delta: float) -> void:
	if _ring.visible: _ring.rotation.y += delta * 1.5
	if _target_mark.visible:
		var s := 1.0 + 0.08 * sin(Time.get_ticks_msec() * 0.008)
		_target_mark.scale = Vector3(s, 0.15, s)

func play(a: String) -> void:
	if anim and anim.has_animation(a): anim.play(a)

func _on_anim_done(a: StringName) -> void:
	if a == &"Death": return
	if unit.alive: anim.play("Idle")

## Duração da animação (para esperar o golpe acertar).
func length(a: String) -> float:
	return anim.get_animation(a).length if anim and anim.has_animation(a) else 0.6

## Pisca branco ao levar dano.
func flash() -> void:
	for m in _mats:
		if not m is ShaderMaterial: continue
		if not m.has_meta("base_emission"): m.set_meta("base_emission", m.get_shader_parameter("emission"))
		m.set_shader_parameter("emission", Color(0.9, 0.9, 0.9))
	await get_tree().create_timer(0.08).timeout
	for m in _mats:
		if m is ShaderMaterial and is_instance_valid(m): m.set_shader_parameter("emission", m.get_meta("base_emission", Color.BLACK))

## Investida até perto do alvo (corpo a corpo) e volta.
func lunge(to: Vector3, out_time := 0.22) -> void:
	var dir := (to - home)
	dir.y = 0
	var dest := home + dir - dir.normalized() * 1.5
	var tw := create_tween()
	tw.tween_property(self, "position", dest, out_time).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tw.finished

func go_home(t := 0.3) -> void:
	var tw := create_tween()
	tw.tween_property(self, "position", home, t).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	await tw.finished

## Entrada na sala (inimigos surgem crescendo).
func pop_in(delay := 0.0) -> void:
	scale = Vector3.ONE * 0.01
	var tw := create_tween()
	tw.tween_interval(delay)
	tw.tween_property(self, "scale", Vector3.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func fade_out() -> void:
	var tw := create_tween()
	tw.tween_interval(0.9)
	tw.tween_property(self, "scale", Vector3(1, 0.01, 1), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await tw.finished
	visible = false

func top() -> Vector3: return global_position + Vector3(0, height + 0.15, 0)
func chest() -> Vector3: return global_position + Vector3(0, height * 0.55, 0)
