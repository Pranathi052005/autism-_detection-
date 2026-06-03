import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { useCreateSession, useUpdateSession } from "../hooks/useSession";
import {
  useVideoAnalysis,
  useAudioAnalysis,
  useFullScreening,
  encodeAnswers,
} from "../hooks/useScreening";
import {
  UploadCloud,
  FileVideo,
  FileAudio,
  X,
  Loader2,
  User,
  Film,
  Headphones,
  ClipboardList,
  Check,
  ChevronRight,
  ChevronLeft,
  Zap,
} from "lucide-react";

const QUESTIONS = [
  {
    id: "A1",
    text: "Does your child look at you when you call his/her name?",
    options: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
  },
  {
    id: "A2",
    text: "How easy is it to get eye contact with your child?",
    options: ["Very Easy", "Easy", "Average", "Difficult", "Very Difficult"],
  },
  {
    id: "A3",
    text: "Does your child point to ask for something they want?",
    options: [
      "Many times a day",
      "A few times a day",
      "A few times a week",
      "Less than once a week",
      "Never",
    ],
  },
  {
    id: "A4",
    text: "Does your child point to share interest with you?",
    options: [
      "Many times a day",
      "A few times a day",
      "A few times a week",
      "Less than once a week",
      "Never",
    ],
  },
  {
    id: "A5",
    text: "Does your child engage in pretend play?",
    options: [
      "Many times a day",
      "A few times a day",
      "A few times a week",
      "Less than once a week",
      "Never",
    ],
  },
  {
    id: "A6",
    text: "Does your child follow where you are looking?",
    options: [
      "Many times a day",
      "A few times a day",
      "A few times a week",
      "Less than once a week",
      "Never",
    ],
  },
  {
    id: "A7",
    text: "If someone is upset, does your child try to comfort them?",
    options: ["Always", "Usually", "Sometimes", "Rarely", "Never"],
  },
  {
    id: "A8",
    text: "How would you describe your child's first words?",
    options: [
      "Very typical",
      "Typical",
      "Slightly unusual",
      "Very unusual",
      "No words yet",
    ],
  },
  {
    id: "A9",
    text: "Does your child use simple gestures (e.g. waving goodbye)?",
    options: [
      "Many times a day",
      "A few times a day",
      "A few times a week",
      "Less than once a week",
      "Never",
    ],
  },
  {
    id: "A10",
    text: "Does your child stare at nothing with no apparent purpose?",
    options: [
      "Never",
      "Less than once a week",
      "A few times a week",
      "A few times a day",
      "Many times a day",
    ],
  },
];

// Function to encode answers for ML model
const encodeAnswer = (questionId, answer) => {
  const atRiskAnswers = {
    A1: ["Sometimes", "Rarely", "Never"],
    A2: ["Difficult", "Very Difficult"],
    A3: ["A few times a week", "Less than once a week", "Never"],
    A4: ["A few times a week", "Less than once a week", "Never"],
    A5: ["A few times a week", "Less than once a week", "Never"],
    A6: ["A few times a week", "Less than once a week", "Never"],
    A7: ["Sometimes", "Rarely", "Never"],
    A8: ["Slightly unusual", "Very unusual", "No words yet"],
    A9: ["A few times a week", "Less than once a week", "Never"],
    A10: ["A few times a day", "Many times a day"],
  };
  const encoded = atRiskAnswers[questionId]?.includes(answer) ? 1 : 0;
  console.log(
    `🔍 ENCODING: Question ${questionId}, Answer: "${answer}", Encoded: ${encoded}`,
  );
  return encoded;
};

