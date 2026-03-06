# Task: Register OAuth apps and fill in .env credentials

You have browser access. Register OAuth apps for Google, Facebook, and X/Twitter, then paste the credentials into the project's `.env` file.

The app's NextAuth callback URL pattern is:
```
http://localhost:3000/api/auth/callback/{provider}
```

Production domain (also add if prompted):
```
https://foodmedals.com/api/auth/callback/{provider}
```

---

## 1. Google

1. Go to https://console.cloud.google.com/apis/credentials
2. Create project "FoodMedals" if none exists
3. Configure OAuth consent screen → External → App name "FoodMedals" → save
4. Create Credentials → OAuth client ID → Web application
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://foodmedals.com`
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://foodmedals.com/api/auth/callback/google`
7. Copy **Client ID** → `GOOGLE_CLIENT_ID`
8. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

## 2. Facebook

1. Go to https://developers.facebook.com/apps → Create App
2. App type: Consumer → App name "FoodMedals"
3. Add product: Facebook Login
4. Facebook Login → Settings → Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://foodmedals.com/api/auth/callback/facebook`
5. Settings → Basic → copy **App ID** → `FACEBOOK_CLIENT_ID`
6. Settings → Basic → copy **App Secret** → `FACEBOOK_CLIENT_SECRET`

## 3. X / Twitter

1. Go to https://developer.x.com/en/portal/projects-and-apps
2. Create Project "FoodMedals" → Add App
3. App Settings → User authentication settings → Set up
4. Enable OAuth 2.0 → Type: Web App
5. Callback URL:
   - `http://localhost:3000/api/auth/callback/twitter`
6. Website URL: `https://foodmedals.com`
7. Keys and Tokens → copy **Client ID** → `TWITTER_CLIENT_ID`
8. Keys and Tokens → copy **Client Secret** → `TWITTER_CLIENT_SECRET`

---

## .env target format

Fill in the empty strings in `.env`:

```
GOOGLE_CLIENT_ID="<value>"
GOOGLE_CLIENT_SECRET="<value>"
FACEBOOK_CLIENT_ID="<value>"
FACEBOOK_CLIENT_SECRET="<value>"
TWITTER_CLIENT_ID="<value>"
TWITTER_CLIENT_SECRET="<value>"
```

## Rules

- DO NOT change any other values in `.env`
- DO NOT modify any source code files
- Ask the user to handle any login/2FA/CAPTCHA steps themselves
- If a provider requires a phone number or business verification, inform the user and skip to the next provider
- After all 3 are done, confirm which credentials were successfully added
