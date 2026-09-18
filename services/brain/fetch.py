"""Fetch an immutable upstream snapshot into ignored research storage."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

MANIFEST = Path(__file__).with_name('provenance.json')

def verify(root, manifest):
    for name, expected in manifest['files'].items():
        actual = hashlib.sha256((root / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'Checksum mismatch: {name}')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--destination', type=Path, default=Path('research/fly-brain'))
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text())
    root = args.destination.resolve()
    if not root.exists():
        root.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['git', 'clone', '--no-checkout', manifest['upstream'] + '.git', str(root)], check=True)
    # Never reset an existing checkout with local edits.
    dirty = subprocess.check_output(['git', '-C', str(root), 'status', '--porcelain'], text=True)
    head = subprocess.run(['git', '-C', str(root), 'rev-parse', '--verify', 'HEAD'], capture_output=True, text=True)
    # A fresh --no-checkout clone reports deleted files; allow only first checkout.
    if (root / 'data').exists() and dirty:
        raise RuntimeError('Upstream checkout has local changes; use a fresh destination')
    if head.returncode or head.stdout.strip() != manifest['commit'] or not (root / 'data').exists():
        subprocess.run(['git', '-C', str(root), 'checkout', '--detach', manifest['commit']], check=True)
    verify(root, manifest)
    print(json.dumps({'verified': True, 'commit': manifest['commit'], 'path': str(root)}))

if __name__ == '__main__':
    main()
