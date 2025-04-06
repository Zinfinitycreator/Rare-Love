async function handler({ intention, values, growth }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const [user] = await sql`
      INSERT INTO users (auth_id, email)
      VALUES (${session.user.id}, ${session.user.email})
      ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `;

    const gptResponse = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Analyze these dating profile answers and generate a compatibility score between 0-100 based on self-awareness, emotional intelligence, and relationship readiness:
            Relationship Intention: ${intention}
            Core Values: ${values}
            Growth Goals: ${growth}`,
          },
        ],
        json_schema: {
          name: "compatibility_score",
          schema: {
            type: "object",
            properties: {
              score: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["score", "reasoning"],
            additionalProperties: false,
          },
        },
      }),
    });

    const { result } = await gptResponse.json();
    const analysis = JSON.parse(result);

    await sql`
      INSERT INTO profiles (user_id, intention, values, growth_goals, compatibility_score)
      VALUES (
        ${user.id},
        ${intention},
        ${Array.isArray(values) ? values : [values]},
        ${growth},
        ${analysis.score}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        intention = EXCLUDED.intention,
        values = EXCLUDED.values,
        growth_goals = EXCLUDED.growth_goals,
        compatibility_score = EXCLUDED.compatibility_score,
        updated_at = CURRENT_TIMESTAMP
    `;

    return {
      success: true,
      compatibility_score: analysis.score,
      reasoning: analysis.reasoning,
    };
  } catch (error) {
    console.error("Profile submission error:", error);
    return { error: "Failed to submit profile" };
  }
}