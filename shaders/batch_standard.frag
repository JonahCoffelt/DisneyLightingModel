#version 330 core

layout (location = 0) out vec4 fragColor;


in vec2 uv;
flat in int materialID;
in vec3 normal;
in vec3 position;
in mat3 TBN;

uniform vec3 cameraPosition;


float mtlRed;


struct textArray {
    sampler2DArray array;
};

struct DirLight {
    vec3 direction;
  
    vec3 color;

    float ambient;
    float diffuse;
    float specular;
};  

struct PointLight{
    vec3 position;

    vec3 color;

    float constant;
    float linear;
    float quadratic;  

    float ambient;
    float diffuse;
    float specular;
    float radius;
};

struct Material {
    vec3 color;
    float specular;
    float specularExponent;
    float alpha;

    int hasAlbedoMap;
    //int hasSpecularMap;
    int hasNormalMap;

    vec2 albedoMap;
    //vec2 specularMap;
    vec2 normalMap;
};

uniform DirLight dirLight;

#define maxMaterials 10
uniform Material materials[maxMaterials];
uniform sampler2D materialsTexture;


vec3 CalcDirLight(DirLight light, Material mtl, vec3 normal, vec3 viewDir, vec3 albedo) {
    // Vector between the view and light vectors
    vec3 halfVector = normalize((viewDir - light.direction) / 2);
    // Lambertian Diffuse
    float diff = dot(normalize(-light.direction), normal);
    // Blinn-Phong Specular
    float specular = pow(dot(normal, halfVector), mtl.specularExponent);
    // Final result
    vec3 ambient = .1 * albedo;
    return (albedo + specular * .5) * diff + ambient;
}


uniform textArray textureArrays[5];


void main() {


    Material mtl = materials[int(materialID)];

    vec3 albedo;
    vec2 textureID;
    if (bool(mtl.hasAlbedoMap)) {
        textureID = mtl.albedoMap;
        albedo = texture(textureArrays[int(round(textureID.x))].array, vec3(uv, round(textureID.y))).rgb;
    }
    else {
        albedo = mtl.color;
    }

    vec3 normalDirection = normal;
    if (bool(mtl.hasNormalMap)) {
        textureID = mtl.normalMap;
        vec3 nomral_map_fragment = texture(textureArrays[int(round(textureID.x))].array, vec3(uv, round(textureID.y))).rgb;
        normalDirection = nomral_map_fragment * 2.0 - 1.0;
        normalDirection = normalize(TBN * normalDirection); 
    }


    vec3 viewDir = vec3(normalize(cameraPosition - position));
    vec3 light_result = CalcDirLight(dirLight, mtl, normalDirection, viewDir, albedo);
    fragColor = vec4(light_result, mtl.alpha);

    mtlRed = texture(materialsTexture, vec2(materialID * 12, 1)).r  * 255;
    fragColor.rgb += vec3(mtlRed) / 100000;
    fragColor.rgb += viewDir      / 100000;
}