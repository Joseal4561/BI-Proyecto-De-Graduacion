import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRankService } from './user-rank.service';
import { CreateUserRankDto } from './dto/create-user-rank.dto';
import { UpdateUserRankDto } from './dto/update-user-rank.dto';

@Controller('user-ranks')
@UseGuards(AuthGuard('jwt'))
export class UserRankController {
  constructor(private readonly userRankService: UserRankService) {}

  @Post()
  create(@Body() createUserRankDto: CreateUserRankDto) {
    return this.userRankService.create(createUserRankDto);
  }

  @Get()
  findAll() {
    return this.userRankService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.userRankService.findByUserId(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userRankService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserRankDto: UpdateUserRankDto, @Request() req) {
    return this.userRankService.update(+id, updateUserRankDto, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.userRankService.remove(+id, req.user.role);
  }

  @Post('bulk-upload')
  async bulkUpload(@Body() uploadData: { data: any[] }, @Request() req) {
    try {
      const { data } = uploadData;

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No se proporcionaron datos válidos para importar');
      }

      const results = await this.userRankService.bulkInsert(data, req.user.role);

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

  // Endpoint to get data filter for current user
  @Get('filter/my-access')
  async getMyDataFilter(@Request() req) {
    return this.userRankService.getDataFilterForUser(req.user.userId);
  }

  // Endpoint to get accessible school IDs for current user
  @Get('access/schools')
  async getAccessibleSchools(@Request() req) {
    return this.userRankService.getAccessibleSchoolIds(req.user.userId);
  }

  // Endpoint to check if current user can access a specific school
  @Get('access/school/:escuelaId')
  async canAccessSchool(@Param('escuelaId') escuelaId: string, @Request() req) {
    const hasAccess = await this.userRankService.canAccessSchool(req.user.userId, +escuelaId);
    return { hasAccess };
  }

  // Endpoint to check if current user can access a specific municipio
  @Get('access/municipio/:municipioId')
  async canAccessMunicipio(@Param('municipioId') municipioId: string, @Request() req) {
    const hasAccess = await this.userRankService.canAccessMunicipio(req.user.userId, +municipioId);
    return { hasAccess };
  }
}