-- MySQL dump 10.13  Distrib 8.0.19-10, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: space_abyss_dev
-- ------------------------------------------------------
-- Server version	8.0.19-10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!50717 SELECT COUNT(*) INTO @rocksdb_has_p_s_session_variables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'performance_schema' AND TABLE_NAME = 'session_variables' */;
/*!50717 SET @rocksdb_get_is_supported = IF (@rocksdb_has_p_s_session_variables, 'SELECT COUNT(*) INTO @rocksdb_is_supported FROM performance_schema.session_variables WHERE VARIABLE_NAME=\'rocksdb_bulk_load\'', 'SELECT 0') */;
/*!50717 PREPARE s FROM @rocksdb_get_is_supported */;
/*!50717 EXECUTE s */;
/*!50717 DEALLOCATE PREPARE s */;
/*!50717 SET @rocksdb_enable_bulk_load = IF (@rocksdb_is_supported, 'SET SESSION rocksdb_bulk_load = 1', 'SET @rocksdb_dummy_bulk_load = 0') */;
/*!50717 PREPARE s FROM @rocksdb_enable_bulk_load */;
/*!50717 EXECUTE s */;
/*!50717 DEALLOCATE PREPARE s */;

--
-- Table structure for table `actions`
--

DROP TABLE IF EXISTS `actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `addiction_linkers`
--

DROP TABLE IF EXISTS `addiction_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addiction_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `addicted_to_object_type_id` int DEFAULT NULL,
  `addicted_body_id` int DEFAULT NULL,
  `addiction_level` int DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `tick_count` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=476 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(30) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=286 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_notifications`
--

DROP TABLE IF EXISTS `ai_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ai_id` int DEFAULT NULL,
  `previous_energy` int DEFAULT NULL,
  `notified_today` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_rules`
--

DROP TABLE IF EXISTS `ai_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ai_id` int DEFAULT NULL,
  `attack` varchar(30) DEFAULT NULL,
  `protect` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `owner_id` int DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `renting_player_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `is_accepted` tinyint(1) DEFAULT '0',
  `price` int DEFAULT '0',
  `auto_market` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artists`
--

DROP TABLE IF EXISTS `artists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artists` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `twitter_link` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assembled_in_linkers`
--

DROP TABLE IF EXISTS `assembled_in_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assembled_in_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `assembled_in_object_type_id` int DEFAULT NULL,
  `tick_count` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assemblies`
--

DROP TABLE IF EXISTS `assemblies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assemblies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `assembler_object_id` int DEFAULT NULL,
  `being_assembled_object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `socket_id` varchar(30) DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `current_tick_count` int DEFAULT '0',
  `amount_completed` int DEFAULT '0',
  `total_amount` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3942 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banned_entries`
--

DROP TABLE IF EXISTS `banned_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banned_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email_address` varchar(240) DEFAULT NULL,
  `ip_address` varchar(240) DEFAULT NULL,
  `reason` varchar(240) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bid_linkers`
--

DROP TABLE IF EXISTS `bid_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bid_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  `price` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `biomes`
--

DROP TABLE IF EXISTS `biomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biomes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `body_types`
--

DROP TABLE IF EXISTS `body_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `body_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `image_url` varchar(60) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  `credit_cost` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coords`
--

DROP TABLE IF EXISTS `coords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coords` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tile_x` int DEFAULT NULL,
  `tile_y` int DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `planet_type` varchar(20) DEFAULT NULL,
  `object` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `planet_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `object_amount` int DEFAULT '0',
  `floor_type_id` int DEFAULT NULL,
  `belongs_to_planet_id` int DEFAULT NULL,
  `belongs_to_object_id` int DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  `watched_by_object_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10202 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dirty_datas`
--

