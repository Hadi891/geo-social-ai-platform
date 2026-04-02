"""
Seed test users near Palaiseau, France (48.7167 N, 2.2500 E)
- Adds tags column to posts table
- Creates 6 realistic users with real portrait photos
- Inserts locations, posts with tags and images, comments, likes
"""

import sys, io as _io
sys.stdout = _io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import uuid
import requests
import io
import boto3
import psycopg2
from psycopg2.extras import execute_values
import random

# ── DB Config ─────────────────────────────────────────────────────────────────
DB_HOST     = "geo-social-ai-platform-1.cxqyc2i6o32m.eu-north-1.rds.amazonaws.com"
DB_USER     = "postgres"
DB_PASSWORD = "T2-x*cvp,eF_,NN"
DB_NAME     = "postgres"
S3_BUCKET   = "geo-social-ai-platform-media"
AWS_REGION  = "eu-north-1"

# ── S3 Client ─────────────────────────────────────────────────────────────────
s3 = boto3.client("s3", region_name=AWS_REGION)

# ── Helpers ───────────────────────────────────────────────────────────────────

def new_id():
    return str(uuid.uuid4())

def upload_image_from_url(url: str, s3_key: str) -> str:
    """Download image from url and upload to S3. Returns the S3 key."""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    s3.upload_fileobj(
        io.BytesIO(resp.content),
        S3_BUCKET,
        s3_key,
        ExtraArgs={"ContentType": "image/jpeg"},
    )
    print(f"  Uploaded {url} -> s3://{S3_BUCKET}/{s3_key}")
    return s3_key

# ── User data ─────────────────────────────────────────────────────────────────
# Palaiseau center: 48.7167, 2.2500
# Nearby coordinates within ~10 km radius

