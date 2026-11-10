from pathlib import Path
import firebase_admin
from firebase_admin import credentials, db
import pandas as pd

key_path = Path(__file__).resolve().parent / "terrasense-cs401-firebase-adminsdk-fbsvc-2ddf7ce1b2.json"
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://terrasense-cs401-default-rtdb.firebaseio.com/"
})

data = db.reference("/readings").get()

#df = pd.DataFrame.from_dict(data, orient="index")
df = pd.DataFrame(data)

print(df)