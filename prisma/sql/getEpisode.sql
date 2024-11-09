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
	   COALESCE(`aggr_selection_0_View`.`view_count`, 0) AS `view_count`,
	   COALESCE(`aggr_selection_0_View`.`count_0`, 0)    AS `count_0`,
	   COALESCE(`aggr_selection_0_View`.`count_1`, 0)    AS `count_1`,
	   COALESCE(`aggr_selection_0_View`.`count_2`, 0)    AS `count_2`,
	   COALESCE(`aggr_selection_0_View`.`count_3`, 0)    AS `count_3`,
	   COALESCE(`aggr_selection_0_View`.`count_4`, 0)    AS `count_4`,
	   COALESCE(`aggr_selection_0_View`.`count_5`, 0)    AS `count_5`,
	   COALESCE(`aggr_selection_0_View`.`count_6`, 0)    AS `count_6`,
	   COALESCE(`aggr_selection_0_View`.`count_7`, 0)    AS `count_7`,
	   COALESCE(`aggr_selection_0_View`.`count_8`, 0)    AS `count_8`,
	   COALESCE(`aggr_selection_0_View`.`count_9`, 0)    AS `count_9`
FROM `main`.`Episode`
		 LEFT JOIN (SELECT `main`.`View`.`episodeId`,
						   COUNT(*)                                                       AS `view_count`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 10 THEN 1 ELSE 0 END) as `count_0`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 1 THEN 1 ELSE 0 END)  as `count_1`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 2 THEN 1 ELSE 0 END)  as `count_2`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 3 THEN 1 ELSE 0 END)  as `count_3`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 4 THEN 1 ELSE 0 END)  as `count_4`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 5 THEN 1 ELSE 0 END)  as `count_5`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 6 THEN 1 ELSE 0 END)  as `count_6`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 7 THEN 1 ELSE 0 END)  as `count_7`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 8 THEN 1 ELSE 0 END)  as `count_8`,
						   COUNT(CASE WHEN `main`.`VIEW`.`rating` = 9 THEN 1 ELSE 0 END)  as `count_9`
					FROM `main`.`View`
					WHERE `main`.`View`.`viewerId` = :viewerId
					GROUP BY `main`.`View`.`episodeId`) AS `aggr_selection_0_View`
				   ON (`main`.`Episode`.`id` = `aggr_selection_0_View`.`episodeId`)
WHERE (`main`.`Episode`.`seriesId` = :seriesId AND `main`.`Episode`.`season` = :season AND
	   `main`.`Episode`.`production` = :production);
