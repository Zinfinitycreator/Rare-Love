async function handler({ matchId, content, generatePrompt = false }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get current user's ID from users table
    const [currentUser] = await sql`
      SELECT id FROM users 
      WHERE auth_id = ${session.user.id}
    `;

    if (!currentUser) {
      return { error: "User not found" };
    }

    // Verify match exists and user is part of it
    const [match] = await sql`
      SELECT * FROM matches 
      WHERE id = ${matchId} 
      AND (user1_id = ${currentUser.id} OR user2_id = ${currentUser.id})
    `;

    if (!match) {
      return { error: "Match not found or unauthorized" };
    }

    if (generatePrompt) {
      // Get shared values for the match
      const [profile1, profile2] = await sql`
        SELECT values FROM profiles 
        WHERE user_id IN (${match.user1_id}, ${match.user2_id})
      `;

      const sharedValues = profile1.values.filter((value) =>
        profile2.values.includes(value)
      );

      const gptResponse = await fetch(
        "/integrations/chat-gpt/conversationgpt4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Generate a thoughtful conversation prompt or question based on these shared values: ${sharedValues.join(
                  ", "
                )}`,
              },
            ],
          }),
        }
      );

      const { result } = await gptResponse.json();
      content = result;
    }

    // Store the message
    await sql`
      INSERT INTO messages (match_id, sender_id, content)
      VALUES (${matchId}, ${currentUser.id}, ${content})
    `;

    // Get updated message thread
    const messages = await sql`
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        m.created_at,
        u.email as sender_email
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.match_id = ${matchId}
      ORDER BY m.created_at ASC
    `;

    return { messages };
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Failed to send message" };
  }
}