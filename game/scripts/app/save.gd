extends RefCounted
## Salvamento local do perfil (user://, que no navegador fica no IndexedDB da página).
## A sincronização com a conta no servidor vem depois, reaproveitando a API atual.

const Profile := preload("res://scripts/core/profile.gd")
const PATH := "user://perfil.json"

static func load_profile() -> Dictionary:
	if FileAccess.file_exists(PATH):
		var parsed = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		if typeof(parsed) == TYPE_DICTIONARY:
			return Profile.migrate(_ints(parsed))
		push_warning("Salvamento ilegível; começando um perfil novo.")
	return Profile.create()

static func save(p: Dictionary) -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f == null:
		push_warning("Não foi possível salvar o perfil (%s)." % error_string(FileAccess.get_open_error()))
		return
	f.store_string(JSON.stringify(p))

static func reset() -> Dictionary:
	var p := Profile.create()
	save(p)
	return p

## JSON devolve todo número como float; o perfil usa inteiros.
static func _ints(v):
	match typeof(v):
		TYPE_FLOAT:
			return int(v) if is_equal_approx(v, roundf(v)) else v
		TYPE_DICTIONARY:
			var d := {}
			for k in v: d[k] = _ints(v[k])
			return d
		TYPE_ARRAY:
			return v.map(func(x): return _ints(x))
	return v
