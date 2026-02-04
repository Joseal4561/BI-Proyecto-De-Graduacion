import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EscuelaService } from './escuelas.service';
import { CreateEscuelaDto } from './dto/create-escuela.dto';
import { UpdateEscuelaDto } from './dto/update-escuela.dto';

@Controller('escuelas')
@UseGuards(AuthGuard('jwt'))
export class EscuelaController {
  constructor(private readonly escuelaService: EscuelaService) {}

  @Post()
  create(@Body() createEscuelaDto: CreateEscuelaDto, @Request() req) {
    return this.escuelaService.create(createEscuelaDto, req.user.role);
  }

  @Get()
  findAll(@Request() req) {
    return this.escuelaService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.escuelaService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEscuelaDto: UpdateEscuelaDto, @Request() req) {
    return this.escuelaService.update(+id, updateEscuelaDto, req.user.role, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.escuelaService.remove(+id, req.user.role, req.user.id);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }) {
    try {
      const { data } = uploadData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.escuelaService.bulkInsert(data);
      
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