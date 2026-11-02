"""Build a dependency-free, single-file local review copy from the actual source.
Usage: python scripts/build-preview.py [output.html]
The deployed source remains index.html and ES modules. This is a review artifact.
"""
from pathlib import Path
import re
import sys
from urllib.parse import quote

root=Path(__file__).resolve().parents[1]
files=[
    ('data/regions.js',['DIMENSIONS','REGIONS','getRegion']),
    ('data/characters-west.js',['CHARACTERS_WEST']),
    ('data/characters-inazuma.js',['CHARACTERS_INAZUMA']),
    ('data/characters-east.js',['CHARACTERS_EAST']),
    ('data/characters-nodkrai.js',['CHARACTERS_NODKRAI']),
    ('data/characters.js',['CHARACTERS']),
    ('data/question-builder.js',['QUESTION_AXES','buildRegionQuestions']),
    ('data/questions/mondstadt.js',['MONDSTADT_QUESTIONS']),
    ('data/questions/liyue.js',['LIYUE_QUESTIONS']),
    ('data/questions/inazuma.js',['INAZUMA_QUESTIONS']),
    ('data/questions/sumeru.js',['SUMERU_QUESTIONS']),
    ('data/questions/fontaine.js',['FONTAINE_QUESTIONS']),
    ('data/questions/natlan.js',['NATLAN_QUESTIONS']),
    ('data/questions/nodkrai.js',['NODKRAI_QUESTIONS']),
    ('data/questions-west.js',['QUESTIONS_WEST']),
    ('data/questions-east.js',['QUESTIONS_EAST']),
    ('data/questions-nodkrai.js',['QUESTIONS_NODKRAI']),
    ('engine.js',['DATA_VERSION','RANK_WEIGHTS','isValidAnswer','answerVector','possibleAnswers','questionBounds','scoreAnswers','matchCharacters','matchingReasons','restoreProgress','verifyKey']),
    ('art.js',['icon','landscape','atlas']),
]
parts=['(()=>{\n"use strict";']
for relative,names in files:
    code=(root/relative).read_text(encoding='utf-8')
    code=re.sub(r'^import .*?;\s*$', '', code, flags=re.MULTILINE)
    for name in names:
        assert re.search(r'export (?:const|function|async function)\s+'+name+r'\b',code),f'Missing named export {name}'
    code=re.sub(r'\bexport (?=const|function|async function)', '', code)
    joined=','.join(names)
    parts.append(f'const {{{joined}}}=(()=>{{\n{code}\nreturn {{{joined}}};\n}})();')
app=(root/'app.js').read_text(encoding='utf-8')
app=re.sub(r'^import .*?;\s*$', '', app, flags=re.MULTILINE)
parts.append(app+'\n})();')
script='\n'.join(parts).replace('</script','<\\/script')
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+ (root/'style.css').read_text(encoding='utf-8')+'</style>')
svg='data:image/svg+xml,'+quote((root/'assets/compass.svg').read_text(encoding='utf-8'),safe='')
html=html.replace('./assets/compass.svg',svg)
html=html.replace('<script type="module" src="./app.js"></script>','<script>'+script+'</script>')
output=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent/'提瓦特心途-本地预览.html'
output.write_text(html,encoding='utf-8')
print(f'Preview created: {output}\nBundled {len(files)+1} modules; {len(script)} characters of JavaScript.')
