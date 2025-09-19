import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TipoEscuelaService } from './tipo-escuela.service';
import {CreateTipoEscuelaDto} from './dto/create-tipo-escuela.dto';
import {UpdateTipoEscuelaDto} from './dto/update-tipo-escuela.dto';

@Controller('tipos-escuelas')
@UseGuards(AuthGuard('jwt'))
export class TipoEscuelaController {
  constructor(private readonly tipoEscuelaService: TipoEscuelaService) {}

  @Post()
  create(@Body() createTipoEscuelaDto: CreateTipoEscuelaDto, @Request() req) {
    return this.tipoEscuelaService.create(createTipoEscuelaDto, req.user.role);
  }

  @Get()
  findAll() {
    return this.tipoEscuelaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoEscuelaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoEscuelaDto: UpdateTipoEscuelaDto, @Request() req) {
    return this.tipoEscuelaService.update(+id, updateTipoEscuelaDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tipoEscuelaService.remove(+id, req.user.role);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }) {
    try {
      const { data } = uploadData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.tipoEscuelaService.bulkInsert(data);
      
      return {
        success: true,
        imported: results.imported,
        failed: results.failed,
        errors: results.errors
      };
    } catch (error) {
      throw new BadRequestException(`Error durante la importación: ${error.message}`);
    }
  }
}