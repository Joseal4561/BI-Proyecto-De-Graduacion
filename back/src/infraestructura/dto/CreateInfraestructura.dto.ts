import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class CreateInfraestructuraEscolarDto {
  @IsNumber()
  @IsNotEmpty()
  escuelaId: number;

  // Datos generales del establecimiento
  @IsEnum(['Monolingüe', 'Bilingüe'])
  @IsOptional()
  modalidad?: 'Monolingüe' | 'Bilingüe';

  @IsEnum(['Urbana', 'Rural'])
  @IsOptional()
  area?: 'Urbana' | 'Rural';

  @IsString()
  @IsOptional()
  jornada?: string;

  // Descripción de la infraestructura
  @IsNumber()
  @IsOptional()
  totalAulasFormales?: number;

  @IsBoolean()
  @IsOptional()
  techoLamina?: boolean;

  @IsBoolean()
  @IsOptional()
  techoLosaFundida?: boolean;

  @IsBoolean()
  @IsOptional()
  paredesAdobe?: boolean;

  @IsBoolean()
  @IsOptional()
  paredesBlock?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneDireccion?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneCocina?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneBodega?: boolean;

  @IsNumber()
  @IsOptional()
  sanitariosLavables?: number;

  @IsNumber()
  @IsOptional()
  sanitariosLetrinas?: number;

  @IsBoolean()
  @IsOptional()
  tieneSalonUsosMultiples?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneLaboratorio?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneMuroPerimetral?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneCanchaPolideportiva?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneCanchaBaloncesto?: boolean;

  @IsBoolean()
  @IsOptional()
  tieneCanchaFutbol?: boolean;

  @IsBoolean()
  @IsOptional()
  tienePiscina?: boolean;

  @IsBoolean()
  @IsOptional()
  circulacionDelPredio?: boolean;

  @IsString()
  @IsOptional()
  observacionesInfraestructura?: string;

  // Acceso y servicios
  @IsNumber()
  @IsOptional()
  hueAMunKmAsfalto?: number;

  @IsNumber()
  @IsOptional()
  hueAMunKmTerraceria?: number;

  @IsNumber()
  @IsOptional()
  munAComKmAsfalto?: number;

  @IsNumber()
  @IsOptional()
  munAComKmTerraceria?: number;

  @IsNumber()
  @IsOptional()
  comACenKmAsfalto?: number;

  @IsNumber()
  @IsOptional()
  munACenKmTerraceria?: number;

  @IsNumber()
  @IsOptional()
  munACenKmVereda?: number;

  @IsBoolean()
  @IsOptional()
  servicioEnergiaElectrica?: boolean;

  @IsBoolean()
  @IsOptional()
  servicioAguaPotable?: boolean;

  @IsBoolean()
  @IsOptional()
  drenajeRedMunicipal?: boolean;

  @IsBoolean()
  @IsOptional()
  drenajeFosaSeptica?: boolean;

  @IsBoolean()
  @IsOptional()
  drenajeFosaSepticaYPozo?: boolean;

  @IsBoolean()
  @IsOptional()
  drenajeDesfogueARio?: boolean;

  // Aspecto Legal y Condiciones
  @IsString()
  @IsOptional()
  certezaJuridica?: string;

  @IsString()
  @IsOptional()
  predioANombreDe?: string;

  @IsEnum(['Bueno', 'Malo'])
  @IsOptional()
  condicionEdificio?: 'Bueno' | 'Malo';

  @IsString()
  @IsOptional()
  dañoAEdificio?: string;

  // Observaciones
  @IsBoolean()
  @IsOptional()
  esPrioritario?: boolean;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsBoolean()
  @IsOptional()
  cuentaConPredio?: boolean;

  @IsBoolean()
  @IsOptional()
  programaDeRemozamiento?: boolean;

  @IsString()
  @IsOptional()
  servicioMasReciente?: string;

  // Mobiliario
  @IsNumber()
  @IsOptional()
  noEscritorios?: number;

  @IsNumber()
  @IsOptional()
  noMesasHexagonales?: number;

  @IsNumber()
  @IsOptional()
  noPizarras?: number;

  @IsNumber()
  @IsOptional()
  noCatedras?: number;

  @IsNumber()
  @IsOptional()
  idSolicitud?: number;

  @IsString()
  @IsOptional()
  coordenadas?: string;
}