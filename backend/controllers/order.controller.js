const Order = require("../models/Order");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");
const ApiResponse = require("../utils/apiResponse");
const { paginate } = require("../utils/pagination");
const logger = require("../utils/logger");
const supabase = require("../config/supabase");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const parsePaymentField = (row) => {
  if (!row) return null;
  let payment = {
    method: 'Unknown',
    status: 'Unknown',
    transactionId: 'N/A',
    paidAt: null
  };

  const txId = row.transaction_id;
  if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(txId);
      payment.method = parsed.method || 'Unknown';
      payment.status = parsed.status || 'Unknown';
      payment.transactionId = parsed.transactionId || 'N/A';
      payment.paidAt = parsed.paidAt || null;
    } catch (e) {
      // Fallback
    }
  }
  return payment;
};

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  const {
    status,
    deliverySlot,
    date,
    customerId,
    vendorId,
    zone,
    search,
    page = 1,
    limit = 10,
    sortBy = "created_at",
    sortOrder = "desc",
  } = req.query;

  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (deliverySlot) filter.delivery_slot = deliverySlot;
  if (zone) filter.zone = zone;
  if (vendorId) filter.vendor = vendorId;

  // Enforce customer isolation: customers see only their own orders
  if (req.user.role === "customer") {
    filter.customer = req.user.id || req.user._id;
  } else if (customerId) {
    filter.customer = customerId;
  }

  if (date && date !== "undefined" && date !== "null") {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.delivery_date = {
        $gte: d.toISOString().split("T")[0],
        $lt: next.toISOString().split("T")[0],
      };
    }
  }
  if (search) filter.$or = [{ order_id: { $regex: search } }];

  const result = await paginate("orders", filter, {
    page,
    limit,
    sortBy,
    sortOrder,
    select: '*, customer_details:customers(name), route_details:routes(name), order_items(quantity, price, total, product_details:products(name))'
  });

  // Map and format records for backward compatibility with admin page
  const formattedData = result.data.map(row => {
    const routeName = row.route_details?.name || "N/A";
    const customerName = row.customer_details?.name || "Unknown";
    
    const items = (row.order_items || []).map(item => ({
      ...item,
      product_name: item.product_details?.name || "Unknown Product",
    }));

    const product = items[0]?.product_name || "N/A";
    const quantity = items[0]?.quantity || 0;

    return {
      ...row,
      customerName,
      route: routeName,
      product,
      quantity,
      amount: row.total,
      date: row.delivery_date,
      paymentStatus: row.payment_status === "captured" ? "Paid" : row.payment_status === "failed" ? "Failed" : "Unpaid",
      payment: parsePaymentField(row),
      items,
    };
  });

  return ApiResponse.paginated(res, formattedData, result.pagination);
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, "Order not found");

  // Enforce customer isolation
  if (
    req.user.role === "customer" &&
    order.customer !== (req.user.id || req.user._id)
  ) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to view this order",
    );
  }

  return ApiResponse.success(res, order);
};

const mapStatusToDb = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'placed') return 'placed';
  if (s === 'in progress' || s === 'in_progress' || s === 'confirmed') return 'confirmed';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'failed') return 'failed';
  return 'placed'; // default
};

