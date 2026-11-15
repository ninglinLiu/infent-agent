"""Package the standalone build plus checksum-verified portable Node runtimes."""
from pathlib import Path
import concurrent.futures, hashlib, json, shutil, tarfile, urllib.request, zipfile
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release' / 'omniai-demo'
CACHE = ROOT / 'release' / 'downloads'
NODE = 'v22.20.0'
TARGETS = ['win-x64','darwin-arm64','darwin-x64','linux-x64','linux-arm64']
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
def download(name):
    dest = CACHE / name
    if not dest.exists():
        with opener.open(f'https://nodejs.org/dist/{NODE}/{name}',timeout=60) as res, dest.open('wb') as out:
            shutil.copyfileobj(res,out)
    return dest
def runtime(target, sums):
    suffix='zip' if target.startswith('win') else 'tar.gz'
    name=f'node-{NODE}-{target}.{suffix}'
    archive=download(name)
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=sums[name]: raise RuntimeError(f'Checksum mismatch: {name}')
    folder=OUT/'runtime'/target; folder.mkdir(parents=True,exist_ok=True)
    prefix=f'node-{NODE}-{target}/'
    if suffix=='zip':
        with zipfile.ZipFile(archive) as z:
            for file in ['node.exe','LICENSE']:
                (folder/file).write_bytes(z.read(prefix+file))
    else:
        with tarfile.open(archive) as tar:
            for src,dst in [('bin/node','node'),('LICENSE','LICENSE')]:
                with tar.extractfile(prefix+src) as stream: (folder/dst).write_bytes(stream.read())
                (folder/dst).chmod(0o755 if dst=='node' else 0o644)
    print(f'Runtime verified: {target}',flush=True)
def copy_changed(src,dst):
    src,dst=Path(src),Path(dst)
    if dst.exists() and src.stat().st_size==dst.stat().st_size and abs(src.stat().st_mtime-dst.stat().st_mtime)<.01: return str(dst)
    return shutil.copy2(src,dst)
def main():
    CACHE.mkdir(parents=True,exist_ok=True)
    OUT.mkdir(parents=True,exist_ok=True)
    # Runtime prerender caches must never survive into a fresh release.
    for relative in ['app/.next/server/route-cache','app/.next/cache']:
        target=OUT/relative
        if target.exists():
            if not target.resolve().is_relative_to((OUT/'app').resolve()): raise RuntimeError('Unsafe cache path')
            shutil.rmtree(target)
    # Copy dereferencing junctions/symlinks so the bundle survives relocation.
    shutil.copytree(ROOT/'.next/standalone',OUT/'app',dirs_exist_ok=True,copy_function=copy_changed,symlinks=False,ignore=shutil.ignore_patterns('.env*','local-data','.vercel'))
    shutil.copytree(ROOT/'.next/static',OUT/'app/.next/static',dirs_exist_ok=True,copy_function=copy_changed)
    shutil.copytree(ROOT/'public',OUT/'app/public',dirs_exist_ok=True,copy_function=copy_changed)
    shutil.copytree(ROOT/'supabase/migrations',OUT/'app/supabase/migrations',dirs_exist_ok=True,copy_function=copy_changed)
    for file in (ROOT/'deploy/local').iterdir():
        if file.is_file(): shutil.copy2(file,OUT/file.name)
    sumsfile=download('SHASUMS256.txt')
    sums=dict((line.split()[1].lstrip('*'),line.split()[0]) for line in sumsfile.read_text().splitlines())
    shutil.copy2(sumsfile,OUT/'NODE-SHASUMS256.txt')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(lambda target:runtime(target,sums),TARGETS))
    manifest={str(p.relative_to(OUT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file() and p.name!='MANIFEST-SHA256.json'}
    (OUT/'MANIFEST-SHA256.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    path=shutil.make_archive(str(ROOT/'release/omniai-demo-portable'),'zip',OUT.parent,OUT.name)
    print(f'Portable package: {path}',flush=True)
if __name__=='__main__': main()
