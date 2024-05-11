import { Scene } from '@babylonjs/core/scene';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';

const BASE_URL = import.meta.env.BASE_URL || '/';

class Renderer {
    constructor(canvas, engine, material_callback, ground_mesh_callback) {
        this.canvas = canvas;
        this.engine = engine;
        this.scenes = [
            {
                scene: new Scene(this.engine),
                background_color: new Color4(0.1, 0.1, 0.1, 1.0),
                materials: null,
                ground_subdivisions: [50, 50],
                ground_mesh: null,
                camera: null,
                ambient: new Color3(0.2, 0.2, 0.2),
                lights: [],
                models: []
            }
        ];
        this.active_scene = 0;
        this.active_light = 0;
        this.shading_alg = 'gouraud';

        this.scenes.forEach((scene, idx) => {
            scene.materials = material_callback(scene.scene);
            scene.ground_mesh = ground_mesh_callback(scene.scene, scene.ground_subdivisions);
            this['createScene' + idx](idx);
        });

        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    handleKeyDown(event) {
        let key = event.key.toUpperCase();
        let currentLight = this.scenes[this.active_scene].lights[this.active_light];
        const moveStep = 0.2;

        switch (key) {
            case 'A': currentLight.position.x -= moveStep; break; // translate negative x
            case 'D': currentLight.position.x += moveStep; break; // translate positive x
            case 'F': currentLight.position.y -= moveStep; break; // translate negative y
            case 'R': currentLight.position.y += moveStep; break; // translate positive y
            case 'W': currentLight.position.z -= moveStep; break; // translate negative z
            case 'S': currentLight.position.z += moveStep; break; // translate positive z
        }
    }

    createScene0(scene_idx) {
        let current_scene = this.scenes[scene_idx];
        let scene = current_scene.scene;
        let materials = current_scene.materials;
        let ground_mesh = current_scene.ground_mesh;

        // Set scene-wide / environment values
        scene.clearColor = current_scene.background_color;
        scene.ambientColor = current_scene.ambient;
        scene.useRightHandedSystem = true;

        // Create camera
        current_scene.camera = new UniversalCamera('camera', new Vector3(0.0, 1.8, 10.0), scene);
        current_scene.camera.setTarget(new Vector3(0.0, 1.8, 0.0));
        current_scene.camera.upVector = new Vector3(0.0, 1.0, 0.0);
        current_scene.camera.attachControl(this.canvas, true);
        current_scene.camera.fov = 35.0 * (Math.PI / 180);
        current_scene.camera.minZ = 0.1;
        current_scene.camera.maxZ = 100.0;

        // Create point light sources
        let light0 = new PointLight('light0', new Vector3(1.0, 1.0, 5.0), scene);
        light0.diffuse = new Color3(1.0, 1.0, 1.0);
        light0.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light0);

        let light1 = new PointLight('light1', new Vector3(0.0, 3.0, 0.0), scene);
        light1.diffuse = new Color3(1.0, 1.0, 1.0);
        light1.specular = new Color3(1.0, 1.0, 1.0);
        current_scene.lights.push(light1);

        // Create ground mesh
        let white_texture = RawTexture.CreateRGBTexture(new Uint8Array([255, 255, 255]), 1, 1, scene);
        let ground_heightmap = new Texture(BASE_URL + 'heightmaps/default.png', scene);
        ground_mesh.scaling = new Vector3(20.0, 1.0, 20.0);
        ground_mesh.metadata = {
            mat_color: new Color3(0.10, 0.65, 0.15),
            mat_texture: white_texture,
            mat_specular: new Color3(0.0, 0.0, 0.0),
            mat_shininess: 1,
            texture_scale: new Vector2(1.0, 1.0),
            height_scalar: 1.0,
            heightmap: ground_heightmap
        }
        ground_mesh.material = materials['ground_' + this.shading_alg];

        // Create other models
        let sphere = CreateSphere('sphere', { segments: 32 }, scene);
        sphere.position = new Vector3(1.0, 0.5, 3.0);
        sphere.metadata = {
            mat_color: new Color3(0.10, 0.35, 0.88),
            mat_texture: white_texture,
            mat_specular: new Color3(0.8, 0.8, 0.8),
            mat_shininess: 16,
            texture_scale: new Vector2(1.0, 1.0)
        }
        sphere.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(sphere);

        let box = CreateBox('box', { width: 2, height: 1, depth: 1 }, scene);
        box.position = new Vector3(-1.0, 0.5, 2.0);
        box.metadata = {
            mat_color: new Color3(0.75, 0.15, 0.05),
            mat_texture: white_texture,
            mat_specular: new Color3(0.4, 0.4, 0.4),
            mat_shininess: 4,
            texture_scale: new Vector2(1.0, 1.0)
        }
        box.material = materials['illum_' + this.shading_alg];
        current_scene.models.push(box);


        // Animation function - called before each frame gets rendered
        scene.onBeforeRenderObservable.add(() => {
            // update models and lights here (if needed)
            // ...

            // update uniforms in shader programs
            this.updateShaderUniforms(scene_idx, materials['illum_' + this.shading_alg]);
            this.updateShaderUniforms(scene_idx, materials['ground_' + this.shading_alg]);
        });
    }
    

