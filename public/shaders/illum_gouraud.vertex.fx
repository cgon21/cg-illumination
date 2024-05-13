#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec3 normal;
in vec2 uv; 

// Uniforms
// projection 3D to 2D
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
// material
uniform vec2 texture_scale;
uniform float mat_shininess; // n
// camera
uniform vec3 camera_position;
// lights
uniform int num_lights;
uniform vec3 light_positions[8];
uniform vec3 light_colors[8]; // Ip

// Output
out vec2 model_uv;
out vec3 diffuse_illum;
out vec3 specular_illum;

void main() {
    vec3 new_position = vec3(world * vec4(position, 1.0));
    vec3 modelNormal = inverse(transpose(mat3(world))) * normal;

    for (int i = 0; i < num_lights; i++) {
        vec3 lightDir = normalize(light_positions[i] - new_position);
        vec3 N = normalize(modelNormal);
        vec3 L = normalize(lightDir);
        vec3 diffuse = (light_colors[i] * max(dot(N, L), 0.0));
        diffuse_illum += diffuse;
        vec3 R = normalize(2.0 * dot(N, L) * N - L);
        vec3 V = normalize(camera_position - new_position);
        vec3 specular = (light_colors[i] * pow(max(dot(R, V), 0.0), mat_shininess));
        specular_illum += specular;
    }

    // Pass vertex texcoord onto the fragment shader
    model_uv = uv * texture_scale;

    // Transform and project vertex from 3D world-space to 2D screen-space
    gl_Position = projection * view * world * vec4(position, 1.0);
}
