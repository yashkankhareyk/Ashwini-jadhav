const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('./config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();
const Product = require('./models/Product');
const connectDB = require('./config/db');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // local dev
    'https://your-production-frontend-domain', // production, replace with your deployed frontend
  ],
  credentials: true,
}));
app.use(express.json());
// app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// BASE_URL fallback for local development
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'; // Set BASE_URL in .env for production
app.set('trust proxy', true);

// Multer Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
  },
});
const upload = multer({ storage });

// In-memory storage (replacing MongoDB)
let products = [];
let admins = [];
let productIdCounter = 1;
let adminIdCounter = 1;

// Helper functions for in-memory storage
const generateId = () => Date.now().toString();

// Product model functions
const createProduct = (productData) => {
  const product = {
    _id: generateId(),
    ...productData,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  products.push(product);
  return product;
};

const findProducts = (filter = {}) => {
  return products.filter(product => {
    if (filter.isActive !== undefined && product.isActive !== filter.isActive) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const findProductById = (id) => {
  return products.find(product => product._id === id);
};

const updateProduct = (id, updateData) => {
  const productIndex = products.findIndex(product => product._id === id);
  if (productIndex === -1) return null;
  
  products[productIndex] = {
    ...products[productIndex],
    ...updateData,
    updatedAt: new Date()
  };
  return products[productIndex];
};

// Admin model functions
const createAdmin = (adminData) => {
  const admin = {
    _id: generateId(),
    ...adminData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  admins.push(admin);
  return admin;
};

const findAdminByEmail = (email) => {
  return admins.find(admin => admin.email === email);
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = findAdminByEmail('admin@lilycanal.com');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Aayush@1999$', 10);
      const admin = createAdmin({
        email: 'admin@lilycanal.com',
        password: hashedPassword
      });
      // console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Add some sample products
const createSampleProducts = () => {
  const sampleProducts = [
    {
      name: "Luxury Face Serum",
      description: "Anti-aging serum with vitamin C and hyaluronic acid for radiant, youthful skin.",
      price: "₹89.99",
      imageUrl: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
      affiliateLink: "https://example.com/luxury-face-serum",
      brand: "GlowBeauty"
    },
    {
      name: "Moisturizing Lip Balm",
      description: "Nourishing lip balm with natural ingredients for soft, hydrated lips.",
      price: "₹12.99",
      imageUrl: "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400",
      affiliateLink: "https://example.com/moisturizing-lip-balm",
      brand: "NaturalGlow"
    },
    {
      name: "Premium Foundation",
      description: "Full coverage foundation with SPF 30 for flawless, protected skin all day.",
      price: "₹45.99",
      imageUrl: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
      affiliateLink: "https://example.com/premium-foundation",
      brand: "BeautyPro"
    },
    {
      name: "Eye Cream Deluxe",
      description: "Intensive eye cream that reduces dark circles and fine lines for brighter eyes.",
      price: "₹67.99",
      imageUrl: "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400",
      affiliateLink: "https://example.com/eye-cream-deluxe",
      brand: "LuxeSkin"
    }
  ];

  sampleProducts.forEach(product => createProduct(product));
  // console.log('Sample products created');
};

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products (optionally filter by isActive)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new product
app.post('/api/products', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, affiliateLink, brand } = req.body;
    let imageUrl = '';
    let cloudinaryId = '';
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary HTTPS URL
      cloudinaryId = req.file.filename; // Cloudinary public_id
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }
    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      cloudinaryId,
      affiliateLink,
      brand
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product
app.put('/api/products/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, affiliateLink, brand } = req.body;
    let imageUrl;
    let cloudinaryId;
    if (req.file) {
      imageUrl = req.file.path;
      cloudinaryId = req.file.filename;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }
    const updateData = {
      name,
      description,
      price,
      affiliateLink,
      brand,
    };
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (cloudinaryId) updateData.cloudinaryId = cloudinaryId;
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft delete a product (set isActive to false)
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.cloudinaryId) {
      await cloudinary.uploader.destroy(product.cloudinaryId);
    }
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product and image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Image upload route (standalone)
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = req.file.path; // Cloudinary HTTPS URL
    const cloudinaryId = req.file.filename;
    res.json({ imageUrl, cloudinaryId });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const startServer = async () => {
  // console.log('Using in-memory storage (no MongoDB required)');
  await createDefaultAdmin();
  createSampleProducts();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // console.log('Admin credentials: admin@lilycanal.com / admin123');
  });
};

startServer();

// Reminder for frontend devs:
// In your frontend .env, set VITE_API_BASE_URL=http://localhost:5000/api for local testing
// and VITE_API_BASE_URL=https://your-production-backend-domain/api for production