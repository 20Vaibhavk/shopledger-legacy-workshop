'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('CURRENT BEHAVIOUR: checkout applies HSN GST and coupon to subtotal before GST', function () {
  // In-memory order line matching the fields routes/orders.js stores after product lookup.
  var items = [{
    id: 17,
    name: 'Rice',
    sku: 'RICE-1',
    hsn: '1006',
    price: 100,
    qty: 2
  }];

  assert.deepEqual(pricing.computeTotals(items, 'WELCOME'), {
    subtotal: 200,
    discount: 10,
    taxable: 190,
    tax: 9.5,
    cgst: 4.75,
    sgst: 4.75,
    total: 199.5,
    lines: [{
      id: 17,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 200,
      discount: 10,
      taxable: 190,
      tax: 9.5,
      net: 199.5
    }]
  });
});

test('invoice matches checkout HSN GST and applies coupon to subtotal before GST', function () {
  // Stored order is an in-memory representation of the checkout result.
  var order = {
    id: 42,
    date: '2026-11-21',
    items: [{ name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 2 }],
    coupon: 'WELCOME',
    subtotal: 200,
    discount: 10,
    tax: 9.5,
    total: 199.5
  };

  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 200,
    discount: 10,
    tax: 9.5,
    cgst: 4.75,
    sgst: 4.75,
    total: 199.5,
    rows: [{
      name: 'Rice',
      sku: 'RICE-1',
      hsn: '1006',
      qty: 2,
      price: 100,
      gstPercent: 5,
      line: 200,
      lineTax: 9.5
    }]
  });

  var html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹199\.50/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});

test('invoice uses checkout GST rate normalization for decimal gstRate values', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Oil', price: 100, qty: 1, gstRate: 0.05 }]
  });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('printable invoice matches checkout totals and HSN GST after capped coupon discount', function () {
  // All inputs stay in memory; checkout and invoice receive the same order lines.
  var items = [
    { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 10 },
    { id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', price: 100, qty: 10 }
  ];
  var pricing = require('../lib/pricing');
  var billed = pricing.computeTotals(items, 'SAVE10');
  var order = {
    id: 43,
    date: '2026-11-21',
    items: items,
    coupon: 'SAVE10',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 150); // SAVE10's percentage discount is capped.
  assert.equal(figures.subtotal, billed.subtotal);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.cgst, billed.cgst);
  assert.equal(figures.sgst, billed.sgst);
  assert.equal(figures.total, billed.total);
  assert.deepEqual(figures.rows.map(function (row) { return row.gstPercent; }), [5, 12]);

  var html = invoice.render(order);
  assert.match(html, /Invoice Total<\/td><td class="r">₹2007\.25/);
  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹157\.25/);
});
