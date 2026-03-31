const axios = require("axios");
const { ChatRoom, Doctor, Message, User } = require("../models");

class AIController {
  static async matchDate(req, res, next) {
    try {
      const { chatRoomId } = req.body;

      if (!chatRoomId) {
        throw { name: "BadRequest", message: "chatRoomId is required" };
      }

      if (!process.env.API_GEMINI_KEY) {
        throw { name: "BadRequest", message: "API_GEMINI_KEY is not configured" };
      }

      const room = await ChatRoom.findByPk(chatRoomId, {
        include: [
          {
            model: Message,
            attributes: ["id", "SenderId", "senderRole", "message", "createdAt"],
          },
          {
            model: Doctor,
            include: [
              {
                model: User,
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "name"],
          },
        ],
        order: [[Message, "createdAt", "ASC"]],
      });

      if (!room) {
        throw { name: "NotFound", message: "Chat room not found" };
      }

      const isOwner =
        req.user.role === "Admin" ||
        req.user.id === room.UserId ||
        req.user.id === room.Doctor?.UserId;

      if (!isOwner) {
        throw { name: "Forbidden", message: "You're not authorized" };
      }

      const prompt = `You are a scheduling assistant.
Match a consultation date between user and doctor strictly from database chat messages.

Return JSON only with this schema:
{
  "matchedDate": "YYYY-MM-DD or null",
  "confidence": "low|medium|high",
  "reason": "short explanation",
  "alternatives": ["YYYY-MM-DD", "YYYY-MM-DD"],
  "messagesUsed": [messageId1, messageId2]
}

Rules:
- If no clear date overlap, matchedDate must be null.
- Use only dates implied or stated in messages.
- Prioritize the latest messages.
- Keep output valid JSON only, no markdown.

Context:
Today: ${new Date().toISOString().slice(0, 10)}
Doctor availability flag: ${room.Doctor?.isAvailable}
Doctor name: ${room.Doctor?.User?.name || "Unknown"}
User name: ${room.User?.name || "Unknown"}
Messages: ${JSON.stringify(
        room.Messages.map((m) => ({
          id: m.id,
          senderRole: m.senderRole,
          message: m.message,
          createdAt: m.createdAt,
        }))
      )}`;

      const geminiURL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

      const { data } = await axios.post(
        `${geminiURL}?key=${process.env.API_GEMINI_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }
      );

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "{\"matchedDate\":null}";

      let aiResult = null;
      try {
        aiResult = JSON.parse(text);
      } catch (error) {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          aiResult = JSON.parse(text.slice(start, end + 1));
        } else {
          aiResult = { matchedDate: null, confidence: "low", reason: text };
        }
      }

      res.status(200).json({
        roomId: room.id,
        doctorId: room.DoctorId,
        userId: room.UserId,
        doctorAvailable: room.Doctor?.isAvailable || false,
        aiResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;
