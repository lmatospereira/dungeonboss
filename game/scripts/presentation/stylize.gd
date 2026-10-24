extends RefCounted
## Aplica o visual estilizado a um modelo importado do Blender (.glb):
## troca cada material por toon + contorno, mantendo a cor e a emissão originais.
## Para o cenário: `tint` tinge materiais pelo prefixo do nome (ex.: {"piso": Color(...)}, cor
## multiplicada; em material com emissão, a cor da emissão), `outline_width` 0 dispensa o contorno
## e `cache` (compartilhado entre chamadas) reaproveita os materiais entre várias cópias da mesma peça.

const TOON := preload("res://shaders/toon.gdshader")
const OUTLINE := preload("res://shaders/outline.gdshader")

static func apply(root: Node, outline_width := 0.009, tint := {}, rim := -1.0, cache := {}) -> Array:
	var made: Array = []
	for mi in root.find_children("*", "MeshInstance3D", true, false):
		var mesh: Mesh = mi.mesh
		if mesh == null: continue
		for s in mesh.get_surface_count():
			var src = mi.get_active_material(s)
			if not cache.has(src):
				cache[src] = make(src, outline_width, tint, rim)
				made.append(cache[src])
			mi.set_surface_override_material(s, cache[src])
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	return made

## Material estilizado equivalente a `src` (usado também nas malhas do piso em MultiMesh).
static func make(src: Material, outline_width := 0.009, tint := {}, rim := -1.0) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = TOON
	if src is BaseMaterial3D:
		var albedo: Color = src.albedo_color
		var emission := Color.BLACK
		if src.emission_enabled: emission = src.emission * src.emission_energy_multiplier
		var t = _tint_for(src.resource_name, tint)
		if t != null:
			if src.emission_enabled: emission = t * src.emission_energy_multiplier
			else: albedo = Color(albedo.r * t.r, albedo.g * t.g, albedo.b * t.b, albedo.a)
		m.set_shader_parameter("albedo", albedo)
		m.set_shader_parameter("emission", emission)
		m.set_shader_parameter("metallic_hint", src.metallic)
	if rim >= 0.0: m.set_shader_parameter("rim_strength", rim)
	if outline_width > 0.0:
		var o := ShaderMaterial.new()
		o.shader = OUTLINE
		o.set_shader_parameter("width", outline_width)
		m.next_pass = o
	return m

static func _tint_for(name: String, tint: Dictionary):
	for prefix in tint:
		if name.begins_with(prefix): return tint[prefix]
	return null