    //TODO: Write a createScene1, createScene2, createScene3
    createScene1(scene_idx) {
        let scene = new Scene(this.engine);
        let camera = new UniversalCamera("Camera", new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);
    
        let light = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        light.intensity = 0.7;
    
        let sphere = Mesh.CreateSphere("sphere1", 16, 2, scene);
        sphere.position.y = 1;
    
        let ground = Mesh.CreateGround("ground1", 6, 6, 2, scene);
    
        this.scenes[scene_idx] = { scene: scene, camera: camera, lights: [light], models: [sphere, ground] };
    }

    createScene2(scene_idx) {
        let scene = new Scene(this.engine);
        let camera = new UniversalCamera('Camera', new Vector3(-10, 2, 0), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);
    
        let movingLight = new PointLight('movingLight', new Vector3(0, 2, -10), scene);
        movingLight.diffuse = new Color3(0.95, 0.42, 0.11);
        movingLight.specular = new Color3(0.5, 0.5, 0.5);
    
        scene.onBeforeRenderObservable.add(() => {
            movingLight.position.x = 10 * Math.sin(this.engine.getDeltaTime() / 1000);
            movingLight.position.y = 5 + 2 * Math.cos(this.engine.getDeltaTime() / 1000);
        });
    
        let movingSphere = Mesh.CreateSphere('movingSphere', 32, 2, scene);
        movingSphere.position = new Vector3(3, 1, 2);
    
        scene.onBeforeRenderObservable.add(() => {
            movingSphere.position.x = 5 * Math.cos(this.engine.getDeltaTime() / 1000);
            movingSphere.position.z = 5 * Math.sin(this.engine.getDeltaTime() / 1000);
        });
    
        this.scenes[scene_idx] = { scene: scene, camera: camera, lights: [movingLight], models: [movingSphere] };
    }

    createScene3(scene_idx) {
        let scene = new Scene(this.engine);
        let camera = new UniversalCamera('Camera', new Vector3(0, 5, -15), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);
    
        let light2 = new PointLight('light2', new Vector3(5, 10, -10), scene);
        light2.diffuse = new Color3(0.4, 0.6, 0.9);
        let light3 = new PointLight('light3', new Vector3(-5, -10, 10), scene);
        light3.diffuse = new Color3(0.9, 0.6, 0.4);
    
        let texturedGround = Mesh.CreateGround('texturedGround', 10, 10, 2, scene);
        let texturedSphere = Mesh.CreateSphere('texturedSphere', 32, 3, scene);
        texturedSphere.position.y = 2;
    
        this.scenes[scene_idx] = { scene: scene, camera: camera, lights: [light2, light3], models: [texturedGround, texturedSphere] };
    }
    updateShaderUniforms(scene_idx, shader) {
        let current_scene = this.scenes[scene_idx];
        shader.setVector3('camera_position', current_scene.camera.position);
        shader.setColor3('ambient', current_scene.scene.ambientColor);
        shader.setInt('num_lights', current_scene.lights.length);
        let light_positions = [];
        let light_colors = [];
        current_scene.lights.forEach((light) => {
            light_positions.push(light.position.x, light.position.y, light.position.z);
            light_colors.push(light.diffuse);
        });
        shader.setArray3('light_positions', light_positions);
        shader.setColor3Array('light_colors', light_colors);
    }

    getActiveScene() {
        return this.scenes[this.active_scene].scene;
    }

    setActiveScene(idx) {
        this.active_scene = idx;
    }

    setShadingAlgorithm(algorithm) {
        this.shading_alg = algorithm;

        this.scenes.forEach((scene) => {
            let materials = scene.materials;
            let ground_mesh = scene.ground_mesh;

            ground_mesh.material = materials['ground_' + this.shading_alg];
            scene.models.forEach((model) => {
                model.material = materials['illum_' + this.shading_alg];
            });
        });
    }

    setHeightScale(scale) {
        this.scenes.forEach((scene) => {
            let ground_mesh = scene.ground_mesh;
            ground_mesh.metadata.height_scalar = scale;
        });
    }

    setActiveLight(idx) {
        console.log(idx);
        this.active_light = idx;
    }
}

export { Renderer }
