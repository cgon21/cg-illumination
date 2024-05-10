<script setup>
import { reactive, onMounted } from 'vue';

import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Effect } from '@babylonjs/core/Materials/effect';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Tools } from '@babylonjs/core/Misc/tools';

import { Renderer } from './renderer'

const BASE_URL = import.meta.env.BASE_URL || '/';

let data = reactive({
    renderer: null,
    height_scale: 1.0
});

// Create a new material for basic meshes
function createBasicMaterial(name, scene) {
    let basic_mat = new ShaderMaterial(name, scene, {vertex: name, fragment: name}, {
        attributes: ['position', 'normal', 'uv'],
        uniforms: ['world', 'view', 'projection', 'mat_color', 'mat_specular', 'mat_shininess', 'texture_scale',
                    'camera_position', 'ambient', 'num_lights', 'light_positions', 'light_colors'],
        samplers: ['mat_texture']
    });
    basic_mat.backFaceCulling = false;
    basic_mat.onBindObservable.add((mesh) => {
        const shader = basic_mat.getEffect();
        shader.setColor3('mat_color', mesh.metadata.mat_color);
        shader.setTexture('mat_texture', mesh.metadata.mat_texture);
        shader.setVector2('texture_scale', mesh.metadata.texture_scale);
        shader.setColor3('mat_specular', mesh.metadata.mat_specular);
        shader.setFloat('mat_shininess', mesh.metadata.mat_shininess);
    });
    return basic_mat;
}

// Create a new material for a mesh with a height displacement map
function createGroundMaterial(name, scene) {
    let ground_mat = new ShaderMaterial(name, scene, {vertex: name, fragment: name}, {
        attributes: ['position', 'uv'],
        uniforms: ['world', 'view', 'projection', 'mat_color', 'mat_specular', 'mat_shininess', 'ground_size',
                    'height_scalar', 'texture_scale', 'camera_position', 'ambient', 'num_lights', 'light_positions',
                    'light_colors'],
        samplers: ['mat_texture', 'heightmap']
    });
    ground_mat.backFaceCulling = false;
    ground_mat.onBindObservable.add((mesh) => {
        const shader = ground_mat.getEffect();
        shader.setColor3('mat_color', mesh.metadata.mat_color);
        shader.setTexture('mat_texture', mesh.metadata.mat_texture);
        shader.setVector2('texture_scale', mesh.metadata.texture_scale);
        shader.setColor3('mat_specular', mesh.metadata.mat_specular);
        shader.setFloat('mat_shininess', mesh.metadata.mat_shininess);
        shader.setVector2('ground_size', new Vector2(mesh.scaling.x, mesh.scaling.z));
        shader.setFloat('height_scalar', mesh.metadata.height_scalar);
        shader.setTexture('heightmap', mesh.metadata.heightmap);
    });
    return ground_mat;
}

// Create a plane mesh divided into a grid of rectangles 
function createGroundModel(name, subdivisions, scene) {
    let ground = new Mesh(name, scene);
    let vertex_positions = [];
    let vertex_texcoords = [];
    let triangle_indices = [];
    for (let j = 0; j <= subdivisions[1]; j++) {
        let v = j / subdivisions[1];
        let curr_row = j * (subdivisions[0] + 1);
        let next_row = (j + 1) * (subdivisions[0] + 1);
        for (let i = 0; i <= subdivisions[0]; i++) {
            let u = i / subdivisions[0];
            vertex_positions.push(u - 0.5, 0.0, v - 0.5);
            vertex_texcoords.push(u, v);
            if (j < subdivisions[1] && i < subdivisions[0]) {
                triangle_indices.push(curr_row + i, curr_row + i + 1, next_row + i);
                triangle_indices.push(next_row + i, curr_row + i + 1, next_row + i + 1);
            }
        }
    }

    let vertex_data = new VertexData();
    vertex_data.positions = vertex_positions;
    vertex_data.uvs = vertex_texcoords;
    vertex_data.indices = triangle_indices;
    vertex_data.applyToMesh(ground);

    return ground;
}

