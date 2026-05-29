"""
Embeds ICD-10-CM codes into a ChromaDB vector index using all-MiniLM-L6-v2.
Run once after download_icd10.py. Takes ~5-10 minutes on Apple Silicon.
"""
import os
import sys
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer

CSV_PATH = "data/icd10/icd10cm_codes_2025.csv"
CHROMA_PATH = "data/chroma"
BATCH_SIZE = 500
COLLECTION_NAME = "icd10"


def main():
    if not os.path.exists(CSV_PATH):
        print(f"CSV not found: {CSV_PATH}")
        print("Run scripts/download_icd10.py first.")
        sys.exit(1)

    print("Loading ICD-10 codes...")
    df = pd.read_csv(CSV_PATH, dtype=str).dropna()
    codes = df["code"].tolist()
    descriptions = df["description"].tolist()
    print(f"  {len(codes):,} codes loaded")

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    print("Initialising ChromaDB...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        client.delete_collection(COLLECTION_NAME)
        print("  Deleted existing collection")
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    print("Building index...")
    total = len(codes)
    for i in range(0, total, BATCH_SIZE):
        batch_codes = codes[i : i + BATCH_SIZE]
        batch_descs = descriptions[i : i + BATCH_SIZE]
        embeddings = embedder.encode(batch_descs, show_progress_bar=False).tolist()
        collection.add(ids=batch_codes, documents=batch_descs, embeddings=embeddings)
        done = min(i + BATCH_SIZE, total)
        print(f"  {done:,}/{total:,}", end="\r")

    print(f"\nDone — {total:,} codes indexed at {CHROMA_PATH}")


if __name__ == "__main__":
    main()
