const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true, min: [0, 'Price must be a positive number'] },
        description: { type: String, required: true },
        computer: {
            ram: { type: Number, required: true },
            type: { type: String, enum: ['PC', 'LAPTOP', 'LAPTOP GAMING'], required: true },
            storage: { type: Number, required: true },
            graphic_card: { type: String },
            processor: {
                type: String,
                required: true,
            },
            battery_life: {
                type: Number,
            },
            os: {
                type: String,
                required: true,
            },
        },
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
