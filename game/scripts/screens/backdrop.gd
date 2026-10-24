extends Node3D
## Fundo 3D das telas de menu: uma sala da masmorra (tema do capítulo) com personagens parados
## e a câmera balançando devagar.

const DungeonRoom := preload("res://scripts/presentation/dungeon_room.gd")
const Stylize := preload("res://scripts/presentation/stylize.gd")

var cam: Camera3D
var room
var _models: Array = []
var _t := 0.0
var look := Vector3(0, 1.2, -1.0)
var base := Vector3(0, 3.6, 9.5)

func _ready() -> void:
	room = DungeonRoom.new()
	add_child(room)
	cam = Camera3D.new()
	cam.fov = 40
	add_child(cam)
	get_viewport().size_changed.connect(_fit)
	_fit()

func _fit() -> void:
	var s := get_viewport().get_visible_rect().size
	cam.keep_aspect = Camera3D.KEEP_HEIGHT if s.x >= s.y else Camera3D.KEEP_WIDTH
	cam.fov = 40 if s.x >= s.y else 50

func set_theme(key: String, boss := false) -> void:
	room.build(key, boss)

## Personagens em fila (chaves de heróis/inimigos), centrados em `center_x`.
func set_lineup(keys: Array, center_x := 0.0, spacing := 2.2, z := -1.0) -> void:
	for m in _models: m.queue_free()
	_models.clear()
	for i in keys.size():
		var k: String = keys[i]
		var path := ""
		for dir in ["heroes", "enemies", "bosses"]:
			var p := "res://assets/characters/%s/%s.glb" % [dir, k]
			if ResourceLoader.exists(p): path = p
		if path == "": continue
		var n: Node3D = load(path).instantiate()
		add_child(n)
		n.position = Vector3(center_x + (i - (keys.size() - 1) / 2.0) * spacing, 0, z - absf(i - (keys.size() - 1) / 2.0) * 0.4)
		n.rotation.y = deg_to_rad(-(i - (keys.size() - 1) / 2.0) * 8)
		Stylize.apply(n)
		var players := n.find_children("*", "AnimationPlayer", true, false)
		if players.size() > 0:
			var a: AnimationPlayer = players[0]
			if a.has_animation("Idle"):
				a.get_animation("Idle").loop_mode = Animation.LOOP_LINEAR
				a.play("Idle")
				a.seek(randf() * 1.5)
		_models.append(n)

## Um personagem girando devagar (vitrine da tela de heróis).
func spin(on: bool) -> void:
	set_meta("spin", on)

func _process(delta: float) -> void:
	_t += delta
	cam.look_at_from_position(base + Vector3(sin(_t * 0.15) * 0.8, sin(_t * 0.11) * 0.15, 0), look)
	if get_meta("spin", false):
		for m in _models: m.rotation.y += delta * 0.6
