"""
Seed matches between test-4 and seeded users, then add stories for those users.
"""

import sys, io as _io
sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import uuid
import requests
import io
import boto3
import psycopg2
import random

DB_HOST     = "geo-social-ai-platform-1.cxqyc2i6o32m.eu-north-1.rds.amazonaws.com"
DB_USER     = "postgres"
DB_PASSWORD = "T2-x*cvp,eF_,NN"
DB_NAME     = "postgres"
S3_BUCKET   = "geo-social-ai-platform-media"
AWS_REGION  = "eu-north-1"

MY_USER_ID  = "d10c335f-7372-486e-86cc-eefcbea97c39"  # test-4

s3 = boto3.client("s3", region_name=AWS_REGION)

def new_id():
    return str(uuid.uuid4())

def upload_image_from_url(url: str, s3_key: str) -> str:
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    s3.upload_fileobj(
        io.BytesIO(resp.content),
        S3_BUCKET,
        s3_key,
        ExtraArgs={"ContentType": "image/jpeg"},
    )
    print(f"  Uploaded -> s3://{S3_BUCKET}/{s3_key}")
    return s3_key

# Story images from Unsplash (lifestyle, travel, food)
STORY_IMAGES = [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600",  # travel
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",  # coffee
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",  # restaurant
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600",  # sunset
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600",  # beach
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600",  # food
    "https://images.unsplash.com/photo-1543373014-cfe4f4bc1cdf?w=600",    # nature
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",  # mountains
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",  # meal
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",  # event
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600",  # workspace
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600",  # tech
]

STORY_CAPTIONS = [
    "Beautiful day out here",
    "Living for these moments",
    "Can't believe this view",
    "Saturday vibes",
    "Just a regular evening",
    None,
    "New adventures",
    "This place is magic",
    None,
    "Weekend mode on",
    "Best day ever",
    None,
]

def main():
    conn = psycopg2.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
        dbname=DB_NAME, sslmode="require",
    )
    conn.autocommit = False
    cur = conn.cursor()

    # ── Fetch seeded users ─────────────────────────────────────────────────────
    print("=== Step 1: Fetch seeded users ===")
    cur.execute("""
        SELECT id, name FROM users
        WHERE cognito_sub LIKE 'seed-user-%'
        ORDER BY name
    """)
    seed_users = cur.fetchall()
    if not seed_users:
        print("  No seed users found! Run seed_users.py first.")
        return

    print(f"  Found {len(seed_users)} seeded users:")
    for uid, name in seed_users:
        print(f"    {name} ({uid})")

    # ── Add matches ────────────────────────────────────────────────────────────
    print("\n=== Step 2: Add matches between test-4 and seed users ===")
    # Delete existing matches first to avoid conflicts
    cur.execute("""
        DELETE FROM matches
        WHERE user_a = %s OR user_b = %s
    """, (MY_USER_ID, MY_USER_ID))
    print(f"  Cleared {cur.rowcount} previous matches for test-4.")

    for seed_uid, seed_name in seed_users:
        # Ensure consistent ordering (user_a < user_b lexicographically)
        user_a, user_b = sorted([MY_USER_ID, seed_uid])
        cur.execute("""
            INSERT INTO matches (id, user_a, user_b)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (new_id(), user_a, user_b))
        print(f"  Matched test-4 <-> {seed_name}")

    conn.commit()

    # ── Clean old stories from seed users ─────────────────────────────────────
    print("\n=== Step 3: Clean old stories from seed users ===")
    seed_ids = [uid for uid, _ in seed_users]
    cur.execute("DELETE FROM stories WHERE author_id = ANY(%s::uuid[])", (seed_ids,))
    print(f"  Deleted {cur.rowcount} old stories.")
    conn.commit()

    # ── Add stories for seed users ─────────────────────────────────────────────
    print("\n=== Step 4: Add stories for matched users ===")
    random.seed(123)
    story_pool = list(zip(STORY_IMAGES, STORY_CAPTIONS))
    random.shuffle(story_pool)

    story_idx = 0
    for seed_uid, seed_name in seed_users:
        # Give each user 1-2 stories
        num_stories = random.randint(1, 2)
        print(f"\n  {seed_name}: adding {num_stories} story/stories...")

        for k in range(num_stories):
            img_url, caption = story_pool[story_idx % len(story_pool)]
            story_idx += 1

            s3_key = f"stories/{seed_uid}/story-{k}-{new_id()}.jpg"
            try:
                upload_image_from_url(img_url, s3_key)
            except Exception as e:
                print(f"    Warning: upload failed: {e}")
                continue

            cur.execute("""
                INSERT INTO stories (id, author_id, media_url, media_type, caption, expires_at)
                VALUES (%s, %s, %s, 'image', %s, NOW() + INTERVAL '24 hours')
            """, (new_id(), seed_uid, s3_key, caption))
            print(f"    Story added: {s3_key}")

        conn.commit()

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n=== Done! ===")
    cur.execute("SELECT COUNT(*) FROM matches WHERE user_a = %s OR user_b = %s", (MY_USER_ID, MY_USER_ID))
    print(f"  Matches for test-4 : {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM stories WHERE author_id = ANY(%s::uuid[])", (seed_ids,))
    print(f"  Stories inserted   : {cur.fetchone()[0]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
