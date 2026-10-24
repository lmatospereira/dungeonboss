extends RefCounted
## Acesso aos dados do jogo (res://data/*.json, copiados de ../data pelo tools/godot.sh).
## Fonte única dos números: nunca escreva valores de balanceamento nos scripts.

const FILES := ["heroes", "enemies", "abilities", "dungeons", "rules", "progression", "campaign"]
static var _cache: Dictionary = {}

static func all() -> Dictionary:
	if _cache.is_empty():
		for f in FILES:
			var path := "res://data/%s.json" % f
			if not FileAccess.file_exists(path):
				push_error("Dados ausentes: %s. Rode tools/godot.sh sync." % path)
				continue
			var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
			if typeof(parsed) != TYPE_DICTIONARY:
				push_error("JSON inválido em %s" % path)
				continue
			_cache[f] = parsed
	return _cache

## Para o simulador: troca os dados em memória (ex.: testar um ajuste de balanceamento).
static func override(d: Dictionary) -> void:
	_cache = d

static func heroes() -> Dictionary: return all()["heroes"]["heroes"]
static func hero_order() -> Array: return all()["heroes"]["order"]
static func abilities() -> Dictionary: return all()["abilities"]["abilities"]
static func ability(id: String) -> Dictionary: return abilities().get(id, {})
static func values(id: String) -> Dictionary: return ability(id).get("values", {})
static func rules() -> Dictionary: return all()["rules"]["combat"]
static func elements() -> Dictionary: return all()["rules"]["elements"]
static func progression() -> Dictionary: return all()["progression"]
static func dungeons() -> Array: return all()["dungeons"]["dungeons"]
static func campaign() -> Dictionary: return all()["campaign"]

static func is_hero(key: String) -> bool: return heroes().has(key)

## Definição de qualquer unidade: herói, inimigo comum ou chefe.
static func unit_def(key: String) -> Dictionary:
	var d := all()
	if d["heroes"]["heroes"].has(key): return d["heroes"]["heroes"][key]
	if d["enemies"]["enemies"].has(key): return d["enemies"]["enemies"][key]
	if d["enemies"]["bosses"].has(key): return d["enemies"]["bosses"][key]
	push_error("Unidade desconhecida: %s" % key)
	return {}

## Texto da habilidade a partir do template: {chave|pct} → 125%, {chave|bonus} → +25%, {rules.x}.
static func ability_text(id: String) -> String:
	var a := ability(id)
	var t: String = a.get("text", "")
	var re := RegEx.new()
	re.compile("\\{([\\w.]+)(?:\\|(\\w+))?\\}")
	var out := t
	for m in re.search_all(t):
		var key := m.get_string(1)
		var fmt := m.get_string(2)
		var v = rules().get(key.substr(6)) if key.begins_with("rules.") else a.get("values", {}).get(key)
		if v == null:
			push_error("Texto da habilidade %s usa {%s}, que não existe" % [id, key])
			continue
		var s := str(v)
		if fmt == "pct": s = "%d%%" % roundi(v * 100.0)
		elif fmt == "bonus": s = "+%d%%" % roundi((v - 1.0) * 100.0)
		elif typeof(v) == TYPE_FLOAT and is_equal_approx(v, roundf(v)): s = str(int(v))
		out = out.replace(m.get_string(), s)
	return out