USERS = [
    {
        "name": "Sophie Leclerc",
        "age": 24,
        "gender": "female",
        "sexual_orientation": "male",
        "bio": "Architecture student at Polytechnique 🏛️ Coffee addict, weekend hiker. Looking for someone to explore Essonne with!",
        "interests": ["architecture", "hiking", "coffee", "photography", "cycling"],
        "introversion_score": 40,
        "lat": 48.7100, "lon": 2.2380,   # Palaiseau village
        "portrait_url": "https://randomuser.me/api/portraits/women/44.jpg",
        "posts": [
            {
                "content": "Golden hour at Étang de Saclay yesterday 🌅 There's something magical about this place after class.",
                "media_img": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
                "tags": ["nature", "saclay", "goldenhour", "photography"],
            },
            {
                "content": "Finally finished my semester project model! Months of work paying off ✨",
                "media_img": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
                "tags": ["architecture", "polytechnique", "studentlife"],
            },
        ],
    },
    {
        "name": "Lucas Martin",
        "age": 26,
        "gender": "male",
        "sexual_orientation": "female",
        "bio": "Software engineer @ startup in Massy. Climbing, jazz, and great food. Paris-Saclay alumnus 🎓",
        "interests": ["climbing", "jazz", "coding", "food", "travel"],
        "introversion_score": 55,
        "lat": 48.7267, "lon": 2.2700,   # Massy
        "portrait_url": "https://randomuser.me/api/portraits/men/32.jpg",
        "posts": [
            {
                "content": "Crushed a new bouldering route at the gym today 🧗 V5 finally down after 3 weeks!",
                "media_img": "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800",
                "tags": ["climbing", "bouldering", "fitness", "sport"],
            },
            {
                "content": "Weekend jazz session at a tiny bar in Paris 🎷 Some evenings are just perfect.",
                "media_img": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
                "tags": ["jazz", "paris", "music", "weekend"],
            },
        ],
    },
    {
        "name": "Camille Dubois",
        "age": 22,
        "gender": "female",
        "sexual_orientation": "both",
        "bio": "Master student in AI at Paris-Saclay 🤖 Dog mom, yoga enthusiast, aspiring chef on weekends.",
        "interests": ["AI", "yoga", "cooking", "dogs", "reading"],
        "introversion_score": 65,
        "lat": 48.6991, "lon": 2.1882,   # Orsay
        "portrait_url": "https://randomuser.me/api/portraits/women/17.jpg",
        "posts": [
            {
                "content": "Sunday cooking experiment: homemade ramen from scratch 🍜 Took 6 hours but worth every minute.",
                "media_img": "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800",
                "tags": ["cooking", "ramen", "foodie", "sundayvibes"],
            },
        ],
    },
    {
        "name": "Antoine Rousseau",
        "age": 27,
        "gender": "male",
        "sexual_orientation": "female",
        "bio": "PhD in physics at Paris-Saclay ⚛️ Cyclist, amateur astronomer, book nerd. Ask me about dark matter.",
        "interests": ["physics", "cycling", "astronomy", "books", "chess"],
        "introversion_score": 72,
        "lat": 48.7333, "lon": 2.1667,   # Saclay plateau
        "portrait_url": "https://randomuser.me/api/portraits/men/56.jpg",
        "posts": [
            {
                "content": "Morning 40km ride through the Chevreuse valley ☁️ Best way to clear your head before research.",
                "media_img": "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800",
                "tags": ["cycling", "chevreuse", "morning", "nature"],
            },
            {
                "content": "Clear sky last night, finally got a proper shot of Jupiter through my telescope 🪐",
                "media_img": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800",
                "tags": ["astronomy", "jupiter", "stargazing", "science"],
            },
        ],
    },
    {
        "name": "Inès Benali",
        "age": 23,
        "gender": "female",
        "sexual_orientation": "male",
        "bio": "Engineering student, dance instructor on weekends 💃 Love Afrobeats, brunch spots, and spontaneous road trips.",
        "interests": ["dance", "music", "afrobeats", "brunch", "roadtrips"],
        "introversion_score": 25,
        "lat": 48.7050, "lon": 2.2600,   # Palaiseau south
        "portrait_url": "https://randomuser.me/api/portraits/women/68.jpg",
        "posts": [
            {
                "content": "Dance workshop went amazing today ✨ 30 students showed up and the energy was incredible!",
                "media_img": "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800",
                "tags": ["dance", "afrobeats", "workshop", "community"],
            },
            {
                "content": "Best brunch spot in Palaiseau? Found it 🥞 The açaí bowl is insane.",
                "media_img": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
                "tags": ["brunch", "food", "palaiseau", "healthyfood"],
            },
        ],
    },
    {
        "name": "Hugo Petit",
        "age": 25,
        "gender": "male",
        "sexual_orientation": "both",
        "bio": "Graphic designer & illustrator 🎨 Skateboarding, indie films, street art. Always looking for creative people.",
        "interests": ["design", "illustration", "skateboarding", "film", "streetart"],
        "introversion_score": 48,
        "lat": 48.6833, "lon": 2.1700,   # Les Ulis
        "portrait_url": "https://randomuser.me/api/portraits/men/78.jpg",
        "posts": [
            {
                "content": "New illustration series inspired by Parisian street art 🖌️ This one took a whole weekend.",
                "media_img": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800",
                "tags": ["illustration", "streetart", "art", "design"],
            },
        ],
    },
]

# Comment templates to mix around
COMMENT_POOL = [
    "This is so beautiful! 😍",
    "Love this! Where is this exactly?",
    "Goals 🙌",
    "We should do this together sometime!",
    "Amazing shot 📸",
    "You're making me hungry 😂",
    "This place looks incredible",
    "Legend! How long did it take you?",
    "I've been wanting to try this too",
    "The vibes here are perfect ✨",
    "So talented 🔥",
    "Can't believe this is right next door to us",
    "Need to visit asap",
    "You always find the best spots",
    "This made my day 😊",
]

# ── Main seed ─────────────────────────────────────────────────────────────────

