#version 300 es
precision mediump float;

// Input
in vec3 model_position;
in vec3 model_normal;
in vec2 model_uv;

// Uniforms
// material
uniform vec3 mat_color;
uniform vec3 mat_specular;
uniform float mat_shininess;
uniform sampler2D mat_texture;
// camera
uniform vec3 camera_position;
// lights
uniform vec3 ambient; // Ia
uniform int num_lights;
uniform vec3 light_positions[8];
uniform vec3 light_colors[8]; // Ip

// Output
out vec4 FragColor;

void main() {
    vec3 L = normalize(light_positions[0] - model_position); 
    vec3 N = normalize(model_normal);
    float N_cross_L = max(dot(N, L), 0.0);
    vec3 R = normalize((2.0 * N_cross_L * N) - L);

    vec3 normalizedViewDir = normalize(camera_position - model_position);
    vec3 color = mat_color * texture(mat_texture, model_uv).rgb;

    vec3 ambient_light = max(ambient, vec3(0.0)); 
    vec3 diffuse_light = max(light_colors[0] * N_cross_L, vec3(0.0)); 
    vec3 specular_light = max(light_colors[0] * pow(dot(R, normalizedViewDir), mat_shininess), vec3(0.0));
    vec3 combined_light = (ambient_light * color) + (diffuse_light * color) + (specular_light * mat_specular);
    FragColor = vec4(combined_light, 1.0);
}
