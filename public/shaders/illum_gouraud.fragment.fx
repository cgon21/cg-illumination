#version 300 es
precision mediump float;

// Input
in vec2 model_uv;
in vec3 diffuse_illum;
in vec3 specular_illum;

// Uniforms
// material
uniform vec3 mat_color;
uniform vec3 mat_specular;
uniform sampler2D mat_texture;
// light from environment
uniform vec3 ambient; // Ia

// Output
out vec4 FragColor;

void main() {
    vec3 model_color = mat_color * texture(mat_texture, model_uv).rgb;
    vec4 ambient_illumination = vec4(ambient * model_color, 1.0);
    vec4 diffuse_illumination = vec4(diffuse_illum * model_color, 1.0);
    vec4 specular_illumination = vec4(specular_illum * mat_specular, 1.0);

    // Color
    FragColor = min(vec4(1.0, 1.0, 1.0, 1.0), ambient_illumination + diffuse_illumination + specular_illumination);
}
