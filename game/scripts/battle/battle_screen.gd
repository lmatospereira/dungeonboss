extends Node3D
## Tela de batalha de uma fase: monta a sala, os modelos e a interface, roda o núcleo de combate
## passo a passo e anima os eventos que ele devolve. O núcleo decide tudo; aqui só se mostra.
##
## Ciclo: step() → anima os eventos → se for a vez de um herói, espera o jogador (ou a IA no AUTO)
## → act() → anima → ... até "room_won" (próxima sala ou vitória) ou "lost".

const Data := preload("res://scripts/core/data.gd")
const Battle := preload("res://scripts/core/battle.gd")
const AI := preload("res://scripts/core/ai.gd")
const Campaign := preload("res://scripts/core/campaign.gd")
const Profile := preload("res://scripts/core/profile.gd")
const DungeonRoom := preload("res://scripts/presentation/dungeon_room.gd")
const UnitView := preload("res://scripts/battle/unit_view.gd")
const Fx := preload("res://scripts/battle/fx.gd")
const Hud := preload("res://scripts/battle/battle_hud.gd")
const UI := preload("res://scripts/ui/ui_kit.gd")

## Formação: heróis à esquerda, inimigos à direita (x, z). A primeira posição fica mais perto da câmera.
const HERO_SLOTS := [Vector2(-2.4, 0.5), Vector2(-4.1, 2.0), Vector2(-4.3, -1.1), Vector2(-6.0, 0.5)]
const ENEMY_SLOTS := [Vector2(2.4, 0.5), Vector2(4.1, 2.0), Vector2(4.3, -1.1), Vector2(6.0, 0.5), Vector2(5.8, 2.8), Vector2(6.2, -2.0)]
const BOSS_SLOT := Vector2(4.0, 0.3)
const BOSS_ADDS := [Vector2(2.4, 2.2), Vector2(2.6, -1.6), Vector2(6.0, 2.6), Vector2(6.2, -1.8)]
## Quem ataca de perto (investe até o alvo); os outros atiram de longe.
const MELEE := ["brom", "vex", "rook", "goblin", "esqueleto", "bruto", "grakk", "gorruk", "ignar"]
const STATUS_TEXT := {"burn": "Queimando", "poison": "Envenenado", "stun": "Atordoado", "shield": "Escudo", "taunt": "Provocando", "enrage": "Fúria!", "charge": "Concentrando"}

signal player_acted(result: Dictionary)

var app
var stage_id := "1-1"
var turbo := false
var stage: Dictionary
var dungeon: Dictionary
var rooms: Array
var room_i := 0
var battle
var views := {}           # unit_id → UnitView
var hud
var fx
var cam: Camera3D
var gold_run := 0
var selected_target := 0
var base_speed := 1.0
var _awaiting = null      # herói esperando o jogador
var _pick := ""           # "", "ally", "fallen": esperando escolher aliado para _pick_ability
var _pick_ability := ""
var _cam_home: Transform3D
var _over := false

func _ready() -> void:
	stage = Campaign.stage(stage_id)
	if stage.is_empty():
		app.open_map.call_deferred()
		return
	dungeon = Campaign.dungeon(stage["dungeon"])
	rooms = Campaign.rooms(stage)
	var room := DungeonRoom.new()
	add_child(room)
	room.build(dungeon.get("theme", "goblin"), stage.get("boss", false))
	cam = Camera3D.new()
	add_child(cam)
	get_viewport().size_changed.connect(_fit_camera)
	_fit_camera()
	fx = Fx.new()
	add_child(fx)
	get_viewport().physics_object_picking = true
	hud = Hud.new()
	add_child(hud)
	hud.camera = cam
	hud.ability_pressed.connect(_on_ability)
	hud.card_pressed.connect(_on_pick)
	hud.auto_toggled.connect(_on_auto)
	hud.speed_toggled.connect(func(f):
		base_speed = 2.0 if f else 1.0
		Engine.time_scale = base_speed
		app.profile["settings"]["fast"] = f)
	hud.quit_pressed.connect(func():
		_over = true
		Engine.time_scale = 1.0
		app.finish_battle(stage_id, false, room_i, 0, _team_keys()))
	var settings: Dictionary = app.profile.get("settings", {})
	hud.set_tools(settings.get("auto", false) or turbo, settings.get("fast", false))
	base_speed = 4.0 if turbo else (2.0 if settings.get("fast", false) else 1.0)
	Engine.time_scale = base_speed
	battle = Battle.new(randi())
	battle.auto_heroes = false
	battle.add_heroes(Profile.battle_team(app.profile))
	for u in battle.side_units("hero"):
		var s: Vector2 = HERO_SLOTS[u.slot % HERO_SLOTS.size()]
		_spawn(u, Vector3(s.x, 0, s.y), deg_to_rad(58))
	hud.set_heroes(battle.side_units("hero"))
	hud.set_title("Fase %s · %s" % [stage["id"], dungeon["name"]])
	_run()

