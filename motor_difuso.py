import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# 1. Definición de Antecedentes (Entradas) y Consecuentes (Salidas)
hvs = ctrl.Antecedent(np.arange(0, 101, 1), 'humedad_sustrato')
ta = ctrl.Antecedent(np.arange(-10, 51, 1), 'temperatura_ambiental')
hr = ctrl.Antecedent(np.arange(0, 101, 1), 'humedad_relativa')

pr = ctrl.Consequent(np.arange(0, 101, 1), 'prioridad_riego')
rf = ctrl.Consequent(np.arange(0, 101, 1), 'riesgo_fitosanitario')

# 2. Funciones de pertenencia[cite: 2]
# Humedad Volumétrica del Sustrato (HVS)
hvs['deficit'] = fuzz.zmf(hvs.universe, 10, 40)
hvs['capacidad_campo'] = fuzz.trapmf(hvs.universe, [30, 50, 70, 85])
hvs['saturacion'] = fuzz.smf(hvs.universe, 75, 90)

# Temperatura Ambiental (TA)
ta['fria'] = fuzz.trimf(ta.universe, [-10, 0, 15])
ta['templada'] = fuzz.trimf(ta.universe, [10, 20, 28])
ta['calida'] = fuzz.trimf(ta.universe, [22, 30, 38])
ta['extrema'] = fuzz.trapmf(ta.universe, [35, 40, 50, 50])

# Humedad Relativa (HR)
hr['baja'] = fuzz.zmf(hr.universe, 30, 50)
hr['media'] = fuzz.trimf(hr.universe, [30, 50, 70])
hr['alta'] = fuzz.smf(hr.universe, 60, 80)

# Prioridad de Riego (PR)
pr['nula'] = fuzz.trimf(pr.universe, [0, 0, 20])
pr['baja'] = fuzz.trimf(pr.universe, [10, 25, 40])
pr['moderada'] = fuzz.trimf(pr.universe, [30, 50, 70])
pr['alta'] = fuzz.trimf(pr.universe, [60, 75, 90])
pr['critica'] = fuzz.trapmf(pr.universe, [80, 90, 100, 100])

# Riesgo Fitosanitario (RF)
rf['bajo'] = fuzz.trimf(rf.universe, [0, 0, 30])
rf['medio'] = fuzz.trimf(rf.universe, [20, 45, 70])
rf['alto'] = fuzz.trimf(rf.universe, [60, 75, 90])
rf['critico'] = fuzz.trapmf(rf.universe, [80, 90, 100, 100])

# 3. Base de Conocimiento: 20 Reglas de Producción[cite: 2]
# Bloque A: Prioridad de Riego
regla1 = ctrl.Rule(hvs['deficit'] & ta['extrema'], pr['critica'])
regla2 = ctrl.Rule(hvs['deficit'] & ta['calida'], pr['alta'])
regla3 = ctrl.Rule(hvs['deficit'] & ta['templada'], pr['moderada'])
regla4 = ctrl.Rule(hvs['deficit'] & ta['fria'], pr['baja'])
regla5 = ctrl.Rule(hvs['deficit'] & hr['baja'] & ta['calida'], pr['critica'])
regla6 = ctrl.Rule(hvs['capacidad_campo'] & ta['extrema'], pr['moderada'])
regla7 = ctrl.Rule(hvs['capacidad_campo'] & ta['calida'], pr['baja'])
regla8 = ctrl.Rule(hvs['capacidad_campo'] & ta['templada'], pr['nula'])
regla9 = ctrl.Rule(hvs['saturacion'], pr['nula'])
regla10 = ctrl.Rule(hvs['capacidad_campo'] & hr['alta'] & ta['calida'], pr['nula'])

# Bloque B: Riesgo Fitosanitario
regla11 = ctrl.Rule(hvs['saturacion'] & ta['calida'] & hr['alta'], rf['critico'])
regla12 = ctrl.Rule(hvs['saturacion'] & ta['templada'] & hr['alta'], rf['alto'])
regla13 = ctrl.Rule(hvs['saturacion'] & ta['fria'], rf['alto'])
regla14 = ctrl.Rule(hr['alta'] & ta['templada'], rf['medio'])
regla15 = ctrl.Rule(hvs['capacidad_campo'] & hr['baja'] & ta['templada'], rf['bajo'])
regla16 = ctrl.Rule(hvs['deficit'] & ta['extrema'] & hr['baja'], rf['alto'])
regla17 = ctrl.Rule(hvs['capacidad_campo'] & ta['extrema'] & hr['alta'], rf['medio'])
regla18 = ctrl.Rule(hvs['deficit'] & ta['fria'], rf['bajo'])
regla19 = ctrl.Rule(hvs['saturacion'] & hr['media'] & ta['templada'], rf['medio'])
regla20 = ctrl.Rule(hvs['capacidad_campo'] & hr['media'] & ta['calida'], rf['bajo'])

# 4. Controladores de Inferencia Mamdani[cite: 2]
riego_ctrl = ctrl.ControlSystem([regla1, regla2, regla3, regla4, regla5, regla6, regla7, regla8, regla9, regla10])
riesgo_ctrl = ctrl.ControlSystem([regla11, regla12, regla13, regla14, regla15, regla16, regla17, regla18, regla19, regla20])

# Envoltorios de simulación para inyección de crisp inputs
simulador_riego = ctrl.ControlSystemSimulation(riego_ctrl)
simulador_riesgo = ctrl.ControlSystemSimulation(riesgo_ctrl)

def evaluar_estado_planta(humedad_sustrato: float, temperatura: float, humedad_relativa: float) -> dict:
    """Ejecuta el SED y devuelve las magnitudes desfuzificadas (Centroide)."""
    
    simulador_riego.input['humedad_sustrato'] = humedad_sustrato
    simulador_riego.input['temperatura_ambiental'] = temperatura
    simulador_riego.input['humedad_relativa'] = humedad_relativa
    
    simulador_riesgo.input['humedad_sustrato'] = humedad_sustrato
    simulador_riesgo.input['temperatura_ambiental'] = temperatura
    simulador_riesgo.input['humedad_relativa'] = humedad_relativa
    
    simulador_riego.compute()
    simulador_riesgo.compute()
    
    # Manejo de excepciones para Base de Reglas Dispersa
    try:
        pr_val = round(simulador_riego.output['prioridad_riego'], 2)
    except KeyError:
        pr_val = 0.0  # Sin prioridad si ninguna regla aplica
        
    try:
        rf_val = round(simulador_riesgo.output['riesgo_fitosanitario'], 2)
    except KeyError:
        rf_val = 0.0  # Sin riesgo documentado si ninguna regla aplica
    
    return {
        "prioridad_riego": pr_val,
        "riesgo_fitosanitario": rf_val
    }

# Bloque de ejecución de prueba
if __name__ == "__main__":
    # Test 1: Simulación con parámetros del documento (HVS:25, TA:35, HR:40)[cite: 2]
    resultado = evaluar_estado_planta(25.0, 35.0, 40.0)
    print("--- Resultados de la Desfuzificación ---")
    print(f"Prioridad de Riego (0-100): {resultado['prioridad_riego']}%")
    print(f"Riesgo Fitosanitario (0-100): {resultado['riesgo_fitosanitario']}%")