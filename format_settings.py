import json

with open("package.json") as f:
    package = json.load(f)

for name, setting in package["contributes"]["configuration"]["properties"].items():
    print(f"\n### `{name}`\n")
    print(f"Default: `{json.dumps(setting['default'])}`\n")
    print(f"{setting['description']}\n")
    print(f"```json")
    print(f'"{name}": {json.dumps(setting["default"])}')
    print(f"```")
