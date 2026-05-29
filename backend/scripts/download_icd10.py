"""
Downloads FY2025 ICD-10-CM codes from CMS and saves them as data/icd10/icd10cm_codes_2025.csv.

If the URL below is stale, find the latest at:
  https://www.cms.gov/medicare/coding-billing/icd-10-codes
Download the "Code Descriptions in Tabular Order" ZIP and place the .txt order file
in data/icd10/, then re-run this script pointing to the local file.
"""
import os
import sys
import urllib.request
import zipfile
import io
import pandas as pd

CMS_ZIP_URL = (
    "https://www.cms.gov/files/zip/2025-code-descriptions-tabular-order.zip"
)
OUT_DIR = "data/icd10"
OUT_CSV = os.path.join(OUT_DIR, "icd10cm_codes_2025.csv")

# Fixed-width column spec for the CMS order file
_COLSPECS = [(0, 5), (6, 13), (14, 15), (16, 76)]
_COLNAMES = ["seq", "code", "is_header", "description"]


def parse_order_file(file_obj) -> pd.DataFrame:
    df = pd.read_fwf(file_obj, colspecs=_COLSPECS, header=None, names=_COLNAMES, dtype=str)
    df = df[df["is_header"] == "0"][["code", "description"]].dropna()
    df["code"] = df["code"].str.strip()
    df["description"] = df["description"].str.strip()
    return df.reset_index(drop=True)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"Downloading ICD-10-CM 2025 codes from CMS...")
    try:
        with urllib.request.urlopen(CMS_ZIP_URL, timeout=60) as resp:
            zip_bytes = resp.read()
    except Exception as e:
        print(f"Download failed: {e}")
        print("Please download manually and place the order .txt file in data/icd10/")
        sys.exit(1)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        order_files = [n for n in zf.namelist() if "order" in n.lower() and n.endswith(".txt")]
        if not order_files:
            print("Could not find order file in ZIP. Files found:", zf.namelist())
            sys.exit(1)
        order_file = order_files[0]
        print(f"Parsing {order_file}...")
        with zf.open(order_file) as f:
            df = parse_order_file(f)

    df.to_csv(OUT_CSV, index=False)
    print(f"Saved {len(df):,} codes → {OUT_CSV}")


if __name__ == "__main__":
    main()
