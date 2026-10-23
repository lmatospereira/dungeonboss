extends SceneTree
## Simula a campanha no AUTO: chance de vitória de cada fase com a equipe e o nível que o jogador
## deve ter ao chegar nela. tools/godot.sh campaign
const Campaign := preload("res://scripts/core/campaign.gd")
const Battle := preload("res://scripts/core/battle.gd")

func play(team: Array, rooms: Array, seed: int) -> bool:
	var b = Battle.new(seed)
	b.add_heroes(team)
	for i in rooms.size():
		b.load_room(rooms[i])
		var state := "running"
		while state == "running": state = b.step()["state"]
		if state != "room_won": return false
		if i < rooms.size() - 1: b.rest_between_rooms()
	return true

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var n := 200
	for st in Campaign.stages():
		var line := "%s (nível %d%s):" % [st["id"], st["lvl"], ", chefe" if st.get("boss", false) else ""]
		for setup in [["brom", "lyra", "alva"], ["brom", "lyra", "alva", "kai"]]:
			for dl in [-1, 0, 1]:
				var lvl := maxi(1, int(st["lvl"]) + dl)
				var team: Array = setup.map(func(k): return {"k": k, "lvl": lvl, "evo": 1})
				var w := 0
				for s in n:
					if play(team, Campaign.rooms(st), 1000 + s): w += 1
				line += "  %dh L%d %d%%" % [setup.size(), lvl, roundi(100.0 * w / n)]
		print(line)
	quit()
