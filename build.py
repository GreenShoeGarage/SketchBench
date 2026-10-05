from pathlib import Path
p=Path(__file__).parent
text=(p/'shell.html').read_text().replace('/*STYLES*/',(p/'style.css').read_text()).replace('/*KERNEL*/','\n'.join((p/n).read_text() for n in ['kernel.js','geometry-plus.js','solids.js','interchange.js'])).replace('/*APP*/','\n'.join((p/n).read_text() for n in ['app.js','precision.js','sketch-regions.js','studio.js','projects.js','export-ui.js','finish.js','examples.js','bootstrap.js']))
(p/'index.html').write_text(text)
print('Built standalone index.html:',len(text.encode()),'bytes')
