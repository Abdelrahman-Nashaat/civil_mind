"""
CivilMind - OCR Script for Scanned Arabic PDFs
Run this on your local machine (uses GPU if available via EasyOCR)
Requirements: pip install easyocr pymupdf Pillow
"""

import fitz  # PyMuPDF
import easyocr
import numpy as np
from PIL import Image
import io, os, time

# PDFs to process
PDFS = {
    "Egyptian_Loads_2012": "kupdf_net_egyptian-code-for-loads-2012.pdf",
    "Egyptian_Concrete_2018": "الكود_المصرى_للمنشآت_الخرسانيه_2018.pdf",
}

OUTPUT_DIR = "civilmind_knowledge"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# EasyOCR - Arabic + English, GPU=True uses your RTX 2060!
print("Loading EasyOCR model (first time will download ~1GB)...")
reader = easyocr.Reader(['ar', 'en'], gpu=True)
print("Model loaded!")

def ocr_pdf(pdf_path, output_name):
    doc = fitz.open(pdf_path)
    total = len(doc)
    print(f"\nProcessing {output_name}: {total} pages...")
    
    all_text = []
    start = time.time()
    
    for i, page in enumerate(doc):
        # Render at 200 DPI for good OCR quality
        mat = fitz.Matrix(200/72, 200/72)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
        img_bytes = pix.tobytes("jpeg")
        img = Image.open(io.BytesIO(img_bytes))
        img_np = np.array(img)
        
        # OCR
        results = reader.readtext(img_np, detail=0, paragraph=True)
        page_text = "\n".join(results)
        all_text.append(f"\n--- Page {i+1} ---\n{page_text}")
        
        # Progress
        if (i+1) % 10 == 0:
            elapsed = time.time() - start
            rate = elapsed / (i+1)
            remaining = rate * (total - i - 1)
            print(f"  Page {i+1}/{total} | {remaining/60:.1f} min remaining")
    
    output_path = os.path.join(OUTPUT_DIR, f"{output_name}.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(all_text))
    
    print(f"  Saved: {output_path}")
    return output_path

# Run OCR
for name, filename in PDFS.items():
    if os.path.exists(filename):
        ocr_pdf(filename, name)
    else:
        print(f"File not found: {filename} - make sure it's in the same folder as this script")

print("\nDone! Upload the .txt files in civilmind_knowledge/ to Dify Knowledge Base.")