func _exit_tree() -> void:
	Engine.time_scale = 1.0
	get_tree().paused = false

func _team_keys() -> Array: return battle.side_units("hero").map(func(u): return u.key)

func _fit_camera() -> void:
	var s := get_viewport().get_visible_rect().size
	if s.x >= s.y:
		cam.keep_aspect = Camera3D.KEEP_HEIGHT
		cam.fov = 34
		cam.look_at_from_position(Vector3(0, 6.6, 13.6), Vector3(0, 0.7, -0.2))
	else:
		cam.keep_aspect = Camera3D.KEEP_WIDTH
		cam.fov = 50
		cam.look_at_from_position(Vector3(0, 12.0, 11.5), Vector3(0, 0.2, 0.4))
	_cam_home = cam.transform

func _wait(t: float) -> void:
	await get_tree().create_timer(t, false).timeout

func _spawn(u, pos: Vector3, face: float):
	var v := UnitView.new()
	add_child(v)
	v.setup(u, pos, face)
	v.picked.connect(_on_pick)
	views[u.id] = v
	return v

# ---------------- ciclo da luta ----------------
func _run() -> void:
	await _enter_room()
	while not _over:
		var r: Dictionary = battle.step()
		await _play(r["events"])
		match r["state"]:
			"await_input":
				var res: Dictionary = await _hero_turn(battle.current)
				if _over: return
				await _play(res["events"])
			"room_won":
				await _room_cleared()
				if room_i == rooms.size() - 1:
					await _victory()
					return
				room_i += 1
				await _enter_room()
			"lost", "stalled":
				await _defeat()
				return

func _enter_room() -> void:
	var is_boss: bool = stage.get("boss", false) and room_i == rooms.size() - 1
	hud.set_rooms(room_i, rooms.size(), stage.get("boss", false))
	if room_i > 0:
		var ev: Array = battle.rest_between_rooms()
		await _play(ev)
	battle.load_room(rooms[room_i])
	var enemies: Array = battle.side_units("enemy")
	for i in enemies.size():
		var u = enemies[i]
		var s: Vector2 = BOSS_SLOT if u.is_boss else (BOSS_ADDS[i % BOSS_ADDS.size()] if is_boss else ENEMY_SLOTS[i % ENEMY_SLOTS.size()])
		var v = _spawn(u, Vector3(s.x, 0, s.y), deg_to_rad(-58))
		v.pop_in(0.12 * i)
		hud.add_enemy(u, v)
		if u.is_boss: hud.set_boss(u)
	selected_target = 0
	if is_boss:
		var b = enemies[0]
		await _boss_intro(b)
	else:
		hud.banner("Sala %d de %d" % [room_i + 1, rooms.size()], dungeon["sub"][mini(room_i, dungeon["sub"].size() - 1)] if room_i < rooms.size() else "", UI.INK, 0.9)
		await _wait(1.0)

