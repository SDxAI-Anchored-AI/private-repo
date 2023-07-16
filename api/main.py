from fastapi import FastAPI
from gradio_client import Client
from pydantic import BaseModel
from grounded_llm import get_response_grounded, get_response_ungrounded

client = Client("https://michaelcreatesstuff-llm-grounded-diffusion.hf.space/")

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
      
class message_details(BaseModel):
	prompt: str
	kg_sentences: str
	previous_messages: list

@app.post('/api/python/llm-ungrounded')
async def get_ungrounded_llm_response(message_details: message_details):
	# TODO update the kg_sentences and previous_messages functions
	return get_response_ungrounded(message_details.prompt)

@app.post('/api/python/llm-grounded')
async def get_grounded_llm_response(message_details: message_details):
	# TODO update the kg_sentences and previous_messages functions
	return get_response_grounded(message_details.prompt)


class diffusionStepInput(BaseModel):
    prompt: str
      
class groundedDiffusionStepInput(BaseModel):
    prompt: str
    denoisingSteps: int
    frozenStepsRatio: float

grounded_diffusion_template = """You are an intelligent bounding box generator. I will provide you with a caption for a photo, image, or painting. Your task is to generate the bounding boxes for the objects mentioned in the caption, along with a background prompt describing the scene. The images are of size 512x512, and the bounding boxes should not overlap or go beyond the image boundaries. Each bounding box should be in the format of (object name, [top-left x coordinate, top-left y coordinate, box width, box height]) and include exactly one object. Make the boxes larger if possible. Do not put objects that are already provided in the bounding boxes into the background prompt. If needed, you can make reasonable guesses. Generate the object descriptions and background prompts in English even if the caption might not be in English. Do not include non-existing or excluded objects in the background prompt. Please refer to the example below for the desired format.

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
                Background prompt: An oil painting of a living room scene"""

@app.post('/api/python/llm-grounded-diffusion-step-1')
async def llm_grounded_diffusion_step_1(diffusionStepInput: diffusionStepInput):
    result = client.predict(
				diffusionStepInput.prompt,
				grounded_diffusion_template,
				api_name="/get_lmd_prompt"
    )
    return {result}

@app.post('/api/python/llm-grounded-diffusion-visualize-layout')
async def llm_grounded_diffusion_visualize_layout(diffusionStepInput: diffusionStepInput):
    print("visualize layout prompt: ")
    print(diffusionStepInput.prompt)
    result = client.predict(
				diffusionStepInput.prompt,
				api_name="/visualize-layout"
    )
    print("llm-grounded-diffusion-visualize-layout result")
    if (len(result) == 2): 
        print(len(result[1]))
        return {result[1]}
    else:
        return "Error"

grounded_diffusion_negative_prompt = "artifacts, blurry, smooth texture, bad quality, distortions, unrealistic, distorted image, bad proportions, duplicate, two, many, group, occlusion, occluded, side, border, collate"
grounded_diffusion_negative_prompt_overall = "artifacts, blurry, smooth texture, bad quality, distortions, unrealistic, distorted image, bad proportions, duplicate"

@app.post('/api/python/llm-grounded-diffusion-layout-to-image')
async def llm_grounded_diffusion_layout_to_image(groundedDiffusionStepInput: groundedDiffusionStepInput):
    print(groundedDiffusionStepInput.prompt)
    
    result = client.predict(
				groundedDiffusionStepInput.prompt,	# str  in 'Prompt for Layout Generation' Textbox component
				"",	# str  in 'Prompt for overall generation (optional but recommended)' Textbox component
				0,	# int | float (numeric value between 0 and 10000) in 'Seed' Slider component
				groundedDiffusionStepInput.denoisingSteps or 20,	# int | float (numeric value between 1 and 250) in 'Number of denoising steps (set to >=50 for higher generation quality)' Slider component
				True,	# bool  in 'Use DPM scheduler (unchecked: DDIM scheduler, may have better coherence, recommend >=50 inference steps)' Checkbox component
				True,	# bool  in 'Use FP16 Mixed Precision (faster but with slightly lower quality)' Checkbox component
				20,	# int | float (numeric value between 0 and 10000) in 'Seed for foreground variation' Slider component
				0.1,	# int | float (numeric value between 0 and 1) in 'Variations added to foreground for single object generation (0: no variation, 1: max variation)' Slider component
				groundedDiffusionStepInput.frozenStepsRatio or 0.4,	# int | float (numeric value between 0 and 1) in 'Foreground frozen steps ratio (higher: preserve object attributes; lower: higher coherence; set to 0: (almost) equivalent to vanilla GLIGEN except details)' Slider component
				0.3,	# int | float (numeric value between 0 and 1) in 'GLIGEN guidance steps ratio (the beta value)' Slider component
				grounded_diffusion_negative_prompt,	# str  in 'Negative prompt for single object generation' Textbox component
				grounded_diffusion_negative_prompt_overall,	# str  in 'Negative prompt for overall generation' Textbox component
				True,	# bool  in 'Show annotated single object generations' Checkbox component
				True,	# bool  in 'Scale bounding boxes to just fit the scene' Checkbox component
				api_name="/layout-to-image"
    )
    print("llm-grounded-diffusion-layout-to-image result")
    if (len(result) == 2): 
        print(len(result[1]))
        return {result[1]}
    else:
        return "Error"

@app.post('/api/python/llm-grounded-diffusion-baseline')
async def llm_grounded_diffusion_layout_to_image(diffusionStepInput: diffusionStepInput):
    print(diffusionStepInput.prompt)
    result = client.predict(
				diffusionStepInput.prompt,
				0,	# int | float (numeric value between 0 and 10000) in 'Seed' Slider component
				api_name="/baseline"
    )
    print("llm-grounded-diffusion-baseline result")
    if (len(result) == 2): 
        print(len(result[1]))
        return {result[1]}
    else:
        return "Error"
