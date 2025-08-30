import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EscuelasService } from './escuelas.service';

@Controller('escuelas')
@UseGuards(AuthGuard('jwt'))
export class EscuelasController {
  constructor(private readonly escuelasService: EscuelasService) {}

  @Get()
  findAll() {
    return this.escuelasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.escuelasService.findOne(+id);
  }
}