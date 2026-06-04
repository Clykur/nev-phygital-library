import re

with open("src/components/layout/StudentAppShell.tsx", "r") as f:
    content = f.read()

with open("scratch_hub_shell.tsx", "r") as f:
    hub_shell_code = f.read()

# Replace the whole HubAppShell function
pattern = re.compile(r"function HubAppShell\(\{ children \}: \{ children: ReactNode \}\) \{.*?\n\}\n", re.DOTALL)
content = pattern.sub(hub_shell_code, content)

with open("src/components/layout/StudentAppShell.tsx", "w") as f:
    f.write(content)
