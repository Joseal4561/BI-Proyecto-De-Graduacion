import json
import sys
import logging
import pandas as pd
import numpy as np
import pickle
from datetime import datetime
from statsmodels.tsa.arima.model import ARIMAResults
import warnings
import os
warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FurniturePredictor:
    def __init__(self):
        self.models_loaded = False
        self.furniture_models = {}
        self.metadata = None
        
        self.furniture_types = [
            'necesidad_catedras',
            'necesidad_escritorios',
            'necesidad_mesas_exagonales',
            'necesidad_pizzaras'
        ]
        
        # Load models
        self.load_models()
    
    def load_models(self):
        """Load all trained furniture ARIMA models"""
        try:
            # Get the directory where this script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            models_dir = os.path.join(script_dir, 'models')
            
            logger.info(f"Script directory: {script_dir}")
            logger.info(f"Looking for models in: {models_dir}")
            logger.info(f"Models directory exists: {os.path.exists(models_dir)}")
            
            if not os.path.exists(models_dir):
                # List what's in the script directory for debugging
                logger.error(f"Contents of script directory: {os.listdir(script_dir)}")
                raise FileNotFoundError(f"Directorio de modelos no encontrado en {models_dir}. Ejecute train_furniture_models.py primero.")
            
            # List all files in models directory for debugging
            logger.info(f"Files in models directory: {os.listdir(models_dir)}")
            
            # Load metadata
            metadata_path = os.path.join(models_dir, 'arima_furniture_metadata.pkl')
            logger.info(f"Looking for metadata at: {metadata_path}")
            if os.path.exists(metadata_path):
                with open(metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
                logger.info("Furniture metadata loaded successfully")
            else:
                logger.warning(f"Metadata file not found at: {metadata_path}")
            
            # Load each furniture type model
            for furniture_type in self.furniture_types:
                model_path = os.path.join(models_dir, f'arima_furniture_{furniture_type}.pkl')
                logger.info(f"Looking for model at: {model_path}")
                if os.path.exists(model_path):
                    self.furniture_models[furniture_type] = ARIMAResults.load(model_path)
                    logger.info(f"Model loaded: {furniture_type}")
                else:
                    logger.warning(f"Model not found: {furniture_type} at {model_path}")
            
            self.models_loaded = len(self.furniture_models) == len(self.furniture_types)
            
            if self.models_loaded:
                logger.info("All furniture models loaded successfully")
            else:
                logger.warning(f"Only {len(self.furniture_models)}/{len(self.furniture_types)} models loaded")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.models_loaded = False
    
    def predict_furniture_needs(self, escuela_id, periods_ahead=6):
        """
        Make predictions for furniture needs
        
        Args:
            escuela_id: School ID for context
            periods_ahead: Number of months to predict ahead
        
        Returns:
            Dictionary with predictions for all furniture types
        """
        try:
            if not self.models_loaded:
                return {
                    "model_type": "ARIMA Furniture",
                    "error": "Modelos no cargados. Ejecute train_furniture_models.py primero.",
                    "confidence": 0.0
                }
            
            predictions_by_type = {}
            
            # Make predictions for each furniture type
            for furniture_type in self.furniture_types:
                if furniture_type not in self.furniture_models:
                    continue
                
                model = self.furniture_models[furniture_type]
                meta = self.metadata['furniture_types'][furniture_type] if self.metadata else None
                
                try:
                    # Make forecast
                    forecast = model.forecast(steps=periods_ahead)
                    
                    # Get confidence intervals
                    try:
                        forecast_obj = model.get_forecast(steps=periods_ahead)
                        conf_int = forecast_obj.conf_int()
                    except:
                        # Fallback if confidence intervals fail
                        conf_int = pd.DataFrame({
                            'lower': forecast * 0.85,
                            'upper': forecast * 1.15
                        })
                    
                    # Calculate confidence based on model quality
                    if meta:
                        base_confidence = max(0.65, 1 - (meta['aic'] / 1500))
                        std_factor = 1 - min(0.3, meta['std_value'] / max(meta['mean_value'], 1))
                        confidence = min(0.92, max(0.65, base_confidence * std_factor))
                    else:
                        confidence = 0.75
                    
                    # Prepare predictions
                    predictions_list = []
                    for i in range(periods_ahead):
                        pred_value = max(0, int(round(forecast.iloc[i])))
                        lower_bound = max(0, int(round(conf_int.iloc[i, 0])))
                        upper_bound = max(pred_value, int(round(conf_int.iloc[i, 1])))
                        
                        predictions_list.append({
                            'period': i + 1,
                            'predicted_value': pred_value,
                            'confidence_interval': {
                                'lower': lower_bound,
                                'upper': upper_bound
                            }
                        })
                    
                    # Calculate trend
                    if len(forecast) >= 2:
                        trend_rate = ((forecast.iloc[-1] - forecast.iloc[0]) / max(forecast.iloc[0], 1)) * 100
                    else:
                        trend_rate = 0.0
                    
                    predictions_by_type[furniture_type] = {
                        'predictions': predictions_list,
                        'confidence': round(confidence, 4),
                        'trend_analysis': {
                            'growth_rate': round(trend_rate, 2),
                            'trend_direction': 'increasing' if trend_rate > 0 else 'decreasing' if trend_rate < 0 else 'stable',
                            'average_predicted': round(float(forecast.mean()), 2),
                            'total_predicted': int(round(forecast.sum()))
                        },
                        'model_info': {
                            'aic': meta['aic'] if meta else 'N/A',
                            'order': str(meta['order']) if meta else 'N/A',
                            'historical_avg': round(meta['mean_value'], 2) if meta else 'N/A'
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"Error predicting {furniture_type}: {e}")
                    predictions_by_type[furniture_type] = {
                        'error': str(e),
                        'confidence': 0.0
                    }
            
            # Calculate overall summary
            total_confidence = np.mean([
                pred['confidence'] 
                for pred in predictions_by_type.values() 
                if 'confidence' in pred and pred['confidence'] > 0
            ]) if predictions_by_type else 0.0
            
            return {
                "model_type": "ARIMA Furniture",
                "escuela_id": escuela_id,
                "periods_predicted": periods_ahead,
                "predictions_by_furniture_type": predictions_by_type,
                "overall_confidence": round(total_confidence, 4),
                "summary": {
                    'next_month': {
                        furniture_type: pred['predictions'][0]['predicted_value']
                        for furniture_type, pred in predictions_by_type.items()
                        if 'predictions' in pred and len(pred['predictions']) > 0
                    },
                    'next_semester': {
                        furniture_type: sum(p['predicted_value'] for p in pred['predictions'][:6])
                        for furniture_type, pred in predictions_by_type.items()
                        if 'predictions' in pred
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in furniture prediction: {e}")
            return {
                "model_type": "ARIMA Furniture",
                "error": str(e),
                "confidence": 0.0
            }

def process_parameters(parameters):
    """Process prediction request parameters"""
    
    try:
        logger.info(f"Processing furniture prediction with parameters: {parameters}")
        
        predictor = FurniturePredictor()
        
        if not predictor.models_loaded:
            return {
                "status": "error",
                "message": "Modelos no cargados. Ejecute train_furniture_models.py para entrenar los modelos primero.",
                "confidence": 0.0
            }
        
        # Extract parameters
        escuela_id = parameters.get('escuela_id', 0)
        periods_ahead = int(parameters.get('periods_ahead', 6))
        
        if periods_ahead < 1 or periods_ahead > 24:
            return {
                "status": "error",
                "message": "El número de períodos debe estar entre 1 y 24",
                "confidence": 0.0
            }
        
        # Make prediction
        result = predictor.predict_furniture_needs(escuela_id, periods_ahead)
        
        return {
            "status": "success",
            "message": f"Predicción de necesidades de mobiliario generada exitosamente para {periods_ahead} períodos",
            "prediction_data": result,
            "input_parameters": {
                "escuela_id": escuela_id,
                "periods_ahead": periods_ahead
            }
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
        result["model_version"] = "1.0.0"
        
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