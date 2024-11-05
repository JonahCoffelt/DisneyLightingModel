from scripts.camera import *
from scripts.model_handler import ModelHandler
from scripts.render.material_handler import MaterialHandler
from scripts.render.light_handler import LightHandler
from scripts.render.sky import Sky
from scripts.file_manager.save_scene import save_scene
from scripts.file_manager.load_scene import load_scene
from math import cos, sin
import moderngl as mgl

class Scene:
    def __init__(self, engine, project) -> None:
        """
        Contains all data for scene
        """

        # Stores the engine, project, and ctx
        self.engine = engine
        self.project = project
        self.ctx = self.engine.ctx

        # Makes a free cam
        self.camera = Camera(self.engine, position=(0, 0, 5))

        # Gets handlers from parent project
        self.vao_handler = self.project.vao_handler
        # model handler
        self.sky = Sky(self)
        self.material_handler = MaterialHandler(self)
        self.model_handler = ModelHandler(self)
        self.light_handler = LightHandler(self)
        self.time = 0
        
        load_scene(self, "lighting_test")

        self.model_handler.add(vbo="sphere", position=(-8, 0, 0))
        self.model_handler.add(vbo="sphere", position=(-4, 0, 0), material="normal_test")
                        
    def use(self, camera=True):
        """
        Updates project handlers to use this scene
        """

        self.vao_handler.shader_handler.set_camera(self.camera)
        if camera: self.camera.use()
        self.vao_handler.generate_framebuffer()
        self.vao_handler.shader_handler.write_all_uniforms()
        self.project.texture_handler.write_textures()
        self.project.texture_handler.write_textures('batch')
        self.light_handler.write('batch')
        self.material_handler.write('batch')

    def update(self, camera=True):
        """
        Updates uniforms, and camera
        """

        self.time += self.engine.dt * 2
        self.light_handler.dir_light.dir = glm.vec3(cos(self.time), -1, sin(self.time))
        self.light_handler.write('batch')

        self.model_handler.update()
        self.vao_handler.shader_handler.update_uniforms()
        if camera: self.camera.update()

    def render(self, display=True):
        """
        Redners all instances
        """

        self.vao_handler.framebuffer.clear(color=(0.1, 0.1, 0.1, 1.0))
        self.vao_handler.framebuffer.use()
        # self.sky.render()
        self.ctx.disable(flags=mgl.CULL_FACE)
        self.model_handler.render()

        if not display: return

        self.ctx.screen.use()
        self.vao_handler.shader_handler.programs['frame']['screenTexture'] = 0
        self.vao_handler.frame_texture.use(location=0)
        self.vao_handler.vaos['frame'].render()

    def release(self):
        """
        Releases scene's VAOs
        """

        self.vao_handler.release()