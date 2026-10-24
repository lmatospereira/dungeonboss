extends Node
## Raiz do jogo: guarda o perfil e troca as telas (mapa, heróis, batalha, resultado).
## Parâmetros da URL no navegador:
##   ?vitrine (ou ?grupo / ?tema)  abre a vitrine dos modelos
##   ?fase=1-2                     vai direto para a batalha da fase
##   ?turbo                        batalha em 4x e no AUTO (testes)
##   ?novo                         apaga o progresso salvo e começa de novo

const Save := preload("res://scripts/app/save.gd")
const UI := preload("res://scripts/ui/ui_kit.gd")
const Profile := preload("res://scripts/core/profile.gd")
const MapScreen := preload("res://scripts/screens/map_screen.gd")
const HeroesScreen := preload("res://scripts/screens/heroes_screen.gd")
const BattleScreen := preload("res://scripts/battle/battle_screen.gd")
const ResultScreen := preload("res://scripts/screens/result_screen.gd")

var profile: Dictionary
var turbo := false
var _screen: Node

func _ready() -> void:
	if url_has("vitrine") or url_param("grupo") != "" or url_param("tema") != "":
		get_tree().change_scene_to_file.call_deferred("res://scenes/showcase.tscn")
		return
	profile = Save.reset() if url_has("novo") else Save.load_profile()
	turbo = url_has("turbo")
	var fase := url_param("fase")
	if fase != "": open_battle(fase)
	else: open_map()

func save() -> void: Save.save(profile)

func _swap(n: Node) -> void:
	if _screen: _screen.queue_free()
	_screen = n
	add_child(n)

func open_map(focus_stage := "") -> void:
	Engine.time_scale = 1.0
	var m := MapScreen.new()
	m.app = self
	m.focus_stage = focus_stage
	_swap(m)

func open_heroes(then_stage := "") -> void:
	var h := HeroesScreen.new()
	h.app = self
	h.then_stage = then_stage
	_swap(h)

func open_battle(stage_id: String) -> void:
	var b := BattleScreen.new()
	b.app = self
	b.stage_id = stage_id
	b.turbo = turbo
	_swap(b)

## Fim da batalha: aplica as recompensas no perfil, salva e mostra o resultado por cima da cena.
func finish_battle(stage_id: String, win: bool, rooms_cleared: int, alive: int, team: Array) -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var res := Profile.finish_stage(profile, stage_id, win, rooms_cleared, alive, team, rng)
	save()
	var r := ResultScreen.new()
	r.app = self
	r.stage_id = stage_id
	r.result = res
	r.team = team
	add_child(r)

## Fora do navegador, os mesmos parâmetros vêm da linha de comando: godot -- fase=1-1 turbo
func url_param(key: String) -> String:
	if not OS.has_feature("web"):
		for a in OS.get_cmdline_user_args():
			if a.begins_with(key + "="): return a.substr(key.length() + 1)
		return ""
	return str(JavaScriptBridge.eval("new URLSearchParams(location.search).get('%s') || ''" % key, true))

func url_has(key: String) -> bool:
	if not OS.has_feature("web"):
		return Array(OS.get_cmdline_user_args()).any(func(a): return a == key or a.begins_with(key + "="))
	return bool(JavaScriptBridge.eval("new URLSearchParams(location.search).has('%s')" % key, true))
