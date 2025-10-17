import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface EnrollmentPredictionDto {
  model_type: 'enrollment';
  cantidad_alumnos: number;
  numero_inscripciones: number;
  anio: number;
}

export interface DropoutPredictionDto {
  model_type: 'dropout';
  cantidad_alumnos: number;
  numero_inscripciones: number;
  numero_maestros: number;
  promedio_calificaciones: number;
  es_urbana: boolean;
}

export type PredictionDto = EnrollmentPredictionDto | DropoutPredictionDto;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async executePythonScript(parameters: PredictionDto): Promise<any> {
    try {
      const scriptPath = '../src/ai/ai_model.py';
      
      this.logger.log(`Script path: ${scriptPath}`);
      this.logger.log(`Model type: ${parameters.model_type}`);
      

      const pythonParams = this.preparePythonParameters(parameters);
      
      const parametersJson = JSON.stringify(pythonParams);
      
 
      const command = `python3 "${scriptPath}" "${parametersJson}"`;
      this.logger.log(`Executing command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        cwd: process.cwd(),
      });

      if (stderr) {
        this.logger.warn(`Python script stderr: ${stderr}`);
      }

      this.logger.log(`Python script stdout: ${stdout}`);

      if (!stdout || stdout.trim() === '') {
        throw new Error('Python script returned empty output');
      }

   
      const result = JSON.parse(stdout.trim());
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Python script returned error status');
      }
      
      this.logger.log('Script Python ejecutado exitosamente');
      return result;
      
    } catch (error) {
      this.logger.error(`Error ejecutando script Python: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Fallo en la ejecución del script Python: ${error.message}`);
    }
  }

  private preparePythonParameters(parameters: PredictionDto): any {
    if (parameters.model_type === 'enrollment') {
      return {
        model_type: 'enrollment',
        cantidad_alumnos: parameters.cantidad_alumnos.toString(),
        numero_inscripciones: parameters.numero_inscripciones.toString(),
        anio: parameters.anio.toString()
      };
    } else if (parameters.model_type === 'dropout') {
      return {
        model_type: 'dropout',
        cantidad_alumnos: parameters.cantidad_alumnos.toString(),
        numero_inscripciones: parameters.numero_inscripciones.toString(),
        numero_maestros: parameters.numero_maestros.toString(),
        promedio_calificaciones: parameters.promedio_calificaciones.toString(),
        es_urbana: parameters.es_urbana.toString()
      };
    } else {
      throw new Error(`Unsupported model type: ${(parameters as any).model_type}`);
    }
  }
}
