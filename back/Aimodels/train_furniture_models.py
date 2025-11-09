# train_furniture_models.py - Script to train ARIMA models for furniture predictions
import pandas as pd
import numpy as np
import pickle
from datetime import datetime
from statsmodels.tsa.arima.model import ARIMA
import warnings
import os
warnings.filterwarnings('ignore')

def load_and_preprocess_furniture_data():
    """Load and preprocess furniture needs data"""
    
    # Load data
    data = pd.read_csv('necesidades_escuelas.csv')
    
    print(f"Loaded furniture dataset with {len(data)} records")
    print(f"Schools: {data['escuela_id'].nunique()}")
    
    # Parse dates (format: dd/mm/yyyy)
    data['fecha_reporte'] = pd.to_datetime(data['fecha_reporte'], format='%d/%m/%Y')
    
    # Extract year and month for time series
    data['year'] = data['fecha_reporte'].dt.year
    data['month'] = data['fecha_reporte'].dt.month
    data['year_month'] = data['fecha_reporte'].dt.to_period('M')
    
    print(f"Date range: {data['fecha_reporte'].min()} - {data['fecha_reporte'].max()}")
    
    return data

def prepare_time_series(data, column_name):
    """Prepare time series data for a specific furniture type"""
    
    # Group by year_month and sum the needs
    ts_data = data.groupby('year_month')[column_name].sum().sort_index()
    
    # Convert PeriodIndex to numeric for ARIMA
    ts_data.index = range(len(ts_data))
    
    return ts_data

def find_best_arima_order(ts_data, max_p=3, max_d=2, max_q=3):
    """Find best ARIMA order using AIC criterion"""
    best_aic = float('inf')
    best_order = (1, 1, 1)
    
    for p in range(max_p + 1):
        for d in range(max_d + 1):
            for q in range(max_q + 1):
                try:
                    model = ARIMA(ts_data, order=(p, d, q))
                    fitted = model.fit()
                    if fitted.aic < best_aic:
                        best_aic = fitted.aic
                        best_order = (p, d, q)
                except:
                    continue
    
    return best_order

def train_furniture_arima_models(data, models_dir):
    """Train ARIMA models for each furniture type"""
    
    print("\n" + "="*60)
    print("Entrenando modelos ARIMA para predicción de necesidades de mobiliario")
    print("="*60)
    
    furniture_types = [
        'necesidad_catedras',
        'necesidad_escritorios', 
        'necesidad_mesas_exagonales',
        'necesidad_pizzaras'
    ]
    
    models = {}
    metadata = {
        'training_date': datetime.now().isoformat(),
        'furniture_types': {}
    }
    
    for furniture_type in furniture_types:
        print(f"\n--- Entrenando modelo para: {furniture_type} ---")
        
        # Prepare time series
        ts_data = prepare_time_series(data, furniture_type)
        print(f"Serie de tiempo: {len(ts_data)} períodos")
        print(f"Promedio: {ts_data.mean():.2f}, Min: {ts_data.min()}, Max: {ts_data.max()}")
        
        # Find best ARIMA order
        print("Calculando mejor orden ARIMA...")
        best_order = find_best_arima_order(ts_data)
        
        # Train ARIMA model
        arima_model = ARIMA(ts_data, order=best_order)
        arima_fit = arima_model.fit()
        
        print(f"Modelo entrenado con orden {best_order}")
        print(f"AIC: {arima_fit.aic:.2f}")
        
        # Save model with absolute path
        model_filename = os.path.join(models_dir, f'arima_furniture_{furniture_type}.pkl')
        arima_fit.save(model_filename)
        print(f"Modelo guardado: {model_filename}")
        
        # Store model reference and metadata
        models[furniture_type] = arima_fit
        
        metadata['furniture_types'][furniture_type] = {
            'order': best_order,
            'aic': arima_fit.aic,
            'last_value': float(ts_data.iloc[-1]),
            'mean_value': float(ts_data.mean()),
            'std_value': float(ts_data.std()),
            'trend': 'Aumento' if ts_data.iloc[-1] > ts_data.iloc[0] else 'Disminución',
            'data_periods': len(ts_data)
        }
    
    # Save metadata
    metadata_path = os.path.join(models_dir, 'arima_furniture_metadata.pkl')
    with open(metadata_path, 'wb') as f:
        pickle.dump(metadata, f)
    print(f"\nMetadata saved: {metadata_path}")
    
    print("\n" + "="*60)
    print("Todos los modelos de mobiliario guardados exitosamente!")
    print("="*60)
    
    return models, metadata

def create_models_directory():
    """Create models directory if it doesn't exist"""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, 'models')
    
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"Created 'models' directory at: {models_dir}")
    else:
        print(f"Models directory already exists at: {models_dir}")
    
    return models_dir

def main():
    """Main execution function"""
    
    print("SCRIPT PARA ENTRENAR MODELOS ARIMA DE PREDICCIÓN DE MOBILIARIO")
    print("=" * 60)
    print(f"Entrenamiento iniciado: {datetime.now()}")
    
    # Create models directory
    models_dir = create_models_directory()
    
    # Load data
    print("\n1. Cargando datos de mobiliario...")
    data = load_and_preprocess_furniture_data()
    
    # Train models
    print("\n2. Entrenando modelos ARIMA para mobiliario...")
    try:
        models, metadata = train_furniture_arima_models(data, models_dir)
    except Exception as e:
        print(f"Error al entrenar modelos: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Summary
    print("\n" + "="*60)
    print("Entrenamiento completado exitosamente!")
    print("="*60)
    print(f"Modelos guardados en: {models_dir}")
    for furniture_type in metadata['furniture_types'].keys():
        print(f"  - arima_furniture_{furniture_type}.pkl")
    print("  - arima_furniture_metadata.pkl")
    print(f"\nEntrenamiento completado en: {datetime.now()}")
    
    print("\nResumen de modelos:")
    for furniture_type, meta in metadata['furniture_types'].items():
        print(f"\n{furniture_type}:")
        print(f"  Orden ARIMA: {meta['order']}")
        print(f"  AIC: {meta['aic']:.2f}")
        print(f"  Promedio: {meta['mean_value']:.2f}")
        print(f"  Tendencia: {meta['trend']}")

if __name__ == "__main__":
    main()