SELECT `main`.`Episode`.`id`,
	   `main`.`Episode`.`name`,
	   `main`.`Episode`.`abbreviation`,
	   `main`.`Episode`.`runtime`,
	   `main`.`Episode`.`release`,
	   `main`.`Episode`.`starDate`,
	   `main`.`Episode`.`season`,
	   `main`.`Episode`.`production`,
	   `main`.`Episode`.`description`,
	   `main`.`Episode`.`seriesId`,
	   `main`.`Episode`.`sort`,
	   COALESCE(`views`.`reviewCount`, 0)     AS `reviewCount`,
	   COALESCE(`opinions`.`opinionCount`, 0) AS `opinionCount`,
	   COALESCE(`opinions`.`oneCount`, 0)     AS `oneCount`,
	   COALESCE(`opinions`.`twoCount`, 0)     AS `twoCount`,
	   COALESCE(`opinions`.`threeCount`, 0)   AS `threeCount`,
	   COALESCE(`opinions`.`fourCount`, 0)    AS `fourCount`,
	   COALESCE(`opinions`.`fiveCount`, 0)    AS `fiveCount`,
	   COALESCE(`opinions`.`sixCount`, 0)     AS `sixCount`,
	   COALESCE(`opinions`.`sevenCount`, 0)   AS `sevenCount`,
	   COALESCE(`opinions`.`eightCount`, 0)   AS `eightCount`,
	   COALESCE(`opinions`.`nineCount`, 0)    AS `nineCount`,
	   COALESCE(`opinions`.`tenCount`, 0)     AS `tenCount`
FROM `main`.`Episode`
		 LEFT JOIN (SELECT `main`.`Opinion`.`episodeId`,
						   COUNT(*)                                                   AS `opinionCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 1 THEN 1 END)  AS `oneCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 2 THEN 1 END)  AS `twoCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 3 THEN 1 END)  AS `threeCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 4 THEN 1 END)  AS `fourCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 5 THEN 1 END)  AS `fiveCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 6 THEN 1 END)  AS `sixCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 7 THEN 1 END)  AS `sevenCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 8 THEN 1 END)  AS `eightCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 9 THEN 1 END)  AS `nineCount`,
						   COUNT(CASE WHEN `main`.`Opinion`.`rating` = 10 THEN 1 END) AS `tenCount`
					FROM `main`.`Opinion`
					GROUP BY `main`.`Opinion`.`episodeId`) AS `opinions`
				   ON (`main`.`Episode`.`id` = `opinions`.`episodeId`)
		 LEFT JOIN (SELECT `main`.`View`.`episodeId`,
						   COUNT(CASE WHEN `main`.`View`.`comment` IS NOT NULL THEN 1 END) AS `reviewCount`
					FROM `main`.`View`
					GROUP BY `main`.`View`.`episodeId`) AS `views`
				   ON (`main`.`Episode`.`id` = `views`.`episodeId`)
WHERE (`main`.`Episode`.`seriesId` = :seriesId AND `main`.`Episode`.`season` = :season AND
	   `main`.`Episode`.`production` = :production);
