import os
import subprocess

os.chdir(os.path.dirname(os.path.abspath(__file__)))

process = subprocess.Popen(
    [
        "mkdocs", "serve"
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

for line in process.stdout:
    print(line, end="")