import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MunicipioService } from './municipio.service';
import { CreateMunicipioDto} from './dto/create-municipio.dto';
import { UpdateMunicipioDto } from './dto/update-municipio.dto';

@Controller('municipios')
@UseGuards(AuthGuard('jwt'))
export class MunicipioController {
  constructor(private readonly municipioService: MunicipioService) {}

  @Post()
  create(@Body() createMunicipioDto: CreateMunicipioDto, @Request() req) {
    return this.municipioService.create(createMunicipioDto, req.user.role);
  }

  @Get()
  findAll() {
    return this.municipioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.municipioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMunicipioDto: UpdateMunicipioDto, @Request() req) {
    return this.municipioService.update(+id, updateMunicipioDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.municipioService.remove(+id, req.user.role);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }) {
    try {
      const { data } = uploadData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.municipioService.bulkInsert(data);
      
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