function changeScene(event) {
    let scene_idx = parseInt(event.target.value.substring(5));
    data.renderer.setActiveScene(scene_idx);
}

function selectShadingAlgorithm(event) {
    data.renderer.setShadingAlgorithm(event.target.value);
}

function updateHeightScale(event) {
    data.height_scale = event.target.value / 10.0
    data.renderer.setHeightScale(data.height_scale);
}

function selectLightIdx(event) {
    let light_idx = parseInt(event.target.value.substring(5));
    data.renderer.setActiveLight(light_idx);
}

onMounted(() => {
    // Get the canvas element from the DOM
    const canvas = document.getElementById('renderCanvas');
    canvas.width = 992;
    canvas.height = 558;

    // Create a WebGL 2 rendering context
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Error: Browser does not support WebGL2 Canvas');
        return;
    }

    // Associate a Babylon Render Engine to it.
    const engine = new Engine(gl);

    // Download shaders
    let shader_names = ['illum_gouraud', 'illum_phong', 'ground_gouraud', 'ground_phong']
    let shader_src = [
        Tools.LoadFileAsync(BASE_URL + 'shaders/illum_gouraud.vertex.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/illum_gouraud.fragment.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/illum_phong.vertex.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/illum_phong.fragment.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/ground_gouraud.vertex.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/ground_gouraud.fragment.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/ground_phong.vertex.fx', false),
        Tools.LoadFileAsync(BASE_URL + 'shaders/ground_phong.fragment.fx', false)
    ]
    Promise.all(shader_src).then((sources) => {
        // Load shaders
        for (let i = 0; i < shader_names.length; i++) {
            let name = shader_names[i];
            let vert_src = sources[2 * i];
            let frag_src = sources[2 * i + 1];
            Effect.ShadersStore[name + 'VertexShader'] = vert_src;
            Effect.ShadersStore[name + 'FragmentShader'] = frag_src;
        }

        // Create our Renderer
        data.renderer = new Renderer(canvas, engine, (scene) => {
            return {
                illum_gouraud: createBasicMaterial('illum_gouraud', scene),
                illum_phong: createBasicMaterial('illum_phong', scene),
                ground_gouraud: createGroundMaterial('ground_gouraud', scene),
                ground_phong: createGroundMaterial('ground_phong', scene)
            };
        }, (scene, subdivisions) => {
            return createGroundModel('ground', subdivisions, scene);
        });
    }).catch((err) => {
        console.log(err);
    })

    // Render every frame
    engine.runRenderLoop(() => {
        if (data.renderer !== null) {
            data.renderer.getActiveScene().render();
        }
    });
});
</script>

<template>
    <div id="userInterface">
        <label for="sceneSelect">Scene: </label>
        <select v-if="data.renderer !== null" id="sceneSelect" class="spaceRight" @change="changeScene">
            <option v-for="i in data.renderer.scenes.length" :value="'scene' + (i - 1)">Scene {{ i - 1 }}</option>
        </select>
        <label for="shadingAlg">Shading Algorithm: </label>
        <select id="shadingAlg" class="spaceRight" @change="selectShadingAlgorithm">
            <option value="gouraud">Gouraud</option>
            <option value="phong">Phong</option>
        </select>
        <label for="heightScale">Heightmap Scale: </label>
        <input id="heightScale" type="range" value="10" min="1" max="50" style="width: 8rem;" @input="updateHeightScale" />
        <label class="spaceRight" style="margin-left: 0.5rem;">{{ data.height_scale.toFixed(1) }}</label>
        <label for="lightIdx">Light: </label>
        <select v-if="data.renderer !== null" id="lightIdx" @change="selectLightIdx">
            <option v-for="i in data.renderer.scenes[data.renderer.active_scene].lights.length" :value="'light' + (i - 1)">Light {{ i - 1 }}</option>
        </select>
    </div>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<style scoped>
label, input, select, option {
    font-size: 1rem;
}

#userInterface {
    width: 100%;
    padding: 0.5rem 0 0.75rem 0;
}

.spaceRight {
    margin-right: 2rem;
}
</style>
