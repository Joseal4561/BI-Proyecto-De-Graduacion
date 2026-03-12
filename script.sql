CREATE DATABASE  IF NOT EXISTS `db_educacion` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `db_educacion`;
-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_educacion
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `datos_educativos`
--

DROP TABLE IF EXISTS `datos_educativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datos_educativos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `escuela_id` int NOT NULL,
  `anio` year NOT NULL,
  `semestre` enum('1','2') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_alumnos` int NOT NULL,
  `numero_inscripciones` int NOT NULL,
  `tasa_desercion` decimal(5,2) NOT NULL,
  `tasa_promocion` decimal(5,2) DEFAULT NULL,
  `numero_maestros` int DEFAULT NULL,
  `promedio_calificaciones` decimal(4,2) DEFAULT NULL,
  `es_urbana` tinyint(1) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_datos_educativos` (`escuela_id`,`anio`,`semestre`),
  CONSTRAINT `datos_educativos_ibfk_1` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `datos_educativos`
--

LOCK TABLES `datos_educativos` WRITE;
/*!40000 ALTER TABLE `datos_educativos` DISABLE KEYS */;
/*!40000 ALTER TABLE `datos_educativos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escuelas`
--

DROP TABLE IF EXISTS `escuelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escuelas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_udi` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modalidad` enum('monolingüe','bilingüe') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jornada` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_fundacion` date DEFAULT NULL,
  `tipo_id` int NOT NULL,
  `municipio_id` int NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_codigo_udi` (`codigo_udi`),
  KEY `tipo_id` (`tipo_id`),
  KEY `municipio_id` (`municipio_id`),
  CONSTRAINT `escuelas_ibfk_1` FOREIGN KEY (`tipo_id`) REFERENCES `tipos_escuelas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `escuelas_ibfk_2` FOREIGN KEY (`municipio_id`) REFERENCES `municipios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escuelas`
--

