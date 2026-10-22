// Contorno escuro (casca invertida) usado como next_pass do material toon.
shader_type spatial;
render_mode unshaded, cull_front, depth_draw_opaque;

uniform vec4 color : source_color = vec4(0.16, 0.09, 0.08, 1.0);
uniform float width = 0.009;

void vertex() {
	VERTEX += NORMAL * width;
}

void fragment() {
	ALBEDO = color.rgb;
}