DROP TABLE IF EXISTS `dirty_datas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dirty_datas` (
  `id` int unsigned NOT NULL,
  `the_number` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docking_rules`
--

DROP TABLE IF EXISTS `docking_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docking_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_id` int DEFAULT NULL,
  `allow` varchar(30) DEFAULT NULL,
  `deny` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drop_linkers`
--

DROP TABLE IF EXISTS `drop_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drop_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `monster_type_id` int DEFAULT NULL,
  `dropped_object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `dropped_monster_type_id` int DEFAULT NULL,
  `reason` varchar(20) DEFAULT NULL,
  `rarity` int DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  `dropped_floor_type_id` int DEFAULT NULL,
  `event_linker_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eating_linkers`
--

DROP TABLE IF EXISTS `eating_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eating_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `body_id` int DEFAULT NULL,
  `eating_object_type_id` int DEFAULT NULL,
  `ticks_completed` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5591 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipment_linkers`
--

DROP TABLE IF EXISTS `equipment_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `equip_slot` varchar(24) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `body_id` int DEFAULT NULL,
  `amount` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2106 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_linkers`
--

DROP TABLE IF EXISTS `event_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `monster_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `level` int DEFAULT '0',
  `floor_type_id` int DEFAULT NULL,
  `hp_effect` int DEFAULT '0',
  `gives_object_type_id` int DEFAULT NULL,
  `floor_type_class` varchar(20) DEFAULT NULL,
  `spawns_off_grid` tinyint(1) DEFAULT '0',
  `npc_job_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `max_level` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `limit_per_planet` int DEFAULT NULL,
  `highest_planet_level` int DEFAULT '0',
  `lowest_planet_level` int DEFAULT '0',
  `tick_count` int DEFAULT NULL,
  `requires_floor_type_id` int DEFAULT NULL,
  `minimum_planet_hp_percent` int DEFAULT NULL,
  `maximum_planet_hp_percent` int DEFAULT NULL,
  `requires_floor_type_class` varchar(20) DEFAULT NULL,
  `spawns_in_galaxy` tinyint(1) DEFAULT '0',
  `galaxy_limit` int DEFAULT '0',
  `rarity` int DEFAULT '1',
  `despawn_condition` varchar(30) DEFAULT '',
  `difficulty` int DEFAULT '0',
  `despawn_result` varchar(20) DEFAULT 'destroy',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faction_invitations`
--

DROP TABLE IF EXISTS `faction_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faction_invitations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `inviting_player_id` int DEFAULT NULL,
  `invited_player_id` int DEFAULT NULL,
  `faction_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faction_linkers`
--

DROP TABLE IF EXISTS `faction_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faction_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `faction_id` int DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `factions`
--

DROP TABLE IF EXISTS `factions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `description` text,
  `player_count` int DEFAULT '1',
  `requires_invite` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `floor_type_assembly_linkers`
--

DROP TABLE IF EXISTS `floor_type_assembly_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floor_type_assembly_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `required_for_floor_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `floor_type_display_linkers`
--

DROP TABLE IF EXISTS `floor_type_display_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floor_type_display_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `floor_type_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `game_file_index` int DEFAULT NULL,
  `layer` varchar(20) DEFAULT NULL,
  `only_visual` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `floor_types`
--

DROP TABLE IF EXISTS `floor_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floor_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `hp_effect` int DEFAULT '0',
  `can_build_on` tinyint(1) DEFAULT NULL,
  `planet_type_ids` varchar(60) DEFAULT NULL,
  `max_floor_level` int DEFAULT '0',
  `min_floor_level` int DEFAULT NULL,
  `is_protected` tinyint(1) DEFAULT '0',
  `is_assembled` tinyint(1) DEFAULT '0',
  `game_file_index` int DEFAULT '0',
  `repaired_floor_type_id` int DEFAULT NULL,
  `can_walk_on` tinyint(1) DEFAULT '1',
  `can_decay` tinyint(1) DEFAULT '0',
  `default_decay_rate` int DEFAULT NULL,
  `is_animated` tinyint(1) DEFAULT '0',
  `movement_modifier` decimal(4,2) DEFAULT '1.00',
  `artist_id` int DEFAULT NULL,
  `class` varchar(20) DEFAULT NULL,
  `frame_count` int DEFAULT '1',
  `hp_effect_damage_type` varchar(20) DEFAULT NULL,
  `movement_type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=89 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `galaxies`
--

DROP TABLE IF EXISTS `galaxies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galaxies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `year` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventories`
--

DROP TABLE IF EXISTS `inventories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `item_1` varchar(60) DEFAULT '0',
  `item_1_amount` smallint unsigned DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `item_2` varchar(60) DEFAULT NULL,
  `item_2_amount` int DEFAULT NULL,
  `item_3` varchar(60) DEFAULT NULL,
  `item_3_amount` int DEFAULT NULL,
  `last_free_spot` smallint unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `object_id` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `player_id_index` (`player_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `owned_by_object_id` int DEFAULT NULL,
  `price` int DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  `body_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28454 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_linkers`
--

DROP TABLE IF EXISTS `job_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `job_id` int DEFAULT NULL,
  `next_job_id` int DEFAULT NULL,
  `structure_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `killed_linkers`
--

DROP TABLE IF EXISTS `killed_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `killed_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `monster_count` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6651 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market_linkers`
--

DROP TABLE IF EXISTS `market_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `market_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `area_id` int DEFAULT NULL,
  `ending_at` bigint unsigned DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `rarity` smallint unsigned DEFAULT NULL,
  `mineable` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `game_file_x_offset` int DEFAULT '0',
  `game_file_y_offset` int DEFAULT '0',
  `planet_type_ids` varchar(60) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `body` text,
  `from_player_id` int DEFAULT NULL,
  `to_player_id` int DEFAULT NULL,
  `unread` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `from_user_id` int DEFAULT NULL,
  `to_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mining_linkers`
--

DROP TABLE IF EXISTS `mining_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mining_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monster_planet_linkers`
--

DROP TABLE IF EXISTS `monster_planet_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monster_planet_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `monster_type_id` int DEFAULT NULL,
  `planet_type_id` int DEFAULT NULL,
  `spawns_here` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monster_type_attacks`
--

DROP TABLE IF EXISTS `monster_type_attacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monster_type_attacks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `damage_amount` int DEFAULT NULL,
  `damage_type` varchar(20) DEFAULT NULL,
  `rarity` tinyint DEFAULT NULL,
  `maximum_hp_percent` int DEFAULT NULL,
  `flavor_text` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `minimum_hp_percent` int DEFAULT NULL,
  `minimum_attack_range` int DEFAULT NULL,
  `maximum_attack_range` int DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  `additional_effect` varchar(20) DEFAULT NULL,
  `damage_effect` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monster_types`
--

DROP TABLE IF EXISTS `monster_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monster_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `exp` int unsigned DEFAULT NULL,
  `hp` int unsigned DEFAULT NULL,
  `attack_strength` smallint unsigned DEFAULT NULL,
  `attack_range` smallint unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `race_id` int DEFAULT NULL,
  `auto_attack` tinyint(1) DEFAULT '1',
  `max_level` int DEFAULT '0',
  `image_src` varchar(100) DEFAULT NULL,
  `description` text,
  `frame_count` int DEFAULT NULL,
  `drops_amount` int DEFAULT '1',
  `attack_movement_type` varchar(20) DEFAULT NULL,
  `spawns_object_type_id` int DEFAULT NULL,
  `spawns_monster_type_id` int DEFAULT NULL,
  `idle_movement_type` varchar(20) DEFAULT NULL,
  `game_file_index` int DEFAULT NULL,
  `movement_tile_width` int DEFAULT '1',
  `movement_tile_height` int DEFAULT '1',
  `admin_description` text,
  `attack_movement_delay` int DEFAULT '2000',
  `artist_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `frame_width` int DEFAULT NULL,
  `frame_height` int DEFAULT NULL,
  `hacking_defense_modifier` int DEFAULT '0',
  `piercing_defense_modifier` int DEFAULT '0',
  `defense` int DEFAULT '1',
  `decay_rate` int DEFAULT '0',
  `spawns_object_type_amount` int DEFAULT NULL,
  `spawns_object_type_depleted` varchar(20) DEFAULT NULL,
  `spawns_object_type_on_create` tinyint(1) DEFAULT NULL,
  `spawns_object_type_location` varchar(20) DEFAULT NULL,
  `spawns_monster_location` varchar(20) DEFAULT NULL,
  `attack_chance_on_harvest` int DEFAULT '0',
  `control_defense_modifier` int DEFAULT '0',
  `corrosive_defense_modifier` int DEFAULT '0',
  `electric_defense_modifier` int DEFAULT '0',
  `explosion_defense_modifier` int DEFAULT '0',
  `freezing_defense_modifier` int DEFAULT '0',
  `heat_defense_modifier` int DEFAULT '0',
  `gravity_defense_modifier` int DEFAULT '0',
  `laser_defense_modifier` int DEFAULT '0',
  `melee_defense_modifier` int DEFAULT '0',
  `plasma_defense_modifier` int DEFAULT '0',
  `poison_defense_modifier` int DEFAULT '0',
  `radiation_defense_modifier` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=159 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monsters`
--

DROP TABLE IF EXISTS `monsters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monsters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `type` varchar(40) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `current_hp` int DEFAULT '0',
  `exp` int DEFAULT '0',
  `attack_strength` int DEFAULT '0',
  `planet_id` int DEFAULT NULL,
  `planet_level` int DEFAULT '0',
  `planet_coord_id` int DEFAULT NULL,
  `max_hp` int DEFAULT '1',
  `object_id` int DEFAULT NULL,
  `ship_coord_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `spawned_event_id` int DEFAULT NULL,
  `has_spawned_object` tinyint(1) DEFAULT '0',
  `spawned_object_type_amount` int DEFAULT NULL,
  `spawner_tick_count` int DEFAULT '0',
  `current_spawn_linker_id` int DEFAULT '0',
  `coord_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=25389 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newsletters`
--

DROP TABLE IF EXISTS `newsletters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(240) DEFAULT NULL,
  `body` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `last_user_id_sent` int DEFAULT '0',
  `should_send` tinyint(1) DEFAULT '0',
  `finished_sending` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npc_job_requirement_linkers`
--

DROP TABLE IF EXISTS `npc_job_requirement_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `npc_job_requirement_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `npc_job_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npc_jobs`
--

DROP TABLE IF EXISTS `npc_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `npc_jobs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_starter` tinyint(1) DEFAULT '0',
  `ship_object_type_id` int DEFAULT NULL,
  `body_object_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npc_types`
--

DROP TABLE IF EXISTS `npc_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `npc_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `race_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `profession` varchar(40) DEFAULT NULL,
  `build_priority` int DEFAULT '0',
  `small_priority` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npcs`
--

DROP TABLE IF EXISTS `npcs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `npcs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `father_id` int DEFAULT NULL,
  `mother_id` int DEFAULT NULL,
  `is_alive` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `personality_type_id` int DEFAULT NULL,
  `personality_type` varchar(40) DEFAULT NULL,
  `race_id` int DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `build_priority` int DEFAULT '0',
  `small_priority` int DEFAULT '0',
  `family_priority` int DEFAULT '0',
  `build_skill` int DEFAULT '0',
  `spouse_id` int DEFAULT '0',
  `current_hp` int DEFAULT '1',
  `max_hp` int DEFAULT '1',
  `planet_coord_id` int DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `current_structure` varchar(20) DEFAULT NULL,
  `has_inventory` tinyint(1) DEFAULT '0',
  `attack_strength` int DEFAULT '1',
  `dream_structure_type_id` int DEFAULT NULL,
  `current_structure_type_id` int DEFAULT NULL,
  `current_structure_type_is_built` tinyint(1) DEFAULT '0',
  `current_job_id` int DEFAULT NULL,
  `dream_job_id` int DEFAULT NULL,
  `coord_id` int DEFAULT NULL,
  `ship_coord_id` int DEFAULT NULL,
  `farming_skill_points` int DEFAULT '1',
  `attacking_skill_points` int DEFAULT '1',
  `defending_skill_points` int DEFAULT '1',
  `wants_object_type_id` int DEFAULT NULL,
  `enslaved_to_player_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `enslaved_to_npc_id` int DEFAULT NULL,
  `surgery_skill_points` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_assembly_linkers`
--

DROP TABLE IF EXISTS `object_type_assembly_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_assembly_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `required_for_object_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_conversion_linkers`
--

DROP TABLE IF EXISTS `object_type_conversion_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_conversion_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `input_object_type_id` int DEFAULT NULL,
  `output_type` varchar(30) DEFAULT NULL,
  `output_object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `output_amount` int DEFAULT '1',
  `input_type` varchar(30) DEFAULT NULL,
  `output_destination` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_decay_linkers`
--

DROP TABLE IF EXISTS `object_type_decay_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_decay_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  `decay_rate` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `decays_when_abandoned` tinyint(1) DEFAULT '0',
  `floor_type_class` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_display_linkers`
--

DROP TABLE IF EXISTS `object_type_display_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_display_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `game_file_index` int DEFAULT NULL,
  `layer` varchar(20) DEFAULT NULL,
  `only_visual` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_equipment_linkers`
--

DROP TABLE IF EXISTS `object_type_equipment_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_equipment_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `equip_slot` varchar(20) DEFAULT NULL,
  `auto_doc_required` tinyint(1) DEFAULT '0',
  `capacity_used` int DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_type_research_linkers`
--

DROP TABLE IF EXISTS `object_type_research_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_type_research_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `research_tick_count` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `research_times_required` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `object_types`
--

DROP TABLE IF EXISTS `object_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  `hp` int unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `spawns_object_type_id` int DEFAULT '0',
  `attack_strength` smallint DEFAULT '0',
  `min_attack_range` int DEFAULT '0',
  `exp` smallint DEFAULT '0',
  `spawns_object_seconds` smallint unsigned DEFAULT '0',
  `regeneration_rate` smallint unsigned DEFAULT NULL,
  `is_assembled` tinyint(1) DEFAULT '0',
  `visitable` tinyint(1) DEFAULT '0',
  `npc_buildable` tinyint(1) DEFAULT '0',
  `spawns_object_type_amount` int DEFAULT '0',
  `spawns_id` int DEFAULT NULL,
  `spawns_type` varchar(20) DEFAULT NULL,
  `is_plantable` tinyint(1) DEFAULT '0',
  `planted_object_type_id` int DEFAULT NULL,
  `is_equippable` tinyint(1) DEFAULT '0',
  `can_pick_up` tinyint(1) DEFAULT '0',
  `equip_slot` varchar(20) DEFAULT NULL,
  `credits_required` int DEFAULT '0',
  `defense` int DEFAULT '0',
  `equip_skill` varchar(20) DEFAULT NULL,
  `description` text,
  `assembly_time` int DEFAULT NULL,
  `assembly_object_type_id` int DEFAULT NULL,
  `can_walk_on` tinyint(1) DEFAULT '1',
  `game_file_index` int DEFAULT NULL,
  `research_tick_count` int DEFAULT NULL,
  `can_be_researched` tinyint(1) DEFAULT '0',
  `research_times_required` int DEFAULT NULL,
  `required_research_object_type_id` int DEFAULT NULL,
  `spawns_object_type_depleted` varchar(20) DEFAULT NULL,
  `spawns_object_type_on_create` tinyint(1) DEFAULT '0',
  `max_attack_range` int DEFAULT '0',
  `can_eat` tinyint(1) DEFAULT '0',
  `has_spawned_object_game_file_index` int DEFAULT NULL,
  `can_be_mined` tinyint(1) DEFAULT '0',
  `can_be_attacked` tinyint(1) DEFAULT '0',
  `race_id` int DEFAULT NULL,
  `can_be_built` tinyint(1) DEFAULT '0',
  `is_trap` tinyint(1) DEFAULT '0',
  `is_ship` tinyint(1) DEFAULT '0',
  `is_dockable` tinyint(1) DEFAULT '0',
  `active_game_file_index` int DEFAULT NULL,
  `is_active_frame_count` int DEFAULT '0',
  `spawns_monster_type_id` int DEFAULT '0',
  `spawns_monster_location` varchar(20) DEFAULT NULL,
  `complexity` int DEFAULT '1',
  `assembled_as_object` tinyint(1) DEFAULT '1',
  `grows_into_object_type_id` int DEFAULT NULL,
  `can_have_rules` tinyint(1) DEFAULT '0',
  `is_stairs` tinyint(1) DEFAULT '0',
  `is_hole` tinyint(1) DEFAULT '0',
  `repaired_object_type_id` int DEFAULT NULL,
  `manufacturing_modifier` int DEFAULT NULL,
  `hp_modifier` int DEFAULT NULL,
  `defense_modifier` int DEFAULT NULL,
  `attack_modifier` int DEFAULT NULL,
  `linked_object_type_id` int DEFAULT NULL,
  `is_wall` tinyint(1) DEFAULT '0',
  `max_storage` int DEFAULT NULL,
  `is_converter` tinyint(1) DEFAULT '0',
  `can_have_inventory` tinyint(1) DEFAULT '0',
  `can_decay` tinyint(1) DEFAULT '0',
  `admin_description` text,
  `default_decay_rate` int DEFAULT NULL,
  `move_delay` int DEFAULT NULL,
  `can_be_salvaged` tinyint(1) DEFAULT '0',
  `mining_modifier` int DEFAULT NULL,
  `artist_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `assembled_in_object` tinyint(1) DEFAULT '0',
  `attack_radius` int DEFAULT '0',
  `is_consumed_on_attack` tinyint(1) DEFAULT '0',
  `can_be_repaired` tinyint(1) DEFAULT '0',
  `max_energy_storage` int DEFAULT NULL,
  `needs_engines` tinyint(1) DEFAULT '0',
  `is_ship_wall` tinyint(1) DEFAULT '0',
  `drop_requires_object_type_id` int DEFAULT NULL,
  `drop_requires_floor_type_class` varchar(20) DEFAULT NULL,
  `spawns_object_type_location` varchar(20) DEFAULT NULL,
  `frame_width` int DEFAULT NULL,
  `frame_height` int DEFAULT NULL,
  `spawns_in_galaxy` tinyint(1) DEFAULT '0',
  `heat_defense_modifier` int DEFAULT '0',
  `freezing_defense_modifier` int DEFAULT '0',
  `is_skin` tinyint(1) DEFAULT '0',
  `is_ship_weapon` tinyint(1) DEFAULT '0',
  `is_ship_engine` tinyint(1) DEFAULT '0',
  `can_be_claimed` tinyint(1) DEFAULT '0',
  `engine_power_required` int DEFAULT '0',
  `engine_power` int DEFAULT '0',
  `electric_defense_modifier` int DEFAULT '0',
  `is_full_game_file_index` int DEFAULT '0',
  `land_movement_modifier` decimal(4,2) DEFAULT '1.00',
  `fluid_movement_modifier` decimal(4,2) DEFAULT '1.00',
  `air_movement_modifier` decimal(4,2) DEFAULT '1.00',
  `control_defense_modifier` int DEFAULT '0',
  `corrosive_defense_modifier` int DEFAULT '0',
  `explosion_defense_modifier` int DEFAULT '0',
  `gravity_defense_modifier` int DEFAULT '0',
  `hacking_defense_modifier` int DEFAULT '0',
  `laser_defense_modifier` int DEFAULT '0',
  `melee_defense_modifier` int DEFAULT '0',
  `piercing_defense_modifier` int DEFAULT '0',
  `plasma_defense_modifier` int DEFAULT '0',
  `poison_defense_modifier` int DEFAULT '0',
  `radiation_defense_modifier` int DEFAULT '0',
  `is_portal` tinyint(1) DEFAULT '0',
  `attaches_to_object_type_id` int DEFAULT NULL,
  `researching_modifier` int DEFAULT '0',
  `farming_modifier` int DEFAULT '0',
  `decay_modifier` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=443 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `objects`
--

DROP TABLE IF EXISTS `objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `planet_coord_id` int DEFAULT NULL,
  `has_spawned_object` tinyint(1) DEFAULT '0',
  `planet_id` int DEFAULT NULL,
  `captain_npc_id` int DEFAULT NULL,
  `visitable` tinyint(1) DEFAULT '0',
  `current_hp` int DEFAULT '0',
  `spawns_object` tinyint(1) DEFAULT '0',
  `has_inventory` tinyint(1) DEFAULT '0',
  `player_id` int DEFAULT NULL,
  `attack_strength` int DEFAULT '0',
  `attack_range` int DEFAULT '0',
  `energy` int DEFAULT '0',
  `faction_id` int DEFAULT NULL,
  `ship_coord_id` int DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  `coord_id` int DEFAULT NULL,
  `spawned_object_type_amount` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '0',
  `ship_id` int DEFAULT NULL,
  `ai_id` int DEFAULT NULL,
  `attached_to_id` int DEFAULT NULL,
  `spawned_event_id` int DEFAULT NULL,
  `docked_at_planet_id` int DEFAULT NULL,
  `docked_at_object_id` int DEFAULT NULL,
  `tint` varchar(10) DEFAULT NULL,
  `spawner_tick_count` int DEFAULT '0',
  `current_spawn_linker_id` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=134993 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personality_types`
--

DROP TABLE IF EXISTS `personality_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personality_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_coords`
--

DROP TABLE IF EXISTS `planet_coords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_coords` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_id` int DEFAULT NULL,
  `tile_x` int DEFAULT NULL,
  `tile_y` int DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `building_type` varchar(40) DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `object_timestamp` int DEFAULT NULL,
  `item_type` varchar(60) DEFAULT NULL,
  `object_hp` int unsigned DEFAULT NULL,
  `object_attack_strength` int unsigned DEFAULT NULL,
  `object_amount` int DEFAULT NULL,
  `floor_type` varchar(20) DEFAULT NULL,
  `monster_type` varchar(40) DEFAULT NULL,
  `monster_hp` smallint unsigned DEFAULT NULL,
  `monster_id` int DEFAULT NULL,
  `monster_range` smallint DEFAULT NULL,
  `monster_attack_strength` smallint DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `npc_id` int DEFAULT '0',
  `npc_name` varchar(30) DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `npc_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `level` int DEFAULT '0',
  `spawns_monster_type_id` int DEFAULT '0',
  `floor_type_id` int DEFAULT NULL,
  `spawned_monster_id` int DEFAULT NULL,
  `belongs_to_object_id` int DEFAULT NULL,
  `belongs_to_monster_id` int DEFAULT NULL,
  `structure_id` int DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `planet_x_index` (`tile_x`),
  KEY `planet_y_index` (`tile_y`),
  KEY `planet_id_index` (`planet_id`),
  KEY `monster_id_index` (`monster_id`),
  KEY `object_id_index` (`object_id`)
) ENGINE=MyISAM AUTO_INCREMENT=495529 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_event_linkers`
--

DROP TABLE IF EXISTS `planet_event_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_event_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `highest_planet_level` int DEFAULT '0',
  `lowest_planet_level` int DEFAULT NULL,
  `rarity` int DEFAULT '1',
  `minimum_planet_hp_percent` int DEFAULT NULL,
  `maximum_planet_hp_percent` int DEFAULT NULL,
  `limit_per_planet` int DEFAULT NULL,
  `is_regular_monster_spawn` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_floor_linkers`
--

DROP TABLE IF EXISTS `planet_floor_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_floor_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `highest_planet_level` int DEFAULT '0',
  `lowest_planet_level` int DEFAULT NULL,
  `rarity` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_material_linkers`
--

DROP TABLE IF EXISTS `planet_material_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_material_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_monster_linkers`
--

DROP TABLE IF EXISTS `planet_monster_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_monster_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `highest_planet_level` int DEFAULT '0',
  `lowest_planet_level` int DEFAULT NULL,
  `rarity` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_object_linkers`
--

DROP TABLE IF EXISTS `planet_object_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_object_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `highest_planet_level` int DEFAULT '0',
  `lowest_planet_level` int DEFAULT NULL,
  `rarity` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_type_display_linkers`
--

DROP TABLE IF EXISTS `planet_type_display_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_type_display_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `game_file_index` int DEFAULT NULL,
  `layer` varchar(20) DEFAULT NULL,
  `only_visual` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_type_impact_linkers`
--

DROP TABLE IF EXISTS `planet_type_impact_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_type_impact_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `planet_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `hp_change` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planet_types`
--

DROP TABLE IF EXISTS `planet_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planet_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `hp_effect` int DEFAULT '0',
  `floor_ice` tinyint(1) DEFAULT '0',
  `size` int DEFAULT '10',
  `depth` int DEFAULT '5',
  `max_depth` int DEFAULT NULL,
  `min_depth` int DEFAULT NULL,
  `game_file_x_offset` int DEFAULT '0',
  `game_file_y_offset` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '0',
  `wall_object_type_id` int DEFAULT NULL,
  `game_file_index` int DEFAULT NULL,
  `artist_id` int DEFAULT NULL,
  `description` text,
  `admin_description` text,
  `size_underground` int DEFAULT '10',
  `x_size_above` int DEFAULT '10',
  `x_size_under` int DEFAULT '10',
  `y_size_above` int DEFAULT '10',
  `y_size_under` int DEFAULT '10',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=41 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planets`
--

DROP TABLE IF EXISTS `planets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tile_x` int DEFAULT NULL,
  `tile_y` int DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `player_name` varchar(30) DEFAULT NULL,
  `defenses` int DEFAULT '0',
  `population` int DEFAULT '0',
  `current_hp` int DEFAULT '1000000',
  `ai_id` int DEFAULT NULL,
  `x_size` int DEFAULT NULL,
  `y_size` int DEFAULT NULL,
  `name` varchar(40) DEFAULT NULL,
  `being_invaded_by` smallint DEFAULT '0',
  `original_race` varchar(40) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `planet_type_id` int DEFAULT NULL,
  `coord_id` int DEFAULT NULL,
  `lowest_depth` int DEFAULT NULL,
  `last_level_generated` int DEFAULT NULL,
  `faction_id` int DEFAULT NULL,
  `max_hp` int DEFAULT '1000000',
  `x_size_above` int DEFAULT '10',
  `x_size_under` int DEFAULT '10',
  `y_size_above` int DEFAULT '10',
  `y_size_under` int DEFAULT '10',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player_logs`
--

DROP TABLE IF EXISTS `player_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `message` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `year` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `scope` varchar(20) DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `custom_message` text,
  PRIMARY KEY (`id`),
  KEY `year_index` (`year`),
  KEY `month_index` (`month`),
  KEY `scope_index` (`scope`)
) ENGINE=MyISAM AUTO_INCREMENT=300 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player_relationship_linkers`
--

DROP TABLE IF EXISTS `player_relationship_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_relationship_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `race_id` int DEFAULT NULL,
  `score` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `other_player_id` int DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player_research_linkers`
--

DROP TABLE IF EXISTS `player_research_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_research_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `researches_completed` int DEFAULT '0',
  `player_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=182 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(60) DEFAULT NULL,
  `attack_strength` int DEFAULT '5',
  `planet_id` int DEFAULT NULL,
  `attack_range` smallint unsigned DEFAULT '1',
  `exp` int DEFAULT '1',
  `current_hp` int DEFAULT '1',
  `left_hand` varchar(40) DEFAULT NULL,
  `right_hand` varchar(40) DEFAULT NULL,
  `laser_skill` smallint DEFAULT '1',
  `melee_skill_points` int DEFAULT '1',
  `arch_skill` smallint DEFAULT '1',
  `gravity_skill` smallint DEFAULT '1',
  `electric_skill` smallint DEFAULT '1',
  `max_hp` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `image` varchar(30) DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `level` int DEFAULT '1',
  `planet_level` int DEFAULT '0',
  `energy` int DEFAULT '0',
  `shield` int DEFAULT '0',
  `socket_id` varchar(30) DEFAULT NULL,
  `food_ticks` int DEFAULT '0',
  `defense` int DEFAULT '1',
  `laser_skill_points` int DEFAULT '1',
  `laser_damage_modifier` decimal(7,2) DEFAULT '1.00',
  `farming_skill_points` int DEFAULT '1',
  `manufacturing_skill_points` int DEFAULT '1',
  `cooking_skill_points` int DEFAULT '1',
  `faction_id` int DEFAULT NULL,
  `planet_coord_id` int DEFAULT NULL,
  `coord_id` int DEFAULT NULL,
  `ship_coord_id` int DEFAULT NULL,
  `fist_skill_points` int DEFAULT '1',
  `body_id` int DEFAULT NULL,
  `plasma_skill_points` int DEFAULT '1',
  `defending_skill_points` int DEFAULT '1',
  `surgery_skill_points` int DEFAULT '1',
  `researching_skill_points` int DEFAULT '1',
  `repairing_skill_points` int DEFAULT '1',
  `mining_skill_points` int DEFAULT '1',
  `previous_ship_coord_id` int DEFAULT NULL,
  `previous_coord_id` int DEFAULT NULL,
  `previous_planet_coord_id` int DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `salvaging_skill_points` int DEFAULT '1',
  `explosion_skill_points` int DEFAULT '1',
  `control_skill_points` int DEFAULT '1',
  `corrosive_skill_points` int DEFAULT '1',
  `electric_skill_points` int DEFAULT '1',
  `hacking_skill_points` int DEFAULT '1',
  `freeze_skill_points` int DEFAULT '1',
  `heat_skill_points` int DEFAULT '1',
  `gravity_skill_points` int DEFAULT '1',
  `piercing_skill_points` int DEFAULT '1',
  `poison_skill_points` int DEFAULT '1',
  `radiation_skill_points` int DEFAULT '1',
  `skin_id` int DEFAULT NULL,
  `skin_object_type_id` int DEFAULT NULL,
  `description` text,
  `last_login` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=256 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `portals`
--

DROP TABLE IF EXISTS `portals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portals` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `attached_to_id` int unsigned DEFAULT '0',
  `player_id` int DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `planet_x` int DEFAULT NULL,
  `planet_y` int DEFAULT NULL,
  `planet_level` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `price` int DEFAULT NULL,
  `total_claimed` int DEFAULT '0',
  `maximum_claim_amount` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_eating_linkers`
--

DROP TABLE IF EXISTS `race_eating_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_eating_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `race_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `tick_count` int DEFAULT '1',
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `hp` int DEFAULT NULL,
  `attack` int DEFAULT NULL,
  `defense` int DEFAULT NULL,
  `addiction_chance` int DEFAULT NULL,
  `addiction_tick_count` int DEFAULT '0',
  `manufacturing` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `races`
--

DROP TABLE IF EXISTS `races`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `races` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `starting_planet_id` int DEFAULT '0',
  `starting_planet_name` varchar(40) DEFAULT NULL,
  `invention` int DEFAULT NULL,
  `expand` int DEFAULT NULL,
  `progress_level` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `researches`
--

DROP TABLE IF EXISTS `researches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `researches` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `researcher_object_id` int DEFAULT NULL,
  `being_researched_object_type_id` int DEFAULT NULL,
  `socket_id` varchar(30) DEFAULT NULL,
  `player_id` int DEFAULT NULL,
  `current_tick_count` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2133 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rules`
--

DROP TABLE IF EXISTS `rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rule` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=353 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salvage_linkers`
--

DROP TABLE IF EXISTS `salvage_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salvage_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `salvaged_object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `complexity` int DEFAULT NULL,
  `rarity` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ship_coords`
--

DROP TABLE IF EXISTS `ship_coords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ship_coords` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `tile_x` int DEFAULT NULL,
  `tile_y` int DEFAULT NULL,
  `object` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `object_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `object_type` varchar(30) DEFAULT NULL,
  `object_amount` int DEFAULT NULL,
  `floor_type_id` int DEFAULT NULL,
  `monster_id` int DEFAULT NULL,
  `belongs_to_object_id` int DEFAULT NULL,
  `belongs_to_monster_id` int DEFAULT NULL,
  `spawns_monster_type_id` int DEFAULT '0',
  `structure_id` int DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  `level` int DEFAULT '0',
  `is_engine_hardpoint` tinyint(1) DEFAULT '0',
  `is_weapon_hardpoint` tinyint(1) DEFAULT '0',
  `is_damaged` tinyint(1) DEFAULT '0',
  `spawned_monster_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=193393 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ship_linkers`
--

DROP TABLE IF EXISTS `ship_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ship_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ship_type_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `object_type_id` int DEFAULT '0',
  `floor_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `monster_type_id` int DEFAULT NULL,
  `spawns_monster_type_id` int DEFAULT NULL,
  `level` int DEFAULT '0',
  `is_weapon_hardpoint` tinyint(1) DEFAULT '0',
  `is_engine_hardpoint` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2906 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skin_price_linkers`
--

DROP TABLE IF EXISTS `skin_price_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skin_price_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `price` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `purchase_count` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skin_purchase_linkers`
--

DROP TABLE IF EXISTS `skin_purchase_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skin_purchase_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `space_abyss_admins`
--

DROP TABLE IF EXISTS `space_abyss_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `space_abyss_admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `last_new_player_email_timestamp` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spawn_linkers`
--

DROP TABLE IF EXISTS `spawn_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spawn_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `monster_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `rarity` int DEFAULT NULL,
  `ticks_required` int DEFAULT NULL,
  `spawns_object_type_id` int DEFAULT NULL,
  `spawns_monster_type_id` int DEFAULT NULL,
  `spawns_amount` int DEFAULT NULL,
  `spawns_location` varchar(20) DEFAULT NULL,
  `spawns_on_create` tinyint(1) DEFAULT '0',
  `minimum_hp_percent` int DEFAULT NULL,
  `maximum_hp_percent` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `requires_floor_type_class` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spawned_events`
--

DROP TABLE IF EXISTS `spawned_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spawned_events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `planet_id` int DEFAULT NULL,
  `tick_count` int DEFAULT '0',
  `origin_planet_coord_id` int DEFAULT NULL,
  `ship_id` int DEFAULT NULL,
  `origin_coord_id` int DEFAULT NULL,
  `origin_ship_coord_id` int DEFAULT NULL,
  `planet_event_linker_id` int DEFAULT NULL,
  `is_despawned` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65425 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `storytellers`
--

DROP TABLE IF EXISTS `storytellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storytellers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `current_spawned_event_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `previous_difficulty` int DEFAULT '0',
  `previous_event_ticks` int DEFAULT '0',
  `current_event_ticks` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structure_type_linkers`
--

DROP TABLE IF EXISTS `structure_type_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `structure_type_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `structure_type_id` int DEFAULT NULL,
  `level` int DEFAULT '0',
  `floor_type_id` int DEFAULT NULL,
  `place_npc` tinyint(1) DEFAULT '0',
  `area_name` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=508 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structure_type_requirement_linkers`
--

DROP TABLE IF EXISTS `structure_type_requirement_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `structure_type_requirement_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `structure_type_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structure_types`
--

DROP TABLE IF EXISTS `structure_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `structure_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(40) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structures`
--

DROP TABLE IF EXISTS `structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `structures` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `npc_id` int DEFAULT NULL,
  `structure_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trade_linker_items`
--

DROP TABLE IF EXISTS `trade_linker_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trade_linker_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int DEFAULT NULL,
  `object_type_id` int DEFAULT NULL,
  `object_type_amount` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trade_linkers`
--

DROP TABLE IF EXISTS `trade_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trade_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `initiating_player_id` int DEFAULT NULL,
  `other_player_id` int DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trap_linkers`
--

DROP TABLE IF EXISTS `trap_linkers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trap_linkers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `object_type_id` int DEFAULT NULL,
  `trapped_object_type_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `password` varchar(60) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `remember_token` varchar(60) DEFAULT NULL,
  `alpha_coders_user_id` int DEFAULT NULL,
  `password_temp` varchar(245) DEFAULT NULL,
  `password_node` varchar(245) DEFAULT NULL,
  `newsletter` tinyint(1) DEFAULT '1',
  `is_banned` tinyint(1) DEFAULT '0',
  `unread_message_count` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=250 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50112 SET @disable_bulk_load = IF (@is_rocksdb_supported, 'SET SESSION rocksdb_bulk_load = @old_rocksdb_bulk_load', 'SET @dummy_rocksdb_bulk_load = 0') */;
/*!50112 PREPARE s FROM @disable_bulk_load */;
/*!50112 EXECUTE s */;
/*!50112 DEALLOCATE PREPARE s */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-03-22 16:03:06
