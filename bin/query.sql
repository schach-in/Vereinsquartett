SELECT
    DISTINCT organisationen_kennungen.kennung AS zps,
    COALESCE(organisationen.org_kurz, organisationen.organisation) AS name,
    organisationen.website AS website,
    organisationen.gruendung AS gruendung,
    vereinsdb_stats.members AS mitglieder,
    vereinsdb_stats.members_female AS weibliche_mitglieder,
    vereinsdb_stats.members_u25 AS jugendliche,
    (YEAR(CURDATE()) - vereinsdb_stats.avg_byear) AS durchschnitts_alter,
    vereinsdb_stats.avg_rating AS durchschnitts_dwz,
    (
        SELECT COUNT(*) FROM teams AS t
        LEFT JOIN termine
        ON
            t.termin_id = termine.termin_id
            AND termine.kennung LIKE "%/dvm-u%"
        WHERE
            t.verein_org_id = teams.verein_org_id
            AND team_status != "Löschung"
    ) AS dvm_teilnahmen
FROM teams
LEFT JOIN organisationen ON
    teams.verein_org_id = organisationen.org_id
LEFT JOIN organisationen_kennungen ON
    organisationen_kennungen.org_id = teams.verein_org_id
    AND aktuell = "ja"
LEFT JOIN vereinsdb_stats ON
    vereinsdb_stats.org_id = teams.verein_org_id
WHERE
    team_status != "Löschung"
    AND teams.termin_id IN (
        SELECT
            termin_id
        FROM
            termine
        WHERE
            kennung LIKE "2017/dvm-u%"
            AND termin_kategorie_id = 176
    )
ORDER BY zps ASC;