const geminiService = require('../services/ChatBot_Service');

const geminiController = {
  /**
   * Xử lý yêu cầu tạo nội dung từ Gemini API.
   * @param {Object} req - Đối tượng Request từ Express.
   * @param {Object} res - Đối tượng Response từ Express.
   */
  async generateContent(req, res) {
    console.log('Request body:', req.body);
    const { prompt, model } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Thiếu trường "prompt" trong yêu cầu.' });
    }

    try {
      const text = await geminiService.generateContent(prompt, model);

      // Tách JSON trong dấu ```json ... ```
      // Regex lấy đoạn nằm trong dấu ```
      const match = text.match(/```json\s*([\s\S]*?)```/);
      let jsonData = null;

      if (match && match[1]) {
        try {
          jsonData = JSON.parse(match[1]);
        } catch (e) {
          // Nếu parse lỗi, để nguyên text
          jsonData = null;
        }
      }

      res.status(200).json({
        success: true,
        data: jsonData || text,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message || 'Có lỗi xảy ra khi gọi Gemini API.',
      });
    }
  },
};

module.exports = geminiController;
