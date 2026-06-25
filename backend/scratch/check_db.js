require('dotenv').config({ path: 'c:/Users/valli/Downloads/MILZO proj/backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  // 1. Customer
  console.log('--- Testing Customer Insert ---');
  const testCustomer = {
    name: 'Test Customer',
    phone: '9999999999',
    address_line1: 'Test Address Line 1',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    status: 'active'
  };
  const { data: custData, error: custErr } = await supabase.from('customers').insert(testCustomer).select();
  if (custErr) {
    console.error('Customer Insert Failed:', custErr.message);
  } else {
    console.log('Customer Insert Success:', custData[0].id);
  }

  // 2. Product
  console.log('--- Testing Product Insert ---');
  const testProduct = {
    name: 'Test Milk Product',
    category: 'cow_milk',
    unit: 'litre',
    unit_size: 1,
    price: 50
  };
  const { data: prodData, error: prodErr } = await supabase.from('products').insert(testProduct).select();
  if (prodErr) {
    console.error('Product Insert Failed:', prodErr.message);
  } else {
    console.log('Product Insert Success:', prodData[0].id);
  }

  // 3. Booking (using created customer and product)
  if (custData && prodData) {
    console.log('--- Testing Booking Insert ---');
    const testBooking = {
      customer: custData[0].id,
      product: prodData[0].id,
      quantity: 2,
      delivery_date: '2026-06-25',
      delivery_slot: 'morning',
      price: 50,
      total: 100,
      status: 'pending'
    };
    const { data: bookData, error: bookErr } = await supabase.from('bookings').insert(testBooking).select();
    if (bookErr) {
      console.error('Booking Insert Failed:', bookErr.message);
    } else {
      console.log('Booking Insert Success:', bookData[0].id);
    }

    // 4. Subscription
    console.log('--- Testing Subscription Insert ---');
    const testSub = {
      customer: custData[0].id,
      product: prodData[0].id,
      plan_type: 'daily',
      delivery_slot: 'morning',
      quantity: 1,
      price_per_unit: 50,
      start_date: '2026-06-25',
      status: 'active'
    };
    const { data: subData, error: subErr } = await supabase.from('subscriptions').insert(testSub).select();
    if (subErr) {
      console.error('Subscription Insert Failed:', subErr.message);
    } else {
      console.log('Subscription Insert Success:', subData[0].id);
    }

    // Cleanup
    console.log('--- Cleaning Up ---');
    if (subData) {
      await supabase.from('subscriptions').delete().eq('id', subData[0].id);
      console.log('Deleted test subscription');
    }
    if (bookData) {
      await supabase.from('bookings').delete().eq('id', bookData[0].id);
      console.log('Deleted test booking');
    }
    await supabase.from('products').delete().eq('id', prodData[0].id);
    console.log('Deleted test product');
    await supabase.from('customers').delete().eq('id', custData[0].id);
    console.log('Deleted test customer');
  }
}

testInsert();
