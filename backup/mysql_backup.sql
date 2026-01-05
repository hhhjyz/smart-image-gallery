-- MySQL dump 10.13  Distrib 8.0.44, for Linux (aarch64)
--
-- Host: localhost    Database: smart_gallery
-- ------------------------------------------------------
-- Server version	8.0.44

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

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `file_name` longtext,
  `url` longtext,
  `tags` longtext,
  `camera_model` longtext,
  `shooting_time` longtext,
  `resolution` longtext,
  `aperture` longtext,
  `iso` longtext,
  `thumbnail_url` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_images_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
INSERT INTO `images` VALUES (1,'2025-12-10 21:10:52.359','2025-12-10 21:10:52.359','2025-12-10 21:17:19.199',1,'PixPin_2025-11-24_12-37-43.png','/minio/images/ddaf8d61-f7bb-47a0-b6d1-0714806713bf.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'2025-12-10 21:25:25.733','2025-12-10 21:25:25.733','2025-12-10 21:53:13.916',1,'PixPin_2025-11-24_12-37-43.png','/minio/images/e6b2446d-ba04-4829-aef6-ad8457eaab95.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'2025-12-10 21:53:26.085','2025-12-10 21:53:26.085','2025-12-10 22:02:42.417',1,'照片.jpeg','/minio/images/49186ddd-7b3d-4aaa-abf2-548d7e57c205.jpeg','AI服务异常',NULL,NULL,NULL,NULL,NULL,NULL),(4,'2025-12-10 21:58:30.635','2025-12-10 21:58:30.635','2025-12-10 22:02:40.519',1,'扫描全能王 2025-8-30 20.22_1.JPG','/minio/images/f1819fee-81b2-4e58-86e5-2612df45caf9.JPG','<|begin_of_box|>身份证,蒋翼泽,男性,汉族,浙江省玉环市<|end_of_box|>',NULL,NULL,NULL,NULL,NULL,NULL),(5,'2025-12-10 22:02:48.385','2025-12-10 22:02:48.385','2025-12-10 22:50:08.045',1,'7df9e15b-4f65-4d57-aaea-add51c748896.png','/minio/images/79081a6c-252a-4e80-bd44-39c6fcf54f22.png','年级,专业,必修门数',NULL,NULL,NULL,NULL,NULL,NULL),(6,'2025-12-10 22:03:32.371','2025-12-10 22:03:32.371','2025-12-10 22:50:03.132',1,'images.webp','/minio/images/5487fa8c-52d7-4b2c-b444-3429439635c3.webp','橘猫, 短毛, 草地, 淡定, 坐姿',NULL,NULL,NULL,NULL,NULL,NULL),(7,'2025-12-10 22:04:08.957','2025-12-10 22:04:08.957','2025-12-10 22:50:01.342',1,'images.webp','/minio/images/d94310a7-43a3-440d-ab06-83f7e4f97c8b.webp','猫',NULL,NULL,NULL,NULL,NULL,NULL),(8,'2025-12-10 22:04:20.895','2025-12-10 22:04:20.895','2025-12-10 22:49:59.012',1,'计算机网络.png','/minio/images/2bf8f0d3-1aef-4720-be06-a9c8eaaa286d.png','书法',NULL,NULL,NULL,NULL,NULL,NULL),(9,'2025-12-10 22:43:33.686','2025-12-10 22:47:01.212','2025-12-10 22:49:57.233',1,'照片.jpeg','/minio/images/d8055ae1-806b-4c02-8175-f053ecc80a7f.jpeg','证件照,年轻男子,蓝色背景,111','','','','','',NULL),(10,'2025-12-10 22:51:50.664','2025-12-10 22:51:50.664','2025-12-10 23:02:55.067',1,'images (1).jpeg','/minio/images/20c727b6-b0bb-4e12-b4dc-c659b1914c49.jpeg','玫瑰, 花朵, 露水','','','','','',NULL),(11,'2025-12-10 22:56:30.946','2025-12-10 22:56:30.946','2025-12-10 22:56:38.056',1,'IMG_2813.HEIC','/minio/images/76372d1c-4696-4392-852f-b8b18a049163.HEIC','AI服务异常','','','','','',NULL),(12,'2025-12-10 22:57:23.398','2025-12-10 22:57:23.398','2025-12-10 23:02:32.881',1,'IMG_2811.PNG','/minio/images/b5c1b6ff-87cc-4e10-be75-1cd4719fb839.PNG','足球比赛,球员,球场,观众席','','','','','',NULL),(13,'2025-12-10 23:02:44.275','2025-12-10 23:02:44.275',NULL,1,'IMG_2811.PNG','/minio/images/7b175c1a-31c7-4142-af32-d5eaa7d2d38b.PNG','足球比赛','未知设备','2025-12-10 23:02:44','2556x1179','-','-',NULL),(14,'2025-12-10 23:03:00.723','2025-12-10 23:03:00.723','2025-12-10 23:03:08.221',1,'images.webp','/minio/images/fd9d6f09-528c-4eae-8411-b6dd85816624.webp','猫咪','未知设备','2025-12-10 23:03:00','未知','-','-',NULL),(15,'2025-12-10 23:50:14.716','2025-12-10 23:50:14.716',NULL,1,'edited-IMG_2811.PNG','/minio/images/a4354087-0c9f-465b-8221-ec4a4f484989.PNG','足球比赛','未知设备','2025-12-10 23:50:14','1179x543','-','-',NULL),(16,'2025-12-10 23:59:00.764','2025-12-10 23:59:00.764',NULL,1,'images (1).jpeg','/minio/images/ab57d235-b6fc-445b-80ef-020e3753c191.jpeg','玫瑰','未知设备','2025-12-10 23:59:00','168x300','-','-','/minio/images/thumb-ab57d235-b6fc-445b-80ef-020e3753c191.jpg'),(17,'2025-12-11 00:08:00.506','2025-12-11 00:08:00.506',NULL,1,'IMG_2811.PNG','/minio/images/58c7150c-ba0f-415d-a71c-5a9fcaa2fa4e.PNG','足球比赛','未知设备','2025-12-11 00:08:00','2556x1179','-','-','/minio/images/thumb-58c7150c-ba0f-415d-a71c-5a9fcaa2fa4e.jpg'),(18,'2025-12-11 00:13:24.161','2025-12-11 00:13:24.161','2025-12-11 00:52:52.561',1,'IMG_2813.JPG','/minio/images/44267d89-e1ba-4615-91bf-e6b0dda7d78b.JPG','计算机网络','未知设备','2025-12-11 00:13:23','4032x3024','-','-','/minio/images/thumb-44267d89-e1ba-4615-91bf-e6b0dda7d78b.jpg'),(19,'2025-12-11 00:56:34.746','2025-12-11 00:56:34.746',NULL,1,'IMG_2813.JPG','/minio/images/3717730b-8c13-43cd-8a1f-616f4cf0f92c.JPG','计算机网络','iPhone 14 Pro','2025-12-09 20:41:27','4032x3024','f/2.8','125','/minio/images/thumb-3717730b-8c13-43cd-8a1f-616f4cf0f92c.jpg'),(20,'2025-12-11 00:58:10.243','2025-12-11 00:58:10.243',NULL,1,'IMG_2811.PNG','/minio/images/b13beca0-f825-4acd-90d5-df81a6308ee6.PNG','足球比赛','','2025-12-09 13:35:44','2556x1179','-','-','/minio/images/thumb-b13beca0-f825-4acd-90d5-df81a6308ee6.jpg'),(21,'2025-12-29 15:34:03.880','2025-12-29 15:34:03.880',NULL,1,'edited-IMG_2813.JPG','/minio/images/2128553c-cc7a-4767-bf2b-25b2229508b6.JPG','计算机网络','','','2592x2685','-','-','/minio/images/thumb-2128553c-cc7a-4767-bf2b-25b2229508b6.jpg'),(22,'2025-12-29 15:34:45.589','2025-12-29 16:36:44.410',NULL,1,'IMG_2817.jpeg','/minio/images/70be4912-bc99-41bf-9b3b-848e67cbc102.jpeg','银杏叶,哈哈哈','iPhone 14 Pro','2025-12-11 18:32:38','4032x3024','f/2.2','1600','/minio/images/thumb-70be4912-bc99-41bf-9b3b-848e67cbc102.jpg'),(23,'2026-01-05 04:15:39.029','2026-01-05 04:15:39.029',NULL,1,'photo_60A15DB4-AA73-49A2-B362-63BEFA79981E_1767521736.jpeg','/minio/images/966404b8-0b91-424e-bd52-5f32d12f9664.jpeg','火锅','','','1080x1440','-','-','/minio/images/thumb-966404b8-0b91-424e-bd52-5f32d12f9664.jpg'),(24,'2026-01-05 04:16:14.586','2026-01-05 04:16:14.586',NULL,1,'IMG_2926.jpeg','/minio/images/3cc6a1cf-e635-4541-93f7-fc0400bf6989.jpeg','雪人','iPhone 14 Pro','2026-01-01 22:08:03','4032x3024','f/2.8','2000','/minio/images/thumb-3cc6a1cf-e635-4541-93f7-fc0400bf6989.jpg'),(25,'2026-01-05 04:27:17.681','2026-01-05 04:27:17.681',NULL,1,'IMG_2729.jpeg','/minio/images/2b25f6be-d9b1-4447-b857-93713ab2d1ee.jpeg','河流','iPhone 14 Pro','2025-12-06 11:57:51','4032x3024','f/2.8','32','/minio/images/thumb-2b25f6be-d9b1-4447-b857-93713ab2d1ee.jpg'),(26,'2026-01-05 04:28:51.229','2026-01-05 04:28:51.229',NULL,1,'IMG_2743.jpeg','/minio/images/5ba29f83-1279-42f1-ada6-8135adf2294e.jpeg','公园','iPhone 14 Pro','2025-12-06 12:05:08','4032x2268','f/2.8','32','/minio/images/thumb-5ba29f83-1279-42f1-ada6-8135adf2294e.jpg'),(27,'2026-01-05 04:30:24.432','2026-01-05 04:30:24.432',NULL,1,'IMG_2792.jpeg','/minio/images/490d9996-9ede-482d-84f0-2184ede9878e.jpeg','湖泊,相机:iPhone 14 Pro,时间:中午,月份:12,季节:冬,方向:横图,分辨率:高','iPhone 14 Pro','2025-12-06 12:41:27','4032x2268','f/2.8','32','/minio/images/thumb-490d9996-9ede-482d-84f0-2184ede9878e.jpg'),(28,'2026-01-05 04:39:49.634','2026-01-05 04:39:49.634',NULL,1,'edited-IMG_2743.jpeg','/minio/images/0fb22c10-7028-4f13-9328-dca1175fffdb.jpeg','公园,方向:横图,分辨率:高','','','4032x2268','-','-','/minio/images/thumb-0fb22c10-7028-4f13-9328-dca1175fffdb.jpg'),(29,'2026-01-05 05:03:03.794','2026-01-05 05:03:03.794',NULL,1,'IMG_2928.jpeg','/minio/images/eac4a0ae-8509-4c31-a3b5-f617a381502c.jpeg','塑料袋,方向:竖图,分辨率:中','','','1080x1920','-','-','/minio/images/thumb-eac4a0ae-8509-4c31-a3b5-f617a381502c.jpg'),(30,'2026-01-05 05:03:48.517','2026-01-05 05:03:48.517',NULL,1,'IMG_2875.jpeg','/minio/images/8fb2e0f3-2c36-43f9-b3cc-c8a3f7106887.jpeg','早餐,方向:竖图,分辨率:中','','','1080x1920','-','-','/minio/images/thumb-8fb2e0f3-2c36-43f9-b3cc-c8a3f7106887.jpg'),(31,'2026-01-05 05:07:24.126','2026-01-05 05:10:48.768',NULL,1,'IMG_2782.jpeg','/minio/images/9251747d-43a1-4e5a-9f3b-1eb9d9d73505.jpeg','秋景,相机:iPhone 14 Pro,时间:中午,月份:12,季节:冬,方向:横图,分辨率:高,canshu','iPhone 14 Pro','2025-12-06 12:23:37','4032x2268','f/1.8','64','/minio/images/thumb-9251747d-43a1-4e5a-9f3b-1eb9d9d73505.jpg'),(32,'2026-01-05 05:09:38.302','2026-01-05 05:09:38.302','2026-01-05 05:10:14.443',1,'edited-IMG_2782.jpeg','/minio/images/5bd56ee8-f338-4e1a-b2c0-d188ac3e1b89.jpeg','自然风光,方向:横图,分辨率:中','','','2268x1275','-','-','/minio/images/thumb-5bd56ee8-f338-4e1a-b2c0-d188ac3e1b89.jpg'),(33,'2026-01-05 05:09:57.154','2026-01-05 05:09:57.154','2026-01-05 05:10:11.746',1,'edited-edited-IMG_2782.jpeg','/minio/images/17faeca0-9eb7-45ca-affb-ad7f9df13c14.jpeg','自然景观,方向:横图,分辨率:中','','','2268x1275','-','-','/minio/images/thumb-17faeca0-9eb7-45ca-affb-ad7f9df13c14.jpg'),(34,'2026-01-05 05:11:05.238','2026-01-05 05:11:05.238',NULL,1,'edited-IMG_2782.jpeg','/minio/images/9b41ee02-543b-430f-a7d5-4b798c4eea3b.jpeg','自然风光,方向:横图,分辨率:中','','','2268x1275','-','-','/minio/images/thumb-9b41ee02-543b-430f-a7d5-4b798c4eea3b.jpg');
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_users_username` (`username`),
  UNIQUE KEY `uni_users_email` (`email`),
  KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2025-12-29 15:16:52.631','2025-12-29 15:16:52.631',NULL,'hhhjyz','jiangyize705@gmail.com','$2a$10$8h.CKzkxZr8Ms5etKVRy3OhQ7QWKl2iMvfDV/eHpRlxINiR7oUXCC'),(5,'2026-01-05 04:59:20.681','2026-01-05 04:59:20.681',NULL,'1','3230102998@zju.edu.cn','$2a$10$1ipYfwLhbEy.mbCp.kglze4YO4iYPcWWsrn7DZTCdADeNIzsYGiPy'),(7,'2026-01-05 05:02:27.713','2026-01-05 05:02:27.713',NULL,'mmm','3230102997@zju.edu.cn','$2a$10$gdrTEqy83SYAsipw2QYbC.muWhHgLzuhbjzuAZBjSX4DbKGadmSmC'),(10,'2026-01-05 05:06:27.749','2026-01-05 05:06:27.749',NULL,'jjj','7989@zju.edu.cn','$2a$10$OUfBfOX/SAUaHJQOj5tJiuYHDBR6nq6.mdcOayREpV8sbRM0Njv9K');
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

-- Dump completed on 2026-01-05 11:07:31
