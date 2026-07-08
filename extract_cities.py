import re
with open('../SunApp/app.js', 'r') as f:
    content = f.read()

# Find the CITIES array
match = re.search(r'(const CITIES = \[.*?\];)', content, re.DOTALL)
if match:
    with open('cities.js', 'w') as f:
        f.write(match.group(1))
    print("Cities extracted successfully.")
else:
    print("Could not find CITIES array.")
