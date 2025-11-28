import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FurniturePredictionDto {
  escuela_id: number;
  periods_ahead?: number; // Number of months to predict (default 6)
}

@Injectable()
export class FurnitureAiService {
  private readonly logger = new Logger(FurnitureAiService.name);

  async predictFurnitureNeeds(parameters: FurniturePredictionDto): Promise<any> {
    try {
      const scriptPath = '/var/www/projects/carta/back/Aimodels/Carta/furniture_prediction.py';
      const VENV_PYTHON_EXECUTABLE = '/var/www/projects/carta/back/Aimodels/Carta/bin/python3';

      this.logger.log(`Script path: ${scriptPath}`);
      this.logger.log(`Predicting furniture needs for school: ${parameters.escuela_id}`);
      
      // Prepare parameters
      const pythonParams = {
        escuela_id: parameters.escuela_id.toString(),
        periods_ahead: (parameters.periods_ahead || 6).toString()
      };
      
      const parametersJson = JSON.stringify(pythonParams);
      
      // FIX: Properly escape JSON for command line
      // Replace double quotes with escaped quotes and wrap in single quotes for cross-platform compatibility
      const escapedJson = parametersJson.replace(/"/g, '\\"');
      
      // Execute Python script with properly escaped JSON
      const command = process.platform === 'win32'
        ? `python3 "${scriptPath}" "${escapedJson}"`
        : `${VENV_PYTHON_EXECUTABLE} '${scriptPath}' '${parametersJson}'`;
      
      this.logger.log(`Executing command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        cwd: process.cwd(),
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
      });

      if (stderr) {
        this.logger.warn(`Python script stderr: ${stderr}`);
        // Log stderr but don't throw unless stdout is empty
      }

      this.logger.log(`Python script stdout: ${stdout}`);

      if (!stdout || stdout.trim() === '') {
        throw new Error(`Python script returned empty output. Stderr: ${stderr || 'none'}`);
      }

      // Parse result
      const result = JSON.parse(stdout.trim());
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Python script returned error status');
      }
      
      this.logger.log('Furniture prediction script executed successfully');
      return result;
      
    } catch (error) {
      this.logger.error(`Error executing furniture prediction script: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Fallo en la ejecución del script de predicción de mobiliario: ${error.message}`);
    }
  }
}
