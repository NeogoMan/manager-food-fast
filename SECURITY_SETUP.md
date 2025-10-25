# Security Setup Guide

## Important: Credential Configuration Required

This project uses Firebase and requires proper credential configuration. The credentials are **NOT** included in this repository for security reasons.

## Setup Instructions

### 1. Firebase Web App Configuration (Frontend)

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Then edit `frontend/.env` with your Firebase project credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll to "Your apps" section
5. Copy the Firebase configuration values
6. Paste them into your `.env` file

### 2. Android App Configuration

Create `android/app/google-services.json`:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings
4. Under "Your apps", click on your Android app
5. Download `google-services.json`
6. Place it in `android/app/google-services.json`

You can use `android/app/google-services.json.example` as a reference for the file structure.

### 3. Backend Service Account (Server-side)

Create `serviceAccountKey.json` in the project root:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the downloaded file as `serviceAccountKey.json` in the project root

### 4. Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Update the values according to your setup.

## Security Best Practices

### ⚠️ NEVER commit these files to Git:
- `serviceAccountKey.json`
- `google-services.json`
- Any `.env` files

These files are already in `.gitignore` to prevent accidental commits.

### API Key Restrictions

To enhance security, set up API key restrictions in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services > Credentials
4. Click on your API key
5. Set restrictions:
   - **Application restrictions**: Set to your website domain or Android app
   - **API restrictions**: Limit to only the APIs you need (Firestore, Authentication, etc.)

### Firebase Security Rules

Make sure to configure proper security rules for:
- Firestore Database (`firestore.rules`)
- Firebase Storage
- Firebase Authentication

## Verify Setup

After configuration, verify everything works:

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm start

# Android
cd android
./gradlew build
```

## Troubleshooting

If you see errors about missing Firebase configuration:
1. Verify all `.env` files are created and populated
2. Check that `google-services.json` exists in `android/app/`
3. Ensure `serviceAccountKey.json` exists in the project root
4. Restart your development servers after adding credentials

## Support

For Firebase setup issues, see:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
