GLM-4V 系列
GLM-4V 在不牺牲任何 NLP 任务性能的情况下，实现了视觉语言特征的深度融合；支持视觉问答、图像字幕、视觉定位、复杂目标检测等各类图像/视频理解任务。

模型编码：glm-4v-plus-0111 、glm-4v-flash；
了解 GLM-4V 系列模型差异，选择最适合你的的大模型；
查看 产品价格 ,大规模处理图像数据，推荐使用 Batch API，更有 5 折扣优惠；
欢迎在 体验中心 体验 GLM-4V-Plus-0111 模型的强大能力；
查看模型 速率限制；
查看您的 API Key；
同步调用
接口请求
类型 说明
传输方式 https
请求地址 https://open.bigmodel.cn/api/paas/v4/chat/completions
调用方式 同步调用，等待模型执行完成并返回最终结果或 SSE 调用
字符编码 UTF-8
接口请求格式 JSON
响应格式 JSON 或标准 Stream Event
接口请求类型 POST
开发语言 任意可发起 http 请求的开发语言
请求参数
参数名称 类型 必填 参数说明
model String 是 调用的模型编码。 模型编码：glm-4v-plus-0111 、glm-4v、glm-4v-flash(免费)
GLM-4V-Plus-0111:具备卓越的多模态理解能力，可同时处理最多 5 张图像，并支持视频内容理解（视频大小 ＜ 200M ），适用于复杂的多媒体分析场景。
GLM-4V-Flash（免费）: 专注于高效的单一图像理解，适用于图像解析的场景，例如实时图像分析或批量图像处理。
messages List<Object> 是 调用语言模型时，将当前对话信息列表作为提示输入给模型， 按照 json 数组形式进行传参。比如，
视频理解参数：{ "role": "user", "content": [ { "type": "video_url", "video_url": { "url" : "https://xxx/xx.mp4" } }, { "type": "text", "text": "请仔细描述这个视频" } ] }
图片理解参数：{ "role": "user", "content": [ { "type": "image_url", "image_url": { "url" : "https://xxx/xx.jpg" } }, { "type": "text", "text": "解释一下图中的现象" } ] }
可能的消息类型包括 User message、Assistant message。见下方 message 消息字段说明。
request_id String 否 由用户端传参，需保证唯一性；用于区分每次请求的唯一标识，用户端不传时平台会默认生成。
do_sample Boolean 否 do_sample 为 true 时启用采样策略，do_sample 为 false 时采样策略 temperature、top_p 将不生效
stream Boolean 否 使用同步调用时，此参数应当设置为 Fasle 或者省略。表示模型生成完所有内容后一次性返回所有内容。如果设置为 True，模型将通过标准 Event Stream ，逐块返回模型生成内容。Event Stream 结束时会返回一条 data: [DONE]消息。
temperature Float 否 采样温度，控制输出的随机性，必须为正数 取值范围是：[0.0,1.0]， 默认值为 0.8，值越大，会使输出更随机，更具创造性；值越小，输出会更加稳定或确定 建议您根据应用场景调整 top_p 或 temperature 参数，但不要同时调整两个参数
top_p Float 否 用温度取样的另一种方法，称为核取样 取值范围是：[0.0, 1.0]，默认值为 0.6 模型考虑具有 top_p 概率质量 tokens 的结果 例如：0.1 意味着模型解码器只考虑从前 10% 的概率的候选集中取 tokens 建议您根据应用场景调整 top_p 或 temperature 参数，但不要同时调整两个参数
max_tokens Integer 否 模型最大输出 tokens
user_id String 否 终端用户的唯一 ID，协助平台对终端用户的违规行为、生成违法及不良信息或其他滥用行为进行干预。ID 长度要求：最少 6 个字符，最多 128 个字符。 了解更多
Messages 格式
模型可接受的消息类型包括 User message、Assistant message ，不同的消息类型格式有所差异。具体如下：

User message
参数名称 类型 必填 参数说明
role String 是 消息的角色信息，此时应为 user
content List<Object> 是 消息内容。
 type String 是 文本类型：text
图片类型：image_url
视频类型：video_url
视频和图片类型不能同时输入
 text String 是 type 是 text 时补充
 image_url Object 是 type 是 image_url 时补充
  url String 是 图片 url 或者 base64 编码。
图像大小上传限制为每张图像 5M 以下，且像素不超过 6000\*6000。
支持 jpg、png、jpeg 格式。
说明： GLM-4V-Flash 不支持 base64 编码
 video_url Object 是 type 是 video_url 时补充，仅 glm-4v-plus 支持视频输入
