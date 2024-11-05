import json
from scripts.render.vbo_handler import ModelVBO


def load_scene(scene, local_file_name=None, abs_file_path=None):
    if local_file_name:
        with open(f'saves/{local_file_name}.gltf') as file:
            scene_data = json.load(file)
    else:
        with open(abs_file_path) as file:
            scene_data = json.load(file)
    
    vbos = scene.vao_handler.vbo_handler.vbos
    for buffer in scene_data["buffers"]:
        obj_file = f"models/{buffer['uri']}"
        try:
            vbos[buffer["uri"][:-4]] = ModelVBO(scene.ctx, obj_file)
        except FileNotFoundError:
            print(f"Attempted to load {obj_file} for the scene, but it was not in the models folder")

    for image in scene_data["images"]:
        try:
            scene.project.texture_handler.load_texture(image['uri'][:-4], '/' + image['uri'])
        except FileNotFoundError:
            print(f"Attempted to load {image['uri']} for the scene, but it was not in the textures folder")

    scene.material_handler.materials.clear()
    for mtl in scene_data["materials"]:
        kwargs = {}
        kwargs["name"] = mtl["name"]
        if "pbrMetallicRoughness" in mtl:
            if "baseColorFactor" in mtl["pbrMetallicRoughness"]: 
                kwargs["color"] = mtl["pbrMetallicRoughness"]["baseColorFactor"][:3]
                kwargs["alpha"] = mtl["pbrMetallicRoughness"]["baseColorFactor"][3]
            
            if "metallicFactor" in mtl["pbrMetallicRoughness"]:
                kwargs["specular"] = mtl["pbrMetallicRoughness"]["metallicFactor"]
            if "roughnessFactor" in mtl["pbrMetallicRoughness"]:
                kwargs["specular_exponent"] = mtl["pbrMetallicRoughness"]["roughnessFactor"]
            
            if "baseColorTexture" in mtl["pbrMetallicRoughness"]:
                texture = mtl["pbrMetallicRoughness"]["baseColorTexture"]["index"]
                texture = scene_data["textures"][texture]["sampler"]
                texture = scene_data["images"][texture]["uri"][:-4]
                kwargs["texture"] = texture

        if "normalTexture" in mtl:
            texture = mtl["normalTexture"]["index"]
            texture = scene_data["textures"][texture]["sampler"]
            texture = scene_data["images"][texture]["uri"][:-4]
            kwargs["normal_map"] = texture

        scene.material_handler.add(**kwargs)

    scene.model_handler.models.clear()
    scene.model_handler.chunks.clear()
    scene.model_handler.batches.clear()
    for node in scene_data["nodes"]:
        kwargs = {}

        if "translation" in node:
            kwargs["position"] = node["translation"]
        if "rotation" in node:
            kwargs["rotation"] = node["rotation"]
        if "scale" in node:
            kwargs["scale"] = node["scale"]

        if "mesh" in node:
            if node["mesh"] == "cube": kwargs["vbo"] = "cube"
            else: kwargs["vbo"] = scene_data["buffers"][node["mesh"]]["uri"][:-4]

        if "material" in node:
            kwargs["material"] = scene_data["materials"][node["material"]]["name"]
        scene.model_handler.add(**kwargs)