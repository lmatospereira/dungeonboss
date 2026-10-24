// Sombreamento estilizado dos personagens (direção de arte próxima a jogos de RPG mobile em 3D):
// luz suave envolvente, cor mais viva, brilho de borda quente e contorno discreto (no outline.gdshader).
// A cor vem do material original do Blender (albedo); emissão é mantida para olhos e brilhos.
shader_type spatial;
render_mode diffuse_lambert_wrap, specular_schlick_ggx;

uniform vec4 albedo : source_color = vec4(1.0);
uniform vec3 emission : source_color = vec3(0.0);
uniform float saturation = 1.12;
uniform float rim_strength = 0.22;
uniform vec4 rim_color : source_color = vec4(1.0, 0.9, 0.75, 1.0);
uniform float metallic_hint = 0.0;
uniform float flash = 0.0;        // 0..1: piscada branca ao levar dano

vec3 saturate_color(vec3 c, float s) {
	float l = dot(c, vec3(0.299, 0.587, 0.114));
	return mix(vec3(l), c, s);
}

void fragment() {
	vec3 base = saturate_color(albedo.rgb, saturation);
	base *= mix(1.0, 0.8, metallic_hint);
	ALBEDO = mix(base, vec3(1.0), flash);
	ROUGHNESS = mix(0.8, 0.4, metallic_hint);
	METALLIC = metallic_hint * 0.35;
	SPECULAR = mix(0.2, 0.45, metallic_hint);
	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	EMISSION = emission + rim_color.rgb * rim * rim_strength + vec3(flash * 0.6);
}

void light() {
	// luz envolvente: sombras macias, sem faixas duras
	float wrap = 0.35;
	float d = clamp((dot(NORMAL, LIGHT) + wrap) / (1.0 + wrap), 0.0, 1.0);
	DIFFUSE_LIGHT += d * ATTENUATION * LIGHT_COLOR / PI;
	vec3 h = normalize(LIGHT + VIEW);
	float spec = pow(clamp(dot(NORMAL, h), 0.0, 1.0), mix(18.0, 40.0, metallic_hint)) * mix(0.12, 0.32, metallic_hint);
	SPECULAR_LIGHT += spec * ATTENUATION * LIGHT_COLOR;
}