视频理解时，video_url 参数必须在第一个。
  url String 是 视频 url 地址。
GLM-4V-Plus 视频大小限制为 20M 以内，视频时长不超过 30s。
GLM-4V-Plus-0111 视频大小限制为 200M 以内。
视频类型： mp4 。
Assistant message
参数名称 类型 必填 参数说明
role String 是 消息的角色信息，此时应为 assistant
content String 是 消息内容
响应参数
参数名称 类型 参数说明
id String 任务 ID
created Long 请求创建时间，是以秒为单位的 Unix 时间戳。
model String 模型名称
choices List 当前对话的模型输出内容
 index Integer 结果下标
 finish_reason String 模型推理终止的原因。
stop 代表推理自然结束或触发停止词。
length 代表到达 tokens 长度上限。
sensitive 代表模型推理内容被安全审核接口拦截。
network_error 代表模型推理异常。
 message Object 模型返回的文本信息
  role String 当前对话的角色，目前默认为 assistant（模型）
  content List 当前对话的内容
usage Object 结束时返回本次模型调用的 tokens 数量统计
 prompt_tokens Integer 用户输入的 tokens 数量
 completion_tokens Integer 模型输出的 tokens 数量
 total_tokens Integer 总 tokens 数量
content_filter List 返回内容安全的相关信息
 role String 安全生效环节，包括
role = assistant 模型推理，
role = user 用户输入，
role = history 历史上下文
 level Integer 严重程度 level 0-3，level 0 表示最严重，3 表示轻微
请求示例
上传视频 URL #视频理解示例、上传视频 URL
from zhipuai import ZhipuAI

client = ZhipuAI(api_key="YOUR API KEY") # 填写您自己的 APIKey
response = client.chat.completions.create(
model="glm-4v-plus-0111", # 填写需要调用的模型名称
messages=[
{
"role": "user",
"content": [
{
"type": "video_url",
"video_url": {
"url" : "https://sfile.chatglm.cn/testpath/video/xxxxx.mp4"
}
},
{
"type": "text",
"text": "请仔细描述这个视频"
}
]
}
]
)
print(response.choices[0].message)
上传图片 URL
from zhipuai import ZhipuAI
client = ZhipuAI(api_key="") # 填写您自己的 APIKey
response = client.chat.completions.create(
model="glm-4v-plus-0111", # 填写需要调用的模型名称
messages=[
{
"role": "user",
"content": [
{
"type": "text",
"text": "图里有什么"
},
{
"type": "image_url",
"image_url": {
"url" : "https://img1.baidu.com/it/u=1369931113,3388870256&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1703696400&t=f3028c7a1dca43a080aeb8239f09cc2f"
}
}
]
}
]
)
print(response.choices[0].message)
上传图片 Base64
import base64
from zhipuai import ZhipuAI

img_path = "/Users/YourCompluter/xxxx.jpeg"
with open(img_path, 'rb') as img_file:
img_base = base64.b64encode(img_file.read()).decode('utf-8')

client = ZhipuAI(api_key="YOUR API KEY") # 填写您自己的 APIKey
response = client.chat.completions.create(
model="glm-4v-plus-0111", # 填写需要调用的模型名称
messages=[
{
"role": "user",
"content": [
{
"type": "image_url",
"image_url": {
"url": img_base
}
},
{
"type": "text",
"text": "请描述这个图片"
}
]
}
]
)
print(response.choices[0].message)
多轮图片对话
from zhipuai import ZhipuAI

