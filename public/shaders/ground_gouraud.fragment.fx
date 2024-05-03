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
    vec3 model_color = mat_color * texture(mat_texture, model_uv).rgb;  // taking texture (samples it, so get color of 1 pixel). 2nd parameter is UV coordinate. Sampling texture and multiplying by color
                    //model_color is illumination equations
    // Color
    FragColor = vec4(model_color, 1.0);
}
