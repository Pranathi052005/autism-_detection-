import joblib
import json
import numpy as np
import os
from typing import Dict, List, Tuple

class AutismPredictor:
    def __init__(self):
        """Initialize the autism prediction model"""
        try:
            # Get project root directory
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            
            # Load the trained XGBoost model
            model_path = os.path.join(project_root, 'autism_xgboost_model.pkl')
            self.model = joblib.load(model_path)
            
            # Load feature names
            features_path = os.path.join(project_root, 'model_features.json')
            with open(features_path, 'r') as f:
                self.feature_names = json.load(f)
            
            # Load model metadata
            metadata_path = os.path.join(project_root, 'model_metadata.json')
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            print(f"✅ Autism predictor loaded successfully")
            print(f"   Model: {self.metadata['model_type']}")
            print(f"   Accuracy: {self.metadata['accuracy']*100:.2f}%")
            print(f"   Features: {len(self.feature_names)}")
            
        except Exception as e:
            print(f"❌ Error loading autism predictor: {e}")
            self.model = None
            self.feature_names = []
            self.metadata = {}
    
    def encode_questionnaire_answer(self, question_id: str, answer: str) -> int:
        """
        Encode questionnaire answer using the same logic as frontend
        Returns 1 for at-risk answers, 0 for normal answers
        """
        at_risk_answers = {
            "A1": ["Sometimes", "Rarely", "Never"],
            "A2": ["Difficult", "Very Difficult"],
            "A3": ["A few times a week", "Less than once a week", "Never"],
            "A4": ["A few times a week", "Less than once a week", "Never"],
            "A5": ["A few times a week", "Less than once a week", "Never"],
            "A6": ["A few times a week", "Less than once a week", "Never"],
            "A7": ["Sometimes", "Rarely", "Never"],
            "A8": ["Slightly unusual", "Very unusual", "No words yet"],
            "A9": ["A few times a week", "Less than once a week", "Never"],
            "A10": ["A few times a day", "Many times a day"]
        }
        
        return 1 if answer in at_risk_answers.get(question_id, []) else 0
    
    def preprocess_form_data(self, form_data: Dict) -> np.ndarray:
        """
        Convert form data to model input format
        """
        try:
            # Initialize feature dictionary
            features = {}
            
            # Process questionnaire answers (encoded)
            questionnaire_raw = form_data.get('questionnaire', '[]')
            
            # Check if questionnaire is already a list or needs parsing
            if isinstance(questionnaire_raw, str):
                questionnaire_data = json.loads(questionnaire_raw)
                print(f"🔍 Parsed questionnaire from string: {questionnaire_data}")
            elif isinstance(questionnaire_raw, list):
                questionnaire_data = questionnaire_raw
                print(f"🔍 Questionnaire already parsed as list: {questionnaire_data}")
            else:
                questionnaire_data = []
                print(f"🔍 Invalid questionnaire data type: {type(questionnaire_raw)}")
            
            print(f"🔍 Number of questionnaire items: {len(questionnaire_data)}")
            
            for q in questionnaire_data:
                question_id = q['questionId']
                answer = q['answer']
                encoded_answer = self.encode_questionnaire_answer(question_id, answer)
                features[question_id] = encoded_answer
                print(f"🔍 Question {question_id}: {answer} -> {encoded_answer}")
            
            # Add demographic features
            features['Age'] = int(form_data.get('ageMonths', 0))
            features['Sex'] = 1 if form_data.get('sex') == 'm' else 0
            features['Jaundice'] = 1 if form_data.get('jaundice') == 'yes' else 0
            features['Family_ASD'] = 1 if form_data.get('familyAsd') == 'yes' else 0
            
            print(f"🔍 All features: {features}")
            print(f"🔍 Expected feature names: {self.feature_names}")
            
            # Create feature array in correct order
            feature_array = []
            for feature_name in self.feature_names:
                value = features.get(feature_name, 0)
                feature_array.append(value)
                print(f"🔍 Feature {feature_name}: {value}")
            
            print(f"🔍 Final feature array: {feature_array}")
            return np.array(feature_array).reshape(1, -1)
            
        except Exception as e:
            print(f"❌ Error preprocessing form data: {e}")
            raise
    
    def predict(self, form_data: Dict) -> Dict:
        """
        Make autism prediction from form data
        """
        if not self.model:
            raise ValueError("Model not loaded")
        
        try:
            print(f"🔍 Raw form data keys: {list(form_data.keys())}")
            print(f"🔍 Questionnaire data: {form_data.get('questionnaire', 'Missing')}")
            
            # Preprocess input
            features = self.preprocess_form_data(form_data)
            print(f"🔍 Processed features shape: {features.shape}")
            print(f"🔍 Feature array: {features.flatten()}")
            
            # Make prediction
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            print(f"🔍 Raw prediction: {prediction}")
            print(f"🔍 Raw probabilities: {probabilities}")
            
            # Determine risk level
            asd_probability = probabilities[1]
            if asd_probability >= 0.7:
                risk_level = "HIGH"
                risk_color = "🔴"
            elif asd_probability >= 0.4:
                risk_level = "MEDIUM"
                risk_color = "🟡"
            else:
                risk_level = "LOW"
                risk_color = "🟢"
            
            # Prepare result
            result = {
                'prediction': int(prediction),
                'prediction_label': 'ASD' if prediction == 1 else 'No ASD',
                'probabilities': {
                    'no_asd': float(probabilities[0]),
                    'asd': float(probabilities[1])
                },
                'asd_probability': float(asd_probability),
                'risk_level': risk_level,
                'risk_emoji': risk_color,
                'confidence': float(max(probabilities)),
                'model_info': {
                    'model_type': self.metadata['model_type'],
                    'accuracy': self.metadata['accuracy'],
                    'features_used': len(self.feature_names)
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Error making prediction: {e}")
            raise
    
    def get_feature_importance(self) -> List[Dict]:
        """Get feature importance from the model"""
        if not self.model:
            return []
        
        try:
            importance = self.model.feature_importances_
            feature_importance = []
            
            for i, feature_name in enumerate(self.feature_names):
                feature_importance.append({
                    'feature': feature_name,
                    'importance': float(importance[i])
                })
            
            # Sort by importance
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            return feature_importance
            
        except Exception as e:
            print(f"❌ Error getting feature importance: {e}")
            return []

# Global predictor instance
predictor = AutismPredictor()

def predict_autism(form_data: Dict) -> Dict:
    """
    Convenience function for making predictions
    """
    return predictor.predict(form_data)

def get_model_info() -> Dict:
    """
    Get model information and status
    """
    return {
        'model_loaded': predictor.model is not None,
        'model_type': predictor.metadata.get('model_type', 'Unknown'),
        'accuracy': predictor.metadata.get('accuracy', 0),
        'feature_count': len(predictor.feature_names),
        'features': predictor.feature_names,
        'target_classes': predictor.metadata.get('target_classes', ['No ASD', 'ASD'])
    }
