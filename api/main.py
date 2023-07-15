from fastapi import FastAPI
from gradio_client import Client
from pydantic import BaseModel

client = Client("https://longlian-llm-grounded-diffusion.hf.space/")

app = FastAPI()

@app.get("/api/python/helloworld")
def hello_world():
    return {"message": "Hello World"}

@app.get("/api/python/hello")
async def hello():
    return {"message": "Hello"}

@app.get("/api/python/hello")
async def hello():
    return {"message": "Hello"}

class groundedDiffusionStep1Input(BaseModel):
    prompt: str

@app.post('/api/python/llm-grounded-diffusion-step-1')
async def llm_grounded_diffusion_step_1(groundedDiffusionStep1Input: groundedDiffusionStep1Input):
    result = client.predict(
				groundedDiffusionStep1Input.prompt,	# str  in 'Prompt for Layout Generation' Textbox component
				"""You are an intelligent bounding box generator. I will provide you with a caption for a photo, image, or painting. Your task is to generate the bounding boxes for the objects mentioned in the caption, along with a background prompt describing the scene. The images are of size 512x512, and the bounding boxes should not overlap or go beyond the image boundaries. Each bounding box should be in the format of (object name, [top-left x coordinate, top-left y coordinate, box width, box height]) and include exactly one object. Make the boxes larger if possible. Do not put objects that are already provided in the bounding boxes into the background prompt. If needed, you can make reasonable guesses. Generate the object descriptions and background prompts in English even if the caption might not be in English. Do not include non-existing or excluded objects in the background prompt. Please refer to the example below for the desired format.

                Caption: A realistic image of landscape scene depicting a green car parking on the left of a blue truck, with a red air balloon and a bird in the sky
                Objects: [('a green car', [21, 181, 211, 159]), ('a blue truck', [269, 181, 209, 160]), ('a red air balloon', [66, 8, 145, 135]), ('a bird', [296, 42, 143, 100])]
                Background prompt: A realistic image of a landscape scene

                Caption: A watercolor painting of a wooden table in the living room with an apple on it
                Objects: [('a wooden table', [65, 243, 344, 206]), ('a apple', [206, 306, 81, 69])]
                Background prompt: A watercolor painting of a living room

                Caption: A watercolor painting of two pandas eating bamboo in a forest
                Objects: [('a panda eating bambooo', [30, 171, 212, 226]), ('a panda eating bambooo', [264, 173, 222, 221])]
                Background prompt: A watercolor painting of a forest

                Caption: A realistic image of four skiers standing in a line on the snow near a palm tree
                Objects: [('a skier', [5, 152, 139, 168]), ('a skier', [278, 192, 121, 158]), ('a skier', [148, 173, 124, 155]), ('a palm tree', [404, 180, 103, 180])]
                Background prompt: A realistic image of an outdoor scene with snow

                Caption: An oil painting of a pink dolphin jumping on the left of a steam boat on the sea
                Objects: [('a steam boat', [232, 225, 257, 149]), ('a jumping pink dolphin', [21, 249, 189, 123])]
                Background prompt: An oil painting of the sea

                Caption: A realistic image of a cat playing with a dog in a park with flowers
                Objects: [('a playful cat', [51, 67, 271, 324]), ('a playful dog', [302, 119, 211, 228])]
                Background prompt: A realistic image of a park with flowers

                Caption: 一个客厅场景的油画，墙上挂着电视，电视下面是一个柜子，柜子上有一个花瓶。
                Objects: [('a tv', [88, 85, 335, 203]), ('a cabinet', [57, 308, 404, 201]), ('a flower vase', [166, 222, 92, 108])]
                Background prompt: An oil painting of a living room scene""",	# str  in 'Custom Template' Textbox component

				api_name="/get_lmd_prompt"
    )
    print(result)
    return {result}