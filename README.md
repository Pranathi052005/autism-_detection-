# 🧩 EarlyBloom - Autism Detection Platform 2026

A comprehensive web-based autism spectrum disorder (ASD) screening and assessment platform that uses multimodal AI analysis to help parents and healthcare providers early identify autism risk factors in children.

## 🎯 **Project Overview**

EarlyBloom combines modern web technologies with advanced AI to create an accessible, comprehensive screening platform for autism detection. The system analyzes questionnaires, video recordings, and audio samples to provide detailed assessment results and recommendations.

### **Key Features**
- 📋 **M-CHAT-R/F Questionnaire** - Modified Checklist for Autism in Toddlers
- 🎥 **Video Analysis** - Facial expressions, eye contact, gesture detection
- 🎤 **Audio Analysis** - Speech patterns, vocal characteristics, prosody
- 🤖 **AI-Powered Insights** - Gemini API for personalized recommendations
- 🏥 **Clinic Finder** - Location-based autism care center recommendations
- 📊 **Comprehensive Reports** - Detailed assessment results with next steps
- 🔐 **Secure Authentication** - User management and data privacy
- 📱 **Mobile Responsive** - Works on all devices

## 🏗️ **Tech Stack**

### **Frontend**
- **React 18** - Modern UI framework with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management and validation
- **Axios** - HTTP client for API calls
- **React Query (TanStack Query)** - Server state management
- **Lucide React** - Modern icon library

### **Backend**
- **Python 3.12** - Backend programming language
- **FastAPI** - Modern, fast web framework for APIs
- **Uvicorn** - ASGI server for FastAPI
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **Pydantic** - Data validation and settings management

### **Database & Storage**
- **SQLite** - Lightweight file-based database
- **JWT (JSON Web Tokens)** - Authentication
- **BCrypt** - Secure password hashing

### **AI/ML Technologies**
- **Google Gemini API** - AI-powered clinic recommendations
- **XGBoost** - Machine learning model for autism prediction
- **OpenCV** - Computer vision for video analysis
- **MediaPipe** - Face and gesture detection
- **Librosa** - Audio analysis and feature extraction
- **Scikit-learn** - ML preprocessing and utilities
- **NumPy/Pandas** - Data manipulation and analysis

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.12+
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd autismdetection_1_d
```

2. **Backend Setup**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
# Install Node.js dependencies
npm install
```

4. **Environment Configuration**
```bash
# Copy .env file and configure
cp .env.example .env
# Edit .env with your API keys and settings
```

5. **Start Development Servers**

**Backend (Terminal 1):**
```bash
# Activate virtual environment first
venv\Scripts\activate

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8002
```

**Frontend (Terminal 2):**
```bash
# Start Vite development server
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8002
- API Documentation: http://localhost:8002/docs

## 📁 **Project Structure**

```
autismdetection_1_d/
├── app/                          # Backend application
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry
│   ├── config.py                 # Configuration settings
│   ├── database.py               # Database models and setup
│   └── routers/                  # API route handlers
│       ├── __init__.py
│       ├── sessions.py           # Assessment sessions
│       ├── screening.py          # Screening endpoints
│       └── clinics.py            # Clinic finder endpoints
├── src/                          # Frontend application
│   ├── components/               # Reusable UI components
│   │   ├── ChatBot.jsx
│   │   └── Navbar.jsx
│   ├── hooks/                    # Custom React hooks
│   │   └── useScreening.js       # API interaction hooks
│   ├── pages/                    # Page components
│   │   ├── Login.jsx
│   │   ├── NewSession.jsx        # Assessment form
│   │   └── Report.jsx            # Results display
│   ├── App.jsx                   # Main App component
│   └── index.css                 # Global styles
├── uploads/                      # File upload storage
├── venv/                         # Python virtual environment
├── autismdetect.db              # SQLite database
├── autism_xgboost_model.pkl    # Trained ML model
├── requirements.txt             # Python dependencies
├── package.json                 # Node.js dependencies
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
└── vite.config.js              # Vite configuration
```

## 🔧 **Environment Variables**

Create a `.env` file in the root directory:

```env
# Frontend Configuration
VITE_API_URL=http://localhost:8002

# Backend Configuration
DATABASE_URL=sqlite:///./autismdetect.db
SECRET_KEY=your-super-secret-key-that-should-be-at-least-32-chars
OPENAI_API_KEY=sk-placeholder
UPLOAD_DIR=uploads
ENVIRONMENT=development

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

