const { GoogleGenAI } = require("@google/genai");
const { ChatRoom, Doctor, Message, User } = require("../models");

class AIController {
  static getGeminiApiKey() {
    return (
      process.env.API_GEMINI_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ""
    );
  }

  static getModelName() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  static getGeminiClient() {
    const apiKey = AIController.getGeminiApiKey();
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  static parseJsonResponse(text, fallbackObject) {
    if (!text || typeof text !== "string") return fallbackObject;

    try {
      return JSON.parse(text);
    } catch (error) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch (innerError) {
          return fallbackObject;
        }
      }
      return fallbackObject;
    }
  }

  static async generateJsonWithGemini(prompt, fallbackObject, temperature = 0.2) {
    const client = AIController.getGeminiClient();
    if (!client) {
      throw { name: "BadRequest", message: "API_GEMINI_KEY is not configured" };
    }

    const response = await client.models.generateContent({
      model: AIController.getModelName(),
      contents: prompt,
      config: { temperature },
    });

    const text =
      typeof response?.text === "string"
        ? response.text
        : typeof response?.text === "function"
        ? response.text()
        : "";

    return AIController.parseJsonResponse(text, fallbackObject);
  }

  static keywordScore(text, complaint) {
    const source = String(text || "").toLowerCase();
    const tokens = String(complaint || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3);

    let score = 0;
    for (const token of tokens) {
      if (source.includes(token)) score += 2;
    }

    const hintMap = [
      {
        keys: ["diare", "perut", "mual", "pencernaan", "maag"],
        specs: ["gastro", "penyakit dalam", "internal"],
      },
      {
        keys: ["jantung", "dada", "sesak", "hipertensi"],
        specs: ["cardio", "jantung"],
      },
      {
        keys: ["kepala", "migrain", "saraf", "kejang"],
        specs: ["neuro", "saraf"],
      },
      {
        keys: ["kulit", "gatal", "ruam", "jerawat"],
        specs: ["derma", "kulit"],
      },
      { keys: ["anak", "bayi", "pediatri"], specs: ["pedi", "anak"] },
      { keys: ["batuk", "paru", "asma", "napas"], specs: ["pulmo", "paru"] },
    ];

    const complaintText = String(complaint || "").toLowerCase();
    for (const hint of hintMap) {
      const hasSymptom = hint.keys.some((key) => complaintText.includes(key));
      const hasSpec = hint.specs.some((spec) => source.includes(spec));
      if (hasSymptom && hasSpec) score += 8;
    }

    return score;
  }

  static async matchDate(req, res, next) {
    try {
      const { chatRoomId } = req.body;

      if (!chatRoomId) {
        throw { name: "BadRequest", message: "chatRoomId is required" };
      }

      if (!AIController.getGeminiApiKey()) {
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

      const aiResult = await AIController.generateJsonWithGemini(
        prompt,
        { matchedDate: null, confidence: "low", reason: "No match" },
        0.2
      );

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

  static async recommendDoctor(req, res, next) {
    try {
      const { complaint } = req.body;

      if (!complaint || !String(complaint).trim()) {
        throw { name: "BadRequest", message: "complaint is required" };
      }

      const doctors = await Doctor.findAll({
        include: [
          {
            model: User,
            attributes: ["id", "name", "email", "profilePic"],
          },
        ],
        order: [
          ["isAvailable", "DESC"],
          ["rating", "DESC"],
          ["experience", "DESC"],
        ],
      });

      if (!doctors.length) {
        return res.status(200).json({
          complaint: String(complaint).trim(),
          recommendations: [],
          aiResult: {
            summary: "No doctors available in database",
            confidence: "low",
          },
        });
      }

      let aiResult = {
        recommendedDoctorIds: [],
        summary: "No AI recommendation generated",
        confidence: "low",
      };
      let aiErrorMessage = null;

      if (AIController.getGeminiApiKey()) {
        const prompt = `You are a medical triage assistant for choosing suitable doctors from an internal database.

Return JSON only with schema:
{
  "recommendedDoctorIds": [number, number, number],
  "summary": "short explanation",
  "confidence": "low|medium|high"
}

Rules:
- Recommend max 5 doctors.
- Use only doctor ids provided in database context.
- Prioritize matching specialization to complaint.
- Prefer available doctors (isAvailable: true), higher rating, and higher experience.
- If unsure, still return best-effort ranked ids from provided doctors.
- Keep output strict JSON only (no markdown).

Complaint:
${String(complaint).trim()}

Doctors from database:
${JSON.stringify(
          doctors.map((doctor) => ({
            id: doctor.id,
            name: doctor.User?.name || "Unknown",
            specialization: doctor.specialization,
            experience: doctor.experience,
            bio: doctor.bio,
            isAvailable: doctor.isAvailable,
            rating: doctor.rating,
            location: doctor.location,
          }))
        )}`;

        try {
          aiResult = await AIController.generateJsonWithGemini(
            prompt,
            {
              recommendedDoctorIds: [],
              summary: "No AI recommendation generated",
              confidence: "low",
            },
            0.2
          );
        } catch (error) {
          aiErrorMessage = error?.message || "AI provider request failed";
        }
      }

      const validIds = new Set(doctors.map((doctor) => doctor.id));
      const recommendedIds = Array.isArray(aiResult.recommendedDoctorIds)
        ? aiResult.recommendedDoctorIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && validIds.has(id))
            .slice(0, 5)
        : [];

      const fallbackRecommendations = [...doctors]
        .map((doctor) => {
          const searchable = [
            doctor.specialization,
            doctor.bio,
            doctor.User?.name,
            doctor.location,
          ].join(" ");

          const relevance = AIController.keywordScore(searchable, complaint);
          const availabilityBoost = doctor.isAvailable ? 5 : 0;
          const ratingBoost = Number(doctor.rating || 0);
          const expBoost = Number(doctor.experience || 0) / 10;

          return {
            doctor,
            score: relevance + availabilityBoost + ratingBoost + expBoost,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.doctor);

      const recommendedDoctors =
        recommendedIds.length > 0
          ? recommendedIds
              .map((id) => doctors.find((doctor) => doctor.id === id))
              .filter(Boolean)
          : fallbackRecommendations;

      res.status(200).json({
        complaint: String(complaint).trim(),
        recommendations: recommendedDoctors,
        aiResult: {
          summary: aiErrorMessage
            ? "AI sedang tidak tersedia, rekomendasi diambil dari analisis data dokter lokal."
            : aiResult.summary ||
              "Recommended based on specialization, availability, and experience.",
          confidence: aiErrorMessage ? "medium" : aiResult.confidence || "medium",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;
