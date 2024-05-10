#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec2 uv;

// Uniforms
// projection 3D to 2D
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
// height displacement
uniform vec2 ground_size;
uniform float height_scalar;
uniform sampler2D heightmap;
// material
uniform vec2 texture_scale;

// Output
out vec3 model_position;
out vec3 model_normal;
out vec2 model_uv;

void main() {
     // Get initial position of vertex (prior to height displacement)
    vec4 world_pos = world * vec4(position, 1.0);
    
    // Fetch the height from the heightmap at this vertex's UV coordinates
    float heightValue = texture(heightmap, uv).r;
    float displacement = 2.0 * height_scalar * (heightValue - 0.5);
    
    // Apply displacement along the y-axis
    vec3 displacedPosition = position;
    displacedPosition.y += displacement;

    // Calculate new position in world space
    world_pos = world * vec4(displacedPosition, 1.0);
    
    // Calculate nearby points for normal vector calculation
    vec3 neighbor1_pos = position;
    neighbor1_pos.x += 0.01;  // Small offset to the right
    float neighbor1_height = texture(heightmap, uv + vec2(0.01, 0.0)).r;
    neighbor1_pos.y += 2.0 * height_scalar * (neighbor1_height - 0.5);

    vec3 neighbor2_pos = position;
    neighbor2_pos.z += 0.01;  // Small offset upwards in UV space
    float neighbor2_height = texture(heightmap, uv + vec2(0.0, 0.01)).r;
    neighbor2_pos.y += 2.0 * height_scalar * (neighbor2_height - 0.5);

    // Calculate tangent and bitangent
    vec3 tangent = neighbor1_pos - position;
    vec3 bitangent = neighbor2_pos - position;

    // Compute the normal using the cross product and normalize
    vec3 normalVector = normalize(cross(tangent, bitangent));

    // Transform the normal to world space
    model_normal = normalize(mat3(world) * normalVector);

    // Pass vertex position onto the fragment shader
    model_position = world_pos.xyz;

    // Pass vertex normal onto the fragment shader
    model_normal = vec3(0.0, 1.0, 0.0);

    // Pass updated vertex texcoord onto the fragment shader
    model_uv = uv * texture_scale;

    // Transform and project vertex from 3D world-space to 2D screen-space
    gl_Position = projection * view * world_pos;
}
