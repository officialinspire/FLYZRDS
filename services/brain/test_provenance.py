import hashlib
import tempfile
import unittest
from pathlib import Path
from fetch import verify

class ProvenanceTests(unittest.TestCase):
    def test_rejects_changed_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').write_bytes(b'original')
            manifest = {'files': {'data': hashlib.sha256(b'original').hexdigest()}}
            verify(root, manifest)
            (root / 'data').write_bytes(b'changed')
            with self.assertRaises(ValueError):
                verify(root, manifest)

if __name__ == '__main__':
    unittest.main()
