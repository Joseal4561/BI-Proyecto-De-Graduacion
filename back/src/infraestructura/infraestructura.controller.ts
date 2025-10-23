import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InfraestructuraEscolarService } from './infraestructura.service';
import { CreateInfraestructuraEscolarDto } from './dto/CreateInfraestructura.dto';
import { UpdateInfraestructuraEscolarDto } from './dto/UpdateInfraestructura.dto';

@Controller('infraestructura-escolar')
@UseGuards(AuthGuard('jwt'))
export class InfraestructuraEscolarController {
  constructor(private readonly infraestructuraEscolarService: InfraestructuraEscolarService) {}

  @Post()
  create(@Body() createInfraestructuraEscolarDto: CreateInfraestructuraEscolarDto, @Request() req) {
    return this.infraestructuraEscolarService.create(createInfraestructuraEscolarDto, req.user.role);
  }

  @Get()
  findAll() {
    return this.infraestructuraEscolarService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infraestructuraEscolarService.findOne(+id);
  }

  @Get('escuela/:escuelaId')
  findByEscuela(@Param('escuelaId') escuelaId: string) {
    return this.infraestructuraEscolarService.findByEscuela(+escuelaId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInfraestructuraEscolarDto: UpdateInfraestructuraEscolarDto, @Request() req) {
    return this.infraestructuraEscolarService.update(+id, updateInfraestructuraEscolarDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.infraestructuraEscolarService.remove(+id, req.user.role);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }) {
    try {
      const { data } = uploadData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.infraestructuraEscolarService.bulkInsert(data);
      
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