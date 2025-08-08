# scripts/compute_embeddings.py
# Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars, then run:
# python scripts/compute_embeddings.py news_with_text.csv
import os, sys, csv, json
from sentence_transformers import SentenceTransformer
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    print('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
    sys.exit(1)

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def upsert_embedding(article_id, embedding):
    url = f"{SUPABASE_URL}/rest/v1/news_articles"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        'id': article_id,
        'embedding': embedding
    }
    r = requests.post(url, headers=headers, data=json.dumps(payload))
    return r.status_code, r.text

def main():
    if len(sys.argv) < 2:
        print('Provide CSV file path with id and text columns')
        sys.exit(1)
    infile = sys.argv[1]
    with open(infile,'r',encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row.get('title','') + ' ' + row.get('abstract','')
            emb = model.encode(text).tolist()
            status,txt = upsert_embedding(row['id'], emb)
            print(row['id'], status)

if __name__ == '__main__':
    main()