// @desc    Create order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const isCustomer = req.user.role === "customer";

  if (!isCustomer && req.body.customerName) {
    const supabase = require('../config/supabase');
    try {
      // 1. Resolve customer
      let customerId;
      const { data: existingCusts } = await supabase
        .from('customers')
        .select('id')
        .ilike('name', req.body.customerName)
        .limit(1);
        
      if (existingCusts && existingCusts.length > 0) {
        customerId = existingCusts[0].id;
      } else {
        // Create new customer
        const randomPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            name: req.body.customerName,
            phone: randomPhone,
            address_line1: 'Admin Placed Order Address',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641001',
          })
          .select()
          .single();
          
        if (custErr) {
          logger.error(`Failed to create admin customer: ${custErr.message}`);
          // Fallback to first customer
          const { data: fallbackCust } = await supabase.from('customers').select('id').limit(1);
          if (!fallbackCust || fallbackCust.length === 0) {
            return ApiResponse.error(res, "No customer profiles exist in database to link the order", 400);
          }
          customerId = fallbackCust[0].id;
        } else {
          customerId = newCust.id;
        }
      }

      // 2. Resolve product
      let productId;
      let productPrice = 70;
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${req.body.product.split(' ')[0]}%`)
        .limit(1);
        
      if (prods && prods.length > 0) {
        productId = prods[0].id;
        productPrice = prods[0].price || 70;
      } else {
        const { data: fallbackProds } = await supabase.from('products').select('*').limit(1);
        if (fallbackProds && fallbackProds.length > 0) {
          productId = fallbackProds[0].id;
          productPrice = fallbackProds[0].price || 70;
        } else {
          return ApiResponse.error(res, "No products exist in database to link the order", 400);
        }
      }

      // 3. Resolve route/zone
      let zoneId = null;
      if (req.body.route) {
        const { data: routes } = await supabase
          .from('routes')
          .select('id')
          .ilike('name', `%${req.body.route.split(' ')[0]}%`)
          .limit(1);
        if (routes && routes.length > 0) {
          zoneId = routes[0].id;
        }
      }

      // 4. Construct normalized request body for Order.create
      const totalAmount = Number(req.body.amount || req.body.total || (req.body.quantity * productPrice) || 70);
      const subtotal = totalAmount;
      
      const orderPayload = {
        customer: customerId,
        vendor: null,
        deliveryAgent: null,
        deliverySlot: 'morning',
        deliveryDate: req.body.date || new Date().toISOString().split('T')[0],
        deliveryAddress: {
          line1: 'Admin Placed Order Address',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001',
        },
        zone: zoneId,
        status: mapStatusToDb(req.body.status),
        pricing: {
          subtotal,
          tax: 0,
          deliveryCharge: 0,
          discount: 0,
          total: totalAmount,
        },
        payment: {
          method: 'cod',
          status: req.body.paymentStatus === 'Paid' ? 'captured' : 'pending',
        },
        items: [
          {
            product: productId,
            quantity: req.body.quantity || 1,
            price: productPrice,
          }
        ],
        timeline: [
          {
            status: 'placed',
            timestamp: new Date().toISOString(),
            updatedBy: userId,
          }
        ]
      };

      const order = await Order.create(orderPayload);
      // Increment customer stats
      await Customer.incrementOrders(customerId, totalAmount);

      return ApiResponse.created(res, order, "Order created successfully");
    } catch (err) {
      logger.error(`Failed inside admin createOrder: ${err.message}`);
      return ApiResponse.error(res, `Failed to create order: ${err.message}`, 500);
    }
  }

  // Override customer ID for safety if placed by customer
  const orderCustomer = isCustomer ? userId : req.body.customer;
  req.body.customer = orderCustomer;

  const rawItems = req.body.items;
  const { payment, deliverySlot, deliveryDate, deliveryAddress } = req.body;
  const paymentMethod = payment?.method || req.body.payment_method;

  // 1. Cart Validation
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return ApiResponse.error(res, "Cart is empty or invalid items list", 400);
  }

  // Normalize items and perform defensive validations
  const normalizedItems = [];
  for (const item of rawItems) {
    if (!item) {
      return ApiResponse.error(
        res,
        "Cart contains an invalid or empty item",
        400,
      );
    }

    if (item.product === undefined || item.product === null) {
      return ApiResponse.error(
        res,
        "Product field is missing in cart item",
        400,
      );
    }

    let productId = "";
    if (typeof item.product === "object") {
      if (!item.product.id) {
        return ApiResponse.error(
          res,
          "Product ID is missing in cart item",
          400,
        );
      }
      productId = item.product.id;
    } else if (typeof item.product === "string") {
      productId = item.product;
    } else {
      return ApiResponse.error(res, "Invalid product format in cart item", 400);
    }

    if (
      item.quantity === undefined ||
      item.quantity === null ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return ApiResponse.error(res, "Invalid product quantity in cart", 400);
    }

    normalizedItems.push({
      product: productId,
      quantity: item.quantity,
    });
  }

  // Overwrite request body items with normalized list
  req.body.items = normalizedItems;
  const items = normalizedItems;

  // Check for duplicate product IDs
  const productIds = items.map((i) => i.product);
  const uniqueProductIds = new Set(productIds);
  if (uniqueProductIds.size !== productIds.length) {
    return ApiResponse.error(res, "Duplicate products detected in cart", 400);
  }
  // 2. Delivery Validation
  if (!deliverySlot || !["morning", "evening"].includes(deliverySlot)) {
    return ApiResponse.error(res, "Invalid delivery slot", 400);
  }

  if (!deliveryDate) {
    return ApiResponse.error(res, "Delivery date is required", 400);
  }
  const todayStr = new Date().toISOString().split("T")[0];
  if (deliveryDate < todayStr) {
    return ApiResponse.error(res, "Delivery date cannot be in the past", 400);
  }

  if (
    !deliveryAddress ||
    !deliveryAddress.line1 ||
    !deliveryAddress.city ||
    !deliveryAddress.state ||
    !deliveryAddress.pincode
  ) {
    return ApiResponse.error(res, "Delivery address is incomplete", 400);
  }

  // 3. Product & Pricing Validation
  const supabase = require("../config/supabase");
  let recalculatedSubtotal = 0;

  try {
    // Fetch product details for validation
    const { data: dbProducts, error: dbErr } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .is("deleted_at", null);

    if (dbErr) throw new Error(`Failed to verify products: ${dbErr.message}`);

    if (!dbProducts || dbProducts.length !== items.length) {
      return ApiResponse.error(
        res,
        "One or more products in cart do not exist",
        400,
      );
    }

    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.product);
      if (!dbProduct) {
        return ApiResponse.error(res, "Product not found", 400);
      }
      if (!dbProduct.is_active) {
        return ApiResponse.error(
          res,
          `Product ${dbProduct.name} is currently inactive`,
          400,
        );
      }

      // Stock checks
      const stock = dbProduct.stock || {};
      const availableStock =
        stock.available !== undefined ? Number(stock.available) : 99999;
      if (item.quantity > availableStock) {
        return ApiResponse.error(
          res,
          `Insufficient stock for product ${dbProduct.name}. Available: ${availableStock}`,
          400,
        );
      }

      // Enforce database pricing
      item.price = dbProduct.price;
      recalculatedSubtotal += dbProduct.price * item.quantity;
    }
  } catch (err) {
    logger.error(`Product validation error: ${err.message}`);
    return ApiResponse.error(
      res,
      `Product validation failed: ${err.message}`,
      500,
    );
  }

  // Recalculate billing
  const recalculatedTax = Number((recalculatedSubtotal * 0.05).toFixed(2));
  const recalculatedDeliveryCharge = recalculatedSubtotal > 200 ? 0 : 20;
  const recalculatedTotal = Number(
    (
      recalculatedSubtotal +
      recalculatedTax +
      recalculatedDeliveryCharge
    ).toFixed(2),
  );

  // Verify pricing against frontend payload
  const frontendTotal = Number(req.body.pricing?.total || req.body.total || 0);
  if (Math.abs(recalculatedTotal - frontendTotal) > 0.05) {
    return ApiResponse.error(
      res,
      "Manipulated or inconsistent pricing detected",
      400,
    );
  }

  // 4. Wallet & Atomicity Checkout Process
  const customer = await Customer.findById(orderCustomer);
  if (!customer) return ApiResponse.notFound(res, "Customer profile not found");

  const originalBalance = Number(customer.wallet_balance || 0);

  if (paymentMethod === "wallet" && originalBalance < recalculatedTotal) {
    return ApiResponse.error(
      res,
      `Insufficient wallet balance. Price: ₹${recalculatedTotal.toFixed(2)}, Balance: ₹${originalBalance.toFixed(2)}`,
      400,
    );
  }

  let walletDebited = false;
  let transactionId = null;
  let createdOrderId = null;

  try {
    if (paymentMethod === "wallet") {
      // Deduct balance
      const newBalance = originalBalance - recalculatedTotal;
      await Customer.update(orderCustomer, { wallet_balance: newBalance });
      walletDebited = true;

      // Log transaction in database
      const txRes = await supabase
        .from("wallet_transactions")
        .insert({
          customer_id: orderCustomer,
          amount: recalculatedTotal,
          type: "debit",
          description: `Payment for order ${req.body.order_id || "checkout"}`,
        })
        .select("id")
        .single();

      if (txRes.error)
        throw new Error(
          `Wallet transaction log failed: ${txRes.error.message}`,
        );
      transactionId = txRes.data.id;

      // Update payment state
      req.body.payment = {
        method: "wallet",
        status: "captured",
        transactionId,
        paidAt: new Date().toISOString(),
      };
    } else if (paymentMethod === "online" || paymentMethod === "razorpay") {
      // Preserve Razorpay details sent from the frontend after successful payment
      req.body.payment = {
        method: "razorpay",
        status: payment?.status || "captured",
        transactionId: payment?.transactionId || "N/A",
        paidAt: payment?.paidAt || new Date().toISOString(),
      };
    } else {
      req.body.payment = {
        method: paymentMethod || "cod",
        status: "pending",
      };
    }

    // Set verified totals on the request body before DB write
    req.body.pricing = {
      subtotal: recalculatedSubtotal,
      tax: recalculatedTax,
      deliveryCharge: recalculatedDeliveryCharge,
      discount: 0,
      total: recalculatedTotal,
    };

    // Create the order using model which creates order, order_items, and timeline
    const order = await Order.create({
      ...req.body,
      timeline: [
        {
          status: "placed",
          timestamp: new Date().toISOString(),
          updatedBy: userId,
        },
      ],
    });
    createdOrderId = order.id;

    // Increment customer stats
    await Customer.incrementOrders(orderCustomer, recalculatedTotal);

    return ApiResponse.created(res, order, "Order created successfully");
  } catch (err) {
    // Atomic Rollback
    if (walletDebited) {
      // Revert customer wallet balance
      await Customer.update(orderCustomer, { wallet_balance: originalBalance });
    }
    if (transactionId) {
      // Remove wallet transaction log
      await supabase
        .from("wallet_transactions")
        .delete()
        .eq("id", transactionId);
    }
    if (createdOrderId) {
      // Delete order record (cascade will handle child tables in Supabase if constraints set)
      await supabase.from("orders").delete().eq("id", createdOrderId);
    }
    logger.error(
      `Checkout transaction failed, rolled back successfully: ${err.message}`,
    );
    return ApiResponse.error(
      res,
      `Checkout transaction failed: ${err.message}`,
      500,
    );
  }
};

const updateOrder = async (req, res) => {
  const userId = req.user.id || req.user._id;
  const isCustomer = req.user.role === "customer";
  
  if (!isCustomer && req.body.customerName) {
    // This is an admin update request!
    const supabase = require('../config/supabase');
    try {
      const updates = {};
      
      // 1. Map simple fields
      if (req.body.status !== undefined) updates.status = mapStatusToDb(req.body.status);
      if (req.body.date !== undefined) updates.delivery_date = req.body.date;
      if (req.body.amount !== undefined) updates.total = req.body.amount;
      
      if (req.body.paymentStatus !== undefined) {
        updates.payment_status = req.body.paymentStatus === 'Paid' ? 'captured' : req.body.paymentStatus === 'Failed' ? 'failed' : 'pending';
        
        // Fetch existing order to update stringified payment details in transaction_id column
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('transaction_id, payment_method, payment_status')
          .eq('id', req.params.id)
          .single();
        
        const currentPayment = parsePaymentField(currentOrder);
        let newStatus = 'pending';
        if (req.body.paymentStatus === 'Paid') {
          newStatus = currentPayment.method === 'razorpay' ? 'captured' : 'paid';
        } else if (req.body.paymentStatus === 'Failed') {
          newStatus = 'failed';
        }
        
        currentPayment.status = newStatus;
        if (req.body.paymentStatus === 'Paid') {
          currentPayment.paidAt = currentPayment.paidAt || new Date().toISOString();
        }
        
        updates.transaction_id = JSON.stringify(currentPayment);
      }

      // 2. Resolve route/zone
      if (req.body.route !== undefined) {
        const { data: routes } = await supabase
          .from('routes')
          .select('id')
          .ilike('name', `%${req.body.route.split(' ')[0]}%`)
          .limit(1);
        if (routes && routes.length > 0) {
          updates.zone = routes[0].id;
        }
      }

      // 3. Update main order row
      const { data: orderData, error: updateErr } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', req.params.id)
        .is('deleted_at', null)
        .select()
        .single();

      if (updateErr) {
        logger.error(`Admin update order failed: ${updateErr.message}`);
        return ApiResponse.error(res, `Failed to update order: ${updateErr.message}`, 500);
      }

      // 4. Update order items if product or quantity changed
      if (req.body.product !== undefined || req.body.quantity !== undefined) {
        let productId;
        let productPrice = 70;
        
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${(req.body.product || '').split(' ')[0]}%`)
          .limit(1);
          
        if (prods && prods.length > 0) {
          productId = prods[0].id;
          productPrice = prods[0].price || 70;
        } else {
          const { data: fallbackProds } = await supabase.from('products').select('*').limit(1);
          if (fallbackProds && fallbackProds.length > 0) {
            productId = fallbackProds[0].id;
            productPrice = fallbackProds[0].price || 70;
          }
        }

        const qty = req.body.quantity || 1;
        const itemTotal = qty * productPrice;

        // Update or insert order item
        const { data: existingItems } = await supabase.from('order_items').select('id').eq('order_id', req.params.id).limit(1);
        if (existingItems && existingItems.length > 0) {
          await supabase
            .from('order_items')
            .update({
              product: productId,
              quantity: qty,
              price: productPrice,
              total: itemTotal,
            })
            .eq('id', existingItems[0].id);
        } else {
          await supabase
            .from('order_items')
            .insert({
              order_id: req.params.id,
              product: productId,
              quantity: qty,
              price: productPrice,
              total: itemTotal,
            });
        }
      }

      // Retrieve full updated order using model findById to return correct formatting
      const updatedOrder = await Order.findById(req.params.id);
      return ApiResponse.success(res, updatedOrder, "Order updated successfully");
    } catch (err) {
      logger.error(`Admin updateOrder failed: ${err.message}`);
      return ApiResponse.error(res, `Failed to update order: ${err.message}`, 500);
    }
  }

  const order = await Order.update(req.params.id, req.body);
  if (!order) return ApiResponse.notFound(res, "Order not found");
  return ApiResponse.success(res, order, "Order updated");
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = [
    "placed",
    "confirmed",
    "packed",
    "assigned",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "failed",
  ];

  if (!validStatuses.includes(status))
    return ApiResponse.error(res, "Invalid status", 400);

  const order = await Order.update(req.params.id, { status });
  if (!order) return ApiResponse.notFound(res, "Order not found");

  // Add timeline entry
  await Order.addTimelineEntry(order.id, {
    status,
    timestamp: new Date().toISOString(),
    note,
    updatedBy: req.user._id,
  });

  await AuditLog.create({
    user: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: "STATUS_CHANGE",
    module: "Order",
    entityType: "Order",
    entityId: order.id,
    description: `Order ${order.order_id} status changed to ${status}`,
    ipAddress: req.ip,
  });

  return ApiResponse.success(res, order, `Order status updated to ${status}`);
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.id || req.user._id;
  const order = await Order.findById(req.params.id);
  if (!order) return ApiResponse.notFound(res, "Order not found");

  // Enforce customer isolation
  if (req.user.role === "customer") {
    if (order.customer !== userId) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to cancel this order",
      );
    }
    // Check if order status is still cancellable (only placed/confirmed/pending)
    if (!["placed", "confirmed", "pending"].includes(order.status)) {
      return ApiResponse.error(
        res,
        "This order is already out for delivery or delivered and cannot be cancelled.",
        400,
      );
    }
  } else {
    if (["delivered", "cancelled"].includes(order.status)) {
      return ApiResponse.error(res, "Cannot cancel this order", 400);
    }
  }

  // Handle Automatic Refund if order is paid
  const payment = order.payment || {};
  const isPaid = payment.status === 'paid' || payment.status === 'captured';
  
  let refundDetails = null;

  if (isPaid) {
    try {
      if (payment.method === 'wallet') {
        // Refund to wallet
        const customer = await Customer.findById(order.customer);
        if (customer) {
          const currentBalance = Number(customer.wallet_balance || 0);
          const newBalance = currentBalance + Number(order.total);
          await Customer.update(order.customer, { wallet_balance: newBalance });

          // Log wallet transaction
          await supabase.from('wallet_transactions').insert({
            customer_id: order.customer,
            amount: order.total,
            type: 'credit',
            description: `Refund for cancelled order ${order.order_id || order.id}`,
          });
        }
        
        refundDetails = {
          refundId: `oref_w_${Date.now()}`,
          amount: order.total,
          status: 'processed',
          processedAt: new Date().toISOString(),
        };
      } else if (payment.method === 'razorpay' || payment.method === 'online') {
        // Refund via Razorpay
        if (payment.transactionId && payment.transactionId !== 'N/A') {
          const refund = await razorpay.payments.refund(payment.transactionId, {
            amount: Math.round(order.total * 100), // convert to paise
            notes: { reason: `Order Cancelled: ${reason || 'User Initiated'}` },
          });

          refundDetails = {
            refundId: refund.id,
            amount: order.total,
            status: 'processed',
            processedAt: new Date().toISOString(),
          };
        }
      }
    } catch (refundErr) {
      logger.error(`Automatic refund failed for order ${order.id}: ${refundErr.message}`);
    }
  }

  // Update order status, payment status, and serialized payment details inside transaction_id
  const updatedPayment = {
    ...payment,
    status: isPaid && refundDetails ? 'refunded' : payment.status,
    refund: refundDetails,
  };

  await Order.update(order.id, { 
    status: "cancelled", 
    cancelReason: reason,
    payment_status: isPaid && refundDetails ? 'refunded' : order.payment_status,
    transaction_id: JSON.stringify(updatedPayment),
  });

  await Order.addTimelineEntry(order.id, {
    status: "cancelled",
    timestamp: new Date().toISOString(),
    note: isPaid && refundDetails 
      ? `Order cancelled. Automatic refund of ₹${order.total} processed (${payment.method === 'wallet' ? 'Wallet Credit' : 'Razorpay Gateway'}).`
      : `Order cancelled. ${reason || ''}`,
    updatedBy: userId,
  });

  const updatedOrder = await Order.findById(order.id);

  return ApiResponse.success(
    res,
    updatedOrder,
    isPaid && refundDetails
      ? `Order cancelled and refund of ₹${order.total} processed successfully.`
      : "Order cancelled",
  );
};

// @desc    Delete order (soft)
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  const order = await Order.softDelete(req.params.id);
  if (!order) return ApiResponse.notFound(res, "Order not found");
  return ApiResponse.success(res, null, "Order deleted");
};

// @desc    Get order timeline
// @route   GET /api/orders/:id/timeline
const getOrderTimeline = async (req, res) => {
  const orderObj = await Order.findById(req.params.id);
  if (!orderObj) return ApiResponse.notFound(res, "Order not found");

  // Enforce customer isolation
  if (
    req.user.role === "customer" &&
    orderObj.customer !== (req.user.id || req.user._id)
  ) {
    return ApiResponse.forbidden(
      res,
      "You are not authorized to view this order timeline",
    );
  }

  const order = await Order.getTimeline(req.params.id);
  return ApiResponse.success(res, order);
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderTimeline,
};
