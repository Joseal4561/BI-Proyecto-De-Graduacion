import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrediccionesIaService } from './predicciones-ia.service';
import { AiService, PredictionDto } from './ai.service';
import { SavePrediccionDto } from './dto/create-prediccion.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api')
export class PrediccionesIaController {
  constructor(
    private readonly prediccionesIaService: PrediccionesIaService,
    private readonly aiService: AiService
  ) {}

  @Post('ai/predict/enrollment')
  async makePredictionEnrollment(@Body() predictionDto: any) {
    try {
      const parameters: PredictionDto = {
        model_type: 'enrollment',
        cantidad_alumnos: predictionDto.cantidad_alumnos,
        numero_inscripciones: predictionDto.numero_inscripciones,
        anio: predictionDto.anio
      };

      const result = await this.aiService.executePythonScript(parameters);
      
      return {
        success: true,
        data: result,
        model_type: 'enrollment',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error en predicción de inscripciones: ${error.message}`);
    }
  }

  @Post('ai/predict/dropout')
  async makePredictionDropout(@Body() predictionDto: any) {
    try {
      const parameters: PredictionDto = {
        model_type: 'dropout',
        cantidad_alumnos: predictionDto.cantidad_alumnos,
        numero_inscripciones: predictionDto.numero_inscripciones,
        numero_maestros: predictionDto.numero_maestros,
        promedio_calificaciones: predictionDto.promedio_calificaciones,
        es_urbana: predictionDto.es_urbana
      };

      const result = await this.aiService.executePythonScript(parameters);
      
      return {
        success: true,
        data: result,
        model_type: 'dropout',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Error en predicción de deserción: ${error.message}`);
    }
  }

  // Endpoint para conexión genérica, actualmente sin uso.
  @Post('ai/predict')
  async makePrediction(@Body() createPrediccionDto: any) {
    try {
      const result = await this.makePredictionEnrollment(createPrediccionDto);
      return result;
    } catch (error) {
      throw new Error(`Error en predicción: ${error.message}`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('predicciones-ia')
  async findAll() {
    return this.prediccionesIaService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('predicciones-ia')
  async create(@Body() savePrediccionDto: SavePrediccionDto, @Request() req) {
    const usuarioId = req.user?.id || savePrediccionDto.usuarioId;
    return this.prediccionesIaService.create({
      ...savePrediccionDto,
      usuarioId
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('predicciones-ia/:id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.prediccionesIaService.remove(+id);
  }
}