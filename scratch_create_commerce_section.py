import os

with open("src/pages/hub-commerce.tsx", "r") as f:
    content = f.read()

# We need to change the function name to HubCommerceSection and remove the page-specific padding and titles.
content = content.replace("export default function HubCommercePage() {", "export function HubCommerceSection() {")

# Remove topPad logic
content = content.replace("const topPad = inShell ? \"\" : \"pt-24\";", "")
content = content.replace("<div className={cn(topPad)}>", "<div className=\"space-y-6 pt-8 mt-8 border-t border-border\">")

# Remove restricted state logic
restricted_start = content.find("if (!user?.hubStaffHubIds.length) {")
restricted_end = content.find("const rawInbound", restricted_start)
if restricted_start != -1 and restricted_end != -1:
    content = content[:restricted_start] + content[restricted_end:]

# Remove title section
title_start = content.find("<div className=\"min-w-0\">")
title_end = content.find("<div className=\"mt-4 flex w-full", title_start)
if title_start != -1 and title_end != -1:
    content = content[:title_start] + content[title_end:]

# Create directory if it doesn't exist
os.makedirs("src/components/hub", exist_ok=True)

with open("src/components/hub/HubCommerceSection.tsx", "w") as f:
    f.write(content)

print("Created HubCommerceSection.tsx")
