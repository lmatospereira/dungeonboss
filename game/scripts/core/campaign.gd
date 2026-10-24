extends RefCounted
## Campanha da versão Godot (data/campaign.json): capítulos (masmorras) divididos em fases.
## Sem estado: o progresso do jogador fica no perfil (profile.gd).

const Data := preload("res://scripts/core/data.gd")

static func conf() -> Dictionary: return Data.campaign()

static func dungeon(id: String) -> Dictionary:
	for d in Data.dungeons():
		if d["id"] == id: return d
	push_error("Masmorra desconhecida: %s" % id)
	return {}

## Todas as fases em ordem, cada uma com "chapter" (índice) e "dungeon" (id) acrescentados.
static func stages() -> Array:
	var out: Array = []
	var chapters: Array = conf()["chapters"]
	for ci in chapters.size():
		for s in chapters[ci]["stages"]:
			var st: Dictionary = s.duplicate(true)
			st["chapter"] = ci
			st["dungeon"] = chapters[ci]["dungeon"]
			out.append(st)
	return out

static func stage(id: String) -> Dictionary:
	for s in stages():
		if s["id"] == id: return s
	push_error("Fase desconhecida: %s" % id)
	return {}

## Fase anterior na ordem da campanha ("" para a primeira).
static func previous(id: String) -> String:
	var all := stages()
	for i in all.size():
		if all[i]["id"] == id: return all[i - 1]["id"] if i > 0 else ""
	return ""

## Salas para o núcleo de combate: [[{k, lvl}, ...], ...]; na fase do chefe ele vem por último, um nível acima.
static func rooms(st: Dictionary) -> Array:
	var lvl := int(st["lvl"])
	var out: Array = []
	for r in st["rooms"]:
		out.append(r.map(func(k): return {"k": k, "lvl": lvl}))
	if st.get("boss", false):
		out.append([{"k": dungeon(st["dungeon"])["boss"], "lvl": lvl + 1}])
	return out

## Herói cujas fichas a fase dá (na primeira vitória ou no drop), para mostrar no mapa.
static func token_heroes(st: Dictionary) -> Array:
	var out: Array = st.get("first", {}).get("tokens", {}).keys()
	var drop: String = st.get("drop", {}).get("hero", "")
	if drop != "" and not drop in out: out.append(drop)
	return out
