const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');

// Hàm lấy dữ liệu sản phẩm từ product_service
async function fetchProducts() {
  const response = await axios.get('http://localhost:3001/products'); // Thay 3001 bằng port của product_service
  return response.data;
}

// Hàm chuyển đặc điểm sản phẩm thành vector số
function productToVector(product) {
  const brandMap = { Dell: 1, HP: 2, Custom: 3 };
  const processorMap = { 'Intel i7': 1, 'AMD Ryzen 5': 2 }; // Điều chỉnh dựa trên processor
  const ramMap = { 16: 1, 8: 2 }; // Sử dụng ram dạng số
  const typeMap = { PC: 1, LAPTOP: 2, 'LAPTOP GAMING': 3 };

  const maxPrice = 30000000;
  const normalizedPrice = product.price / maxPrice;

  return [
    brandMap[product.computer.brand] || 0,
    normalizedPrice,
    processorMap[product.computer.processor] || 0,
    ramMap[product.computer.ram] || 0,
    typeMap[product.computer.type] || 0,
  ];
}

// Hàm tính cosine similarity
function cosineSimilarity(vecA, vecB) {
  const tensorA = tf.tensor1d(vecA);
  const tensorB = tf.tensor1d(vecB);

  const dotProduct = tf.dot(tensorA, tensorB);
  const normA = tf.norm(tensorA);
  const normB = tf.norm(tensorB);

  const similarity = dotProduct.div(normA.mul(normB));
  return similarity.dataSync()[0];
}

// Hàm gợi ý sản phẩm
async function recommendProducts(productId, topN = 2) {
  const products = await fetchProducts();
  const targetProduct = products.find((p) => p._id.toString() === productId); // Sử dụng _id từ MongoDB
  if (!targetProduct) return [];

  const targetVector = productToVector(targetProduct);

  const similarities = products
    .filter((p) => p._id.toString() !== productId)
    .map((p) => {
      const vector = productToVector(p);
      const similarity = cosineSimilarity(targetVector, vector);
      return { product: p, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .map((item) => item.product);

  return similarities;
}

module.exports = { recommendProducts };
