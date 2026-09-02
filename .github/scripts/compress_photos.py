"""
Resizes/re-compresses any photo under photos/ that's larger than
necessary for web display. Run by .github/workflows/compress-photos.yml
on every push that touches photos/, so new uploads never need a manual
compression pass.
"""
import os
import subprocess
import sys

from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "photos")
MAX_EDGE = 2000
JPEG_QUALITY = 82
MIN_SIZE_TO_TOUCH = 400 * 1024  # skip files already under 400KB
EXTS = {".jpg", ".jpeg", ".png"}


def changed_files():
    """Only touch files added/modified by the push that triggered this run,
    so the job stays fast and doesn't re-compress the whole library every time."""
    base = os.environ.get("BASE_SHA")
    head = os.environ.get("HEAD_SHA")
    if not base or not head:
        return None
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=ACM", base, head],
            capture_output=True, text=True, check=True
        ).stdout
    except subprocess.CalledProcessError:
        return None
    return {os.path.abspath(p) for p in out.splitlines() if p.startswith("photos/")}


def main():
    touched = changed_files()

    for dirpath, _, filenames in os.walk(ROOT):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in EXTS:
                continue
            fpath = os.path.join(dirpath, fname)
            if touched is not None and os.path.abspath(fpath) not in touched:
                continue

            before_size = os.path.getsize(fpath)
            if before_size < MIN_SIZE_TO_TOUCH:
                continue

            try:
                img = Image.open(fpath)
                img = ImageOps.exif_transpose(img)
                w, h = img.size
                long_edge = max(w, h)
                if long_edge > MAX_EDGE:
                    scale = MAX_EDGE / long_edge
                    img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                if ext == ".png":
                    img.save(fpath, format="PNG", optimize=True)
                else:
                    img.save(fpath, format="JPEG", quality=JPEG_QUALITY, optimize=True)

                after_size = os.path.getsize(fpath)
                if after_size < before_size:
                    print(f"{os.path.relpath(fpath, ROOT)}: {before_size/1024:.0f}KB -> {after_size/1024:.0f}KB")
            except Exception as e:
                print(f"SKIPPED (error): {fpath} -> {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
