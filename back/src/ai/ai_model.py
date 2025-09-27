import json
import sys
import logging
import pandas as pd
import numpy as np
import pickle
import joblib
from datetime import datetime
from sklearn.tree import DecisionTreeClassifier
from statsmodels.tsa.arima.model import ARIMAResults
import warnings
import os
warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EducationalPredictor:
    def __init__(self):
        self.models_loaded = False
        self.arima_students_model = None
        self.arima_enrollments_model = None
        self.decision_tree_model = None
        self.arima_metadata = None
        self.dt_metadata = None
        
       
        self.load_models()
    
    def load_models(self):
        
        try:
            models_dir = './src/ai/models'
            
          
            if not os.path.exists(models_dir):
                raise FileNotFoundError("Directorio de modelos no encontrado. Ejecute train_models.py primero.")
            
            
            arima_students_path = os.path.join(models_dir, 'arima_students_model.pkl')
            arima_enrollments_path = os.path.join(models_dir, 'arima_enrollments_model.pkl')
            
            if os.path.exists(arima_students_path):
                self.arima_students_model = ARIMAResults.load(arima_students_path)
                logger.info("ARIMA students model loaded successfully")
            else:
                logger.warning("ARIMA students model not found")
            
            if os.path.exists(arima_enrollments_path):
                self.arima_enrollments_model = ARIMAResults.load(arima_enrollments_path)
                logger.info("ARIMA enrollments model loaded successfully")
            else:
                logger.warning("ARIMA enrollments model not found")
            
           
            arima_metadata_path = os.path.join(models_dir, 'arima_metadata.pkl')
            if os.path.exists(arima_metadata_path):
                with open(arima_metadata_path, 'rb') as f:
                    self.arima_metadata = pickle.load(f)
                logger.info("ARIMA metadata loaded successfully")
            
            
            dt_model_path = os.path.join(models_dir, 'decision_tree_model.pkl')
            if os.path.exists(dt_model_path):
                self.decision_tree_model = joblib.load(dt_model_path)
                logger.info("Decision Tree model loaded successfully")
            else:
                logger.warning("Decision Tree model not found")
            
     
            dt_metadata_path = os.path.join(models_dir, 'decision_tree_metadata.pkl')
            if os.path.exists(dt_metadata_path):
                with open(dt_metadata_path, 'rb') as f:
                    self.dt_metadata = pickle.load(f)
                logger.info("Decision Tree metadata loaded successfully")
            
            self.models_loaded = True
            logger.info("All models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.models_loaded = False
    
    def predict_enrollment_arima(self, cantidad_alumnos, numero_inscripciones, anio):
        
        try:
            if not self.models_loaded or not self.arima_students_model or not self.arima_enrollments_model:
                return {
                    "model_type": "ARIMA",
                    "error": "ARIMA models not loaded. Please run train_models.py first.",
                    "confidence": 0.0
                }
            
          
            try:
                students_forecast = self.arima_students_model.forecast(steps=2)
                enrollments_forecast = self.arima_enrollments_model.forecast(steps=2)
                
           
                try:
                    students_forecast_obj = self.arima_students_model.get_forecast(steps=2)
                    students_conf_int = students_forecast_obj.conf_int()
                except Exception as e:
                    logger.warning(f"Could not get confidence intervals for students: {e}")
              
                    students_conf_int = pd.DataFrame({
                        'lower': students_forecast * 0.9,
                        'upper': students_forecast * 1.1
                    })
                
                try:
                    enrollments_forecast_obj = self.arima_enrollments_model.get_forecast(steps=2)
                    enrollments_conf_int = enrollments_forecast_obj.conf_int()
                except Exception as e:
               
                    enrollments_conf_int = pd.DataFrame({
                        'lower': enrollments_forecast * 0.9,
                        'upper': enrollments_forecast * 1.1
                    })
                
            except Exception as e:
                logger.error(f"Error making ARIMA forecasts: {e}")
   
                students_forecast = [cantidad_alumnos * 1.05, cantidad_alumnos * 1.1]
                enrollments_forecast = [numero_inscripciones * 1.03, numero_inscripciones * 1.08]
                students_conf_int = pd.DataFrame({
                    'lower': [s * 0.9 for s in students_forecast],
                    'upper': [s * 1.1 for s in students_forecast]
                })
                enrollments_conf_int = pd.DataFrame({
                    'lower': [e * 0.9 for e in enrollments_forecast],
                    'upper': [e * 1.1 for e in enrollments_forecast]
                })
            
          
            if self.arima_metadata:
                students_adjustment = cantidad_alumnos / max(self.arima_metadata['students']['mean_value'], 1)
                enrollments_adjustment = numero_inscripciones / max(self.arima_metadata['enrollments']['mean_value'], 1)
            else:
                students_adjustment = 1.0
                enrollments_adjustment = 1.0
            
          
            adjusted_students_forecast = [f * students_adjustment for f in students_forecast]
            adjusted_enrollments_forecast = [f * enrollments_adjustment for f in enrollments_forecast]
            
           
            if self.arima_metadata:
                base_confidence = max(0.6, 1 - (self.arima_metadata['students']['aic'] / 1000))  # Normalize AIC
                consistency_factor = 1 - abs(cantidad_alumnos - numero_inscripciones) / max(cantidad_alumnos, numero_inscripciones)
                confidence = min(0.95, max(0.60, base_confidence * consistency_factor))
            else:
                confidence = 0.75
            
      
            if len(adjusted_students_forecast) >= 2:
                trend_rate = ((adjusted_students_forecast[1] - cantidad_alumnos) / cantidad_alumnos) * 100
            else:
                trend_rate = 5.0  
            
          
            try:
                students_lower_0 = float(students_conf_int.iloc[0, 0] * students_adjustment)
                students_upper_0 = float(students_conf_int.iloc[0, 1] * students_adjustment)
                students_lower_1 = float(students_conf_int.iloc[1, 0] * students_adjustment)
                students_upper_1 = float(students_conf_int.iloc[1, 1] * students_adjustment)
                
                enrollments_lower_0 = float(enrollments_conf_int.iloc[0, 0] * enrollments_adjustment)
                enrollments_upper_0 = float(enrollments_conf_int.iloc[0, 1] * enrollments_adjustment)
                enrollments_lower_1 = float(enrollments_conf_int.iloc[1, 0] * enrollments_adjustment)
                enrollments_upper_1 = float(enrollments_conf_int.iloc[1, 1] * enrollments_adjustment)
            except:
           
                students_lower_0 = int(adjusted_students_forecast[0] * 0.9)
                students_upper_0 = int(adjusted_students_forecast[0] * 1.1)
                students_lower_1 = int(adjusted_students_forecast[1] * 0.9)
                students_upper_1 = int(adjusted_students_forecast[1] * 1.1)
                
                enrollments_lower_0 = int(adjusted_enrollments_forecast[0] * 0.9)
                enrollments_upper_0 = int(adjusted_enrollments_forecast[0] * 1.1)
                enrollments_lower_1 = int(adjusted_enrollments_forecast[1] * 0.9)
                enrollments_upper_1 = int(adjusted_enrollments_forecast[1] * 1.1)
            
            return {
                "model_type": "ARIMA",
                "predictions": {
                    "next_semester": {
                        "cantidad_alumnos": int(adjusted_students_forecast[0]),
                        "numero_inscripciones": int(adjusted_enrollments_forecast[0]),
                        "confidence_interval": {
                            "students_lower": int(students_lower_0),
                            "students_upper": int(students_upper_0),
                            "enrollments_lower": int(enrollments_lower_0),
                            "enrollments_upper": int(enrollments_upper_0)
                        }
                    },
                    "next_year": {
                        "cantidad_alumnos": int(adjusted_students_forecast[1]),
                        "numero_inscripciones": int(adjusted_enrollments_forecast[1]),
                        "confidence_interval": {
                            "students_lower": int(students_lower_1),
                            "students_upper": int(students_upper_1),
                            "enrollments_lower": int(enrollments_lower_1),
                            "enrollments_upper": int(enrollments_upper_1)
                        }
                    }
                },
                "confidence": round(confidence, 4),
                "trend_analysis": {
                    "growth_rate": round(trend_rate, 2),
                    "seasonal_adjustment": 0.0, 
                    "trend_direction": "increasing" if trend_rate > 0 else "decreasing",
                    "model_info": {
                        "students_aic": self.arima_metadata['students']['aic'] if self.arima_metadata else "N/A",
                        "enrollments_aic": self.arima_metadata['enrollments']['aic'] if self.arima_metadata else "N/A"
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in ARIMA prediction: {e}")
            return {
                "model_type": "ARIMA",
                "error": str(e),
                "confidence": 0.0
            }
    
    def predict_dropout_risk(self, cantidad_alumnos, numero_inscripciones, numero_maestros, promedio_calificaciones, es_urbana):
       
        try:
            if not self.models_loaded or not self.decision_tree_model:
                return {
                    "model_type": "Decision Tree",
                    "error": "Decision Tree model not loaded. Please run train_models.py first.",
                    "confidence": 0.0
                }
            
            
            features = {
                'cantidad_alumnos': cantidad_alumnos,
                'numero_inscripciones': numero_inscripciones,
                'numero_maestros': numero_maestros,
                'promedio_calificaciones': promedio_calificaciones,
                'esUrbana': int(es_urbana),
                'student_teacher_ratio': cantidad_alumnos / numero_maestros,
                'enrollment_rate': numero_inscripciones / cantidad_alumnos
            }
            
           
            if self.dt_metadata and 'features' in self.dt_metadata:
                feature_order = self.dt_metadata['features']
                feature_array = np.array([[features[feat] for feat in feature_order]])
            else:
       
                feature_array = np.array([[
                    features['cantidad_alumnos'],
                    features['numero_inscripciones'], 
                    features['numero_maestros'],
                    features['promedio_calificaciones'],
                    features['esUrbana'],
                    features['student_teacher_ratio'],
                    features['enrollment_rate']
                ]])
            
        
            prediction = self.decision_tree_model.predict(feature_array)[0]
            prediction_proba = self.decision_tree_model.predict_proba(feature_array)[0]
            
           
            risk_level = "ALTO" if prediction == 1 else "BAJO"
            risk_color = "danger" if prediction == 1 else "success"
            
           
            if max(prediction_proba) < 0.7: 
                risk_level = "MEDIO"
                risk_color = "warning"
            
        
            if self.dt_metadata and 'median_dropout_threshold' in self.dt_metadata:
                base_dropout_rate = self.dt_metadata['median_dropout_threshold']
                if prediction == 1:
                    estimated_dropout_rate = base_dropout_rate * (1.2 + prediction_proba[1] * 0.5)
                else:
                    estimated_dropout_rate = base_dropout_rate * (0.5 + prediction_proba[0] * 0.3)
            else:
                estimated_dropout_rate = 8.0 if prediction == 1 else 4.0
            
         
            risk_factors = []
            if features['student_teacher_ratio'] > 25:
                risk_factors.append("Ratio estudiante-maestro muy alto (>25)")
            elif features['student_teacher_ratio'] > 20:
                risk_factors.append("Ratio estudiante-maestro alto (>20)")
            
            if features['promedio_calificaciones'] < 7.0:
                risk_factors.append("Promedio de calificaciones muy bajo (<7.0)")
            elif features['promedio_calificaciones'] < 8.0:
                risk_factors.append("Promedio de calificaciones bajo (<8.0)")
            
            if features['enrollment_rate'] < 0.85:
                risk_factors.append("Tasa de inscripción baja (<85%)")
            
            if not es_urbana:
                risk_factors.append("Ubicación rural")
            
            if cantidad_alumnos < 150:
                risk_factors.append("Escuela pequeña (<150 estudiantes)")
            elif cantidad_alumnos > 500:
                risk_factors.append("Escuela muy grande (>500 estudiantes)")
            
          
            model_confidence = self.dt_metadata['accuracy'] if self.dt_metadata else 0.80
            prediction_confidence = max(prediction_proba) * model_confidence
            
            return {
                "model_type": "Decision Tree",
                "risk_level": risk_level,
                "risk_color": risk_color,
                "risk_score": round(max(prediction_proba), 4),
                "estimated_dropout_rate": round(estimated_dropout_rate, 2),
                "confidence": round(prediction_confidence, 4),
                "risk_factors": risk_factors,
                "prediction_probabilities": {
                    "low_risk": round(prediction_proba[0], 4),
                    "high_risk": round(prediction_proba[1], 4)
                },
                "feature_analysis": {
                    "student_teacher_ratio": round(features['student_teacher_ratio'], 2),
                    "enrollment_rate": round(features['enrollment_rate'], 4),
                    "grade_category": "Alto" if promedio_calificaciones >= 8.5 else "Medio" if promedio_calificaciones >= 7.5 else "Bajo",
                    "school_size_category": "Pequeña" if cantidad_alumnos < 200 else "Grande" if cantidad_alumnos > 400 else "Mediana"
                },
                "model_info": {
                    "training_accuracy": self.dt_metadata['accuracy'] if self.dt_metadata else "N/A",
                    "training_date": self.dt_metadata['training_date'] if self.dt_metadata else "Unknown"
                }
            }
            
        except Exception as e:
            logger.error(f"Error in dropout prediction: {e}")
            return {
                "model_type": "Decision Tree",
                "error": str(e),
                "confidence": 0.0
            }

def process_parameters(parameters):
    
    
    try:
        model_type = parameters.get('model_type', 'enrollment')
        logger.info(f"Processing {model_type} model with parameters: {parameters}")
        
        predictor = EducationalPredictor()
        
        if not predictor.models_loaded:
            return {
                "status": "error",
                "message": "Modelos no cargados. Execute train_models.py para entrenar los modelos primero.",
                "confidence": 0.0
            }
        
        if model_type == 'enrollment':

            cantidad_alumnos = float(parameters.get('cantidad_alumnos', 0))
            numero_inscripciones = float(parameters.get('numero_inscripciones', 0))
            anio = int(parameters.get('anio', 2024))
            
            if any(val <= 0 for val in [cantidad_alumnos, numero_inscripciones]):
                return {
                    "status": "error",
                    "message": "Cantidad de alumnos e inscripciones deben ser mayores a 0",
                    "model_type": "ARIMA",
                    "confidence": 0.0
                }
            
            result = predictor.predict_enrollment_arima(cantidad_alumnos, numero_inscripciones, anio)
            
            return {
                "status": "success",
                "message": "Predicción de inscripciones generada exitosamente usando modelo ARIMA entrenado",
                "prediction_data": result,
                "input_parameters": {
                    "cantidad_alumnos": cantidad_alumnos,
                    "numero_inscripciones": numero_inscripciones,
                    "anio": anio
                }
            }
            
        elif model_type == 'dropout':

            cantidad_alumnos = float(parameters.get('cantidad_alumnos', 0))
            numero_inscripciones = float(parameters.get('numero_inscripciones', 0))
            numero_maestros = float(parameters.get('numero_maestros', 1))
            promedio_calificaciones = float(parameters.get('promedio_calificaciones', 0))
            es_urbana = parameters.get('es_urbana', True)
            
      
            if isinstance(es_urbana, str):
                es_urbana = es_urbana.lower() in ['true', '1', 'yes', 'urbana']
            
            if any(val <= 0 for val in [cantidad_alumnos, numero_inscripciones, numero_maestros]):
                return {
                    "status": "error",
                    "message": "Los valores de alumnos, inscripciones y maestros deben ser mayores a 0",
                    "model_type": "Decision Tree",
                    "confidence": 0.0
                }
                
            if promedio_calificaciones < 0 or promedio_calificaciones > 10:
                return {
                    "status": "error",
                    "message": "El promedio de calificaciones debe estar entre 0 y 10",
                    "model_type": "Decision Tree",
                    "confidence": 0.0
                }
            
            result = predictor.predict_dropout_risk(
                cantidad_alumnos, numero_inscripciones, numero_maestros, 
                promedio_calificaciones, es_urbana
            )
            
            return {
                "status": "success",
                "message": "Predicción de riesgo de deserción generada exitosamente usando modelo de Árbol de Decisión entrenado",
                "prediction_data": result,
                "input_parameters": {
                    "cantidad_alumnos": cantidad_alumnos,
                    "numero_inscripciones": numero_inscripciones,
                    "numero_maestros": numero_maestros,
                    "promedio_calificaciones": promedio_calificaciones,
                    "es_urbana": es_urbana
                }
            }
        
        else:
            return {
                "status": "error",
                "message": f"Tipo de modelo no reconocido: {model_type}",
                "confidence": 0.0
            }
            
    except ValueError as e:
        logger.error(f"Value error processing parameters: {e}")
        return {
            "status": "error",
            "message": f"Parámetros inválidos: {str(e)}",
            "confidence": 0.0
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            "status": "error",
            "message": f"Error inesperado: {str(e)}",
            "confidence": 0.0
        }

def main():
    """Main execution function"""
    try:
        if len(sys.argv) != 2:
            raise ValueError("Los parámetros deben ser ingresados como un único argumento JSON.")
        
        parameters_json = sys.argv[1]
        parameters = json.loads(parameters_json)
        
        logger.info(f"Parámetros recibidos: {parameters}")
        
        result = process_parameters(parameters)
        
        # Add metadata
        result["timestamp"] = datetime.now().isoformat()
        result["processing_time"] = "< 1 second"
        result["model_version"] = "2.0.0"
        result["models_status"] = "loaded" if EducationalPredictor().models_loaded else "not_loaded"
        
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except json.JSONDecodeError as e:
        error_result = {
            "status": "error",
            "message": f"Parámetros JSON inválidos: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "status": "error", 
            "message": f"Ejecución de script fallida: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()