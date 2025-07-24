#!/bin/bash
# 该脚本用于根据 my-icon.jpg 生成不同尺寸和用途的 PNG 图标文件

# 生成 1024x1024 的主图标
sips -s format png -z 1024 1024 elderdiet-frontend/assets/images/my-icon.jpg --out elderdiet-frontend/assets/images/my-icon.png

# 生成 1024x1024 的自适应图标
sips -s format png -z 1024 1024 elderdiet-frontend/assets/images/my-icon.jpg --out elderdiet-frontend/assets/images/my-adaptive-icon.png

# 生成 1024x1024 的启动页图标
sips -s format png -z 1024 1024 elderdiet-frontend/assets/images/my-icon.jpg --out elderdiet-frontend/assets/images/my-splash-icon.png

# 生成 48x48 的 favicon 图标
sips -s format png -z 48 48 elderdiet-frontend/assets/images/my-icon.jpg --out elderdiet-frontend/assets/images/my-favicon.png