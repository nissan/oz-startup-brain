import hashlib
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('check-lfs-images.py'))
guard = importlib.util.module_from_spec(spec); spec.loader.exec_module(guard)
PNG = b'\x89PNG\r\n\x1a\n' + b'\0' * 64


def pointer(data):
    return f'version https://git-lfs.github.com/spec/v1\noid sha256:{hashlib.sha256(data).hexdigest()}\nsize {len(data)}\n'.encode()


class GuardTests(unittest.TestCase):
    """The guard checks staged blobs, so a smudged working tree cannot hide a raw commit or fake one."""
    def repo(self, files):
        d = Path(tempfile.mkdtemp())
        subprocess.run(['git', 'init', '-q', str(d)], check=True)
        for name, data in files.items():
            (d / name).parent.mkdir(parents=True, exist_ok=True)
            (d / name).write_bytes(data)
        subprocess.run(['git', '-C', str(d), 'add', '-A'], check=True)
        return d

    def test_raw_image_fails(self):
        self.assertEqual(['a/raw.png'], guard.problems(self.repo({'a/raw.png': PNG, 'a/note.md': b'x'})))

    def test_pointer_passes_even_when_the_working_tree_holds_the_real_image(self):
        d = self.repo({'b/img.webp': pointer(PNG)})
        (d / 'b/img.webp').write_bytes(PNG)  # what LFS smudge leaves in a checkout
        self.assertEqual([], guard.problems(d))

    def test_malformed_pointer_and_every_raster_extension_are_checked(self):
        bad = {'x.png': b'version https://git-lfs.github.com/spec/v1\noid sha256:zz\nsize 1\n', 'y.JPG': PNG, 'z.gif': PNG, 'w.jpeg': PNG}
        self.assertEqual({'x.png', 'y.JPG', 'z.gif', 'w.jpeg'}, set(guard.problems(self.repo(bad))))

    def test_no_images_is_fine(self):
        self.assertEqual([], guard.problems(self.repo({'README.md': b'x'})))


if __name__ == '__main__':
    unittest.main()
