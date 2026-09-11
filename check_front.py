"""Frontend checks 3 and 4: <div> balance and node --check on the JS block.

Usage, from the frontend repository root:
    python3 check_front.py [index.html]
Exit code 1 on any failure.
"""
import json
import re
import subprocess
import sys
import tempfile

path = sys.argv[1] if len(sys.argv) > 1 else "index.html"
line = next(l for l in open(path, encoding="utf-8").read().split("\n")
            if l.strip().startswith('"<!DOCTYPE')).strip()
tpl = json.loads(line[: line.rfind('"') + 1])

ok = True
opened, closed = len(re.findall(r"<div", tpl)), len(re.findall(r"</div>", tpl))
print(("PASS" if opened == closed else "FAIL") + f" <div> balance: {opened} open / {closed} closed")
ok &= opened == closed

scripts = [m.group(1) for m in re.finditer(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", tpl, re.S)]
js = max(scripts, key=len) if scripts else ""
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
    f.write(js)
r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
print(("PASS" if r.returncode == 0 else "FAIL") + f" node --check on JS block ({len(js)} chars)")
if r.returncode:
    print(r.stderr[:600])
ok &= r.returncode == 0
sys.exit(0 if ok else 1)
