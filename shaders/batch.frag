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

float schlickFresnel(float x) {
    x = clamp(1.0 - x, 0.0, 1.0);
    float x2 = x * x;
    return x2 * x2 * x;
}

float disneyDiffuse(Material mtl, vec3 normal, vec3 incident_vector, vec3 halfVector, vec3 out_vector){
    float roughness = 0.0;

    float FL = schlickFresnel(dot(normal, incident_vector));
    float FV = schlickFresnel(dot(out_vector, incident_vector));

    float Fss90 = pow(dot(incident_vector, halfVector), 2) * roughness;
    float Fd90 = 0.5 + 2.0 * Fss90;

    //float F_diffuse = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);
    //float F_diffuse = (1.0 + (Fd90 - 1.0) * FL) * (1.0 + (Fd90 - 1.0) * FV);
    float F_diffuse = 2.0 * Fss90 * (FL + FV + FL * FV * (2.0 * Fss90 - 1));
    return F_diffuse / 3.1415;
}

vec3 CalcDirLight(DirLight light, Material mtl, vec3 normal, vec3 out_vector, vec3 albedo) {
    // Vector between the view and light vectors
    vec3 incident_vector = normalize(-light.direction);
    vec3 halfVector = normalize(out_vector + incident_vector);
    // Disney Diffuse
    float diff = disneyDiffuse(mtl, normal, incident_vector, halfVector, out_vector);
    return albedo * diff;
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


    vec3 out_vector = normalize(cameraPosition - position);
    vec3 light_result = CalcDirLight(dirLight, mtl, normalize(normalDirection), out_vector, albedo);
    fragColor = vec4(light_result, mtl.alpha);

    mtlRed = texture(materialsTexture, vec2(materialID * 12, 1)).r  * 255;
    fragColor.rgb += vec3(mtlRed) / 100000;
}