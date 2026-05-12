---
name: pdf-to-markdown
description: >-
  Convert PDF files to clean, structured Markdown. Use when the user wants to
  read, extract, analyze, or convert a PDF document to markdown. Triggers on
  requests like "convert this PDF", "read the PDF", "extract text from PDF",
  "load the PDF into context", or when the user mentions a .pdf file and wants
  its content as text or markdown. Handles tables, headers, lists, and images.
compatibility: Requires Python 3.10+ and uv. No GPU needed.
metadata:
  author: rafalschmidt97
  version: "1.0"
allowed-tools: Bash(python*) Bash(uv:*) Bash(test:*) Read Write
---

## Overview

This skill converts PDF documents to structured Markdown using PyMuPDF4LLM.
It preserves document structure (headings, tables, lists) and extracts embedded
images with relative-path references in the output markdown.

PyMuPDF4LLM is lightweight (no GPU, no ML models) and handles digital/native
PDFs well. It auto-detects tables and reading order. For scanned PDFs or
documents with complex borderless tables, results may be less accurate.

## Prerequisites

1. Python 3.10+ available
2. `uv` installed ([install guide](https://docs.astral.sh/uv/getting-started/installation/))

## Setup

The skill uses a dedicated virtual environment. Create it on first use:

```bash
cd <SKILL_DIR> && uv venv .venv && uv pip install --python .venv/bin/python pymupdf pymupdf4llm
```

To verify:
```bash
<SKILL_DIR>/.venv/bin/python -c "import pymupdf4llm; print('ok')"
```

## Usage

### Convert a PDF to Markdown

```bash
<SKILL_DIR>/.venv/bin/python <SKILL_DIR>/scripts/pdf_to_md.py /path/to/document.pdf
```

Output is written to `/path/to/document.md` (same directory as the PDF).
Images are extracted to `/path/to/document_images/`.

### Specify output path

```bash
<SKILL_DIR>/.venv/bin/python <SKILL_DIR>/scripts/pdf_to_md.py /path/to/document.pdf /path/to/output.md
```

### Options

```
Usage: pdf_to_md.py <input.pdf> [output.md] [options]

Options:
  --pages 1,3,5-10   Extract specific pages (1-indexed, ranges supported)
  --no-images        Skip image extraction
  --force            Re-extract even if cached output exists
```

## Workflow

When the user provides a PDF and wants its content:

### Step 1: Ensure the venv exists

```bash
test -d <SKILL_DIR>/.venv || (cd <SKILL_DIR> && uv venv .venv && uv pip install --python .venv/bin/python pymupdf pymupdf4llm)
```

### Step 2: Convert

```bash
<SKILL_DIR>/.venv/bin/python <SKILL_DIR>/scripts/pdf_to_md.py /path/to/document.pdf
```

### Step 3: Read the output

```bash
cat /path/to/document.md
```

If the markdown contains image references like `![](document_images/img_001.png)`,
the images are available in the `document_images/` folder next to the `.md` file.
Use the Read tool on the image files if the user wants to analyze them visually.

## Caching

The script caches output by checking whether the `.md` file already exists and
the source PDF hasn't changed (by mtime). Use `--force` to bypass the cache.

## When This Skill Is Not Enough

This skill covers ~80% of PDF conversion needs. If the output looks wrong,
check whether the PDF falls into one of these harder categories and suggest
the matching tool to the user.

### Scanned / image-only PDFs (no selectable text)

PyMuPDF4LLM has no OCR engine. Pages that are just rasterized images come
back empty or garbled.

- **Mistral OCR API** (`mistral-ocr-latest`) -- hosted, ~$1/1000 pages, high
  quality on tables + math + handwriting. Requires `MISTRAL_API_KEY`.
  `pip install mistralai` and call the document OCR endpoint.
- **Tesseract** (free, local) -- `brew install tesseract`, then use
  `pytesseract` + `pdf2image` to OCR each page. Accuracy is decent for clean
  scans, poor on complex layouts.

### Complex tables (borderless, merged cells, nested headers)

PyMuPDF4LLM detects tables via line/grid analysis. Borderless or irregular
tables often come out broken.

- **Docling** (IBM, open source, CPU-only) -- best table fidelity of any
  local tool. `pip install docling docling-core`. ~50x slower than pymupdf4llm
  but handles the tables that nothing else gets right.

### Math, formulas, LaTeX

PyMuPDF4LLM extracts formulas as plain text, losing structure.

- **Marker** (Datalab, GPL-3.0) -- bundles Surya OCR + Texify for formula
  recognition. Needs GPU (~5GB VRAM). `pip install marker-pdf`. Outputs LaTeX
  inline in markdown. Best option for academic papers.

### Multi-column scientific papers

Reading order can get garbled when columns interleave.

- **Marker** handles multi-column layout detection well with its layout model.
- **MinerU** (open source) -- good at CJK + multi-column. Outputs both
  markdown and structured JSON. Needs GPU.

### Office documents (DOCX, PPTX, XLSX)

Not PDFs, but users often ask about these in the same breath.

- **MarkItDown** (Microsoft, open source) -- fast, lightweight, excellent for
  PowerPoint and Word. Weak on PDFs specifically. `pip install markitdown`.

### When local tools all fail

Some documents (handwritten annotations, mixed-media pages, heavily styled
marketing PDFs) defeat every open-source tool.

- **Mistral Document AI** -- hosted, ~$1-2/1000 pages. Good general quality.
- **Reducto** -- hosted, ~$15/1000 pages. Reportedly the strongest on truly
  difficult inputs. Worth trying as a last resort.
