#!/usr/bin/env python3
"""Convert PDF to Markdown using PyMuPDF4LLM."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional


def parse_pages(pages_str: str) -> list[int]:
    """Parse page specification like '1,3,5-10' into a list of 0-indexed page numbers."""
    pages = []
    for part in pages_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            pages.extend(range(int(start) - 1, int(end)))
        else:
            pages.append(int(part) - 1)
    return sorted(set(pages))


def extract_images(doc, output_dir: Path) -> dict[str, str]:
    """Extract images from PDF and return xref->filename mapping."""
    output_dir.mkdir(parents=True, exist_ok=True)
    seen_xrefs = set()
    mapping = {}
    count = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            try:
                pix = doc.extract_image(xref)
            except Exception:
                continue

            if not pix or not pix.get("image"):
                continue

            ext = pix.get("ext", "png")
            filename = f"img_{count:03d}.{ext}"
            filepath = output_dir / filename
            filepath.write_bytes(pix["image"])
            mapping[str(xref)] = filename
            count += 1

    return mapping


def convert(
    input_path: Path,
    output_path: Path,
    pages: list[int] | None = None,
    extract_imgs: bool = True,
    force: bool = False,
) -> None:
    """Convert PDF to markdown."""

    # Cache check: skip if output exists and is newer than input
    if (
        not force
        and output_path.exists()
        and output_path.stat().st_mtime >= input_path.stat().st_mtime
    ):
        print(f"Cached: {output_path} (use --force to re-extract)")
        return

    import pymupdf
    import pymupdf4llm

    kwargs = {}
    if pages is not None:
        kwargs["pages"] = pages

    md_text = pymupdf4llm.to_markdown(str(input_path), **kwargs)

    # Extract images
    if extract_imgs:
        images_dir_name = output_path.stem + "_images"
        images_dir = output_path.parent / images_dir_name
        doc = pymupdf.open(str(input_path))
        img_map = extract_images(doc, images_dir)
        doc.close()

        if not img_map:
            # Remove empty images dir
            try:
                images_dir.rmdir()
            except (OSError, FileNotFoundError):
                pass
        else:
            print(f"Extracted {len(img_map)} images to {images_dir}")

    # Write output
    output_path.write_text(md_text, encoding="utf-8")
    print(f"Written: {output_path} ({len(md_text)} chars)")


def main():
    parser = argparse.ArgumentParser(description="Convert PDF to Markdown")
    parser.add_argument("input", help="Input PDF file path")
    parser.add_argument("output", nargs="?", help="Output markdown file path")
    parser.add_argument("--pages", help="Pages to extract (e.g. 1,3,5-10)")
    parser.add_argument(
        "--no-images", action="store_true", help="Skip image extraction"
    )
    parser.add_argument(
        "--force", action="store_true", help="Force re-extraction even if cached"
    )

    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    if not input_path.exists():
        print(f"Error: {input_path} not found", file=sys.stderr)
        sys.exit(1)
    if not input_path.suffix.lower() == ".pdf":
        print(f"Error: {input_path} is not a PDF file", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = Path(args.output).resolve()
    else:
        output_path = input_path.with_suffix(".md")

    pages = parse_pages(args.pages) if args.pages else None

    convert(
        input_path=input_path,
        output_path=output_path,
        pages=pages,
        extract_imgs=not args.no_images,
        force=args.force,
    )


if __name__ == "__main__":
    main()
