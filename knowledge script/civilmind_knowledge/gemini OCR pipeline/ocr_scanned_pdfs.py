"""
CivilMind - Gemini Vision OCR Pipeline
=======================================
يستخدم Gemini Flash عشان يعمل OCR دقيق على الأكواد الهندسية العربية
أسرع وأدق من Tesseract للعربي بكتير

Requirements:
    pip install pdf2image google-generativeai tqdm

Usage:
    1. حط الـ PDFs في نفس المجلد مع السكريبت
    2. شغّل: python gemini_ocr_pipeline.py
    3. ارفع الـ .txt files الناتجة على Dify
"""

import os
import sys
import time
import base64
import json
from pathlib import Path
from pdf2image import convert_from_path
import google.generativeai as genai
from tqdm import tqdm
from PIL import Image
import io

# ─── إعداداتك ─────────────────────────────────────────────────────────────────

# ضع الـ API Key بتاعك من: https://aistudio.google.com/apikey
GEMINI_API_KEY = "AIzaSyBiswbfUIi71UTKtAFewprZUaR-lZ9G-Cg"

# مجلد الـ PDFs (نفس مجلد السكريبت افتراضياً)
PDF_FOLDER = Path(__file__).parent

# مجلد الـ output
OUTPUT_FOLDER = Path(__file__).parent / "ocr_output"

# الأكواد المراد معالجتها
PDF_FILES = {
    "saudi_sbc201_general.txt": "201 كود البناء السعودي العام.pdf",
    "saudi_sbc301_loads.txt": "pdfcoffee.com_sbc-code-301-pdf-free.pdf",
    "saudi_sbc303_soil.txt": "kupdf.net_sbc-303-2007-saudi-building-code-structural-soil-and-foundations.pdf",
    "saudi_sbc304_concrete.txt": "pdfcoffee.com_sbc-code-304-pdf-free.pdf",
    "egyptian_ecp203_concrete.txt": "الكود المصرى للمنشآت الخرسانيه 2018.pdf",
    "egyptian_ecp_loads_2012.txt": "kupdf.net_egyptian-code-for-loads-2012.pdf",
}

DPI = 150  # كافي للنصوص، 200 لو فيه جداول ومعادلات
DELAY = 5  # ثانية بين كل page عشان ما تتجاوزش الـ rate limit

# ─── الـ Prompt ─────────────────────────────────────────────────────────────────

OCR_PROMPT = """Extract ALL text from this engineering code page exactly as written.
- Preserve Arabic text with correct direction (RTL)
- Keep all numbers, section numbers, and references (e.g. 4-2-3, SBC 303)
- Keep table content in readable format
- Keep equations in text form
- Do NOT add any commentary or translation
- Just output the extracted text only"""

# ─── الكود ────────────────────────────────────────────────────────────────────

def setup_gemini():
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel("Gemini 2.5 Flash")

def image_to_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()

def ocr_page_with_gemini(model, img: Image.Image, page_num: int, retries=3) -> str:
    img_bytes = image_to_bytes(img)
    
    for attempt in range(retries):
        try:
            response = model.generate_content([
                OCR_PROMPT,
                {"mime_type": "image/jpeg", "data": img_bytes}
            ])
            return response.text
        except Exception as e:
            if "quota" in str(e).lower() or "429" in str(e):
                wait = 60 * (attempt + 1)
                print(f"\n  ⏳ Rate limit - waiting {wait}s...")
                time.sleep(wait)
            elif attempt < retries - 1:
                time.sleep(5)
            else:
                return f"[Error on page {page_num}: {str(e)}]"
    
    return f"[Failed page {page_num}]"

def ocr_pdf(model, pdf_path: Path, output_path: Path):
    """يعمل OCR على PDF كامل"""
    
    # تابع الـ progress لو في restart
    progress_file = output_path.with_suffix(".progress.json")
    completed_pages = {}
    
    if progress_file.exists():
        with open(progress_file, "r", encoding="utf-8") as f:
            completed_pages = json.load(f)
        print(f"  ↩️  Resuming from page {len(completed_pages) + 1}")
    
    from pdf2image import pdfinfo_from_path
    total_pages = pdfinfo_from_path(str(pdf_path))["Pages"]
    
    print(f"\n📄 {pdf_path.name}")
    print(f"   Pages: {total_pages} | Already done: {len(completed_pages)}")
    
    batch_size = 10
    
    for batch_start in range(1, total_pages + 1, batch_size):
        batch_end = min(batch_start + batch_size - 1, total_pages)
        
        # skip لو الـ batch خلص
        if all(str(p) in completed_pages for p in range(batch_start, batch_end + 1)):
            continue
        
        print(f"  Converting pages {batch_start}-{batch_end}...", end=" ", flush=True)
        images = convert_from_path(
            str(pdf_path),
            dpi=DPI,
            first_page=batch_start,
            last_page=batch_end,
            fmt="jpeg"
        )
        print("✓", flush=True)
        
        for i, img in enumerate(tqdm(images, desc=f"  OCR {batch_start}-{batch_end}", unit="page")):
            page_num = batch_start + i
            
            if str(page_num) in completed_pages:
                continue
            
            text = ocr_page_with_gemini(model, img, page_num)
            completed_pages[str(page_num)] = text
            
            # احفظ الـ progress كل 5 صفحات
            if page_num % 5 == 0:
                with open(progress_file, "w", encoding="utf-8") as f:
                    json.dump(completed_pages, f, ensure_ascii=False)
            
            time.sleep(DELAY)
    
    # احفظ الـ progress الكامل
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(completed_pages, f, ensure_ascii=False)
    
    # اكتب الـ output file مرتب حسب الصفحات
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        for page_num in range(1, total_pages + 1):
            text = completed_pages.get(str(page_num), "[Missing page]")
            f.write(f"\n{'='*60}\n📄 Page {page_num}\n{'='*60}\n")
            f.write(text + "\n")
    
    # امسح الـ progress file
    progress_file.unlink(missing_ok=True)
    
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"  ✅ Saved: {output_path.name} ({size_mb:.1f} MB)")

def main():
    if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        print("❌ ضع الـ Gemini API Key في المتغير GEMINI_API_KEY")
        print("   روح: https://aistudio.google.com/apikey")
        sys.exit(1)
    
    print("=" * 60)
    print("🏗️  CivilMind - Gemini Vision OCR Pipeline")
    print("=" * 60)
    
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    model = setup_gemini()
    print("✅ Gemini connected\n")
    
    for output_name, pdf_name in PDF_FILES.items():
        output_path = OUTPUT_FOLDER / output_name
        
        # ابحث عن الـ PDF
        pdf_path = PDF_FOLDER / pdf_name
        if not pdf_path.exists():
            print(f"❌ Not found: {pdf_name}")
            continue
        
        if output_path.exists():
            print(f"⏭️  Already done: {output_name}")
            continue
        
        try:
            ocr_pdf(model, pdf_path, output_path)
        except KeyboardInterrupt:
            print("\n⏸️  Paused - run again to resume")
            sys.exit(0)
        except Exception as e:
            print(f"❌ Failed: {pdf_name} - {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ Done! Files in: {OUTPUT_FOLDER}")
    print("\n🚀 Next: Upload the .txt files to Dify Knowledge Base")
    print("=" * 60)

if __name__ == "__main__":
    main()
