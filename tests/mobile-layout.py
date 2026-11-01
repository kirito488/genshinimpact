"""CSS cascade regressions for known mobile bugs; not a browser rendering test.
Uses tinycss2, cssselect2 and lxml already present in the review environment.
"""
from pathlib import Path
import json
import re
import tinycss2
import cssselect2
from lxml import html

root=Path(__file__).resolve().parents[1]
rules=tinycss2.parse_stylesheet((root/'style.css').read_text(encoding='utf-8'),skip_comments=True,skip_whitespace=True)
fixture=html.fromstring('''<html><body>
<header class="site-header"><a class="brand" id="brand"></a><nav><button class="nav-link" id="nav"></button><button class="icon-button" id="help"></button></nav></header>
<main><div class="hero"><div class="hero-map"><svg class="atlas-art" id="atlas"></svg></div></div>
<div class="cast-preview"><div class="avatar-stack"><span class="portrait small" id="avatar"></span></div></div>
<div class="question-panel"><div class="question-body" id="question"><div class="scale-options" id="scale"><button class="scale-option" id="scale-answer"><span class="scale-orb" id="orb"></span></button></div>
<div class="rank-slot filled" id="rank"><span></span><span></span><span class="rank-controls" id="rank-controls"><button id="rank-button"></button></span></div></div></div>
<div class="character-card" id="card"><div class="character-identity"><h2 id="name">梦见月瑞希</h2></div></div></main>
<dialog><button class="modal-close icon-button" id="close"></button><div class="key-input-wrap"><input id="key"></div><textarea class="copy-area" id="copy"></textarea></dialog>
</body></html>''')
elements={element.etree_element.get('id'):element for element in cssselect2.ElementWrapper.from_html_root(fixture).iter_subtree() if element.etree_element.get('id')}

def enabled(condition,width):
    if 'print' in condition or 'prefers-reduced-motion' in condition:
        return False
    for kind,number in re.findall(r'(min|max)-width\s*:\s*([\d.]+)px',condition):
        if kind=='max' and width>float(number): return False
        if kind=='min' and width<float(number): return False
    return True

def cascade(width):
    matcher=cssselect2.Matcher()
    def add(items):
        for rule in items:
            assert rule.type!='error',str(rule)
            if rule.type=='at-rule' and rule.at_keyword=='media' and enabled(tinycss2.serialize(rule.prelude),width):
                add(tinycss2.parse_rule_list(rule.content,skip_whitespace=True,skip_comments=True))
            elif rule.type=='qualified-rule':
                selector_text=tinycss2.serialize(rule.prelude)
                # cssselect2 does not model the dialog's browser-owned backdrop.
                if '::backdrop' in selector_text:continue
                selectors=cssselect2.compile_selector_list(selector_text)
                declarations=tinycss2.parse_declaration_list(rule.content,skip_whitespace=True,skip_comments=True)
                assert not any(item.type=='error' for item in declarations)
                for selector in selectors: matcher.add_selector(selector,declarations)
    add(rules)
    output={}
    for key,element in elements.items():
        values={};priority={}
        for specificity,order,pseudo,declarations in matcher.match(element):
            if pseudo is not None:continue
            for declaration in declarations:
                if declaration.type!='declaration':continue
                rank=(declaration.important,specificity,order)
                if declaration.name not in priority or rank>=priority[declaration.name]:
                    priority[declaration.name]=rank;values[declaration.name]=tinycss2.serialize(declaration.value).strip()
        output[key]=values
    return output

def pixels(value):
    assert value.endswith('px'),value
    return float(value[:-2])

report={'kind':'static-css-contract','renderedBrowser':False,'assertions':0,'widths':[]}
def check(value,message):
    report['assertions']+=1
    assert value,message

for width in [320,360,390,414,600,768,850]:
    css=cascade(width)
    check(pixels(css['key']['font-size'])>=16,f'{width}: iOS input zoom threshold')
    check(css['atlas']['width']=='100%' and css['atlas']['margin-left']=='0',f'{width}: map stays inside its column')
    check(css['avatar']['width']=='36px' and css['avatar']['height']=='36px',f'{width}: stacked avatar cascade')
    row={'width':width,'inputPx':pixels(css['key']['font-size']),'atlasWidth':css['atlas']['width']}
    if width<=600:
        for key in ['help','close','rank-button']:
            check(pixels(css[key]['width'])>=44 and pixels(css[key]['height'])>=44,f'{width}: {key} touch area')
        check(pixels(css['copy']['font-size'])>=16,f'{width}: textarea zoom threshold')
        check(pixels(css['scale-answer']['font-size'])>=12,f'{width}: scale answer readability')
        check(css['rank']['display']=='grid',f'{width}: rank controls have a separate row')
        # Compute the exact fixed horizontal boxes from the cascaded layout values.
        main_padding=[float(v[:-2]) for v in css['question'].get('padding','').split()]
        question_side=main_padding[1]
        content=width-32-2-2*question_side
        gap=pixels(css['scale']['gap'])
        scale_width=(content-4*gap)/5
        check(scale_width>=44,f'{width}: five scales remain finger-sized')
        check(pixels(css['orb']['width'])+8<=scale_width+.01,f'{width}: scale endpoints fit')
        check(content-24-2-26-10>=3*44+2*8,f'{width}: rank controls fit their second row')
        row.update({'questionContentPx':content,'scaleTouchWidthPx':round(scale_width,1),'rankTouchPx':44,'copyFontPx':16})
    report['widths'].append(row)

output=root.parent/'mobile-review.json'
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
