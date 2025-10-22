import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NecesidadMobiliarioService } from './necesidad-mobiliario.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';

@Controller('necesidad-mobiliario')
@UseGuards(AuthGuard('jwt'))
export class NecesidadMobiliarioController {
  constructor(private readonly necesidadMobiliarioService: NecesidadMobiliarioService) {}

  @Post()
  create(@Body() createNecesidadMobiliarioDto: CreateSolicitudDto, @Request() req) {
    return this.necesidadMobiliarioService.create(createNecesidadMobiliarioDto, req.user.role);
  }

  @Get()
  findAll() {
    return this.necesidadMobiliarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.necesidadMobiliarioService.findOne(+id);
  }

  @Get('escuela/:escuelaId')
  findByEscuela(@Param('escuelaId') escuelaId: string) {
    return this.necesidadMobiliarioService.findByEscuela(+escuelaId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNecesidadMobiliarioDto: UpdateSolicitudDto, @Request() req) {
    return this.necesidadMobiliarioService.update(+id, updateNecesidadMobiliarioDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.necesidadMobiliarioService.remove(+id, req.user.role);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }) {
    try {
      const { data } = uploadData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.necesidadMobiliarioService.bulkInsert(data);
      
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