"""Independent export checks using only Python's standard library; no app code."""
from pathlib import Path
import re,math,struct,json,collections
root=Path(__file__).parents[1]/'examples'
for f in sorted(root.glob('*.stl')):
    vertices=[tuple(map(float,m)) for m in re.findall(r'vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)',f.read_text())]
    assert len(vertices)%3==0 and vertices
    edges=collections.Counter();signed_volume=0;min_area=math.inf
    def sub(a,b):return tuple(x-y for x,y in zip(a,b))
    def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    def dot(a,b):return sum(x*y for x,y in zip(a,b))
    for i in range(0,len(vertices),3):
        a,b,c=vertices[i:i+3]
        area=math.sqrt(dot(cross(sub(b,a),sub(c,a)),cross(sub(b,a),sub(c,a))))/2
        assert area>1e-9,(f.name,'degenerate triangle')
        min_area=min(min_area,area)
        signed_volume+=dot(a,cross(b,c))/6
        for p,q in [(a,b),(b,c),(c,a)]:
            p=tuple(round(n,6) for n in p);q=tuple(round(n,6) for n in q)
            edges[(p,q)]+=1
    # Each directed edge has exactly as many opposite-oriented partners.
    assert all(n==edges[(q,p)] for (p,q),n in edges.items()),(f.name,'unpaired mesh edge')
    assert signed_volume>0
    print(f'{f.name}: {len(vertices)//3} nondegenerate triangles; all edges paired; volume {signed_volume:.6f} mm³')
for f in sorted(root.glob('*.glb')):
    b=f.read_bytes();magic,version,length=struct.unpack_from('<III',b)
    assert magic==0x46546c67 and version==2 and length==len(b)
    jslen,jstype=struct.unpack_from('<II',b,12);assert jstype==0x4e4f534a and jslen%4==0
    j=json.loads(b[20:20+jslen]);off=20+jslen;binlen,bintype=struct.unpack_from('<II',b,off)
    assert bintype==0x004e4942 and binlen==j['buffers'][0]['byteLength'];binary=b[off+8:]
    count=0
    for accessor in j['accessors']:
        bv=j['bufferViews'][accessor['bufferView']];start=bv.get('byteOffset',0)+accessor.get('byteOffset',0);n=accessor['count']*3
        values=struct.unpack_from('<'+'f'*n,binary,start)
        assert all(math.isfinite(v) for v in values)
        for axis in range(3):
            assert min(values[axis::3])==accessor['min'][axis]
            assert max(values[axis::3])==accessor['max'][axis]
        count+=1
    print(f'{f.name}: GLB header, lengths, alignment, {count} accessors and bounds verified')
