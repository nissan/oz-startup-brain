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
    ATTRS = (b'*.png filter=lfs diff=lfs merge=lfs -text\n*.jpg filter=lfs diff=lfs merge=lfs -text\n*.JPG filter=lfs diff=lfs merge=lfs -text\n'
             b'*.jpeg filter=lfs diff=lfs merge=lfs -text\n*.gif filter=lfs diff=lfs merge=lfs -text\n*.webp filter=lfs diff=lfs merge=lfs -text\n'
             b'src/*.png -filter binary\n')

    def repo(self, files, attrs=True):
        d = Path(tempfile.mkdtemp())
        if attrs:
            files = {'.gitattributes': self.ATTRS, **files}
        subprocess.run(['git', 'init', '-q', str(d)], check=True)
        for name, data in files.items():
            (d / name).parent.mkdir(parents=True, exist_ok=True)
            (d / name).write_bytes(data)
        # Stage exactly these bytes, as a machine without git-lfs would: no clean filter converts them.
        subprocess.run(['git', '-C', str(d), '-c', 'filter.lfs.process=', '-c', 'filter.lfs.clean=cat', '-c', 'filter.lfs.required=false', 'add', '-A'], check=True)
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

    def test_exempt_path_must_hold_real_bytes(self):
        self.assertEqual([], guard.problems(self.repo({'src/logo.png': PNG, 'x/shot.png': pointer(PNG)})))
        self.assertEqual(['src/logo.png (exempt from LFS but committed as a pointer)'], guard.problems(self.repo({'src/logo.png': pointer(PNG), 'x/shot.png': pointer(PNG)})))

    def test_missing_lfs_rules_fail(self):
        self.assertTrue(guard.problems(self.repo({'x/shot.png': PNG}, attrs=False))[0].startswith('(no image is tracked'))

    def test_no_images_is_fine(self):
        self.assertEqual([], guard.problems(self.repo({'README.md': b'x'})))


if __name__ == '__main__':
    unittest.main()
