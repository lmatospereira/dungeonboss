extends RefCounted
## Monta e joga uma masmorra inteira (salas + chefe) com o núcleo, sem apresentação.
## Usado pelos testes e pelo simulador de balanceamento.

const Data := preload("res://scripts/core/data.gd")
const Battle := preload("res://scripts/core/battle.gd")

## Salas da masmorra: inimigos no nível da masmorra; chefe um nível acima.
static func rooms(dungeon: Dictionary) -> Array:
	var out: Array = []
	var lvl := int(dungeon["lvl"])
	for r in dungeon["rooms"]:
		out.append(r.map(func(k): return {"k": k, "lvl": lvl}))
	out.append([{"k": dungeon["boss"], "lvl": lvl + 1}])
	return out

## Joga a masmorra no AUTO. Devolve {win, cleared, actions, alive, battle}.
static func play(team: Array, dungeon: Dictionary, seed: int) -> Dictionary:
	var b = Battle.new(seed)
	b.add_heroes(team)
	var rs := rooms(dungeon)
	var cleared := 0
	for i in rs.size():
		b.load_room(rs[i])
		var state := "running"
		while state == "running":
			state = b.step()["state"]
		if state != "room_won":
			return {"win": false, "cleared": cleared, "actions": b.actions, "alive": b.alive("hero").size(), "battle": b, "state": state}
		cleared += 1
		if i < rs.size() - 1: b.rest_between_rooms()
	return {"win": true, "cleared": cleared, "actions": b.actions, "alive": b.alive("hero").size(), "battle": b, "state": "won"}

## Luta PvP: equipe A (heróis) contra a defesa B, as duas na IA. Devolve true se A vencer.
static func pvp(team_a: Array, team_b: Array, seed: int) -> Dictionary:
	var b = Battle.new(seed)
	b.add_heroes(team_a)
	b.load_room(team_b)
	var state := "running"
	while state == "running":
		state = b.step()["state"]
	return {"win": state == "room_won", "state": state, "actions": b.actions, "battle": b}
