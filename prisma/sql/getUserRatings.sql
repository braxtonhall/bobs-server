SELECT COUNT(CASE WHEN `main`.`Opinion`.`rating` = 1 THEN 1 END)  AS `oneCount`,
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
WHERE (`main`.`Opinion`.`viewerId` = :viewerId)
GROUP BY `main`.`Opinion`.`viewerId`;
