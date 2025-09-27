
import json
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_parameters(parameters):

    try:
        # Extract features from parameters
        feature1 = float(parameters.get('feature1', 0))
        feature2 = float(parameters.get('feature2', 0))
        feature3 = float(parameters.get('feature3', 0))
        feature4 = float(parameters.get('feature4', 0))
        
        logger.info(f"Processing features: {feature1}, {feature2}, {feature3}, {feature4}")
        
        # Simulate some processing time and basic validation
        if any(val < 0 for val in [feature1, feature2, feature3, feature4]):
            return {
                "status": "warning",
                "message": "Some features have negative values",
                "prediction": "uncertain",
                "confidence": 0.5,
                "processed_features": {
                    "feature1": feature1,
                    "feature2": feature2,
                    "feature3": feature3,
                    "feature4": feature4
                }
            }
        
        # Simulate a simple calculation (replace with actual AI model)
        simple_prediction = (feature1 + feature2 + feature3 + feature4) / 4
        confidence = min(0.95, max(0.1, abs(simple_prediction) / 100))
        
        return {
            "status": "successful",
            "message": "Prediction completed successfully",
            "prediction": round(simple_prediction, 4),
            "confidence": round(confidence, 4),
            "processed_features": {
                "feature1": feature1,
                "feature2": feature2,
                "feature3": feature3,
                "feature4": feature4
            },
            "model_info": {
                "version": "1.0.0",
                "type": "basic_predictor"
            }
        }
        
    except ValueError as e:
        logger.error(f"Value error processing parameters: {e}")
        return {
            "status": "error",
            "message": f"Invalid parameter values: {str(e)}",
            "prediction": None
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            "status": "error",
            "message": f"Unexpected error occurred: {str(e)}",
            "prediction": None
        }

def main():
    """
    Main function that handles input/output with the NestJS backend
    """
    try:
        # Check if parameters were provided as command line argument
        if len(sys.argv) != 2:
            raise ValueError("Parameters must be provided as a JSON string argument")
        
        # Parse the JSON parameters from command line argument
        parameters_json = sys.argv[1]
        parameters = json.loads(parameters_json)
        
        logger.info(f"Received parameters: {parameters}")
        
        # Process the parameters and get prediction
        result = process_parameters(parameters)
        
        # Add metadata
        result["timestamp"] = datetime.now().isoformat()
        result["processing_time"] = "< 1 second"  # In a real scenario, you'd measure this
        
        # Output the result as JSON (this will be captured by NestJS)
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        error_result = {
            "status": "error",
            "message": f"Invalid JSON parameters: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "status": "error", 
            "message": f"Script execution failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()