import { generatePrompt } from "../services/ai.service.js";

export const getResultController = async (req, res) => {
    try {
        const { prompt } = req.query;
        const result = await generatePrompt(prompt);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
