# train_models.py - Script to train and export AI models
import pandas as pd
import numpy as np
import pickle
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

def load_and_preprocess_data():
    
    
    # Cargar datos.
    data = pd.read_csv('datos_educativos_extended.txt')
    
    print(f"Loaded dataset with {len(data)} records")
    print(f"Date range: {data['anio'].min()} - {data['anio'].max()}")
    print(f"Schools: {data['escuelaId'].nunique()}")
    
    
    data['time_period'] = data['anio'] + (data['semestre'] - 1) * 0.5
    
    return data

def train_arima_models(data):
   
    
    print("\n" + "="*50)
    print("Entrenando modelos ARIMA para predicción de alumnos e inscripciones")
    print("="*50)
    

    ts_students = data.groupby('time_period')['cantidad_alumnos'].mean().sort_index()
    print(f"Serie de tiempo para estudiantes: {len(ts_students)} periods")
    

    ts_enrollments = data.groupby('time_period')['numero_inscripciones'].mean().sort_index()
    print(f"Serie de tiempo para inscripciones: {len(ts_enrollments)} periods")
    
   
    print("\nCalculando...")
    best_order_students = find_best_arima_order(ts_students)
    
 
    arima_students = ARIMA(ts_students, order=best_order_students)
    arima_students_fit = arima_students.fit()
    print(f"Estudiantes entrenados {best_order_students}")
    print(f"AIC: {arima_students_fit.aic:.2f}")
    
   
    print("\nCalculando...")
    best_order_enrollments = find_best_arima_order(ts_enrollments)
    
    arima_enrollments = ARIMA(ts_enrollments, order=best_order_enrollments)
    arima_enrollments_fit = arima_enrollments.fit()
    print(f"Inscripciones calculadas {best_order_enrollments}")
    print(f"AIC: {arima_enrollments_fit.aic:.2f}")
    
  
    arima_students_fit.save('models/arima_students_model.pkl')
    arima_enrollments_fit.save('models/arima_enrollments_model.pkl')
    
    
    model_metadata = {
        'students': {
            'order': best_order_students,
            'aic': arima_students_fit.aic,
            'last_value': float(ts_students.iloc[-1]),
            'mean_value': float(ts_students.mean()),
            'trend': 'Aumento' if ts_students.iloc[-1] > ts_students.iloc[0] else 'Disminución'
        },
        'enrollments': {
            'order': best_order_enrollments,
            'aic': arima_enrollments_fit.aic,
            'last_value': float(ts_enrollments.iloc[-1]),
            'mean_value': float(ts_enrollments.mean()),
            'trend': 'Aumento' if ts_enrollments.iloc[-1] > ts_enrollments.iloc[0] else 'Disminución'
        },
        'training_date': datetime.now().isoformat(),
        'data_periods': len(ts_students)
    }
    
    with open('models/arima_metadata.pkl', 'wb') as f:
        pickle.dump(model_metadata, f)
    
    print("\nModelo guardado exitosamente!")
    return arima_students_fit, arima_enrollments_fit

def find_best_arima_order(ts_data, max_p=3, max_d=2, max_q=3):
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

def train_dropout_model(data):
   
    
    print("\n" + "="*50)
    print("Entrenando modelo de Árbol de Decisión para predicción de deserción escolar")
    print("="*50)
    
    # Prepare features
    features = ['cantidad_alumnos', 'numero_inscripciones', 'numero_maestros', 
                'promedio_calificaciones', 'esUrbana']
    
    X = data[features].copy()
    
 
    X['student_teacher_ratio'] = X['cantidad_alumnos'] / X['numero_maestros']
    X['enrollment_rate'] = X['numero_inscripciones'] / X['cantidad_alumnos']
    
  
    X['esUrbana'] = X['esUrbana'].astype(int)
    
  
    median_dropout = data['tasa_desercion'].median()
    y = (data['tasa_desercion'] > median_dropout).astype(int)
    
    print(f"Features: {X.columns.tolist()}")
    print(f"Media de tasa de deserción: {median_dropout:.2f}%")
    print(f"Muestras de alto riesgo: {y.sum()} ({y.mean()*100:.1f}%)")
    
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
  
    dt_model = DecisionTreeClassifier(
        max_depth=8,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight='balanced'
    )
    
    dt_model.fit(X_train, y_train)
    
  
    y_pred = dt_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nDesempeño del modelo:")
    print(f"Precisión: {accuracy:.4f}")
    print("\nReporte de clasificación:")
    print(classification_report(y_test, y_pred))
    
   
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importancia': dt_model.feature_importances_
    }).sort_values('importancia', ascending=False)
    
    print("\nImportancia del feature:")
    for _, row in feature_importance.iterrows():
        print(f"  {row['feature']}: {row['importancia']:.4f}")
    
   
    joblib.dump(dt_model, 'models/decision_tree_model.pkl')
    
 
    model_metadata = {
        'features': X.columns.tolist(),
        'feature_importance': feature_importance.to_dict('records'),
        'accuracy': accuracy,
        'median_dropout_threshold': median_dropout,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'class_distribution': {
            'low_risk': int((y == 0).sum()),
            'high_risk': int((y == 1).sum())
        },
        'training_date': datetime.now().isoformat()
    }
    
    with open('models/decision_tree_metadata.pkl', 'wb') as f:
        pickle.dump(model_metadata, f)
    
    print("\nModelo de Árbol de Decisión guardado exitosamente!")
    return dt_model

def create_models_directory():

    import os
    if not os.path.exists('models'):
        os.makedirs('models')
        print("Created 'models' directory")

def main():
  
    
    print("SCRIPT PARA ENTRENAR Y EXPORTAR MODELOS DE IA PARA PREDICCIONES EDUCATIVAS")
    print("=" * 60)
    print(f"Esta instancia de entrenamiento comenzó en: {datetime.now()}")
 
    create_models_directory()
    
 
    print("\n1. Cargando datos...")
    data = load_and_preprocess_data()
    
    
    print("\n2. Entrenando modelo ARIMA...")
    try:
        arima_students, arima_enrollments = train_arima_models(data)
    except Exception as e:
        print(f"Error al entrenar modelo: {e}")
        return
    
    
    print("\n3. Entrenando árbol de decisiones...")
    try:
        dt_model = train_dropout_model(data)
    except Exception as e:
        print(f"error al entrenar modelo: {e}")
        return
    
    
    print("\n" + "="*60)
    print("Entrenamiento completado exitosamente!")
    print("="*60)
    print("Modelos guardadoes en el directorio 'models/':")
    print("  - arima_students_model.pkl")
    print("  - arima_enrollments_model.pkl") 
    print("  - decision_tree_model.pkl")
    print("  - arima_metadata.pkl")
    print("  - decision_tree_metadata.pkl")
    print(f"\nEntrenamiento completado en: {datetime.now()}")
    
    print("\nNota final:")
    print("Los modelos deberían ser entrenados nuevamente de forma periodica")

if __name__ == "__main__":
    main()