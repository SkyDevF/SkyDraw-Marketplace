const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Database operations
const db = {
  // Users operations
  users: {
    async findByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id, userData) {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Shops operations
  shops: {
    async findByUserId(userId) {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          users!inner(name, avatar)
        `)
        .eq('id', id)
        .eq('is_approved', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findAllApproved() {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          users!inner(name, avatar),
          artworks(count)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async findPending() {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async create(shopData) {
      const { data, error } = await supabase
        .from('shops')
        .insert(shopData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id, shopData) {
      const { data, error } = await supabase
        .from('shops')
        .update(shopData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async approve(id) {
      const { data, error } = await supabase
        .from('shops')
        .update({ is_approved: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Artworks operations
  artworks: {
    async findByShopId(shopId) {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async create(artworkData) {
      const { data, error } = await supabase
        .from('artworks')
        .insert(artworkData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Orders operations
  orders: {
    async create(orderData) {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async findByCustomerId(customerId) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          artist:users!orders_artist_id_fkey(name),
          artwork:artworks(title, image_url)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async findByArtistId(artistId) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(name, email)
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async findAll() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(name, email),
          artist:users!orders_artist_id_fkey(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async updateStatus(id, status, userId = null) {
      let query = supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      
      if (userId) {
        query = query.or(`customer_id.eq.${userId},artist_id.eq.${userId}`);
      }
      
      const { data, error } = await query.select().single();
      
      if (error) throw error;
      return data;
    },

    async updateQRPath(id, qrPath) {
      const { data, error } = await supabase
        .from('orders')
        .update({ qr_code_path: qrPath })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Messages operations
  messages: {
    async findBetweenUsers(userId1, userId2) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(name),
          receiver:users!messages_receiver_id_fkey(name)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },

    async create(messageData) {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Statistics
  stats: {
    async getUserStats() {
      const { data, error } = await supabase
        .from('users')
        .select('role');
      
      if (error) throw error;
      
      const stats = {
        total_users: data.length,
        customers: data.filter(u => u.role === 'customer').length,
        artists: data.filter(u => u.role === 'artist').length
      };
      
      return stats;
    },

    async getOrderStats() {
      const { data, error } = await supabase
        .from('orders')
        .select('status, price');
      
      if (error) throw error;
      
      const stats = {
        total_orders: data.length,
        total_revenue: data
          .filter(o => o.status === 'done')
          .reduce((sum, o) => sum + parseFloat(o.price), 0)
      };
      
      return stats;
    }
  }
};

// Initialize database - check connection
const initDB = async () => {
  try {
    console.log('🔄 Connecting to Supabase...');
    
    // Test connection
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Supabase connection issue:', error.message);
      console.log('📋 Please ensure your Supabase URL and keys are correct in .env');
      console.log('📋 Also make sure to create the database tables using the SQL provided');
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (error) {
    console.log('⚠️  Supabase initialization error:', error.message);
  }
};

initDB();

module.exports = { supabase, db };