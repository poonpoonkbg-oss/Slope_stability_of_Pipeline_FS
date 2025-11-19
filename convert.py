import os
import json
import re

base_path = "PTT_PICTURE"
result = []

pattern = r"([A-Za-z0-9]+)_(DRY|RAPID|WET)_(\d+)_([0-9]+m)\.png"

for zone in os.listdir(base_path):
    zone_path = os.path.join(base_path, zone)
    if not os.path.isdir(zone_path):
        continue

    for subfolder in os.listdir(zone_path):
        sub_path = os.path.join(zone_path, subfolder)
        if not os.path.isdir(sub_path):
            continue

        for file in os.listdir(sub_path):
            if file.endswith(".png"):
                match = re.match(pattern, file)
                if match:
                    zone_name = match.group(1)
                    water = match.group(2)
                    degree = int(match.group(3))
                    depth = match.group(4)

                    file_path = f"{base_path}\\{zone}\\{subfolder}/{file}"

                    result.append({
                        "Zone": zone_name,
                        "Water": water,
                        "Degree": degree,
                        "Depth": depth,
                        "File": file_path
                    })

# ส่งออกเป็น JSON
with open("images_output.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)

print("สร้างไฟล์ images_output.json เรียบร้อยแล้ว")