export default function NewSession() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm({ mode: "onChange" });
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [justChangedStep, setJustChangedStep] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [childDetails, setChildDetails] = useState(null);

  const { mutateAsync: createSession, isPending } = useCreateSession();
  const { mutateAsync: updateSession } = useUpdateSession();
  const navigate = useNavigate();

  // Multimodal analysis hooks
  const videoAnalysis = useVideoAnalysis();
  const audioAnalysis = useAudioAnalysis();
  const fullScreening = useFullScreening();

  // Multimodal analysis state
  const [videoResults, setVideoResults] = useState(null);
  const [audioResults, setAudioResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  const [videoPreviews, setVideoPreviews] = useState({});
  const [audioPreviews, setAudioPreviews] = useState({});

  useEffect(() => {
    const vPreviews = {};
    videos.forEach((v) => {
      vPreviews[v.name] = URL.createObjectURL(v);
    });
    setVideoPreviews(vPreviews);
    return () => {
      Object.values(vPreviews).forEach(URL.revokeObjectURL);
    };
  }, [videos]);

  useEffect(() => {
    const aPreviews = {};
    audios.forEach((a) => {
      aPreviews[a.name] = URL.createObjectURL(a);
    });
    setAudioPreviews(aPreviews);
    return () => {
      Object.values(aPreviews).forEach(URL.revokeObjectURL);
    };
  }, [audios]);

  const onVideoDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0)
      setVideos((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const onAudioDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0)
      setAudios((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const {
    getRootProps: getVideoProps,
    getInputProps: getVideoInput,
    isDragActive: isVideoDrag,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: { "video/*": [] },
  });

  const {
    getRootProps: getAudioProps,
    getInputProps: getAudioInput,
    isDragActive: isAudioDrag,
  } = useDropzone({
    onDrop: onAudioDrop,
    accept: { "audio/*": [] },
  });

  const loadDemoData = () => {
    setValue("patientName", "Leo");
    setValue("ageMonths", 24);
    setValue("sex", "m");
    setValue("jaundice", "no");
    setValue("familyAsd", "no");
    setValue("location", "Hyderabad");
    setValue("notes", "Leo sometimes ignores us when playing with blocks.");

    // Set demo answers for each question
    setValue("q_A1", "Sometimes");
    setValue("q_A2", "Average");
    setValue("q_A3", "A few times a week");
    setValue("q_A4", "Less than once a week");
    setValue("q_A5", "A few times a week");
    setValue("q_A6", "A few times a day");
    setValue("q_A7", "Sometimes");
    setValue("q_A8", "Typical");
    setValue("q_A9", "A few times a day");
    setValue("q_A10", "Never");
  };

  const validateStep = (currentStep) => {
    const values = watch();

    if (currentStep === 1) {
      // Validate child details
      if (!values.patientName || values.patientName.trim() === "") {
        alert("Please enter the child's name");
        return false;
      }
      if (!values.ageMonths || values.ageMonths < 1 || values.ageMonths > 200) {
        alert("Please enter a valid age (1-200 months)");
        return false;
      }
      if (!values.sex) {
        alert("Please select the child's gender");
        return false;
      }
      if (!values.jaundice) {
        alert("Please specify if the child had neonatal jaundice");
        return false;
      }
      if (!values.familyAsd) {
        alert("Please specify family ASD history");
        return false;
      }
      if (!values.location || values.location.trim() === "") {
        alert("Please enter your city/location");
        return false;
      }
    }

    if (currentStep === 2) {
      // Validate questionnaire
      for (const q of QUESTIONS) {
        if (!values[`q_${q.id}`]) {
          alert(`Please answer question ${q.id}: ${q.text}`);
          return false;
        }
      }
    }

    return true;
  };

  const getStepValidationStatus = (currentStep) => {
    const values = watch();

    if (currentStep === 1) {
      const required = [
        "patientName",
        "ageMonths",
        "sex",
        "jaundice",
        "familyAsd",
        "location",
      ];
      const completed = required.filter(
        (field) => values[field] && values[field] !== "",
      ).length;
      return { completed, total: required.length };
    }

    if (currentStep === 2) {
      const completed = QUESTIONS.filter((q) => values[`q_${q.id}`]).length;
      return { completed, total: QUESTIONS.length };
    }

    return { completed: 0, total: 0 };
  };

  const nextStep = () => {
    console.log(
      `📍 nextStep called: current step = ${step}, totalSteps = ${totalSteps}`,
    );
    if (validateStep(step)) {
      if (step < totalSteps) {
        console.log(`✅ Moving to step ${step + 1}`);
        setJustChangedStep(true);
        setStep(step + 1);
        // Reset the flag after 100ms to prevent auto-submission
        setTimeout(() => setJustChangedStep(false), 100);
      } else {
        console.log(
          `❌ Cannot advance: step ${step} >= totalSteps ${totalSteps}`,
        );
      }
    } else {
      console.log(`❌ Step ${step} validation failed`);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data) => {
    console.log(
      `🚀 onSubmit called! Current step: ${step}, justChangedStep: ${justChangedStep}`,
    );
    console.log("📊 Form data:", data);
    console.log("📊 Form data keys:", Object.keys(data));

    // Prevent submission if step just changed (to prevent auto-submission)
    if (justChangedStep) {
      console.log("❌ Blocking submission - step just changed");
      return;
    }

    setIsAnalyzing(true);
    setVideoResults(null);
    setAudioResults(null);

    try {
      if (step === 1) {
        // Step 1: Create session with child details and questionnaire
        console.log(
          "🚀 Step 1: Creating session with child details and questionnaire...",
        );

        const formData = new FormData();
        formData.append("patientName", data.patientName);
        formData.append("ageMonths", data.ageMonths);
        formData.append("sex", data.sex);
        formData.append("jaundice", data.jaundice);
        formData.append("familyAsd", data.familyAsd);
        formData.append("notes", data.notes || "");

        // Process questionnaire answers with encoding
        const answers = QUESTIONS.map((q) => ({
          questionId: q.id,
          question: q.text,
          answer: data[`q_${q.id}`],
          encoded: encodeAnswer(q.id, data[`q_${q.id}`]),
        }));
        formData.append("questionnaire", JSON.stringify(answers));

        // Create encoded features for ML model
        const encodedFeatures = {};
        QUESTIONS.forEach((q) => {
          encodedFeatures[q.id] = encodeAnswer(q.id, data[`q_${q.id}`]);
        });
        formData.append("encodedFeatures", JSON.stringify(encodedFeatures));

        console.log("📤 Submitting to /api/sessions...");
        const sessionResult = await createSession(formData);
        setSessionResult(sessionResult);

        // Store child details for later use
        console.log("🔍 RAW FORM DATA - patientName:", data.patientName);
        console.log(
          "🔍 RAW FORM DATA - all data:",
          JSON.stringify(data, null, 2),
        );

        const childDetailsData = {
          patientName: data.patientName,
          ageMonths: data.ageMonths,
          sex: data.sex,
          jaundice: data.jaundice,
          familyAsd: data.familyAsd,
          location: data.location,
          notes: data.notes,
        };
        console.log("👶 SETTING CHILD DETAILS:", childDetailsData);
        setChildDetails(childDetailsData);

        console.log("✅ Session created:", sessionResult);
        console.log("📊 Session result keys:", Object.keys(sessionResult));
        console.log("📊 ML prediction:", sessionResult.ml_prediction);
        console.log("📊 Child details stored:", childDetails);

        // Move to next step
        setStep(2);
      } else if (step === 2) {
        // Step 2: Store questionnaire data locally
        console.log("🚀 Step 2: Storing questionnaire data...");

        // Process questionnaire answers with encoding
        const answers = QUESTIONS.map((q) => ({
          questionId: q.id,
          question: q.text,
          answer: data[`q_${q.id}`],
          encoded: encodeAnswer(q.id, data[`q_${q.id}`]),
        }));

        // Create encoded features for ML model
        const encodedFeatures = {};
        QUESTIONS.forEach((q) => {
          encodedFeatures[q.id] = encodeAnswer(q.id, data[`q_${q.id}`]);
        });

        // Store questionnaire data locally
        const qData = {
          answers: answers,
          encodedFeatures: encodedFeatures,
        };

        setQuestionnaireData(qData);
        console.log("✅ Questionnaire data stored locally");
        console.log("📊 Questionnaire answers:", answers);
        console.log("📊 Encoded features:", encodedFeatures);

        // Move to next step
        setStep(3);
      } else if (step === 3) {
        // Step 3: Create session with questionnaire data, then multimodal analysis
        console.log("🚀 Step 3: Creating session with questionnaire data...");

        if (questionnaireData && childDetails) {
          // Create a new session with both child details and questionnaire
          const formData = new FormData();
          formData.append("patientName", childDetails.patientName);
          formData.append("ageMonths", childDetails.ageMonths);
          formData.append("sex", childDetails.sex);
          formData.append("jaundice", childDetails.jaundice);
          formData.append("familyAsd", childDetails.familyAsd);
          formData.append("notes", childDetails.notes);

          // Add questionnaire data
          formData.append(
            "questionnaire",
            JSON.stringify(questionnaireData.answers),
          );
          formData.append(
            "encodedFeatures",
            JSON.stringify(questionnaireData.encodedFeatures),
          );

          console.log("📤 Creating session with questionnaire data...");
          const fullSessionResult = await createSession(formData);
          setSessionResult(fullSessionResult);
          console.log(
            "✅ Session created with questionnaire:",
            fullSessionResult,
          );

          // Wait for background task to complete and fetch report with ML prediction
          setAnalysisStep("Processing ML prediction...");
          console.log("⏳ Waiting for ML prediction...");

          // Poll for the report until ML prediction is available
          let attempts = 0;
          const maxAttempts = 10; // 10 attempts with 3-second delay = 30 seconds max

          while (attempts < maxAttempts) {
            attempts++;
            console.log(
              `📊 Checking report (attempt ${attempts}/${maxAttempts})...`,
            );

            try {
              const reportResponse = await fetch(
                `/api/sessions/${fullSessionResult.id}/report`,
              );
              const reportData = await reportResponse.json();

              console.log("📊 Report data:", reportData);

              if (
                reportData.ml_prediction &&
                Object.keys(reportData.ml_prediction).length > 0
              ) {
                console.log("✅ ML prediction available!");
                setSessionResult(reportData);
                console.log("📊 ML prediction:", reportData.ml_prediction);
                break;
              }

              if (reportData.status === "completed") {
                console.log("✅ Task completed but no ML prediction found");
                break;
              }

              if (reportData.status === "failed") {
                console.log("❌ Task failed");
                break;
              }

              // Wait 3 seconds before next attempt
              await new Promise((resolve) => setTimeout(resolve, 3000));
            } catch (error) {
              console.error("❌ Error fetching report:", error);
              break;
            }
          }

          if (attempts >= maxAttempts) {
            console.log(
              "⏱️ Timeout waiting for ML prediction, proceeding without it",
            );
          }
        }

        console.log("🚀 Starting full multimodal analysis...");

        // Calculate questionnaire probability from actual answers
        console.log("🚀 DEBUG: Starting questionnaire analysis...");
        console.log("🚀 DEBUG: Raw form data:", JSON.stringify(data, null, 2));

        const encodedAnswers = encodeAnswers({});
        let answersFound = 0;

        QUESTIONS.forEach((q) => {
          const answer = data[`q_${q.id}`];
          console.log(
            `🚀 DEBUG: Question ${q.id} - Looking for data['q_${q.id}'] = "${answer}"`,
          );

          if (answer) {
            answersFound++;
            const encoded = encodeAnswer(q.id, answer);
            encodedAnswers[q.id] = encoded;
            console.log(
              `🚀 DEBUG: ✅ Question ${q.id} - Answer: "${answer}" -> Encoded: ${encoded}`,
            );
          } else {
            console.log(`🚀 DEBUG: ❌ Question ${q.id} - No answer found`);
          }
        });

        const totalRiskScore = Object.values(encodedAnswers).reduce(
          (sum, val) => sum + val,
          0,
        );
        let questionnaireProba = Math.min(totalRiskScore / 10, 1.0); // Convert to 0-1 range

        console.log("🔍 CALCULATED QUESTIONNAIRE PROBABILITY:");
        console.log(
          "- Answers found:",
          answersFound,
          "out of",
          QUESTIONS.length,
        );
        console.log(
          "- Encoded answers:",
          JSON.stringify(encodedAnswers, null, 2),
        );
        console.log("- Total Risk Score:", totalRiskScore);
        console.log("- Probability:", questionnaireProba);
        console.log(
          '- Expected: All "Never" answers should give score=10, probability=1.0, ASD=YES',
        );

        // Additional validation
        if (answersFound === 0) {
          console.error(
            "🚨 CRITICAL: No questionnaire answers found! Check form field names.",
          );
        } else if (totalRiskScore < 7) {
          console.warn(
            '⚠️ WARNING: Low risk score detected. User may not have selected all "Never" options.',
          );
        } else {
          console.log(
            "✅ SUCCESS: High risk score detected. Should predict ASD=YES.",
          );
        }

        // Normalize: if > 1.0 it's a percentage, convert to decimal
        if (questionnaireProba > 1.0) {
          questionnaireProba = questionnaireProba / 100;
        }

        // Clamp to valid range
        questionnaireProba = Math.min(Math.max(questionnaireProba, 0.0), 1.0);

        console.log("📤 STEP 3: Submitting to /api/screening/full...");
        console.log("🔍 Questionnaire Probability:", questionnaireProba);
        console.log(
          "🔍 Expected: All Never answers should give HIGH risk/ASD=YES",
        );
        console.log(
          "🔍 Final questionnaire answers being sent:",
          JSON.stringify(encodedAnswers, null, 2),
        );

        // Initialize variables with safe defaults
        let videoRiskScore = 0.5;
        let videoFeatures = {
          eye_contact_ratio: 0.5,
          head_movement_std: 0.03,
          face_detected_ratio: 0.8,
          total_frames: 0,
        };

        let audioRiskScore = 0.5;
        let audioFeatures = {
          pitch_variability: 50.0,
          energy_mean: 0.02,
          speech_rate: 0.1,
          duration_seconds: 0.0,
        };

        // STEP 1: Analyze video if uploaded
        if (videos.length > 0) {
          console.log("🎥 STEP 1: Analyzing video...");
          setAnalysisStep("Analyzing video...");

          try {
            const videoResult = await videoAnalysis.mutateAsync(videos[0]);
            setVideoResults(videoResult);
            videoRiskScore =
              videoResult.video_risk_score ?? videoResult.risk_score ?? 0.5;
            videoFeatures = videoResult.features ?? {
              eye_contact_ratio: videoResult.eye_contact_ratio ?? 0.5,
              head_movement_std: videoResult.head_movement_std ?? 0.03,
              face_detected_ratio: videoResult.face_detected_ratio ?? 0.8,
              total_frames: videoResult.total_frames ?? 0,
            };
            console.log("✅ Video analysis completed:", videoResult);
          } catch (error) {
            console.error("❌ Video analysis failed:", error);
            setVideoResults({ success: false, error: "Video analysis failed" });
          }
        }

        // STEP 2: Analyze audio if uploaded
        if (audios.length > 0) {
          console.log("🎵 STEP 2: Analyzing audio...");
          setAnalysisStep("Analyzing audio...");

          try {
            const audioResult = await audioAnalysis.mutateAsync(audios[0]);
            setAudioResults(audioResult);
            audioRiskScore =
              audioResult.audio_risk_score ?? audioResult.risk_score ?? 0.5;
            audioFeatures = audioResult.features ?? {
              pitch_variability: audioResult.pitch_variability ?? 50.0,
              energy_mean: audioResult.energy_mean ?? 0.02,
              speech_rate: audioResult.speech_rate ?? 0.1,
              duration_seconds: audioResult.duration_seconds ?? 0.0,
            };
            console.log("✅ Audio analysis completed:", audioResult);
          } catch (error) {
            console.error("❌ Audio analysis failed:", error);
            setAudioResults({ success: false, error: "Audio analysis failed" });
          }
        }

        // STEP 3: Send JSON to /full endpoint
        setAnalysisStep("Creating final assessment...");

        console.log("📤 STEP 3: Submitting to /api/screening/full...");
        console.log("🎥 Video files:", videos);
        console.log("🎵 Audio files:", audios);
        console.log("🎥 Video risk score:", videoRiskScore);
        console.log("🎵 Audio risk score:", audioRiskScore);
        console.log("🎥 Video features:", videoFeatures);
        console.log("🎵 Audio features:", audioFeatures);

        // Only include video/audio in payload if files were uploaded
        const fusionData = {
          questionnaire_proba: questionnaireProba,
          questionnaire_answers: encodedAnswers,
          child_age_months: parseInt(data.ageMonths) || 24,
          ...(videos.length > 0 && {
            video_risk_score: videoRiskScore,
            video_features: videoFeatures,
          }),
          ...(audios.length > 0 && {
            audio_risk_score: audioRiskScore,
            audio_features: audioFeatures,
          }),
        };

        console.log("📦 Payload being sent:", fusionData);

        console.log("📤 STEP 3: Submitting to /api/screening/full...");
        console.log("🚨 FINAL DEBUG - Complete fusionData being sent:");
        console.log(JSON.stringify(fusionData, null, 2));
        console.log(
          "🎯 CRITICAL DEBUG - questionnaire_proba:",
          fusionData.questionnaire_proba,
        );
        console.log(
          "🎯 CRITICAL DEBUG - questionnaire_answers:",
          JSON.stringify(fusionData.questionnaire_answers, null, 2),
        );
        console.log(
          '🎯 CRITICAL DEBUG - Expected: All "Never" answers should give questionnaire_proba=1.0',
        );
        console.log(
          "questionnaire_proba:",
          fusionData.questionnaire_proba,
          typeof fusionData.questionnaire_proba,
        );
        console.log(
          "child_age_months:",
          fusionData.child_age_months,
          typeof fusionData.child_age_months,
        );
        console.log(
          "video_risk_score:",
          fusionData.video_risk_score,
          typeof fusionData.video_risk_score,
        );
        console.log(
          "audio_risk_score:",
          fusionData.audio_risk_score,
          typeof fusionData.audio_risk_score,
        );
        console.log("questionnaire_answers:", fusionData.questionnaire_answers);
        console.log("video_features:", fusionData.video_features);
        console.log("audio_features:", fusionData.audio_features);

        const fusionResult = await fullScreening.mutateAsync(fusionData);
        console.log("✅ Full screening completed:", fusionResult);
        console.log("📊 Fusion result keys:", Object.keys(fusionResult));
        console.log(
          "🎯 Screening ID for navigation:",
          fusionResult.screening_id,
        );

        // Navigate to report with fusion results
        const reportUrl = `/report/${fusionResult.screening_id}`;
        console.log("🚀 Navigating to:", reportUrl);
        console.log("🚀 NAVIGATION DEBUG - About to navigate to report");
        console.log("👶 childDetails at navigation:", childDetails);
        console.log("👶 childDetails?.patientName:", childDetails?.patientName);

        // Get current form values as backup
        const currentFormValues = watch();
        console.log("� CURRENT FORM VALUES:", currentFormValues);
        console.log(
          "🔍 CURRENT FORM patientName:",
          currentFormValues.patientName,
        );

        // Use multiple sources to get the child's name
        const finalChildName =
          childDetails?.patientName ||
          currentFormValues.patientName ||
          "Child Name";
        console.log("👶 FINAL childName being passed:", finalChildName);

        navigate(reportUrl, {
          state: {
            fusionResult,
            videoResults: videoResults || {
              features: { error: "No video analysis performed" },
            },
            audioResults: audioResults || {
              features: { error: "No audio analysis performed" },
            },
            childName: finalChildName,
            childAgeMonths:
              childDetails?.ageMonths || currentFormValues.ageMonths || 24,
            childLocation:
              childDetails?.location || currentFormValues.location || "",
            parentName: childDetails?.parentName || "Parent Name",
          },
        });
      }
    } catch (error) {
      console.error("❌ Error in analysis:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      // Show user-friendly error message
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Analysis failed. Please try again.";
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 relative z-10 overflow-hidden py-12">
      <div className="absolute top-20 right-20 w-96 h-96 bg-brand-primary rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float -z-10"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-delayed -z-10"></div>

      <div className="w-full max-w-2xl glass-card rounded-[2.5rem] shadow-xl border border-white block-fade-in flex flex-col h-auto min-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bio-glass border-b border-bio-glass-100 px-8 py-6 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-bio-text-primary">
              New Assessment
            </h2>
            <button
              type="button"
              onClick={loadDemoData}
              className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-200 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Try Demo Data
            </button>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all duration-700 ${step >= s ? "bg-bio-rose" : "bg-bio-glass-50"}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-display font-bold text-bio-text-secondary mt-2 px-1">
            <span className={step >= 1 ? "text-purple-600" : ""}>
              Child Details
            </span>
            <span className={step >= 2 ? "text-purple-600" : ""}>
              Questionnaire
            </span>
            <span className={step >= 3 ? "text-purple-600" : ""}>
              Multimodal Upload
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          <form
            id="assessment-form"
            onSubmit={handleSubmit(onSubmit)}
            className="h-full"
          >
            {step === 1 && (
              <div className="space-y-6 fade-in h-full flex flex-col justify-center">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white animate-float">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-bio-text-primary">
                    Child Details
                  </h3>
                  <p className="text-bio-500 font-medium font-sm">
                    Let's start with the basics. Every child is unique 💙
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Child's First Name <span className="text-bio-rose">*</span>
                  </label>
                  <input
                    {...register("patientName", { required: true })}
                    className="w-full px-5 py-3.5 bg-bio-glass border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-normal text-bio-text-primary shadow-sm bio-focus-ring"
                    placeholder="e.g. Leo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Age in Months <span className="text-bio-rose">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("ageMonths", { required: true, min: 1 })}
                    className="w-full px-5 py-3.5 bg-bio-glass border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-normal text-bio-text-primary shadow-sm bio-focus-ring"
                    placeholder="e.g. 24"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Child's Gender <span className="text-bio-rose">*</span>
                  </label>
                  <select
                    {...register("sex", { required: true })}
                    className="w-full px-5 py-3.5 bg-[#080B0F] border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-medium text-white shadow-sm bio-focus-ring"
                    style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                  >
                    <option
                      value=""
                      style={{ backgroundColor: "#080B0F", color: "#A0ADB8" }}
                    >
                      Select Gender
                    </option>
                    <option
                      value="m"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      Male
                    </option>
                    <option
                      value="f"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      Female
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Had Neonatal Jaundice?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("jaundice", { required: true })}
                    className="w-full px-5 py-3.5 bg-[#080B0F] border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-medium text-white bio-focus-ring shadow-sm"
                    style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                  >
                    <option
                      value=""
                      style={{ backgroundColor: "#080B0F", color: "#A0ADB8" }}
                    >
                      Select Option
                    </option>
                    <option
                      value="yes"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      Yes
                    </option>
                    <option
                      value="no"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      No
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Family History of ASD?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("familyAsd", { required: true })}
                    className="w-full px-5 py-3.5 bg-[#080B0F] border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-medium text-white bio-focus-ring shadow-sm"
                    style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                  >
                    <option
                      value=""
                      style={{ backgroundColor: "#080B0F", color: "#A0ADB8" }}
                    >
                      Select Option
                    </option>
                    <option
                      value="yes"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      Yes
                    </option>
                    <option
                      value="no"
                      style={{ backgroundColor: "#080B0F", color: "#FFFFFF" }}
                    >
                      No
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    City / Location <span className="text-bio-rose">*</span>
                  </label>
                  <input
                    {...register("location", { required: true })}
                    className="w-full px-5 py-3.5 bg-bio-glass border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-normal text-bio-text-primary shadow-sm bio-focus-ring"
                    placeholder="e.g. Hyderabad, Mumbai, Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-display font-bold text-bio-text-secondary pl-1">
                    Parent Notes (Optional)
                  </label>
                  <textarea
                    {...register("notes")}
                    className="w-full px-5 py-3.5 bg-bio-glass-50 border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-teal/20 focus:border-bio-teal outline-none font-body font-medium text-bio-text-primary bio-focus-ring shadow-sm resize-none"
                    rows="2"
                    placeholder="Anything specific you noticed?"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 fade-in h-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white animate-float">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-bio-text-primary">
                    Parent Questionnaire
                  </h3>
                  <p className="text-bio-500 font-medium font-sm">
                    Please answer based on your child's typical behavior over
                    the past month <span className="text-red-500">*</span>
                  </p>
                  <p className="text-xs text-bio-400 mt-2">
                    All questions are required to proceed
                  </p>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto px-2 pb-4">
                  {QUESTIONS.map((q, i) => (
                    <div
                      key={q.id}
                      className="bio-glass p-5 rounded-bio shadow-bio-card border border-bio-glass-100"
                    >
                      <p className="font-extrabold text-bio-text-primary text-[15px] mb-3">
                        {i + 1}. {q.text}
                      </p>
                      <div className="grid grid-cols-5 gap-1">
                        {q.options.map((opt) => (
                          <label key={opt} className="relative cursor-pointer">
                            <input
                              type="radio"
                              value={opt}
                              {...register(`q_${q.id}`, { required: true })}
                              className="peer sr-only"
                            />
                            <div className="text-center py-3 px-3 rounded-xl text-xs font-display font-bold border-3 border-bio-glass-200 text-bio-text-secondary bg-bio-glass-50 peer-checked:border-4 peer-checked:border-teal-400 peer-checked:bg-teal-400/20 peer-checked:text-teal-400 peer-checked:shadow-lg peer-checked:shadow-teal-400/30 peer-checked:scale-105 transition-all hover:border-teal-300 hover:bg-bio-glass-100 cursor-pointer relative">
                              {opt}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {console.log(
              `🎨 Rendering step 3: condition=${step === 3}, current step=${step}`,
            )}
            {step === 3 && (
              <div className="space-y-6 fade-in h-full flex flex-col justify-center">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white animate-float">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-bio-text-primary">
                    Multimodal Upload
                  </h3>
                  <p className="text-bio-200 font-medium font-sm bio-glass bio-glow-teal inline-block px-4 py-1.5 rounded-full mt-2 border border-bio-teal">
                    💡 Upload video AND audio for complete analysis!
                  </p>
                </div>

                {/* Video Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-purple-500" />
                    <h4 className="font-bold text-bio-700">
                      Video Files (Optional)
                    </h4>
                  </div>
                  <div
                    {...getVideoProps()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isVideoDrag ? "border-bio-rose bg-bio-glass-rose scale-[1.02]" : "border-bio-glass-200 bg-bio-glass-50/50 hover:bio-glass hover:border-bio-rose"}`}
                  >
                    <input {...getVideoInput()} />
                    <UploadCloud className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                    <p className="text-sm text-bio-700 font-bold mb-1">
                      Drag & drop video files here
                    </p>
                    <p className="text-xs text-bio-500">
                      MP4, MOV, AVI, WEBM (max 50MB)
                    </p>
                  </div>
                  {videos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {videos.map((f) => (
                        <div
                          key={f.name}
                          className="relative rounded-xl overflow-hidden shadow-sm border border-bio-glass-200 aspect-video"
                        >
                          <video
                            src={videoPreviews[f.name]}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setVideos((v) =>
                                v.filter((vi) => vi.name !== f.name),
                              )
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audio Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-5 h-5 text-pink-500" />
                    <h4 className="font-bold text-bio-700">
                      Audio Files (Optional)
                    </h4>
                  </div>
                  <div
                    {...getAudioProps()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isAudioDrag ? "border-bio-rose bg-bio-glass-rose scale-[1.02]" : "border-bio-glass-200 bg-bio-glass-50/50 hover:bio-glass hover:border-bio-rose"}`}
                  >
                    <input {...getAudioInput()} />
                    <FileAudio className="w-8 h-8 mx-auto text-pink-400 mb-2" />
                    <p className="text-sm text-bio-700 font-bold mb-1">
                      Drag & drop audio files here
                    </p>
                    <p className="text-xs text-bio-500">
                      WAV, MP3, M4A (max 20MB)
                    </p>
                  </div>
                  {audios.length > 0 && (
                    <div className="space-y-2">
                      {audios.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center gap-3 bio-glass p-3 rounded-xl border border-bio-glass-200"
                        >
                          <audio
                            controls
                            src={audioPreviews[f.name]}
                            className="h-8 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAudios((a) =>
                                a.filter((ai) => ai.name !== f.name),
                              )
                            }
                            className="text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs text-bio-500 mt-4">
                    💡 You can upload both video AND audio files for a complete
                    multimodal analysis
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Progress Indicator */}
        {step <= 2 && (
          <div className="mt-6 bio-glass-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-bio-600">
                {step === 1
                  ? "Child Details"
                  : step === 2
                    ? "Questionnaire"
                    : "Multimodal Upload"}{" "}
                Progress
              </span>
              <span className="text-sm font-bold text-purple-600">
                {getStepValidationStatus(step).completed}/
                {getStepValidationStatus(step).total}
              </span>
            </div>
            <div className="w-full bg-bio-glass-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(getStepValidationStatus(step).completed / getStepValidationStatus(step).total) * 100}%`,
                }}
              ></div>
            </div>
            {getStepValidationStatus(step).completed <
              getStepValidationStatus(step).total && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Please complete all required fields to continue
              </p>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="bio-glass/80 border-t border-bio-glass-100 p-6 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || isPending}
            className="px-6 py-3 bio-glass border border-bio-glass-200 font-display font-bold text-bio-text-primary hover:border-bio-teal hover:bg-bio-glass-teal disabled:opacity-30 flex items-center gap-2 rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {(() => {
            console.log(
              `🔘 Button logic: step=${step}, totalSteps=${totalSteps}, condition=${step < totalSteps}`,
            );
            return step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-3 bio-glass border border-bio-glass-200 text-bio-text-primary font-display font-bold rounded-xl shadow-lg hover:border-bio-rose hover:bg-bio-glass-rose transition-all flex items-center gap-2 transform active:scale-95"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="assessment-form"
                disabled={isPending || !isValid}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" /> Start Assessment
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Multimodal Analysis Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bio-glass rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-bio-text-primary">
                Analyzing Assessment
              </h3>
              <p className="text-bio-600">{analysisStep || "Processing..."}</p>

              {/* Progress indicators */}
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-2 text-sm ${videoResults ? "text-green-600" : "text-bio-400"}`}
                >
                  <Film className="w-4 h-4" />
                  <span>Video Analysis {videoResults ? "✅" : "⏳"}</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${audioResults ? "text-green-600" : "text-bio-400"}`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Audio Analysis {audioResults ? "✅" : "⏳"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-bio-400">
                  <ClipboardList className="w-4 h-4" />
                  <span>Final Assessment ⏳</span>
                </div>
              </div>

              <div className="w-full bg-bio-glass-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
