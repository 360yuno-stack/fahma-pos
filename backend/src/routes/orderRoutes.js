const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Table = require('../models/Table');
const VerifactuConfig = require('../models/VerifactuConfig');

// Helper to generate VeriFactu Hash
async function generateVerifactuHash(order) {
  try {
    const config = await VerifactuConfig.findOne();
    if (!config || !config.isActive) return null;

    const previousOrder = await Order.findOne({ verifactuHash: { $ne: null } }).sort({ createdAt: -1 });
    const previousHash = previousOrder ? previousOrder.verifactuHash : '';
    
    // Hash format: PreviousHash + OrderNumber (or ID) + Total + Date + NIF
    const dataToHash = `${previousHash}${order._id}${order.total}${new Date().toISOString()}${config.nif}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // In a real scenario, this would generate the XML and send it via Certificate
    // Here we simulate the successful chain block
    order.verifactuHash = hash;
    order.verifactuPreviousHash = previousHash;
    order.verifactuSent = true;
    order.verifactuDate = new Date();
    
    // Save last hash in config
    config.lastInvoiceHash = hash;
    await config.save();
    
    return hash;
  } catch (error) {
    console.error("VeriFactu Error:", error);
    return null;
  }
}

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { from, to, status, table, limit = 100 } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from + 'T00:00:00.000Z');
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }
    if (status && status !== 'all') filter.status = status;
    if (table) filter.table = table;

    const orders = await Order.find(filter)
      .populate('table', 'name number zone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('table', 'name number zone');
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { lines, items, total, paymentMethod, tableId, table: tableRef, type, status, notes, customer } = req.body;
    const orderItems = items || (lines || []).map(l => ({
      product: l.productId || l.product,
      name: l.nombre || l.name,
      quantity: l.qty || l.quantity || 1,
      price: l.precio || l.price,
      subtotal: (l.precio || l.price) * (l.qty || l.quantity || 1),
      modifiers: l.modifiers || []
    }));

    const orderTotal = total || orderItems.reduce((s, i) => s + (i.subtotal || i.price * i.quantity), 0);
    const subtotal = orderTotal / 1.10;
    const taxes = orderTotal - subtotal;

    // Mapear métodos de pago a enums válidos en la base de datos
    let mappedPaymentMethod = 'cash';
    if (paymentMethod === 'tarjeta' || paymentMethod === 'card') {
      mappedPaymentMethod = 'card';
    } else if (paymentMethod === 'efectivo' || paymentMethod === 'cash') {
      mappedPaymentMethod = 'cash';
    }

    // Mapear estado a enums válidos en la base de datos
    let mappedStatus = 'pending';
    if (status === 'completed' || status === 'paid') {
      mappedStatus = 'completed';
    } else if (status === 'preparing') {
      mappedStatus = 'preparing';
    } else if (status === 'ready') {
      mappedStatus = 'ready';
    } else if (status === 'cancelled') {
      mappedStatus = 'cancelled';
    }

    const order = new Order({
      table: tableId || tableRef || null,
      type: type || 'dine-in',
      items: orderItems,
      subtotal,
      taxes,
      total: orderTotal,
      paymentMethod: mappedPaymentMethod,
      status: mappedStatus,
      notes: notes || '',
      customer: customer ? {
        client: customer.client || customer._id || null,
        name: customer.name || customer.nombre || '',
        nif: customer.nif || customer.dni_cif || '',
        email: customer.email || '',
        phone: customer.phone || customer.telefono || '',
        address: customer.address || customer.direccion || ''
      } : {}
    });

    if (order.status === 'completed') {
      await generateVerifactuHash(order);
      order.paidAt = new Date();
    }

    const saved = await order.save();

    if (saved.table) {
      if (saved.status === 'completed') {
        await Table.findByIdAndUpdate(saved.table, { status: 'free', currentOrder: null });
      } else {
        await Table.findByIdAndUpdate(saved.table, { status: 'occupied', currentOrder: saved._id });
      }
    }

    const populated = await Order.findById(saved._id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');

    // Imprimir comanda y/o recibo automáticamente
    try {
      const { printOrderComanda, printOrderReceipt } = require('../utils/printHelper');
      printOrderComanda(populated);
      if (saved.status === 'completed') {
        printOrderReceipt(populated);
      }
    } catch (printErr) {
      console.error('Error en impresión automática en creación de pedido:', printErr);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error POST /api/orders:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (status) {
      if (status === 'paid' || status === 'completed') {
        order.status = 'completed';
      } else {
        order.status = status;
      }
    }
    
    if (paymentMethod) {
      if (paymentMethod === 'tarjeta' || paymentMethod === 'card') {
        order.paymentMethod = 'card';
      } else if (paymentMethod === 'efectivo' || paymentMethod === 'cash') {
        order.paymentMethod = 'cash';
      } else {
        order.paymentMethod = paymentMethod;
      }
    }

    if (order.status === 'completed') {
      order.paidAt = new Date();
      if (!order.verifactuHash) {
        await generateVerifactuHash(order);
      }
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, { status: 'free', currentOrder: null });
      }
    }
    
    await order.save();
    
    // Si se ha cobrado, imprimir ticket de venta automáticamente
    if (order.status === 'completed') {
      try {
        const populated = await Order.findById(order._id)
          .populate('table', 'name number zone')
          .populate('items.product', 'category name price');
        const { printOrderReceipt } = require('../utils/printHelper');
        printOrderReceipt(populated);
      } catch (printErr) {
        console.error('Error al imprimir recibo en cambio de estado:', printErr);
      }
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/print - Re-imprimir ticket (comanda o recibo)
router.post('/:id/print', async (req, res) => {
  try {
    const { type = 'receipt' } = req.body; // 'comanda' o 'receipt'
    const order = await Order.findById(req.params.id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');
      
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const { printOrderComanda, printOrderReceipt } = require('../utils/printHelper');
    
    if (type === 'comanda') {
      await printOrderComanda(order);
      res.json({ success: true, message: 'Comanda enviada a las impresoras' });
    } else {
      await printOrderReceipt(order);
      res.json({ success: true, message: 'Ticket de venta enviado a las impresoras' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id - Modificar un pedido existente (incluso si ya fue cobrado)
router.put('/:id', async (req, res) => {
  try {
    const { lines, items, total, paymentMethod, status, notes, customer, tableId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    if (items || lines) {
      const orderItems = items || (lines || []).map(l => ({
        product: l.productId || l.product,
        name: l.nombre || l.name,
        quantity: l.qty || l.quantity || 1,
        price: l.precio || l.price,
        subtotal: (l.precio || l.price) * (l.qty || l.quantity || 1),
        modifiers: l.modifiers || []
      }));
      order.items = orderItems;
    }

    const orderTotal = total !== undefined ? total : order.items.reduce((s, i) => s + (i.subtotal || i.price * i.quantity), 0);
    order.total = orderTotal;
    order.subtotal = orderTotal / 1.10;
    order.taxes = orderTotal - order.subtotal;

    if (paymentMethod) {
      if (paymentMethod === 'tarjeta' || paymentMethod === 'card') {
        order.paymentMethod = 'card';
      } else if (paymentMethod === 'efectivo' || paymentMethod === 'cash') {
        order.paymentMethod = 'cash';
      } else {
        order.paymentMethod = paymentMethod;
      }
    }

    if (status) {
      order.status = status === 'paid' ? 'completed' : status;
    }

    if (notes !== undefined) order.notes = notes;
    if (customer) {
      order.customer = {
        client: customer.client || customer._id || order.customer?.client || null,
        name: customer.name || customer.nombre || '',
        nif: customer.nif || customer.dni_cif || '',
        email: customer.email || '',
        phone: customer.phone || customer.telefono || '',
        address: customer.address || customer.direccion || ''
      };
    }
    if (tableId !== undefined) order.table = tableId || null;

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');

    res.json({ success: true, data: populated, message: 'Pedido actualizado correctamente' });
  } catch (err) {
    console.error('Error PUT /api/orders/:id:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/email-invoice - Enviar factura por correo electrónico
router.post('/:id/email-invoice', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const Settings = require('../models/Settings');
    
    const { targetEmail } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');

    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const settings = await Settings.findOne() || {};
    const recipientEmail = targetEmail || order.customer?.email;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Indique un correo electrónico para enviar la factura' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    const subtotal = (order.subtotal || (order.total / 1.10)).toFixed(2);
    const taxes = (order.taxes || (order.total - (order.total / 1.10))).toFixed(2);
    const total = order.total.toFixed(2);

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}x ${item.name} ${item.modifiers?.length ? `(${item.modifiers.join(', ')})` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">€${(item.subtotal || (item.price * item.quantity)).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #111;">${(settings.restaurantName || 'EL FOGON DEL AGUILA').toUpperCase()}</h1>
          <p style="margin: 4px 0; color: #666; font-size: 13px;">${settings.address || ''} | NIF: ${settings.nif || ''} | Tel: ${settings.phone || ''}</p>
        </div>

        <div style="margin-bottom: 20px; background: #f9f9f9; padding: 12px; border-radius: 6px;">
          <h2 style="margin-top: 0; font-size: 16px; color: #333;">FACTURA N°: F-${new Date(order.createdAt).getFullYear()}/${order.orderNumber}</h2>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Fecha:</strong> ${new Date(order.paidAt || order.createdAt).toLocaleDateString()}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Cliente:</strong> ${order.customer?.name || 'Cliente de Contado'}</p>
          ${order.customer?.nif ? `<p style="margin: 3px 0; font-size: 13px;"><strong>NIF/CIF Cliente:</strong> ${order.customer.nif}</p>` : ''}
          ${order.customer?.address ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Dirección Cliente:</strong> ${order.customer.address}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background: #eee;">
              <th style="padding: 8px; text-align: left;">Concepto</th>
              <th style="padding: 8px; text-align: right;">Precio Un.</th>
              <th style="padding: 8px; text-align: right;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="float: right; width: 220px; margin-bottom: 20px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td>Base Imponible:</td><td style="text-align: right;">€${subtotal}</td></tr>
            <tr><td>IVA (10%):</td><td style="text-align: right;">€${taxes}</td></tr>
            <tr style="font-weight: bold; font-size: 16px; border-top: 2px solid #333;"><td>TOTAL:</td><td style="text-align: right;">€${total}</td></tr>
          </table>
        </div>
        <div style="clear: both;"></div>

        <div style="text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;">
          ${settings.ticketFooterText || '¡Muchas gracias por su confianza!'}
        </div>
      </div>
    `;

    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: `"${settings.restaurantName || 'EL FOGON DEL AGUILA'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `Factura F-${new Date(order.createdAt).getFullYear()}/${order.orderNumber} - ${settings.restaurantName || 'EL FOGON DEL AGUILA'}`,
        html: htmlBody
      });
      res.json({ success: true, message: `Factura enviada con éxito a ${recipientEmail}` });
    } else {
      console.log(`[SIMULACIÓN EMAIL FACTURA] Destinatario: ${recipientEmail}\n${htmlBody}`);
      res.json({ success: true, message: `Factura generada correctamente para ${recipientEmail}` });
    }
  } catch (err) {
    console.error('Error enviando factura por email:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
