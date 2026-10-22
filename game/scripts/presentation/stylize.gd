extends RefCounted
## Aplica o visual estilizado a um modelo importado do Blender (.glb):
## troca cada material por toon + contorno, mantendo a cor e a emissão originais.

const TOON := preload("res://shaders/toon.gdshader")
const OUTLINE := preload("res://shaders/outline.gdshader")

static func apply(root: Node, outline_width := 0.018) -> Array:
	var made: Array = []
	var cache := {}
	for mi in root.find_children("*", "MeshInstance3D", true, false):
		var mesh: Mesh = mi.mesh
		if mesh == null: continue
		for s in mesh.get_surface_count():
			var src = mi.get_active_material(s)
			if cache.has(src):
				mi.set_surface_override_material(s, cache[src])
				continue
			var m := ShaderMaterial.new()
			m.shader = TOON
			if src is BaseMaterial3D:
				m.set_shader_parameter("albedo", src.albedo_color)
				if src.emission_enabled: m.set_shader_parameter("emission", src.emission * src.emission_energy_multiplier)
				m.set_shader_parameter("metallic_hint", src.metallic)
			var o := ShaderMaterial.new()
			o.shader = OUTLINE
			o.set_shader_parameter("width", outline_width)
			m.next_pass = o
			cache[src] = m
			made.append(m)
			mi.set_surface_override_material(s, m)
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	return made