## 📊 **API Endpoints**

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### **Assessment Sessions**
- `POST /sessions/` - Create new assessment session
- `GET /sessions/{id}` - Get session details
- `PUT /sessions/{id}` - Update session

### **Screening Analysis**
- `POST /api/screening/video` - Video analysis
- `POST /api/screening/audio` - Audio analysis
- `POST /api/screening/full` - Complete multimodal analysis
- `GET /api/screening/result/{id}` - Get assessment results

### **Clinic Finder**
- `POST /clinics/nearby` - Get nearby autism clinics

### **Health Check**
- `GET /health` - Application health status

## 🧪 **Testing**

### **Running Tests**
```bash
# Backend tests
python -m pytest

# Frontend tests (if configured)
npm test
```

### **Manual Testing**
1. Start both development servers
2. Open http://localhost:5173
3. Create a new account or login
4. Start a new assessment
5. Fill questionnaire and optionally upload files
6. Review the comprehensive report

## 🎨 **UI/UX Design**

### **Design System**
- **Bio-inspired theme** with soft pastel colors
- **Glass morphism effects** for modern UI
- **Accessibility-first** approach
- **Mobile-responsive** design
- **Child-friendly** interface elements

### **Color Palette**
- **Primary**: Teal/Turquoise (`#14b8a6`)
- **Secondary**: Rose/Pink (`#f43f5e`)
- **Background**: Soft gradients and glass effects
- **Text**: High contrast for readability

## 📈 **Features in Detail**

### **1. Autism Screening Assessment**
- M-CHAT-R/F questionnaire with 10 behavioral questions
- Real-time validation and progress tracking
- Multi-step form with child details collection
- Support for parent notes and observations

### **2. Multimodal AI Analysis**
- **Video Analysis**: Facial expressions, eye contact patterns, gesture recognition
- **Audio Analysis**: Speech patterns, vocal characteristics, prosody analysis
- **Questionnaire Analysis**: Behavioral response patterns and risk scoring
- **Fusion Model**: Combines all modalities for comprehensive assessment

### **3. Location-Based Clinic Finder**
- Automatic clinic recommendations based on user location
- Real hospital/clinic data for major Indian cities (Hyderabad, Bangalore, Mumbai, Delhi)
- Google Maps integration for directions
- Fallback system when AI services are unavailable
- Generic recommendations for other locations

### **4. Comprehensive Reporting**
- Risk assessment with confidence scores
- AI-generated insights and recommendations
- Developmental considerations and next steps
- PDF report generation capability
- Clinic recommendations with contact information

## 🔒 **Security & Privacy**

- **JWT Authentication** for secure sessions
- **Password Hashing** with BCrypt
- **File Upload Validation** and sanitization
- **SQL Injection Prevention** with SQLAlchemy
- **CORS Configuration** for API security
- **Data Anonymization** in assessments
- **Secure File Storage** with access controls

## 🚀 **Deployment**

### **Development**
```bash
# Start development servers
npm run dev                    # Frontend (http://localhost:5173)
python -m uvicorn app.main:app --reload --port 8002  # Backend (http://localhost:8002)
```

### **Production**
```bash
# Build frontend
npm run build

# Start production backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```

### **Docker Deployment** (Future)
```bash
# Build and run with Docker
docker-compose up --build
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Troubleshooting**

### **Common Issues**

**Backend Server Not Starting**
```bash
# Ensure virtual environment is activated
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Check Python version (requires 3.12+)
python --version
```

**Frontend Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS Errors**
```bash
# Ensure both servers are running
# Check .env file for correct API URLs
# Verify backend CORS configuration
```

**Database Issues**
```bash
# Delete and recreate database
rm autismdetect.db
# The app will automatically recreate it
```

### **Getting Help**

- Check the [Issues](../../issues) page for known problems
- Create a new issue for bugs or feature requests
- Review the [Documentation](./docs/) for detailed guides

## 📞 **Contact & Support**

For questions, support, or contributions:

- 📧 Email: support@earlybloom.com
- 🐛 Issues: [GitHub Issues](../../issues)
- 📖 Documentation: [Project Wiki](../../wiki)
- 💬 Discussions: [GitHub Discussions](../../discussions)

---

**EarlyBloom represents a cutting-edge approach to early autism detection, combining modern web technologies with advanced AI to create a comprehensive, accessible, and impactful screening platform for children worldwide.**

🌟 **Made with ❤️ for early childhood development and autism awareness**
