require('dotenv').config(); // Tải biến môi trường từ .env

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy API Key từ biến môi trường
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Lỗi: GEMINI_API_KEY không được định nghĩa trong file .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Prompt mặc định mô tả nhiệm vụ cho AI
const basePrompt = `
Bạn là một trợ lý tìm kiếm sản phẩm thông minh. Tôi sẽ cung cấp cho bạn endpoint API sau:

- /search/product/get-sorted: dùng để tìm sản phẩm, có thể truyền các query parameters:
  - price_min: giá tối thiểu (kiểu số)
  - price_max: giá tối đa (kiểu số)

- /search/product/get-by-brandcomputer: dùng để lọc các loại máy tính và theo hãng, theo thương hiệu, có thể truyền các parameters:
- brand: thương hiệu: có thể là DELL, ASUS, APPLE, HP, ACER,.. nói chung là viết hoa lên
- type: có 3 loại máy tính có bán ở cửa hàng: LAPTOP, LAPTOP_GAMING, PC
Nhiệm vụ của bạn là:
1. Phân tích yêu cầu bằng ngôn ngữ tự nhiên từ người dùng.
2. Xác định các tham số phù hợp từ yêu cầu đó.
3. Tạo URL truy vấn phù hợp từ endpoint /search/product/get-sorted hoặc /search/product/get-by-brandcomputer
4. Trả về một đối tượng JSON gồm:
   - url: URL hoàn chỉnh có chứa các query params
   - params: đối tượng các tham số đã phân tích
   - reply: câu trả lời thân thiện để phản hồi người dùng

Hãy chỉ sử dụng các tham số hợp lệ. Nếu không có tham số nào phù hợp, hãy phản hồi lại hợp lý và không tạo URL. Hãy trò chuyện với khách hàng kể cả những vấn đề không liên quan. 
Nhưng vẫn phải đảm báo cấu trúc trả về, hãy trò chuyện với khách hàng ở reply. Khi nào họ cần tìm kiếm sản phẩm thì tìm
`;

const geminiService = {
  /**
   * Gửi một prompt tới Gemini API và nhận phản hồi.
   * @param {string} promptText - Nội dung câu hỏi/yêu cầu cụ thể của người dùng.
   * @param {string} modelName - Tên của mô hình Gemini (mặc định: 'gemini-pro').
   * @returns {Promise<string>} - Nội dung phản hồi từ Gemini.
   */
  async generateContent(promptText, modelName) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      // Gộp prompt gốc + yêu cầu người dùng
      const fullPrompt = `${basePrompt}\n\nYêu cầu của người dùng: ${promptText}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error(`Lỗi khi gọi Gemini API với model ${modelName}:`, error);

      if (error.response && error.response.status) {
        throw new Error(
          `API Error: ${error.response.status} - ${error.response.statusText || 'Unknown error'}. Message: ${
            error.response.data?.error?.message || error.message
          }`,
        );
      }

      throw new Error(`Không thể kết nối tới Gemini API: ${error.message}`);
    }
  },
};

module.exports = geminiService;
