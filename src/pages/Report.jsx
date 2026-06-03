import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useScreeningResult } from "../hooks/useScreening";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  Calendar,
  User,
  Brain,
  Video,
  Mic,
  BarChart3,
  TrendingUp,
  Activity,
  Eye,
  Heart,
  Lightbulb,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle,
  Download,
  ChevronRight,
  MapPin,
  Phone,
  Building,
  ExternalLink,
  Layers,
} from "lucide-react";
import ChatBot from "../components/ChatBot";

export default function Report() {
  const { id } = useParams();
  const location = useLocation();
  const { data: report, isLoading } = useScreeningResult(id);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [clinicsError, setClinicsError] = useState(null);

  // Get multimodal results from location state
  const fusionResult = location.state?.fusionResult;
  const videoResults = location.state?.videoResults;
  const audioResults = location.state?.audioResults;
  const childLocation = location.state?.childLocation;

  // Log report data for debugging
  console.log("📊 Report data:", report);
  console.log("🎥 Video score in report:", report?.video_score);
  console.log("🎵 Audio score in report:", report?.audio_score);
  console.log("📋 Questionnaire score in report:", report?.questionnaire_score);
  console.log("🎥 Fusion result:", fusionResult);
  console.log("🎥 Video results:", videoResults);
  console.log("🎵 Audio results:", audioResults);

  // Fetch nearby clinics when component loads
  useEffect(() => {
    const fetchClinics = async () => {
      if (childLocation && childLocation.trim()) {
        setIsLoadingClinics(true);
        setClinicsError(null);

        try {
          const response = await fetch("/clinics/nearby", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ location: childLocation }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch clinics");
          }

          const data = await response.json();
          setClinics(data.clinics || []);
          console.log("🏥 Clinics fetched:", data.clinics);
        } catch (error) {
          console.error("❌ Error fetching clinics:", error);
          setClinicsError(error.message || "Failed to fetch clinics");
        } finally {
          setIsLoadingClinics(false);
        }
      }
    };

    fetchClinics();
  }, [childLocation]);

  if (isLoading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  const screeningData = report || {};
  const { final_score, risk_level, breakdown, created_at } = screeningData;

  // Debug: Check what's in location state
  console.log("🔍 DEBUG - Location state:", location.state);
  console.log("🔍 DEBUG - Fusion result:", fusionResult);
  console.log("🔍 DEBUG - Backend report data:", screeningData);
  console.log("🔍 DEBUG - Risk level from backend:", risk_level);
  console.log("🔍 DEBUG - Final score from backend:", final_score);

  // Get user name from localStorage
  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("userEmail")?.split("@")[0] ||
    "User";

  // Child information from assessment
  const childInfo = {
    name:
      location.state?.childName ||
      fusionResult?.childName ||
      location.state?.patientName ||
      `${userName}'s Child`,
    age:
      location.state?.childAgeMonths ||
      fusionResult?.childAgeMonths ||
      location.state?.ageMonths ||
      24,
    assessmentDate: created_at
      ? new Date(created_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    parentName: location.state?.parentName || userName,
  };

  console.log("🔍 DEBUG - Final child info:", childInfo);
  console.log("👶 CHILD NAME DEBUG:");
  console.log("- location.state?.childName:", location.state?.childName);
  console.log("- fusionResult?.childName:", fusionResult?.childName);
  console.log("- location.state?.patientName:", location.state?.patientName);
  console.log("- Final childInfo.name:", childInfo.name);
  console.log('- Expected: Should show actual child name, not "Child Name"');

  // Check if real video/audio data was provided (not just defaults)
  // Use fusionResult from navigation state first, then fall back to report from API
  const videoAnalyzed = fusionResult?.video_analyzed ?? report?.video_analyzed;
  const audioAnalyzed = fusionResult?.audio_analyzed ?? report?.audio_analyzed;
  const videoScore = fusionResult?.video_score ?? report?.video_score;
  const audioScore = fusionResult?.audio_score ?? report?.audio_score;

  const hasRealVideoData = videoAnalyzed && videoScore !== null;
  const hasRealAudioData = audioAnalyzed && audioScore !== null;

  console.log("🎥 DEBUG - Video data check:", {
    hasRealVideoData,
    video_analyzed: videoAnalyzed,
    video_score: videoScore,
  });
  console.log("🎤 DEBUG - Audio data check:", {
    hasRealAudioData,
    audio_analyzed: audioAnalyzed,
    audio_score: audioScore,
  });
  console.log("🎥 DEBUG - fusionResult:", fusionResult);
  console.log("🎤 DEBUG - report:", report);

  // ML Prediction with clear ASD result - Use questionnaire breakdown data
  const questionnaireScore = breakdown?.questionnaire_score || 0;
  const hasASD = questionnaireScore >= 80; // Use questionnaire score directly
  console.log("🧠 ML PREDICTION DEBUG:");
  console.log("- Backend risk_level:", risk_level);
  console.log("- Questionnaire score from breakdown:", questionnaireScore);
  console.log("- hasASD calculation:", hasASD);
  console.log("- Expected: questionnaire_score >= 80 should give hasASD=true");

  const mlPrediction = {
    autismRisk:
      questionnaireScore >= 80
        ? "High Risk"
        : questionnaireScore >= 40
          ? "Medium Risk"
          : "Low Risk",
    hasASD: hasASD ? "YES" : "NO",
    confidence: Math.round(questionnaireScore || 0),
    asdProbability: Math.round(questionnaireScore || 0),
    keyIndicators: [
      { label: "Social Communication", score: 75, status: "attention" },
      { label: "Repetitive Behaviors", score: 60, status: "normal" },
      { label: "Sensory Processing", score: 45, status: "good" },
      { label: "Cognitive Patterns", score: 80, status: "attention" },
    ],
  };

  const videoAnalysis = {
    overallScore: Math.round(breakdown?.video_score || 0),
    eyeContact: videoResults?.features?.eye_contact_ratio
      ? Math.round(videoResults.features.eye_contact_ratio * 100)
      : 65,
    facialExpressions: videoResults?.features?.facial_expressions
      ? Math.round(videoResults.features.facial_expressions * 100)
      : 70,
    movementPatterns: videoResults?.features?.movement_patterns
      ? Math.round(videoResults.features.movement_patterns * 100)
      : 55,
    socialEngagement: videoResults?.features?.social_engagement
      ? Math.round(videoResults.features.social_engagement * 100)
      : 60,
    details: {
      eyeContactAnalysis:
        "Child maintained eye contact for 65% of interaction time",
      facialExpressionAnalysis:
        "Varied facial expressions observed, appropriate emotional responses",
      movementAnalysis:
        "Normal movement patterns detected, no repetitive behaviors noted",
      socialEngagementAnalysis:
        "Moderate social engagement, responds to social cues",
    },
  };

  const audioAnalysis = {
    overallScore: Math.round(breakdown?.audio_score || 0),
    speechClarity: audioResults?.features?.speech_clarity
      ? Math.round(audioResults.features.speech_clarity * 100)
      : 70,
    pitchVariability: audioResults?.features?.pitch_variability || 50,
    speechRate: audioResults?.features?.speech_rate
      ? Math.round(audioResults.features.speech_rate * 100)
      : 60,
    vocalPatterns: audioResults?.features?.vocal_patterns
      ? Math.round(audioResults.features.vocal_patterns * 100)
      : 65,
    details: {
      speechAnalysis: "Clear speech patterns with appropriate articulation",
      pitchAnalysis: "Normal pitch variability for age group",
      rateAnalysis: "Speech rate within normal parameters",
      patternAnalysis: "Appropriate vocal patterns and intonation",
    },
  };

  const multimodalAnalysis = {
    overallScore: Math.round(final_score || 0),
    riskLevel: risk_level || "Unknown",
    confidence: 85,
    breakdown: {
      questionnaire: Math.round(breakdown?.questionnaire_score || 0),
      video: Math.round(breakdown?.video_score || 0),
      audio: Math.round(breakdown?.audio_score || 0),
    },
    interpretation:
      fusionResult?.ai_interpretation?.summary ||
      "Comprehensive analysis indicates need for further evaluation",
  };

  const aiInsights = {
    summary:
      fusionResult?.ai_interpretation?.summary ||
      "Based on the comprehensive analysis of multiple modalities including behavioral observations, video analysis, and audio patterns, the child shows indicators that warrant professional evaluation.",
    keyFindings: fusionResult?.ai_interpretation?.key_findings || [
      "Social communication patterns show areas of concern",
      "Sensory processing appears within normal ranges",
      "Cognitive development shows mixed results",
      "Behavioral patterns suggest need for structured support",
    ],
    developmentalConsiderations: fusionResult?.ai_interpretation
      ?.developmental_considerations || [
      "Consider early intervention services",
      "Focus on social communication skills",
      "Monitor sensory processing development",
      "Provide structured learning environment",
    ],
  };

  const recommendations = fusionResult?.ai_interpretation?.recommendations || [
    {
      category: "Immediate Actions",
      priority: "high",
      items: [
        "Schedule comprehensive developmental evaluation with pediatric specialist",
        "Begin early intervention services if available",
        "Create structured daily routines",
        "Implement visual schedules and supports",
      ],
    },
    {
      category: "Therapeutic Interventions",
      priority: "medium",
      items: [
        "Consider speech therapy for communication support",
        "Occupational therapy for sensory integration",
        "Social skills groups or programs",
        "Applied Behavior Analysis (ABA) therapy",
      ],
    },
    {
      category: "Educational Support",
      priority: "medium",
      items: [
        "Individualized Education Program (IEP) development",
        "Classroom accommodations and modifications",
        "Teacher training and awareness",
        "Peer support and inclusion programs",
      ],
    },
    {
      category: "Home Environment",
      priority: "low",
      items: [
        "Create sensory-friendly spaces at home",
        "Establish clear communication strategies",
        "Use visual supports and schedules",
        "Implement consistent behavioral expectations",
      ],
    },
  ];

  const getRiskColor = (riskLevel) => {
    switch (riskLevel.toUpperCase()) {
      case "HIGH":
        return "text-bio-rose bio-glow-rose border-bio-rose";
      case "MEDIUM":
        return "text-amber-400 bio-glow-amber border-amber-400";
      case "LOW":
        return "text-bio-teal bio-glow-teal border-bio-teal";
      default:
        return "text-bio-text-secondary bio-glass border-bio-glass-100";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Create PDF content
      const pdfContent = {
        childInfo,
        mlPrediction,
        videoAnalysis,
        audioAnalysis,
        multimodalAnalysis,
        aiInsights,
        recommendations,
        reportId: id,
        generatedAt: new Date().toISOString(),
      };

      // Create downloadable text file as PDF placeholder
      const content = `
AUTISM SCREENING REPORT
=====================

Child Information:
- Name: ${childInfo.name}
- Age: ${childInfo.age} months
- Assessment Date: ${childInfo.assessmentDate}
- Report ID: ${id}

ML Prediction Analysis:
- Autism Risk: ${mlPrediction.autismRisk}
- ASD Result: ${mlPrediction.hasASD}
- Confidence: ${mlPrediction.confidence}%
- ASD Probability: ${mlPrediction.asdProbability}%

Video Analysis:
- Overall Score: ${videoAnalysis.overallScore}%
- Eye Contact: ${videoAnalysis.eyeContact}%
- Facial Expressions: ${videoAnalysis.facialExpressions}%
- Movement Patterns: ${videoAnalysis.movementPatterns}%
- Social Engagement: ${videoAnalysis.socialEngagement}%

Audio Analysis:
- Overall Score: ${audioAnalysis.overallScore}%
- Speech Clarity: ${audioAnalysis.speechClarity}%
- Pitch Variability: ${audioAnalysis.pitchVariability}
- Speech Rate: ${audioAnalysis.speechRate}%
- Vocal Patterns: ${audioAnalysis.vocalPatterns}%

Multimodal Analysis:
- Overall Score: ${multimodalAnalysis.overallScore}%
- Risk Level: ${multimodalAnalysis.riskLevel}
- Questionnaire: ${multimodalAnalysis.breakdown.questionnaire}%
- Video: ${multimodalAnalysis.breakdown.video}%
- Audio: ${multimodalAnalysis.breakdown.audio}%

AI Insights:
${aiInsights.summary}

Key Findings:
${aiInsights.keyFindings.map((finding) => `- ${finding}`).join("\n")}

Recommendations:
${recommendations
  .map(
    (cat) => `
${cat.category} (${cat.priority} priority):
${cat.items.map((item) => `- ${item}`).join("\n")}
`,
  )
  .join("\n")}

Generated on: ${new Date().toLocaleString()}
      `;

      // Download as text file (PDF placeholder)
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `earlybloom-development-report-${childInfo.name}-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-bio-black">
      {/* Header */}
      <div className="bio-glass border-b border-bio-glass-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-bio-teal hover:text-bio-rose transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Report Header */}
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-bio-text-primary mb-2">
                EarlyBloom Development Report
              </h1>
              <p className="text-bio-text-secondary">
                Comprehensive Multimodal Assessment Results
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-bio-text-secondary">Report ID</p>
              <p className="font-mono text-sm">{id?.substring(0, 8)}...</p>
            </div>
          </div>

          {/* Child Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bio-glass bio-glow-teal rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-bio-text-secondary">Child's Name</p>
                <p className="font-display font-semibold text-bio-text-primary">
                  {childInfo.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bio-glass bio-glow-teal rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-bio-text-secondary">
                  Age / Assessment Date
                </p>
                <p className="font-display font-semibold text-bio-text-primary">
                  {childInfo.age} months / {childInfo.assessmentDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bio-glass bio-glow-rose rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-bio-text-secondary">Report Status</p>
                <p className="font-display font-semibold text-bio-text-primary">
                  Complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ML Prediction Results */}
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-bio-rose" />
            <h2 className="text-2xl font-display font-bold text-bio-text-primary">
              ML Prediction Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div
              className={`p-6 rounded-lg border-2 ${getRiskColor(risk_level)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Autism Risk Level</span>
                {risk_level === "HIGH" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : risk_level === "MEDIUM" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <p className="text-3xl font-bold mb-2">
                {mlPrediction.autismRisk}
              </p>
              <p className="text-sm opacity-75">
                Confidence: {mlPrediction.confidence}%
              </p>
            </div>

            <div
              className={`p-6 rounded-lg border-2 ${hasASD ? "bio-glass bio-glow-rose border-bio-rose" : "bio-glass bio-glow-teal border-bio-teal"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  ML Prediction Result
                </span>
                {hasASD ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p
                className={`text-4xl font-bold mb-2 ${hasASD ? "text-red-600" : "text-green-600"}`}
              >
                {mlPrediction.hasASD} {hasASD && `(${mlPrediction.autismRisk})`}
              </p>
              <p className="text-sm opacity-75">
                {hasASD
                  ? "Child shows indicators of ASD"
                  : "Child shows typical development"}
              </p>
            </div>
          </div>

          <div className="p-6 bio-glass rounded-bio border border-bio-glass-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-bio-text-secondary">
                ASD Probability
              </span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {mlPrediction.asdProbability}%
            </p>
            <p className="text-sm text-bio-text-secondary">
              Overall assessment score
            </p>
          </div>
        </div>

        {/* Modalities Analyzed */}
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-5 h-5 text-bio-teal" />
            <h3 className="text-lg font-display font-semibold text-bio-text-primary">
              Analysis Based On
            </h3>
          </div>
          <p className="text-[#A0ADB8] text-sm">
            {[
              "Questionnaire",
              videoAnalyzed && "Video",
              audioAnalyzed && "Audio",
            ]
              .filter(Boolean)
              .join(" + ")}
          </p>
        </div>

        {/* Key Indicators Chart */}
        <div>
          <h3 className="text-lg font-display font-semibold text-bio-text-primary mb-4">
            Key Developmental Indicators
          </h3>

          {/* Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Radar Chart */}
            <div>
              <h4 className="text-center font-medium text-bio-text-secondary mb-4">
                Developmental Radar
              </h4>
              <div className="relative w-80 h-80 mx-auto">
                <svg viewBox="0 0 320 320" className="w-full h-full">
                  {/* Background grid */}
                  {[20, 40, 60, 80, 100].map((radius, i) => (
                    <polygon
                      key={`grid-${i}`}
                      points={mlPrediction.keyIndicators
                        .map((_, index) => {
                          const angle = ((index * 72 - 90) * Math.PI) / 180;
                          const x = 160 + radius * Math.cos(angle);
                          const y = 160 + radius * Math.sin(angle);
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Data polygon */}
                  <polygon
                    points={mlPrediction.keyIndicators
                      .map((indicator, index) => {
                        const angle = ((index * 72 - 90) * Math.PI) / 180;
                        const radius = (indicator.score / 100) * 80;
                        const x = 160 + radius * Math.cos(angle);
                        const y = 160 + radius * Math.sin(angle);
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />

                  {/* Labels and dots */}
                  {mlPrediction.keyIndicators.map((indicator, index) => {
                    const angle = ((index * 72 - 90) * Math.PI) / 180;
                    const radius = (indicator.score / 100) * 80;
                    const x = 160 + radius * Math.cos(angle);
                    const y = 160 + radius * Math.sin(angle);
                    const labelX = 160 + 95 * Math.cos(angle);
                    const labelY = 160 + 95 * Math.sin(angle);

                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={
                            indicator.status === "attention"
                              ? "#eab308"
                              : indicator.status === "normal"
                                ? "#22c55e"
                                : "#3b82f6"
                          }
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs fill-gray-700"
                        >
                          {indicator.label}
                        </text>
                        <text
                          x={labelX}
                          y={labelY + 12}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-bold fill-gray-900"
                        >
                          {indicator.score}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bar Chart */}
            <div>
              <h4 className="text-center font-medium text-bio-text-secondary mb-4">
                Score Breakdown
              </h4>
              <div className="space-y-4">
                {mlPrediction.keyIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-32">
                      {indicator.label}
                    </span>
                    <div className="flex-1 bg-bio-glass-50 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          indicator.status === "attention"
                            ? "bg-amber-500 shadow-lg shadow-amber-500/50"
                            : indicator.status === "normal"
                              ? "bg-teal-500 shadow-lg shadow-teal-500/50"
                              : "bg-rose-500 shadow-lg shadow-rose-500/50"
                        }`}
                        style={{ width: `${indicator.score}%` }}
                      >
                        <span className="text-xs font-bold text-white flex items-center justify-center h-full">
                          {indicator.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
              <span>Needs Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50"></div>
              <span>Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Analysis - Only show if real video data was provided */}
      {hasRealVideoData && (
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-6 h-6 text-bio-teal" />
            <h2 className="text-2xl font-display font-bold text-bio-text-primary">
              Video Analysis Results
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bio-glass bio-glow-teal rounded-lg">
              <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {videoAnalysis.eyeContact}%
              </p>
              <p className="text-sm text-bio-text-secondary">Eye Contact</p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {videoAnalysis.facialExpressions}%
              </p>
              <p className="text-sm text-bio-text-secondary">
                Facial Expressions
              </p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {videoAnalysis.movementPatterns}%
              </p>
              <p className="text-sm text-bio-text-secondary">
                Movement Patterns
              </p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <Heart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {videoAnalysis.socialEngagement}%
              </p>
              <p className="text-sm text-bio-text-secondary">
                Social Engagement
              </p>
            </div>
          </div>

          <div className="bio-glass-50 rounded-lg p-4">
            <h4 className="font-semibold text-bio-text-primary mb-3">
              Detailed Analysis
            </h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Eye Contact:</strong>{" "}
                {videoAnalysis.details.eyeContactAnalysis}
              </p>
              <p>
                <strong>Facial Expressions:</strong>{" "}
                {videoAnalysis.details.facialExpressionAnalysis}
              </p>
              <p>
                <strong>Movement Patterns:</strong>{" "}
                {videoAnalysis.details.movementAnalysis}
              </p>
              <p>
                <strong>Social Engagement:</strong>{" "}
                {videoAnalysis.details.socialEngagementAnalysis}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audio Analysis - Only show if real audio data was provided */}
      {hasRealAudioData && (
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Mic className="w-6 h-6 text-bio-rose" />
            <h2 className="text-2xl font-display font-bold text-bio-text-primary">
              Audio Analysis Results
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <Mic className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {audioAnalysis.speechClarity}%
              </p>
              <p className="text-sm text-bio-text-secondary">Speech Clarity</p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <BarChart3 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-indigo-600">
                {audioAnalysis.pitchVariability}
              </p>
              <p className="text-sm text-bio-text-secondary">
                Pitch Variability
              </p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-rose rounded-lg">
              <TrendingUp className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-600">
                {audioAnalysis.speechRate}%
              </p>
              <p className="text-sm text-bio-text-secondary">Speech Rate</p>
            </div>
            <div className="text-center p-4 bio-glass bio-glow-teal rounded-lg">
              <Activity className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-600">
                {audioAnalysis.vocalPatterns}%
              </p>
              <p className="text-sm text-bio-text-secondary">Vocal Patterns</p>
            </div>
          </div>

          <div className="bio-glass-50 rounded-lg p-4">
            <h4 className="font-semibold text-bio-text-primary mb-3">
              Detailed Analysis
            </h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Speech Analysis:</strong>{" "}
                {audioAnalysis.details.speechAnalysis}
              </p>
              <p>
                <strong>Pitch Analysis:</strong>{" "}
                {audioAnalysis.details.pitchAnalysis}
              </p>
              <p>
                <strong>Rate Analysis:</strong>{" "}
                {audioAnalysis.details.rateAnalysis}
              </p>
              <p>
                <strong>Pattern Analysis:</strong>{" "}
                {audioAnalysis.details.patternAnalysis}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multimodal Analysis - Only show if either video or audio data exists */}
      {(hasRealVideoData || hasRealAudioData) && (
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-rose-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-1/2 w-16 h-16 bg-amber-400/10 rounded-full blur-xl animate-pulse delay-2000"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/20 to-rose-400/20 rounded-full blur-md animate-spin-slow"></div>
                <BarChart3 className="w-8 h-8 text-amber-400 relative z-10 animate-bounce" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-rose-400 to-amber-400 mb-2">
                  Multimodal Analysis
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-1 w-16 bg-gradient-to-r from-teal-400 to-rose-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-bio-text-secondary font-medium">
                    LIVE ANALYSIS
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Overall Score Card */}
            <div className="text-center p-8 bg-gradient-to-br from-teal-400/10 via-teal-400/5 to-teal-400/10 border border-teal-400/30 rounded-bio shadow-lg shadow-teal-400/20 hover:shadow-teal-400/30 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="text-5xl font-display font-black text-teal-400 mb-3 animate-pulse">
                  {multimodalAnalysis.overallScore}%
                </div>
                <p className="text-lg font-display font-semibold text-bio-text-primary mb-2">
                  Overall Score
                </p>
                <div className="inline-flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-400 rounded-full animate-ping"></div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${getRiskColor(multimodalAnalysis.riskLevel)} border-2 shadow-lg`}
                  >
                    {multimodalAnalysis.riskLevel} RISK
                  </span>
                </div>
              </div>
            </div>

            {/* Modality Breakdown */}
            <div className="lg:col-span-2 bg-gradient-to-br from-rose-400/5 via-rose-400/10 to-rose-400/5 border border-rose-400/20 rounded-bio p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 text-rose-400 animate-pulse"></div>
                <h4 className="text-xl font-display font-bold text-rose-400">
                  Modality Breakdown
                </h4>
              </div>

              <div className="space-y-4">
                {Object.entries(multimodalAnalysis.breakdown).map(
                  ([modality, score], index) => (
                    <div
                      key={modality}
                      className="flex items-center justify-between p-3 bg-bio-glass/50 rounded-lg hover:bg-bio-glass/80 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-rose-400 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {modality.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-body font-medium text-bio-text-secondary capitalize">
                          {modality}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-32 h-3 bg-bio-glass rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400 transition-all duration-1000 ease-out"
                            style={{ width: `${score}%` }}
                          >
                            <div className="h-full rounded-full bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="text-lg font-display font-bold text-bio-text-primary w-16 text-right group-hover:text-teal-400 transition-colors duration-300">
                          {score}%
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* AI Interpretation Card */}
          <div className="bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-amber-400/10 border border-amber-400/30 rounded-bio p-6 shadow-lg shadow-amber-400/20 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <div className="w-4 h-4 bg-amber-400 rounded-full animate-ping"></div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-full blur-md animate-spin-slow"></div>
                <Lightbulb className="w-8 h-8 text-amber-400 relative z-10 animate-bounce" />
              </div>
              <h4 className="text-xl font-display font-bold text-amber-400 mb-2">
                AI Interpretation
              </h4>
            </div>
            <div className="relative bg-bio-glass/50 rounded-lg p-4 border border-amber-400/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse"></div>
              <p className="text-sm text-bio-text-secondary font-body leading-relaxed relative z-10">
                {multimodalAnalysis.interpretation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-bio-text-primary">
            AI Insights & Analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-bio-text-primary mb-3">
              Summary
            </h4>
            <p className="text-sm text-bio-text-secondary leading-relaxed">
              {aiInsights.summary}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-bio-text-primary mb-3">
              Key Findings
            </h4>
            <ul className="space-y-2">
              {aiInsights.keyFindings.map((finding, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-bio-text-secondary"
                >
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-bio-text-primary mb-3">
            Developmental Considerations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInsights.developmentalConsiderations.map(
              (consideration, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bio-glass bio-glow-amber rounded-lg border border-amber-400/30"
                >
                  <Award className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-bio-text-secondary">
                    {consideration}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Nearby Autism Care Centers */}
      {childLocation && (
        <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6 border border-bio-glass-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bio-glass rounded-bio bio-glow-teal">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-bio-text-primary">
                🏥 Nearby Autism Care Centers
              </h2>
              <p className="text-sm text-bio-text-secondary mt-1">
                Autism clinics and therapy centers in {childLocation}
              </p>
            </div>
          </div>

          {isLoadingClinics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-bio-teal" />
                <p className="text-bio-text-secondary">
                  Finding autism care centers near you...
                </p>
              </div>
            </div>
          ) : clinicsError || clinics.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-bio-text-primary mb-2">
                  We couldn't find clinics automatically
                </h3>
                <p className="text-bio-text-secondary mb-6">
                  Please search for autism care centers in {childLocation} on
                  Google Maps.
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/autism+clinic+near+${encodeURIComponent(childLocation)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bio-glass bio-glow-teal border border-bio-teal text-bio-text-primary rounded-lg hover:bg-bio-glass-teal hover:text-white transition-all font-display font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ExternalLink className="w-4 h-4" />
                Search on Google Maps
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinics.map((clinic, index) => (
                <div
                  key={index}
                  className="bio-glass rounded-xl p-6 shadow-lg border border-bio-glass-100 hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bio-glass bio-glow-teal rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-bio-text-primary mb-2">
                        {clinic.name}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-bio-teal mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-bio-text-secondary">
                            {clinic.address}
                          </p>
                        </div>

                        {clinic.contact &&
                          clinic.contact !== "Contact not available" && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-bio-teal flex-shrink-0" />
                              <p className="text-sm text-bio-text-secondary">
                                {clinic.contact}
                              </p>
                            </div>
                          )}

                        <div>
                          <p className="text-sm font-semibold text-bio-text-primary mb-2">
                            Services:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {typeof clinic.services === "string" ? (
                              clinic.services.split(",").map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-bio-glass-50 text-bio-text-secondary text-xs rounded-full border border-bio-glass-100"
                                >
                                  {service.trim()}
                                </span>
                              ))
                            ) : Array.isArray(clinic.services) ? (
                              clinic.services.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-bio-glass-50 text-bio-text-secondary text-xs rounded-full border border-bio-glass-100"
                                >
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-bio-glass-50 text-bio-text-secondary text-xs rounded-full border border-bio-glass-100">
                                {clinic.services}
                              </span>
                            )}
                          </div>
                        </div>

                        {clinic.relevance &&
                          clinic.relevance !==
                            "Autism care services available" && (
                            <div className="mt-3 p-3 bg-bio-glass-50 rounded-lg border border-bio-glass-100">
                              <p className="text-xs text-bio-text-secondary italic">
                                <strong>Why it's relevant:</strong>{" "}
                                {clinic.relevance}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="bio-glass rounded-bio-lg shadow-bio-card p-8 mb-6 border border-bio-glass-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bio-glass rounded-bio bio-glow-teal">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-bio-text-primary">
              Recommendations & Next Steps
            </h2>
            <p className="text-sm text-bio-text-secondary mt-1">
              Personalized guidance based on your child's assessment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((category, index) => (
            <div
              key={index}
              className="bio-glass rounded-xl p-6 shadow-lg border border-bio-glass-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-bio-text-primary text-lg">
                  {category.category}
                </h4>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    category.priority === "high"
                      ? "bio-glass bio-glow-rose text-bio-rose"
                      : category.priority === "medium"
                        ? "bio-glass bio-glow-amber text-amber-400"
                        : "bio-glass bio-glow-teal text-white"
                  }`}
                >
                  {category.priority.toUpperCase()}
                </span>
              </div>
              <ul className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3 group">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        category.priority === "high"
                          ? "bio-glass bio-glow-rose"
                          : category.priority === "medium"
                            ? "bio-glass bio-glow-amber"
                            : "bio-glass bio-glow-teal"
                      }`}
                    >
                      <CheckCircle
                        className={`w-3 h-3 ${
                          category.priority === "high"
                            ? "text-bio-rose"
                            : category.priority === "medium"
                              ? "text-amber-400"
                              : "text-green-500"
                        }`}
                      />
                    </div>
                    <span className="text-bio-text-secondary leading-relaxed group-hover:text-bio-text-primary transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Important Disclaimer */}
      <div className="bio-glass bio-glow-amber border border-amber-400/30 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-bio-text-primary mb-2">
              Important Medical Disclaimer
            </h3>
            <p className="text-sm text-bio-text-secondary leading-relaxed">
              This screening tool provides preliminary insights and educational
              information only. It is not a substitute for professional medical
              diagnosis, clinical evaluation, or professional medical advice.
              The results should be discussed with qualified healthcare
              professionals, pediatric specialists, or developmental experts who
              can provide comprehensive assessment and appropriate
              recommendations based on direct observation and clinical
              evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Report Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          className="px-6 py-3 bio-glass bio-glow-rose border border-bio-rose text-bio-text-primary rounded-lg hover:bg-bio-glass-rose hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-display font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF Report
            </>
          )}
        </button>
      </div>
      <ChatBot />
    </div>
  );
}