def main():
    conn = psycopg2.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
        dbname=DB_NAME, sslmode="require",
    )
    conn.autocommit = False
    cur = conn.cursor()

    print("=== Step 0: Clean up previous seed data ===")
    cur.execute("DELETE FROM users WHERE cognito_sub LIKE 'seed-user-%'")
    deleted = cur.rowcount
    conn.commit()
    print(f"  Removed {deleted} previous seed users (cascade deletes their posts/likes/etc).")

    print("=== Step 1: Add tags column to posts ===")
    cur.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'")
    conn.commit()
    print("  tags column ready.")

    print("\n=== Step 2: Add tags column to schema.sql ===")
    # (We'll update the schema file separately)

    created_user_ids = []
    all_post_ids = []

    print("\n=== Step 3: Insert users, locations, photos, posts ===")
    for i, u in enumerate(USERS):
        uid = new_id()
        fake_sub = f"seed-user-{i+1:02d}-{new_id()}"
        fake_email = f"seed.{u['name'].lower().replace(' ', '.').replace('é','e').replace('è','e').replace('ê','e').replace('ï','i').replace('î','i').replace('ô','o').replace('û','u').replace('à','a').replace('â','a').replace('ç','c')}@mingle.test"

        print(f"\n  [{i+1}/{len(USERS)}] Creating {u['name']} ...")

        # Insert user
        cur.execute("""
            INSERT INTO users (id, cognito_sub, email, name, age, gender, sexual_orientation,
                               bio, interests, introversion_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (uid, fake_sub, fake_email, u["name"], u["age"], u["gender"],
              u["sexual_orientation"], u["bio"], u["interests"], u["introversion_score"]))
        uid = cur.fetchone()[0]
        created_user_ids.append(uid)

        # Insert location
        cur.execute("""
            INSERT INTO locations (user_id, latitude, longitude, geom)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)
            ON CONFLICT (user_id) DO UPDATE
            SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                geom = EXCLUDED.geom
        """, (uid, u["lat"], u["lon"], u["lon"], u["lat"]))

        # Upload & insert profile photo
        photo_key = f"profile-images/{fake_sub}/profile.jpg"
        try:
            upload_image_from_url(u["portrait_url"], photo_key)
            photo_id = new_id()
            cur.execute("""
                INSERT INTO photos (id, user_id, image_url, is_profile_photo, position)
                VALUES (%s, %s, %s, TRUE, 0)
                ON CONFLICT (user_id) WHERE is_profile_photo = TRUE
                DO UPDATE SET image_url = EXCLUDED.image_url
            """, (photo_id, uid, photo_key))
        except Exception as e:
            print(f"    Warning: could not upload profile photo: {e}")

        # Insert posts
        for j, post in enumerate(u.get("posts", [])):
            post_id = new_id()
            media_key = None

            if post.get("media_img"):
                media_key = f"post-images/{uid}/post-{j}.jpg"
                try:
                    upload_image_from_url(post["media_img"], media_key)
                except Exception as e:
                    print(f"    Warning: could not upload post image: {e}")
                    media_key = None

            cur.execute("""
                INSERT INTO posts (id, author_id, content, media_url, tags)
                VALUES (%s, %s, %s, %s, %s)
            """, (post_id, uid, post["content"], media_key, post.get("tags", [])))
            all_post_ids.append((post_id, uid))
            print(f"    Post {j+1}: '{post['content'][:50]}'")

        conn.commit()

    print(f"\n=== Step 4: Add likes to posts ===")
    for post_id, author_id in all_post_ids:
        # Pick 2-4 random likers (not the author)
        likers = [uid for uid in created_user_ids if uid != author_id]
        random.shuffle(likers)
        likers = likers[:random.randint(2, 4)]
        for liker_id in likers:
            cur.execute("""
                INSERT INTO post_likes (post_id, user_id)
                VALUES (%s, %s) ON CONFLICT DO NOTHING
            """, (post_id, liker_id))

    conn.commit()
    print(f"  Likes added for {len(all_post_ids)} posts.")

    print(f"\n=== Step 5: Add comments to posts ===")
    random.seed(42)
    for post_id, author_id in all_post_ids:
        # Pick 1-3 commenters (not the author)
        commenters = [uid for uid in created_user_ids if uid != author_id]
        random.shuffle(commenters)
        commenters = commenters[:random.randint(1, 3)]
        for commenter_id in commenters:
            comment = random.choice(COMMENT_POOL)
            cur.execute("""
                INSERT INTO post_comments (id, post_id, author_id, content)
                VALUES (%s, %s, %s, %s)
            """, (new_id(), post_id, commenter_id, comment))

    conn.commit()
    print(f"  Comments added for {len(all_post_ids)} posts.")

    print(f"\n=== Done! ===")
    print(f"  Users created : {len(created_user_ids)}")
    print(f"  Posts created : {len(all_post_ids)}")
    cur.execute("SELECT COUNT(*) FROM post_likes WHERE post_id = ANY(%s)", ([p[0] for p in all_post_ids],))
    print(f"  Total likes   : {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM post_comments WHERE post_id = ANY(%s)", ([p[0] for p in all_post_ids],))
    print(f"  Total comments: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
