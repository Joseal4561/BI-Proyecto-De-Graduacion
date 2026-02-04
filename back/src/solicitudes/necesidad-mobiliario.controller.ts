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
    return this.necesidadMobiliarioService.create(createNecesidadMobiliarioDto, req.user.role, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.necesidadMobiliarioService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.necesidadMobiliarioService.findOne(+id, req.user.id);
  }

  @Get('escuela/:escuelaId')
  findByEscuela(@Param('escuelaId') escuelaId: string, @Request() req) {
    return this.necesidadMobiliarioService.findByEscuela(+escuelaId, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNecesidadMobiliarioDto: UpdateSolicitudDto, @Request() req) {
    return this.necesidadMobiliarioService.update(+id, updateNecesidadMobiliarioDto, req.user.role, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.necesidadMobiliarioService.remove(+id, req.user.role, req.user.id);
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