func _boss_intro(b) -> void:
	var v = views[b.id]
	var tw := create_tween()
	var close := cam.transform.looking_at(v.chest(), Vector3.UP)
	close.origin = cam.transform.origin.lerp(v.chest(), 0.45)
	tw.tween_property(cam, "transform", close, 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tw.finished
	v.play("Victory")
	hud.banner(b.def.get("name", b.key), b.def.get("bk", {}).get("quote", ""), Color("ff8a6a"), 1.3)
	await _wait(1.6)
	var back := create_tween()
	back.tween_property(cam, "transform", _cam_home, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	await back.finished

func _room_cleared() -> void:
	hud.set_abilities([])
	_set_turn(null)
	var rr := Profile.room_reward(stage, room_i)
	for id in views:
		var v = views[id]
		if v.unit.side == "enemy" and v.visible: fx.burst(v.chest(), UI.GOLD, 10, 0.7)
	gold_run += int(rr["gold"])
	hud.set_gold(gold_run)
	await _wait(0.9)
	for id in views.keys():
		if views[id].unit.side == "enemy":
			views[id].queue_free()
			views.erase(id)
	hud.clear_enemies()

func _victory() -> void:
	_over = true
	hud.hide_controls(true)
	for u in battle.alive("hero"): views[u.id].play("Victory")
	hud.banner("Vitória!", "%s caiu" % battle.side_units("enemy")[0].def.get("short", "") if stage.get("boss", false) else "Fase %s concluída" % stage["id"], UI.GOLD, 1.6)
	await _wait(2.0)
	Engine.time_scale = 1.0
	app.finish_battle(stage_id, true, rooms.size(), battle.alive("hero").size(), _team_keys())

func _defeat() -> void:
	_over = true
	hud.hide_controls(true)
	for u in battle.alive("enemy"): views[u.id].play("Victory")
	hud.banner("Derrota", "A equipe caiu", UI.BAD, 1.6)
	await _wait(2.0)
	Engine.time_scale = 1.0
	app.finish_battle(stage_id, false, room_i, 0, _team_keys())

# ---------------- vez do herói ----------------
func _hero_turn(u) -> Dictionary:
	_set_turn(u)
	if hud.auto_on:
		await _wait(0.15)
		return _auto_act(u)
	_awaiting = u
	_ensure_target(u)
	hud.set_abilities(_ability_list(u))
	var res: Dictionary = await player_acted
	_awaiting = null
	_pick = ""
	hud.set_pick_mode("", [])
	hud.set_abilities([])
	return res

func _auto_act(u) -> Dictionary:
	var c: Dictionary = AI.choose(battle, u)
	var t = c.get("target")
	return battle.act(c["ab"], t.id if t else 0)

func _ability_list(u) -> Array:
	var ult: String = u.def.get("ult", "")
	return u.abilities.map(func(id): return {"id": id, "cd": int(u.cds.get(id, 0)), "ready": int(u.cds.get(id, 0)) <= 0, "ult": id == ult})

## Alvo marcado: mantém o escolhido se ainda estiver vivo; senão o melhor pela IA.
func _ensure_target(u) -> void:
	var foes: Array = battle.foes_of(u)
	var cur = battle.unit_by_id(selected_target)
	if cur == null or not cur in foes:
		var best = AI.best_foe(battle, u)
		selected_target = best.id if best else 0
	for id in views: views[id].set_target(id == selected_target and _awaiting != null)

func _on_ability(id: String) -> void:
	var u = _awaiting
	if u == null: return
	match str(Data.ability(id).get("target", "")):
		"enemy":
			_submit(id, selected_target)
		"ally":
			_pick = "ally"
			_pick_ability = id
			hud.set_pick_mode("ally", battle.friends_of(u).map(func(x): return x.id))
		"fallen":
			var fallen: Array = battle.fallen_of(u)
			if fallen.size() == 1: _submit(id, fallen[0].id)
			elif fallen.is_empty(): hud.set_hint("Ninguém caído para reviver")
			else:
				_pick = "fallen"
				_pick_ability = id
				hud.set_pick_mode("fallen", fallen.map(func(x): return x.id))
		_:
			_submit(id, 0)

func _on_pick(uid: int) -> void:
	if _awaiting == null: return
	var t = battle.unit_by_id(uid)
	if t == null: return
	if _pick != "":
		_submit(_pick_ability, uid)
		return
	if t.side == "enemy" and t.alive:
		selected_target = uid
		for id in views: views[id].set_target(id == selected_target)

func _on_auto(on: bool) -> void:
	app.profile["settings"]["auto"] = on
	if on and _awaiting != null:
		player_acted.emit(_auto_act(_awaiting))

func _submit(ab: String, target_id: int) -> void:
	var r: Dictionary = battle.act(ab, target_id)
	if r.has("error"):
		hud.set_hint(str(r["error"]).capitalize())
		return
	for id in views: views[id].set_target(false)
	player_acted.emit(r)

func _set_turn(u) -> void:
	for id in views: views[id].set_turn(u != null and id == u.id)
	hud.set_active(u.id if u and u.is_hero else 0)

# ---------------- animação dos eventos ----------------
func _play(events: Array) -> void:
	var returning = null
	for e in events:
		if _over and e["type"] != "death": continue
		match e["type"]:
			"turn":
				if returning: await returning.go_home()
				returning = null
				_set_turn(battle.unit_by_id(e["actor"]))
			"ability":
				if returning: await returning.go_home()
				returning = await _cast(e)
			"damage": await _on_damage(e)
			"heal":
				var v = views.get(e["target"])
				if v and e["amount"] > 0:
					fx.float_text(v.top(), "+%d" % e["amount"], UI.GOOD, 60)
					fx.rise(v.global_position, Color("7dff9a"))
				_refresh(e["target"])
			"dot":
				var v = views.get(e["target"])
				if v:
					fx.float_text(v.top(), str(e["amount"]), Color("ff9a3d") if e["status"] == "burn" else Color("a8f05a"), 52)
					v.play("Hit")
				_refresh(e["target"])
				await _wait(0.25)
			"death":
				var v = views.get(e["target"])
				if v:
					v.play("Death")
					v.set_turn(false)
					v.set_target(false)
					if v.unit.side == "enemy":
						fx.burst(v.chest(), UI.GOLD, 8, 0.6)
						v.fade_out()
				_refresh(e["target"])
			"revive":
				var v = views.get(e["target"])
				if v:
					v.visible = true
					v.scale = Vector3.ONE
					v.play("Idle")
					fx.rise(v.global_position, UI.GOLD)
					fx.float_text(v.top(), "De pé!", UI.GOLD, 56)
				_refresh(e["target"])
			"status":
				var v = views.get(e["target"])
				if v and STATUS_TEXT.has(e["status"]) and e["status"] != "charge":
					fx.float_text(v.top() + Vector3(0, 0.35, 0), STATUS_TEXT[e["status"]], Color("ffe6a0"), 40, 0.7, 0.8)
					if e["status"] == "shield": fx.rise(v.global_position, Color("8fd8ff"))
				_refresh(e["target"])
			"status_end", "cleanse":
				_refresh(e["target"])
			"immune":
				var v = views.get(e["target"])
				if v: fx.float_text(v.top(), "Imune", Color("d8d8ff"), 44)
			"stunned":
				var v = views.get(e["target"])
				if v: fx.float_text(v.top(), "Atordoado", Color("ffe27a"), 48)
				await _wait(0.45)
			"summon":
				var u = battle.unit_by_id(e["target"])
				var n: int = battle.side_units("enemy").size() - 1
				var s: Vector2 = BOSS_ADDS[n % BOSS_ADDS.size()] if stage.get("boss", false) else ENEMY_SLOTS[n % ENEMY_SLOTS.size()]
				var v = _spawn(u, Vector3(s.x, 0, s.y), deg_to_rad(-58))
				v.pop_in()
				hud.add_enemy(u, v)
				fx.burst(v.chest(), Color("c9a046"), 14)
				await _wait(0.3)
			"telegraph":
				var b = battle.unit_by_id(e["actor"])
				var bk: Dictionary = b.def.get("bk", {})
				hud.banner("%s no próximo turno!" % bk.get("big", "Golpe forte"), bk.get("prep", ""), Color("ff7a5a"), 1.2)
				await _wait(1.0)
	if returning: await returning.go_home()

## Animação do uso de uma habilidade; devolve a unidade que precisa voltar para o lugar (investida).
func _cast(e: Dictionary):
	var u = battle.unit_by_id(e["actor"])
	var v = views.get(e["actor"])
	if v == null: return null
	var d := Data.ability(e["ability"])
	var target_kind := str(d.get("target", "enemy"))
	var t = views.get(e["target"]) if e["target"] else null
	var col: Color = UI.ELEMENT_COLORS.get(u.el, Color.WHITE)
	var name := str(d.get("name", ""))
	if u.is_boss:
		var bk: Dictionary = u.def.get("bk", {})
		name = {"bBasic": bk.get("basic", name), "bAoe": bk.get("aoe", name), "bBig": bk.get("big", name), "bRage": bk.get("rage", name)}.get(e["ability"], name)
		if e["ability"] in ["bBig", "bRage", "bAoe"]: hud.banner(name, "", Color("ff8a6a"), 0.8)
		if e["ability"] == "bPrep":
			v.play("Cast")
			return null
	if name != "" and not u.is_boss: fx.float_text(v.top() + Vector3(0, 0.45, 0), name, Color.WHITE, 40, 0.5, 0.9)
	var enemy_side: bool = u.side == "hero"
	var foes_center := _side_center("enemy" if enemy_side else "hero")
	if target_kind in ["enemy", ""] and t and u.key in MELEE:
		await v.lunge(t.global_position)
		v.play("Attack")
		await _wait(v.length("Attack") * 0.4)
		return v
	if target_kind in ["enemy", ""] and t:
		v.play("Attack" if d.get("values", {}).get("cd", 0) == 0 else "Cast")
		await _wait(0.25)
		await fx.projectile(v.chest() + Vector3(0.3 if enemy_side else -0.3, 0, 0), t.chest(), col)
		return null
	if target_kind == "enemies":
		v.play("Cast")
		await _wait(0.35)
		fx.shockwave(foes_center, col, 3.2)
		await _wait(0.12)
		return null
	# aliados, si mesmo, caídos
	v.play("Cast")
	await _wait(0.35)
	if t: fx.rise(t.global_position, col.lightened(0.3))
	return null

func _side_center(side: String) -> Vector3:
	var c := Vector3.ZERO
	var n := 0
	for id in views:
		var v = views[id]
		if v.unit.side == side and v.unit.alive:
			c += v.global_position
			n += 1
	return c / n if n > 0 else Vector3.ZERO

func _on_damage(e: Dictionary) -> void:
	var v = views.get(e["target"])
	_refresh(e["target"])
	if v == null: return
	var crit: bool = e.get("crit", false)
	var adv: bool = e.get("elem", 1.0) > 1.0
	var weak: bool = e.get("elem", 1.0) < 1.0
	if v.unit.alive: v.play("Hit")
	v.flash()
	fx.burst(v.chest(), Color("ffd08a") if crit else Color("ffffff"), 10 if not crit else 18, 0.8)
	var col := Color("fff1c4")
	if crit: col = Color("ffd23a")
	elif adv: col = Color("ff9a4a")
	elif weak: col = Color("b8c4d8")
	fx.float_text(v.top(), str(e["amount"]), col, 78 if crit else 62)
	if crit: fx.float_text(v.top() + Vector3(0, 0.5, 0), "Crítico!", Color("ffd23a"), 40, 0.6, 0.7)
	elif adv: fx.float_text(v.top() + Vector3(0, 0.5, 0), "Eficaz!", Color("ff9a4a"), 36, 0.6, 0.7)
	if e.get("absorbed", 0) > 0: fx.float_text(v.chest(), "-%d escudo" % e["absorbed"], Color("8fd8ff"), 36, 0.5)
	if crit or e.get("heavy", false):
		_shake(0.18 if crit else 0.12)
		await _hitstop(0.07)
	await _wait(0.06)

func _refresh(uid: int) -> void:
	var u = battle.unit_by_id(uid)
	if u: hud.update_unit(u)

func _shake(power: float) -> void:
	var tw := create_tween()
	for i in 6:
		tw.tween_property(cam, "h_offset", randf_range(-power, power), 0.03)
		tw.parallel().tween_property(cam, "v_offset", randf_range(-power, power), 0.03)
	tw.tween_property(cam, "h_offset", 0.0, 0.04)
	tw.parallel().tween_property(cam, "v_offset", 0.0, 0.04)

## Congela a cena por um instante no impacto (sensação de peso do golpe).
func _hitstop(t: float) -> void:
	Engine.time_scale = 0.05
	await get_tree().create_timer(t, true, false, true).timeout
	Engine.time_scale = base_speed
