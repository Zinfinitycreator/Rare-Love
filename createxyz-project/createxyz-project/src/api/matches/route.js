async function handler() {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const [currentUser] = await sql`
      SELECT id FROM users 
      WHERE auth_id = ${session.user.id}
    `;

    if (!currentUser) {
      return { error: "User profile not found" };
    }

    const matches = await sql`
      WITH user_profile AS (
        SELECT 
          values,
          compatibility_score
        FROM profiles
        WHERE user_id = ${currentUser.id}
      ),
      potential_matches AS (
        SELECT 
          p.user_id,
          p.values,
          p.compatibility_score,
          ABS(p.compatibility_score - up.compatibility_score) as score_diff,
          ARRAY(
            SELECT UNNEST(p.values) 
            INTERSECT 
            SELECT UNNEST(up.values)
          ) as shared_values
        FROM profiles p
        CROSS JOIN user_profile up
        WHERE p.user_id != ${currentUser.id}
        AND NOT EXISTS (
          SELECT 1 FROM matches m 
          WHERE (m.user1_id = ${currentUser.id} AND m.user2_id = p.user_id)
          OR (m.user1_id = p.user_id AND m.user2_id = ${currentUser.id})
        )
      )
      SELECT 
        pm.user_id,
        pm.compatibility_score,
        pm.shared_values,
        CASE 
          WHEN pm.score_diff = 0 THEN 100
          ELSE GREATEST(0, 100 - (pm.score_diff * 2))
        END as match_percentage
      FROM potential_matches pm
      WHERE array_length(pm.shared_values, 1) > 0
      ORDER BY match_percentage DESC, array_length(pm.shared_values, 1) DESC
      LIMIT 10
    `;

    return {
      matches: matches.map((match) => ({
        id: match.user_id,
        compatibilityScore: Math.round(match.match_percentage),
        sharedValues: match.shared_values,
      })),
    };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { error: "Failed to fetch matches" };
  }
}