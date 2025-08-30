import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DatosEducativosService } from './datos-educativos.serivce';
import { CreateDatosEducativosDto, UpdateDatosEducativosDto } from './dto';

@Controller('datos-educativos')
@UseGuards(AuthGuard('jwt'))
export class DatosEducativosController {
  constructor(private readonly datosEducativosService: DatosEducativosService) {}

  @Post()
  create(@Body() createDatosEducativosDto: CreateDatosEducativosDto, @Request() req) {
    return this.datosEducativosService.create(createDatosEducativosDto, req.user.role);
  }

  @Get()
  findAll(@Query('escuelaId') escuelaId?: string, @Query('anio') anio?: string) {
    if (escuelaId) {
      return this.datosEducativosService.findByEscuela(+escuelaId);
    }
    if (anio) {
      return this.datosEducativosService.findByYear(+anio);
    }
    return this.datosEducativosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datosEducativosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatosEducativosDto: UpdateDatosEducativosDto, @Request() req) {
    return this.datosEducativosService.update(+id, updateDatosEducativosDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.datosEducativosService.remove(+id, req.user.role);
  }
}