client = ZhipuAI(api_key="YOUR API KEY") # 填写您自己的 APIKey
response = client.chat.completions.create(
model="glm-4v-plus-0111", # 填写需要调用的模型名称
messages=[
{
"content": [
{
"image_url": {
"url": "https://cdn.bigmodel.cn/xxxxxx.png"
},
"type": "image_url"
},
{
"text": "图中有什么",
"type": "text"
}
],
"role": "user"
},
{
"content": [
{
"text": "这是一幅描绘自然风景的画，展现了一片宁静的湖泊，湖水呈现出深浅不一的蓝绿色调。湖边长着一棵盛开的樱花树，粉白色的花朵在阳光下显得格外鲜艳。树下有一位身穿蓝色衣服的人坐在船上，似乎正在享受这美好的时光。\n\n 背景是连绵起伏的山脉，山体被绿色的植被覆盖，山顶则被云雾缭绕，增添了几分神秘感。远处还可以看到一座小亭子，它坐落在湖边的岩石上，与周围的自然环境和谐相融。\n\n 整个画面给人一种宁静、和谐的感觉，仿佛置身于一个世外桃源之中。",
"type": "text"
}
],
"role": "assistant"
},
{
"content": [
{
"image_url": {
"url": "https://cdn.bigmodel.cn/xxxxxxx.jpeg"
},
"type": "image_url"
},
{
"text": "这个图与上面图有什么不一样",
"type": "text"
}
],
"role": "user"
},
{
"content": [
{
"text": "第一张图和第二张图在画面内容、构图、色彩等方面都有很大的不同，形成鲜明的对比。\n\n1.第一张图是风景画，主要描绘了自然风景，如樱花树、湖泊、山脉等，色彩丰富，充满春天的气息，而第二张图是描绘长城在冬季的风景照片，长城在白雪覆盖的山脉中蜿蜒盘旋，整体色调偏冷，给人一种寒冷、宁静的感觉。\n\n2.构图上，第一张图采用对称式构图，以樱花树为中心，两侧的景物相互呼应，形成平衡和谐的画面效果，第二张图则采用对角线构图，长城作为视觉引导线，引导观众的视线穿越整个画面，增加画面的深度和动态感。\n\n 整体来看，这两张图在画面内容、色彩、构图和氛围上都呈现出明显的对比，一张是充满生机和色彩的春日风景画，另一张是宁静而神秘的冬日长城风景照。",
"type": "text"
}
],
"role": "assistant"
},
{
"content": [
{
"image_url": {
"url": "https://cdn.bigmodel.cn/xxxxxxx.jpeg"
},
"type": "image_url"
},
{
"text": "这个图与上一张图有什么区别",
"type": "text"
}
],
"role": "user"
}
]
)
print(response.choices[0].message)
响应示例
{
"created": 1703487403,
"id": "8239375684858666781",
"model": "glm-4v-plus-0111",
"request_id": "8239375684858666781",
"choices": [
{
"finish_reason": "stop",
"index": 0,
"message": {
"content": "图中有一片蓝色的海和蓝天，天空中有白色的云朵。图片的右下角有一个小岛或者岩石，上面长着深绿色的树木。",
"role": "assistant"
}
}
],
"usage": {
"completion_tokens": 37,
"prompt_tokens": 1037,
"total_tokens": 1074
}
}
流式输出
响应参数
参数名称 类型 参数说明
id String 任务 ID
created Long 请求创建时间，是以秒为单位的 Unix 时间戳。
choices List 当前对话的模型输出内容
 index Integer 结果下标
 finish_reason String 模型推理终止的原因。
stop 代表推理自然结束或触发停止词。
length 代表到达 tokens 长度上限。
sensitive 代表模型推理内容被安全审核接口拦截。
network_error 代表模型推理异常。
 delta Object 模型增量返回的文本信息
  role String 当前对话的角色，目前默认为 assistant（模型）
  content String 当前对话的内容
usage Object 本次模型调用的 tokens 数量统计
 prompt_tokens Integer 用户输入的 tokens 数量
 completion_tokens Integer 模型输出的 tokens 数量
 total_tokens Integer 总 tokens 数量
content_filter List 返回内容安全的相关信息
 role String 安全生效环节，包括
role = assistant 模型推理，
role = user 用户输入，
role = history 历史上下文
 level Integer 严重程度 level 0-3，level 0 表示最严重，3 表示轻微
请求示例
from zhipuai import ZhipuAI
client = ZhipuAI(api_key="") # 请填写您自己的 APIKey
response = client.chat.completions.create(
model="glm-4v-plus-0111", # 填写需要调用的模型名称
messages=[
{
"role": "user",
"content": [
{
"type": "image_url",
"image_url": {
"url" : "sfile.chatglm.cn/testpath/xxxx.jpg"
}
},
{
"type": "text",
"text": "图里有什么"
}
]
},
],
stream=True,
)
for chunk in response:
print(chunk.choices[0].delta)
响应示例
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"delta":{"role":"assistant","content":"下"}}]}
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"delta":{"role":"assistant","content":"角"}}]}
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"delta":{"role":"assistant","content":"有一个"}}]}
... ...
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"delta":{"role":"assistant","content":"树木"}}]}
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"delta":{"role":"assistant","content":"。"}}]}
data: {"id":"8305986882425703351","created":1705476637,"model":"glm-4v-plus-0111","choices":[{"index":0,"finish_reason":"stop","delta":{"role":"assistant","content":""}}],"usage":{"prompt_tokens":1037,"completion_tokens":37,"total_tokens":1074}}