LOCK TABLES `escuelas` WRITE;
/*!40000 ALTER TABLE `escuelas` DISABLE KEYS */;
INSERT INTO `escuelas` VALUES (36,'ZCK1ADFI9A','Colegio Interamericano','9','999','bilingüe','Matutina','1991-01-19',2,23,'2025-11-04 22:20:38');
/*!40000 ALTER TABLE `escuelas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `infraestructura_escolar`
--

DROP TABLE IF EXISTS `infraestructura_escolar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `infraestructura_escolar` (
  `id_infraestructura` int NOT NULL AUTO_INCREMENT,
  `escuela_id` int NOT NULL,
  `modalidad` enum('Monolingüe','Bilingüe') DEFAULT NULL,
  `area` enum('Urbana','Rural') DEFAULT NULL,
  `jornada` varchar(50) DEFAULT NULL,
  `total_aulas_formales` int DEFAULT '0',
  `techo_lamina` tinyint(1) DEFAULT '0',
  `techo_losa_fundida` tinyint(1) DEFAULT '0',
  `paredes_adobe` tinyint(1) DEFAULT '0',
  `paredes_block` tinyint(1) DEFAULT '0',
  `tiene_direccion` tinyint(1) DEFAULT '0',
  `tiene_cocina` tinyint(1) DEFAULT '0',
  `tiene_bodega` tinyint(1) DEFAULT '0',
  `sanitarios_lavables` int DEFAULT '0',
  `sanitarios_letrinas` int DEFAULT '0',
  `tiene_salon_usos_multiples` tinyint(1) DEFAULT '0',
  `tiene_laboratorio` tinyint(1) DEFAULT '0',
  `tiene_muro_perimetral` tinyint(1) DEFAULT '0',
  `tiene_cancha_polideportiva` tinyint(1) DEFAULT '0',
  `tiene_cancha_baloncesto` tinyint(1) DEFAULT '0',
  `tiene_cancha_futbol` tinyint(1) DEFAULT '0',
  `tiene_piscina` tinyint(1) DEFAULT '0',
  `circulación_del_predio` tinyint(1) DEFAULT '0',
  `observaciones_infraestructura` text,
  `hue_a_mun_km_asfalto` decimal(8,2) DEFAULT NULL,
  `hue_a_mun_km_terraceria` decimal(8,2) DEFAULT NULL,
  `mun_a_com_km_asfalto` decimal(8,2) DEFAULT NULL,
  `mun_a_com_km_terraceria` decimal(8,2) DEFAULT NULL,
  `com_a_cen_km_asfalto` decimal(8,2) DEFAULT NULL,
  `mun_a_cen_km_terraceria` decimal(8,2) DEFAULT NULL,
  `mun_a_cen_km_vereda` decimal(8,2) DEFAULT NULL,
  `servicio_energia_electrica` tinyint(1) DEFAULT '0',
  `servicio_agua_potable` tinyint(1) DEFAULT '0',
  `drenaje_red_municipal` tinyint(1) DEFAULT '0',
  `drenaje_fosa_septica` tinyint(1) DEFAULT '0',
  `drenaje_fosa_septica_y_pozo` tinyint(1) DEFAULT '0',
  `drenaje_desfogue_a_rio` tinyint(1) DEFAULT '0',
  `certeza_juridica` varchar(100) DEFAULT NULL,
  `predio_a_nombre_de` varchar(100) DEFAULT NULL,
  `condicion_edificio` enum('Bueno','Malo') DEFAULT NULL,
  `daño_a_edificio` text,
  `es_prioritario` tinyint(1) DEFAULT '0',
  `observaciones` text,
  `cuenta_con_perdio` tinyint(1) DEFAULT '0',
  `programa_de_remozamiento` tinyint(1) DEFAULT '0',
  `servicio_mas_reciente` varchar(15) DEFAULT NULL,
  `no_escritorios` int DEFAULT NULL,
  `no_mesas_hexagonales` int DEFAULT NULL,
  `no_pizzarras` int DEFAULT NULL,
  `no_catedras` int DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `coordenadas` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_infraestructura`),
  KEY `escuela_id` (`escuela_id`),
  KEY `id_solicitud` (`id_solicitud`),
  CONSTRAINT `infraestructura_escolar_ibfk_1` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`),
  CONSTRAINT `infraestructura_escolar_ibfk_2` FOREIGN KEY (`id_solicitud`) REFERENCES `necesidad_mobiliario` (`id_necesidad`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `infraestructura_escolar`
--

LOCK TABLES `infraestructura_escolar` WRITE;
/*!40000 ALTER TABLE `infraestructura_escolar` DISABLE KEYS */;
INSERT INTO `infraestructura_escolar` VALUES (5,36,'Bilingüe','Urbana','Matutina',20,0,1,0,1,1,1,1,10,6,1,1,1,1,1,1,1,1,'',0.06,0.07,0.04,0.04,0.03,0.03,0.03,1,1,1,0,0,0,'Si','Director','Malo','Daño de agua',1,'',1,0,'2020',100,100,20,20,2,'12.222, 42.444');
/*!40000 ALTER TABLE `infraestructura_escolar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `municipios`
--

DROP TABLE IF EXISTS `municipios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `municipios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `municipios`
--

LOCK TABLES `municipios` WRITE;
/*!40000 ALTER TABLE `municipios` DISABLE KEYS */;
INSERT INTO `municipios` VALUES (3,'Aguacatán'),(1,'Chiantla'),(4,'Colotenango'),(5,'Concepción Huista'),(6,'Cotzal'),(7,'Cuilco'),(2,'Huehuetenango'),(8,'Jacaltenango'),(9,'La Democracia'),(10,'La Libertad'),(11,'Malacatancito'),(12,'Nentón'),(13,'Petatán'),(14,'San Antonio Huista'),(15,'San Gaspar Ixchil'),(16,'San Ildefonso Ixtahuacán'),(17,'San Juan Atitán'),(18,'San Juan Ixcoy'),(19,'San Mateo Ixtatán'),(20,'San Miguel Adentro'),(21,'San Pedro Necta'),(22,'San Pedro Soloma'),(24,'San Rafael la Unión'),(23,'San Rafael Pétzal'),(25,'San Sebastián Coatán'),(26,'San Sebastián Huehuetenango'),(27,'Santa Ana'),(28,'Santa Cruz Barillas'),(29,'Santa Eulalia'),(30,'Santiago Chimaltenango'),(31,'Soloma'),(32,'Tectitán'),(33,'Todos Santos Cuchumatán'),(34,'Unión Cantinil');
/*!40000 ALTER TABLE `municipios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `necesidad_mobiliario`
--

DROP TABLE IF EXISTS `necesidad_mobiliario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `necesidad_mobiliario` (
  `id_necesidad` int NOT NULL AUTO_INCREMENT,
  `escuela_id` int NOT NULL,
  `necesidad_escritorios` int DEFAULT '0',
  `necesidad_mesas_hexagonales` int DEFAULT '0',
  `necesidad_pizarras` int DEFAULT '0',
  `necesidad_catedras` int DEFAULT '0',
  `fecha_reporte` date DEFAULT NULL,
  `estado` enum('pendiente','en revision','aprobada','desaprobada','en proceso','completada') DEFAULT 'pendiente',
  PRIMARY KEY (`id_necesidad`),
  KEY `escuela_id` (`escuela_id`),
  CONSTRAINT `necesidad_mobiliario_ibfk_1` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `necesidad_mobiliario`
--

LOCK TABLES `necesidad_mobiliario` WRITE;
/*!40000 ALTER TABLE `necesidad_mobiliario` DISABLE KEYS */;
INSERT INTO `necesidad_mobiliario` VALUES (2,36,9,8,7,6,NULL,'completada');
/*!40000 ALTER TABLE `necesidad_mobiliario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `predicciones_ia`
--

DROP TABLE IF EXISTS `predicciones_ia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `predicciones_ia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parametros_entrada` json DEFAULT NULL,
  `resultado_prediccion` json DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_predicciones_ia_usuario_id` (`usuario_id`),
  CONSTRAINT `FK_predicciones_ia_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `predicciones_ia`
--

LOCK TABLES `predicciones_ia` WRITE;
/*!40000 ALTER TABLE `predicciones_ia` DISABLE KEYS */;
INSERT INTO `predicciones_ia` VALUES (1,'{\"descripcion\": \"test\", \"tasaDesercion\": \"1\", \"numeroMaestros\": \"1\", \"cantidadAlumnos\": \"1\", \"numeroInscripciones\": \"1\"}','{\"data\": {\"status\": \"successful\", \"message\": \"Prediction completed successfully\", \"timestamp\": \"2025-09-21T18:40:54.932227\", \"confidence\": 0.1, \"model_info\": {\"type\": \"basic_predictor\", \"version\": \"1.0.0\"}, \"prediction\": 1, \"processing_time\": \"< 1 second\", \"processed_features\": {\"feature1\": 1, \"feature2\": 1, \"feature3\": 1, \"feature4\": 1}}, \"success\": true, \"timestamp\": \"2025-09-22T00:40:54.941Z\"}',NULL,'2025-09-22 00:40:54','2025-09-22 00:40:54'),(2,'{\"descripcion\": \"test2\", \"tasaDesercion\": \"1\", \"numeroMaestros\": \"8\", \"cantidadAlumnos\": \"2\", \"numeroInscripciones\": \"5\"}','{\"data\": {\"status\": \"successful\", \"message\": \"Prediction completed successfully\", \"timestamp\": \"2025-09-21T19:07:51.094844\", \"confidence\": 0.1, \"model_info\": {\"type\": \"basic_predictor\", \"version\": \"1.0.0\"}, \"prediction\": 4, \"processing_time\": \"< 1 second\", \"processed_features\": {\"feature1\": 2, \"feature2\": 5, \"feature3\": 1, \"feature4\": 8}}, \"success\": true, \"timestamp\": \"2025-09-22T01:07:51.103Z\"}',NULL,'2025-09-22 01:07:51','2025-09-22 01:07:51'),(3,'{\"descripcion\": \"test3\", \"tasaDesercion\": \"2\", \"numeroMaestros\": \"5\", \"cantidadAlumnos\": \"4\", \"numeroInscripciones\": \"6\"}','{\"data\": {\"status\": \"Exitosa\", \"message\": \"Predicción generada correctamente\", \"timestamp\": \"2025-09-21T19:15:27.395509\", \"confidence\": 0.1, \"model_info\": {\"type\": \"basic_predictor\", \"version\": \"1.0.0\"}, \"prediction\": 4.25, \"processing_time\": \"< 1 second\", \"processed_features\": {\"feature1\": 4, \"feature2\": 6, \"feature3\": 2, \"feature4\": 5}}, \"success\": true, \"timestamp\": \"2025-09-22T01:15:27.420Z\"}',NULL,'2025-09-22 01:15:27','2025-09-22 01:15:27');
/*!40000 ALTER TABLE `predicciones_ia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_finalizada`
--

DROP TABLE IF EXISTS `solicitud_finalizada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_finalizada` (
  `id_finalizada` int NOT NULL AUTO_INCREMENT,
  `necesidad_id` int NOT NULL,
  `estado` varchar(20) NOT NULL,
  `escritorios_entregados` int DEFAULT NULL,
  `mesas_hexagonales_entregadas` int DEFAULT NULL,
  `pizarras_entregadas` int DEFAULT NULL,
  `catedras_entregadas` int DEFAULT NULL,
  `fecha_finalizacion` datetime NOT NULL,
  PRIMARY KEY (`id_finalizada`),
  UNIQUE KEY `necesidad_id` (`necesidad_id`),
  CONSTRAINT `solicitud_finalizada_ibfk_1` FOREIGN KEY (`necesidad_id`) REFERENCES `necesidad_mobiliario` (`id_necesidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_finalizada`
--

LOCK TABLES `solicitud_finalizada` WRITE;
/*!40000 ALTER TABLE `solicitud_finalizada` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud_finalizada` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_escuelas`
--

DROP TABLE IF EXISTS `tipos_escuelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_escuelas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_escuelas`
--

LOCK TABLES `tipos_escuelas` WRITE;
/*!40000 ALTER TABLE `tipos_escuelas` DISABLE KEYS */;
INSERT INTO `tipos_escuelas` VALUES (2,'Básico'),(3,'Diversificado'),(6,'Oficial Rural'),(7,'Oficial Urbana'),(8,'preprimaria'),(1,'Primaria'),(5,'Privada'),(4,'Técnico');
/*!40000 ALTER TABLE `tipos_escuelas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_rank`
--

DROP TABLE IF EXISTS `user_rank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_rank` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `rankn` enum('Director','Coordinador','Administrador') NOT NULL,
  `escuela_id` int DEFAULT NULL,
  `municipio_id` int DEFAULT NULL,
  `asignado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_rank` (`user_id`),
  KEY `escuela_id` (`escuela_id`),
  KEY `municipio_id` (`municipio_id`),
  CONSTRAINT `user_rank_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_rank_ibfk_2` FOREIGN KEY (`escuela_id`) REFERENCES `escuelas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_rank_ibfk_3` FOREIGN KEY (`municipio_id`) REFERENCES `municipios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_rank`
--

LOCK TABLES `user_rank` WRITE;
/*!40000 ALTER TABLE `user_rank` DISABLE KEYS */;
INSERT INTO `user_rank` VALUES (1,9,'Administrador',NULL,NULL,'2026-02-04 00:12:18');
/*!40000 ALTER TABLE `user_rank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9,'admin4','admin4@gmail.com','$2b$10$Zdc1NiHksGXsHGTGlIL5Y.0T.osSnAMrfzaoSMucl80P.lUJ11olW','admin','2026-02-03 19:36:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-11 19:18:32
