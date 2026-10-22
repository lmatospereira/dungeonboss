// Sombreamento estilizado dos personagens: faixas de luz (cel), brilho de borda e realce de cor.
// A cor vem do material original do Blender (albedo); emissão é mantida para olhos e brilhos.
shader_type spatial;
render_mode diffuse_toon, specular_toon;

uniform vec4 albedo : source_color = vec4(1.0);
uniform vec3 emission : source_color = vec3(0.0);
uniform float rim_strength = 0.18;
uniform vec4 rim_color : source_color = vec4(1.0, 0.92, 0.8, 1.0);
uniform float metallic_hint = 0.0;
uniform float flash = 0.0;        // 0..1: piscada branca ao levar dano

void fragment() {
	ALBEDO = mix(albedo.rgb, vec3(1.0), flash);
	ALBEDO *= mix(1.0, 0.75, metallic_hint);   // metal um pouco mais escuro: o brilho vem do especular
	ROUGHNESS = mix(0.9, 0.55, metallic_hint);
	SPECULAR = mix(0.15, 0.4, metallic_hint);
	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	EMISSION = emission + rim_color.rgb * rim * rim_strength + vec3(flash * 0.6);
}
