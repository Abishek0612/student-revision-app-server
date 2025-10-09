# RevisionApp Backend

AI-powered student revision platform backend built with Node.js, Express, MongoDB, and Google Gemini AI.

## Features

- User authentication with JWT
- PDF upload and processing with embeddings
- AI-powered chat with context from PDFs
- Intelligent quiz generation
- Progress tracking
- YouTube video recommendations
- Cloud storage with Cloudinary

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI/ML**: Google Gemini AI (gemini-pro, embedding-001)
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **PDF Processing**: pdf-parse
- **APIs**: YouTube Data API v3

## Prerequisites

- Node.js >= 14.x
- MongoDB >= 4.x
- Cloudinary account
- Google Gemini API keys (1-3 keys for rotation)
- YouTube Data API key

# .env (paste .env in root directory)

GEMINI_API_KEY_1=AIzaSyBprm3ELe41fYwme4N8DKO0RCVdGjwbPyg
GEMINI_API_KEY_2=AIzaSyCtl1SUEJT7KunzfPS14CodlPAm9iJGxjU
GEMINI_API_KEY_3=AIzaSyB9PGhhGPmnBlfrSDJ5KwhgHYLwMaMnHfg
PORT=5001
MONGO_URI=mongodb+srv://uabishek6:abi%40abi12@cluster0.xblmerd.mongodb.net/student-revision-app
JWT_SECRET=dscdkcdkncdncd3233cn
CLOUDINARY_CLOUD_NAME=dsjgl0cbj
CLOUDINARY_API_KEY=859825451636775
CLOUDINARY_API_SECRET=JDk7hM26QzLpcBe_1KHsxE3sM28
YOUTUBE_API_KEY=AIzaSyBXytxVAGJJet6fKolmegikbXYDpfCttpw

## Installation & run the server

1. **Clone the repository**

```bash
   git clone  -https://github.com/Abishek0612/student-revision-app-server.git
   cd backend

   install node modules -   npm install

  # run the server
  npm run dev or npm start
```
