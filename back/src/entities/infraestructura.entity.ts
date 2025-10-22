import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Escuela } from './escuela.entity';
import { NecesidadMobiliario } from './solicitud.entity';

@Entity('infraestructura_escolar')
export class InfraestructuraEscolar {
  @PrimaryGeneratedColumn({ name: 'id_infraestructura' })
  idInfraestructura: number;

  @Column({ name: 'escuela_id' })
  escuelaId: number;

  // Datos generales del establecimiento
  @Column({ type: 'enum', enum: ['Monolingüe', 'Bilingüe'], nullable: true })
  modalidad: 'Monolingüe' | 'Bilingüe';

  @Column({ type: 'enum', enum: ['Urbana', 'Rural'], nullable: true })
  area: 'Urbana' | 'Rural';

  @Column({ type: 'varchar', length: 50, nullable: true })
  jornada: string;

  // Descripción de la infraestructura
  @Column({ type: 'int', default: 0, name: 'total_aulas_formales' })
  totalAulasFormales: number;

  @Column({ type: 'boolean', default: false, name: 'techo_lamina' })
  techoLamina: boolean;

  @Column({ type: 'boolean', default: false, name: 'techo_losa_fundida' })
  techoLosaFundida: boolean;

  @Column({ type: 'boolean', default: false, name: 'paredes_adobe' })
  paredesAdobe: boolean;

  @Column({ type: 'boolean', default: false, name: 'paredes_block' })
  paredesBlock: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_direccion' })
  tieneDireccion: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_cocina' })
  tieneCocina: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_bodega' })
  tieneBodega: boolean;

  @Column({ type: 'int', default: 0, name: 'sanitarios_lavables' })
  sanitariosLavables: number;

  @Column({ type: 'int', default: 0, name: 'sanitarios_letrinas' })
  sanitariosLetrinas: number;

  @Column({ type: 'boolean', default: false, name: 'tiene_salon_usos_multiples' })
  tieneSalonUsosMultiples: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_laboratorio' })
  tieneLaboratorio: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_muro_perimetral' })
  tieneMuroPerimetral: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_cancha_polideportiva' })
  tieneCanchaPolideportiva: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_cancha_baloncesto' })
  tieneCanchaBaloncesto: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_cancha_futbol' })
  tieneCanchaFutbol: boolean;

  @Column({ type: 'boolean', default: false, name: 'tiene_piscina' })
  tienePiscina: boolean;

  @Column({ type: 'boolean', default: false, name: 'circulación_del_predio' })
  circulacionDelPredio: boolean;

  @Column({ type: 'text', nullable: true, name: 'observaciones_infraestructura' })
  observacionesInfraestructura: string;

  // Acceso y servicios
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'hue_a_mun_km_asfalto' })
  hueAMunKmAsfalto: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'hue_a_mun_km_terraceria' })
  hueAMunKmTerraceria: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'mun_a_com_km_asfalto' })
  munAComKmAsfalto: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'mun_a_com_km_terraceria' })
  munAComKmTerraceria: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'com_a_cen_km_asfalto' })
  comACenKmAsfalto: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'mun_a_cen_km_terraceria' })
  munACenKmTerraceria: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'mun_a_cen_km_vereda' })
  munACenKmVereda: number;

  @Column({ type: 'boolean', default: false, name: 'servicio_energia_electrica' })
  servicioEnergiaElectrica: boolean;

  @Column({ type: 'boolean', default: false, name: 'servicio_agua_potable' })
  servicioAguaPotable: boolean;

  @Column({ type: 'boolean', default: false, name: 'drenaje_red_municipal' })
  drenajeRedMunicipal: boolean;

  @Column({ type: 'boolean', default: false, name: 'drenaje_fosa_septica' })
  drenajeFosaSeptica: boolean;

  @Column({ type: 'boolean', default: false, name: 'drenaje_fosa_septica_y_pozo' })
  drenajeFosaSepticaYPozo: boolean;

  @Column({ type: 'boolean', default: false, name: 'drenaje_desfogue_a_rio' })
  drenajeDesfogueARio: boolean;

  // Aspecto Legal y Condiciones
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'certeza_juridica' })
  certezaJuridica: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'predio_a_nombre_de' })
  predioANombreDe: string;

  @Column({ type: 'enum', enum: ['Bueno', 'Malo'], nullable: true, name: 'condicion_edificio' })
  condicionEdificio: 'Bueno' | 'Malo';

  @Column({ type: 'text', nullable: true, name: 'daño_a_edificio' })
  dañoAEdificio: string;

  // Observaciones
  @Column({ type: 'boolean', default: false, name: 'es_prioritario' })
  esPrioritario: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'boolean', default: false, name: 'cuenta_con_perdio' })
  cuentaConPredio: boolean;

  @Column({ type: 'boolean', default: false, name: 'programa_de_remozamiento' })
  programaDeRemozamiento: boolean;

  @Column({ type: 'varchar', length: 15, nullable: true, name: 'servicio_mas_reciente' })
  servicioMasReciente: string;

  // Mobiliario
  @Column({ type: 'int', nullable: true, name: 'no_escritorios' })
  noEscritorios: number;

  @Column({ type: 'int', nullable: true, name: 'no_mesas_hexagonales' })
  noMesasHexagonales: number;

  @Column({ type: 'int', nullable: true, name: 'no_pizzarras' })
  noPizarras: number;

  @Column({ type: 'int', nullable: true, name: 'no_catedras' })
  noCatedras: number;

  @Column({ type: 'int', nullable: true, name: 'id_solicitud' })
  idSolicitud: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  coordenadas: string;

  // Relaciones
  @ManyToOne(() => Escuela)
  @JoinColumn({ name: 'escuela_id' })
  escuela: Escuela;

  @ManyToOne(() => NecesidadMobiliario)
  @JoinColumn({ name: 'id_solicitud' })
  necesidadMobiliario: NecesidadMobiliario;
}