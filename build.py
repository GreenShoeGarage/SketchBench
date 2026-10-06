from pathlib import Path
p=Path(__file__).parent
text=(p/'shell.html').read_text().replace('/*STYLES*/',(p/'style.css').read_text()).replace('/*KERNEL*/','\n'.join((p/n).read_text() for n in ['kernel.js','geometry-plus.js','solids.js','surfaces.js','software-renderer.js','interchange.js'])).replace('/*APP*/','\n'.join((p/n).read_text() for n in ['app.js','precision.js','sketch-regions.js','viewport-surfaces.js','studio.js','projects.js','export-ui.js','finish.js','examples.js','cad-ui.js','precision-v2.js','assemblies.js','presentation.js','documentation-v2.js','display-v2.js','interaction-v2.js','native-examples.js','release-v2.js','bootstrap.js']))
(p/'index.html').write_text(text)
print('Built index.html (bundled vendor assets also required):',len(text.encode()),'bytes')
