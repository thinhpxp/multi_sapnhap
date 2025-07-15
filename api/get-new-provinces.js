// /api/get-new-provinces.js
import { createClient } from '@supabase/supabase-js';

// Kết nối tới Supabase (sử dụng biến môi trường)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Hàm xử lý chính
export default async function handler(request, response) {
  try {
    // Chỉ lấy các cột cần thiết cho dropdown
    const { data, error } = await supabase
      .from('new_provinces')
      .select('province_code, name')
      .order('name', { ascending: true }); // Sắp xếp theo tên cho dễ nhìn

    if (error) {
      throw error;
    }

    // Trả về danh sách tỉnh
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API get-new-provinces:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tỉnh.' });
  }
}