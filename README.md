# 🎯 Quiz-API-Login App
## The final link = https://quiz-api-login.onrender.com/login

A fun, full-featured Quiz Web App built using **Node.js**, **Express**, **MongoDB**, and the **Open Trivia API**. 
Users can take quizzes, track their history, view leaderboards, and share their scores on social media.
===========================================================
## Professor : Nikola Baci 
## 👥 Contributors - Students
## - Mohamed Hussein --> %50
 
## - Xinshuo Li ------> %50

===========================================================
## 🚀 Features
- 🌐 Fetches questions from the [Open Trivia API](https://opentdb.com/api_config.php)
- 📊 Quiz score tracking with MongoDB
- 📁 User profile with quiz history
- 💡 Dark Mode support
- 🎉 Leaderboard for top performers
- 🔄 One-question-at-a-time format with per-question timer
- ✅ Shows correct answers and feedback
- 🔊 Sound effects for correct/incorrect answers
- 📅 Shows quiz completion time and date
- 💬 Share score on **Facebook**, **Twitter**, and **WhatsApp**
- 🔐 Secure login and user session management

===========================================================

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, EJS (templating)
- **Database:** MongoDB Atlas (cloud-hosted)
- **APIs:** [Open Trivia DB](https://opentdb.com/api_config.php)

===========================================================

### Home Page
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/3f42b579-2574-4083-859b-d21ba9f8db97" />

### Quiz Page
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/fa3f5366-b123-49c7-91a2-a28c183b4f28" />

### Results & Sharing
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c359d3ac-c66f-4b85-8630-d347fccceb1e" />

### MongoDB/Cluster0/quizAppDB 
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c7f6b925-17e0-4bfb-920c-90cd4da647c7" />

### My Profile page
<img width="1360" height="668" alt="Profile Page" src="https://github.com/user-attachments/assets/16e91a06-463c-4494-999f-7921b0519b1a" />

### Leader board page
<img width="1333" height="670" alt="Leader board Page" src="https://github.com/user-attachments/assets/45f08b36-235e-420c-aa55-31e817f80d2a" />


===========================================================
## 📦 Installation
### 1. Clone the repository
```bash
git clone https://github.com/MohamedHussein25/Quiz-API-Login.git
cd Quiz-Api-Login

### 2. Install dependencies
npm install

### 3. Configure .env file
Create a .env file in the root directory:
MONGO_URI=mongodb+srv://userQuiz:Uq123456@cluster0.zgo4mqo.mongodb.net/quizAppDB?retryWrites=true&w=majority&appName=Cluster0
 PORT=3000
▶️ Run the App
node app.js
Then open: http://localhost:3000 in your browser.


===========================================================
📚 Folder Structure

Quiz-API-Login/
│
├── app.js                 # Main application
├── package.json
├── .env                  # Environment variables
│
├── models/
│   ├── User.js
│   └── Score.js
│
├── views/
│   ├── home.ejs
│   ├── quiz.ejs
│   ├── result.ejs
│   ├── profile.ejs
│   └── leaderboard.ejs
│
├── routes/
│   ├── auth.js
│   └── leaderboard.js
│
├── public/
│   ├── styles.css
│   ├── script.js
│   └── images/
│
└── data/
    └── questions.json (optional backup)
===========================================================
🔗 Trivia API Configuration
Category List

API Config Page

Example endpoint:
https://opentdb.com/api.php?amount=10&category=18&type=multiple
===========================================================
📄 License
MIT © 2025 Mohamed Hussein & Xinshuo Li
https://mohamedhussein25.github.io/mohamedhussein.github.io/




