const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Seller only)
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, sku, category, price, comparePrice, stock, description, image } = req.body;

    // Validation
    if (
      !name || !name.trim() ||
      !brand || !brand.trim() ||
      !sku || !sku.trim() ||
      !category || !category.trim() ||
      price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0 ||
      comparePrice === undefined || isNaN(parseFloat(comparePrice)) || parseFloat(comparePrice) <= 0 ||
      stock === undefined || isNaN(parseInt(stock)) || parseInt(stock) < 0 ||
      !description || !description.trim() ||
      !image || !image.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields'
      });
    }

    if (parseFloat(comparePrice) <= parseFloat(price)) {
      return res.status(400).json({
        success: false,
        error: 'Compare-at price must be greater than listing price'
      });
    }

    // Check unique SKU
    const skuExists = await Product.findOne({ sku: sku.toUpperCase() });
    if (skuExists) {
      return res.status(400).json({
        success: false,
        error: `A product with SKU '${sku.toUpperCase()}' already exists`
      });
    }

    const product = await Product.create({
      name,
      brand,
      sku: sku.toUpperCase(),
      category,
      price,
      comparePrice,
      stock,
      description,
      image,
      seller: req.user.id,
      approvalStatus: 'approved',
      adminCode: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      approvalAttempts: 1
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages[0]
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while creating product'
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ approvalStatus: 'approved' }).populate('seller', 'name email phone');
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while retrieving products'
    });
  }
};

// @desc    Get seller's own products
// @route   GET /api/products/my
// @access  Private (Seller only)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id });
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get Seller Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while retrieving seller products'
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email phone');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get Product By ID Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Product ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while retrieving product detail'
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller only, owner only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this product listing'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product listing removed successfully'
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting product'
    });
  }
};

// @desc    Verify product activation code
// @route   PUT /api/products/:id/verify
// @access  Private (Seller only)
exports.verifyProduct = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Please enter verification code' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Owner check
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to verify this product' });
    }

    if (product.approvalStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'Product is not pending activation' });
    }

    if (product.adminCode !== code.trim().toUpperCase()) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    product.approvalStatus = 'approved';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product listed live successfully',
      product
    });
  } catch (error) {
    console.error('Verify Product Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Resubmit product after edit/fix
// @route   PUT /api/products/:id/resubmit
// @access  Private (Seller only)
exports.resubmitProduct = async (req, res) => {
  try {
    const { name, brand, sku, category, price, comparePrice, stock, description, image } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Owner check
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this product' });
    }

    // Validation
    if (
      !name || !name.trim() ||
      !brand || !brand.trim() ||
      !sku || !sku.trim() ||
      !category || !category.trim() ||
      price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0 ||
      comparePrice === undefined || isNaN(parseFloat(comparePrice)) || parseFloat(comparePrice) <= 0 ||
      stock === undefined || isNaN(parseInt(stock)) || parseInt(stock) < 0 ||
      !description || !description.trim() ||
      !image || !image.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields'
      });
    }

    if (parseFloat(comparePrice) <= parseFloat(price)) {
      return res.status(400).json({
        success: false,
        error: 'Compare-at price must be greater than listing price'
      });
    }

    // Update values
    product.name = name.trim();
    product.brand = brand.trim();
    product.sku = sku.trim().toUpperCase();
    product.category = category;
    product.price = parseFloat(price);
    product.comparePrice = parseFloat(comparePrice);
    product.stock = parseInt(stock);
    product.description = description.trim();
    product.image = image.trim();

    // Auto-approve edits
    product.approvalStatus = 'approved';
    product.rejectionReason = undefined;

    await product.save();

    res.status(200).json({
      success: true,
      message: `Product updated successfully.`,
      product
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin approve or reject product listing request (Simulated Endpoint)
// @route   PUT /api/products/:id/admin-decision
// @access  Public
exports.adminDecision = async (req, res) => {
  try {
    const { decision, reason } = req.body; // 'approve' or 'reject'
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (decision === 'approve') {
      product.approvalStatus = 'pending';
      if (!product.adminCode) {
        product.adminCode = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      product.rejectionReason = undefined;
    } else if (decision === 'reject') {
      product.approvalStatus = 'rejected';
      product.rejectionReason = reason || 'Product description or images do not match our standard listing terms.';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid decision type. Use approve or reject' });
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: `Admin decision '${decision}' saved successfully`,
      product
    });
  } catch (error) {
    console.error('Admin Decision Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
