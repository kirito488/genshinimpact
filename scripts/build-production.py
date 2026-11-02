"""Package only public runtime files; never publish owner keys or local QA pages."""
from pathlib import Path
import re
import shutil
import zipfile

root=Path(__file__).resolve().parents[1]
output=root/'dist'
runtime=['index.html','app.js','engine.js','art.js','style.css','assets/compass.svg']
runtime+=sorted(path.relative_to(root).as_posix() for path in (root/'data').rglob('*.js'))
allowed=set(runtime)|{'.nojekyll'}
if output.exists():
    unexpected=[p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file() and p.relative_to(output).as_posix() not in allowed]
    if unexpected:raise RuntimeError(f'Unexpected files in dist: {unexpected}')
output.mkdir(exist_ok=True)
for relative in runtime:
    source=root/relative
    target=output/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source,target)
(output/'.nojekyll').write_text('',encoding='utf-8')
for path in output.rglob('*.js'):
    text=path.read_text(encoding='utf-8')
    assert 'teyvat-mobile-qa' not in text and 'qaLocalStorage' not in text,str(path)
    for dependency in re.findall(r"^import .*? from ['\"]([^'\"]+)['\"]",text,re.MULTILINE):
        if dependency.startswith('.'):
            assert (path.parent/dependency).resolve().is_file(),f'Missing module {dependency} in {path}'
entry=(output/'index.html').read_text(encoding='utf-8')
assert '<iframe' not in entry and '手机适配检查' not in entry and 'type="module"' in entry
archive=root.parent/'提瓦特心途-正式网站.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(output.rglob('*')):
        if path.is_file():bundle.write(path,path.relative_to(output).as_posix())
print(f'Production build passed: {len(allowed)} runtime files; no preview harness, owner keys, tests, or development scripts.')
